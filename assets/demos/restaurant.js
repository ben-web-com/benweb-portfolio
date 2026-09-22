(function () {
  "use strict";
  window.BenDemos = window.BenDemos || {};
  window.BenDemos.restaurant = function (root) {
    var names = {
      tartare: "Tartare de bœuf", risotto: "Risotto aux champignons", burger: "Burger gourmet",
      salade: "Salade composée", fondant: "Fondant au chocolat", cocktail: "Cocktail signature"
    };
    var prices = { tartare: 16, risotto: 15, burger: 17, salade: 12, fondant: 8, cocktail: 9 };
    var quantities = { tartare: 0, risotto: 0, burger: 0, salade: 0, fondant: 0, cocktail: 0 };
    var available = { tartare: true, risotto: true, burger: true, salade: true, fondant: true, cocktail: true };
    var steps = ["received", "preparing", "ready"];
    var messages = ["Commande reçue en cuisine.", "Votre commande est en préparation.", "Votre commande est prête à servir."];
    var ORDERS_BASE = 14, REVENUE_BASE = 186;
    var ordersToday = ORDERS_BASE, revenueToday = REVENUE_BASE;
    var state = -1, timer = null, visible = true, submitted = false;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    var mobile = window.matchMedia("(max-width: 700px)");
    var $ = function (selector) { return root.querySelector(selector); };
    var $$ = function (selector) { return Array.from(root.querySelectorAll(selector)); };

    function changeView(view) {
      $(".restaurant-demo").dataset.restaurantView = view;
      $$("[data-rest-view]").forEach(function (button) { button.setAttribute("aria-pressed", String(button.dataset.restView === view)); });
    }
    function stop() { window.clearTimeout(timer); timer = null; }
    function schedule() {
      stop();
      if (!visible || document.hidden || reduced.matches || state < 0 || state >= 2) return;
      timer = window.setTimeout(function () { setState(state + 1); }, 1700);
    }
    function setState(next) {
      state = Math.min(next, 2);
      $$("[data-order-state]").forEach(function (item, index) {
        item.classList.toggle("is-done", index <= state);
        if (index === state) item.setAttribute("aria-current", "step"); else item.removeAttribute("aria-current");
      });
      $("[data-order-status]").textContent = messages[state];
      $("[data-client-status]").hidden = false;
      $("[data-client-status]").textContent = messages[state];
      var button = $("[data-next-order-state]");
      button.textContent = state === 0 ? "Passer en préparation" : state === 1 ? "Marquer comme prête" : "Commande prête";
      button.disabled = state === 2;
      $("[data-order-followup]").hidden = false;
      updateAdminHistoryStatus();
      schedule();
    }
    function orderTotal() {
      return Object.keys(quantities).reduce(function (sum, key) { return sum + quantities[key] * prices[key]; }, 0);
    }
    function updateCart() {
      var count = Object.values(quantities).reduce(function (sum, n) { return sum + n; }, 0);
      Object.keys(quantities).forEach(function (key) {
        var output = $("[data-quantity='" + key + "']");
        output.value = quantities[key];
        output.parentElement.classList.toggle("has-items", quantities[key] > 0);
        $("[data-dish='" + key + "'][data-delta='-1']").disabled = quantities[key] === 0;
        $("[data-dish='" + key + "'][data-delta='1']").disabled = quantities[key] >= 9 || !available[key];
      });
      var total = orderTotal();
      $("[data-cart-summary]").textContent = count
        ? count + (count > 1 ? " articles · " : " article · ") + total + " €"
        : "Choisissez un plat";
      $("[data-send-order]").disabled = !count;
      $("[data-send-order]").firstChild.textContent = submitted ? "Mettre à jour la commande " : "Envoyer en cuisine ";
    }
    function setAvailability(key, isAvailable) {
      available[key] = isAvailable;
      var item = root.querySelector("[data-dish-item='" + key + "']");
      var note = item.querySelector("[data-dish-unavailable]");
      var stepper = item.querySelector(".dish-quantity");
      item.classList.toggle("is-unavailable", !isAvailable);
      note.hidden = isAvailable;
      stepper.hidden = !isAvailable;
      if (!isAvailable && quantities[key] > 0) { quantities[key] = 0; }
      var adminButton = root.querySelector("[data-toggle-dish='" + key + "']");
      adminButton.setAttribute("aria-pressed", String(!isAvailable));
      adminButton.textContent = isAvailable ? "Disponible" : "Rupture";
      updateCart();
    }
    function addHistoryEntry(count, total) {
      var list = $("[data-admin-history]");
      var entry = document.createElement("li");
      entry.dataset.liveOrder = "true";
      entry.innerHTML = "<b>Table 4</b><span data-live-order-status>" + count + " article" + (count > 1 ? "s" : "") + " · " + total + " € · reçue à l’instant</span>";
      list.prepend(entry);
      while (list.children.length > 5) list.removeChild(list.lastElementChild);
    }
    function updateAdminHistoryStatus() {
      var line = root.querySelector("[data-live-order-status]");
      if (!line) return;
      var labels = ["reçue à l’instant", "en préparation", "prête à servir"];
      line.textContent = line.textContent.replace(/(reçue à l’instant|en préparation|prête à servir)$/, labels[state] || labels[0]);
    }
    function bumpStats(total) {
      ordersToday += 1;
      revenueToday += total;
      $("[data-stat-orders]").textContent = ordersToday;
      $("[data-stat-revenue]").textContent = revenueToday + " €";
    }

    $$("[data-dish]").forEach(function (button) {
      button.addEventListener("click", function () {
        var key = button.dataset.dish;
        if (!available[key] && Number(button.dataset.delta) > 0) return;
        quantities[key] = Math.max(0, Math.min(9, quantities[key] + Number(button.dataset.delta)));
        updateCart();
      });
    });
    $("[data-send-order]").addEventListener("click", function () {
      var list = $("[data-ticket-items]");
      list.replaceChildren();
      var count = 0, total = orderTotal();
      Object.keys(quantities).forEach(function (key) {
        if (!quantities[key]) return;
        count += quantities[key];
        var item = document.createElement("li"), qty = document.createElement("b");
        qty.textContent = quantities[key] + " × ";
        item.append(qty, document.createTextNode(names[key]));
        list.append(item);
      });
      var firstOrder = !submitted;
      submitted = true;
      $("[data-kitchen-empty]").hidden = true;
      $("[data-kitchen-ticket]").hidden = false;
      $("[data-ticket-count]").textContent = "· 1";
      changeView("kitchen");
      setState(reduced.matches ? 2 : 0);
      updateCart();
      if (firstOrder) { addHistoryEntry(count, total); bumpStats(total); }
      if (mobile.matches) {
        var viewButton = $("[data-rest-view='kitchen']");
        viewButton.focus({ preventScroll: true });
        root.scrollIntoView({ behavior: "instant", block: "nearest" });
      }
    });
    $("[data-next-order-state]").addEventListener("click", function () { setState(state + 1); });
    $("[data-reset-order]").addEventListener("click", function () {
      stop(); state = -1; submitted = false;
      Object.keys(quantities).forEach(function (key) { quantities[key] = 0; });
      $("[data-kitchen-empty]").hidden = false;
      $("[data-kitchen-ticket]").hidden = true;
      $("[data-order-followup]").hidden = true;
      $("[data-ticket-count]").textContent = "";
      $("[data-client-status]").hidden = true;
      var live = root.querySelector("[data-live-order]");
      if (live) live.remove();
      changeView("client"); updateCart();
      var firstEnabled = root.querySelector(".restaurant-dish:not(.is-unavailable) [data-delta='1']");
      if (firstEnabled) firstEnabled.focus({ preventScroll: true });
    });
    $$("[data-rest-view]").forEach(function (button) { button.addEventListener("click", function () { changeView(button.dataset.restView); }); });
    $$("[data-toggle-dish]").forEach(function (button) {
      button.addEventListener("click", function () { setAvailability(button.dataset.toggleDish, button.getAttribute("aria-pressed") === "true"); });
    });
    document.addEventListener("visibilitychange", schedule);
    reduced.addEventListener("change", function () { if (reduced.matches && state >= 0) setState(2); else schedule(); });
    Object.keys(available).forEach(function (key) { setAvailability(key, true); });
    updateCart();
    return { visibility: function (on) { visible = on; schedule(); } };
  };
})();
