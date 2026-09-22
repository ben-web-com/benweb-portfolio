(function () {
  "use strict";
  window.BenDemos = window.BenDemos || {};
  window.BenDemos.audit = function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    var panels = Array.prototype.slice.call(root.querySelectorAll("[data-audit-panel]"));
    var status = root.querySelector("[data-audit-status]");
    var labels = { overview: "Vue d’ensemble affichée.", details: "Détails techniques affichés.", actions: "Recommandations affichées." };
    var revealed = false;

    function activate(name, focus) {
      if (!labels[name]) return;
      tabs.forEach(function (tab) {
        var on = tab.dataset.auditTab === name;
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
        if (on && focus) tab.focus();
      });
      panels.forEach(function (panel) { panel.hidden = panel.dataset.auditPanel !== name; });
      root.dataset.auditView = name;
      if (status) status.textContent = labels[name];
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () { activate(tab.dataset.auditTab); });
      tab.addEventListener("keydown", function (event) {
        var dir = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        if (!dir) return;
        event.preventDefault();
        activate(tabs[(index + dir + tabs.length) % tabs.length].dataset.auditTab, true);
      });
    });

    Array.prototype.forEach.call(root.querySelectorAll("[data-goto-tab]"), function (button) {
      button.addEventListener("click", function () { activate(button.dataset.gotoTab, true); });
    });

    function reveal() {
      if (revealed) return;
      revealed = true;
      var scores = Array.prototype.slice.call(root.querySelectorAll("[data-score]"));
      var overall = Math.round(scores.reduce(function (sum, el) { return sum + Number(el.dataset.score); }, 0) / (scores.length || 1));
      var gauge = root.querySelector("[data-gauge-fill]");
      if (gauge) {
        var circumference = 2 * Math.PI * 52;
        gauge.style.strokeDashoffset = String(circumference * (1 - overall / 100));
      }
      var number = root.querySelector("[data-gauge-number]");
      if (number) number.textContent = overall;
      Array.prototype.forEach.call(root.querySelectorAll("[data-fill]"), function (bar) {
        bar.style.width = bar.dataset.fill + "%";
      });
    }

    activate("overview");
    return { visibility: function (on) { if (on) reveal(); } };
  };
})();
