(function () {
  "use strict";
  window.BenDemos = window.BenDemos || {};
  window.BenDemos.restaurant = function (root) {
    var names = { pad: "Pad thaï", curry: "Curry de légumes", tea: "Thé glacé" };
    var quantities = { pad: 0, curry: 0, tea: 0 };
    var steps = ["received", "preparing", "ready"];
    var messages = ["Commande reçue en cuisine.", "Votre commande est en préparation.", "Votre commande est prête à servir."];
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
      schedule();
    }
    function updateCart() {
      var count = Object.values(quantities).reduce(function (sum, n) { return sum + n; }, 0);
      Object.keys(quantities).forEach(function (key) {
        var output = $("[data-quantity='" + key + "']");
        output.value = quantities[key];
        output.parentElement.classList.toggle("has-items", quantities[key] > 0);
        $("[data-dish='" + key + "'][data-delta='-1']").disabled = quantities[key] === 0;
        $("[data-dish='" + key + "'][data-delta='1']").disabled = quantities[key] >= 9;
      });
      $("[data-cart-summary]").textContent = count ? count + (count > 1 ? " articles sélectionnés" : " article sélectionné") : "Choisissez un plat";
      $("[data-send-order]").disabled = !count;
      $("[data-send-order]").firstChild.textContent = submitted ? "Mettre à jour la commande " : "Envoyer en cuisine ";
    }
    $$("[data-dish]").forEach(function (button) {
      button.addEventListener("click", function () {
        var key = button.dataset.dish;
        quantities[key] = Math.max(0, Math.min(9, quantities[key] + Number(button.dataset.delta)));
        updateCart();
      });
    });
    $("[data-send-order]").addEventListener("click", function () {
      var list = $("[data-ticket-items]");
      list.replaceChildren();
      Object.keys(quantities).forEach(function (key) {
        if (!quantities[key]) return;
        var item = document.createElement("li"), count = document.createElement("b");
        count.textContent = quantities[key] + " × ";
        item.append(count, document.createTextNode(names[key]));
        list.append(item);
      });
      submitted = true;
      $("[data-kitchen-empty]").hidden = true;
      $("[data-kitchen-ticket]").hidden = false;
      $("[data-ticket-count]").textContent = "· 1";
      changeView("kitchen");
      setState(reduced.matches ? 2 : 0);
      updateCart();
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
      changeView("client"); updateCart();
      $("[data-dish='pad'][data-delta='1']").focus({ preventScroll: true });
    });
    $$("[data-rest-view]").forEach(function (button) { button.addEventListener("click", function () { changeView(button.dataset.restView); }); });
    document.addEventListener("visibilitychange", schedule);
    reduced.addEventListener("change", function () { if (reduced.matches && state >= 0) setState(2); else schedule(); });
    updateCart();
    return { visibility: function (on) { visible = on; schedule(); } };
  };
})();
