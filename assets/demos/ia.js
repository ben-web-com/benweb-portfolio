(function () {
  "use strict";
  window.BenDemos = window.BenDemos || {};
  window.BenDemos.ia = function (root) {
    var nodes = Array.prototype.slice.call(root.querySelectorAll("[data-ia-node]"));
    var connectors = Array.prototype.slice.call(root.querySelectorAll(".ia-connector"));
    var logLines = Array.prototype.slice.call(root.querySelectorAll("[data-ia-log-line]"));
    var status = root.querySelector("[data-ia-status]");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    var STEP_DELAY = 900;
    var DONE_MESSAGE = "Vous décidez de la suite, selon vos disponibilités.";
    var step = -1, timer = null, visible = true;

    function paint(target) {
      nodes.forEach(function (node, index) {
        node.classList.toggle("is-done", index < target);
        node.classList.toggle("is-active", index === target);
        node.querySelector("[data-ia-state]").textContent = index < target ? "Traité" : index === target ? "En cours" : "En attente";
      });
      connectors.forEach(function (connector, index) { connector.classList.toggle("is-filled", index < target); });
      logLines.forEach(function (line, index) { line.classList.toggle("is-active", target >= 0 && index <= target); });
    }
    function stop() { window.clearTimeout(timer); timer = null; }
    function schedule() {
      stop();
      if (!visible || document.hidden || reduced.matches) return;
      if (step >= nodes.length - 1) { paint(nodes.length); if (status) status.textContent = DONE_MESSAGE; return; }
      timer = window.setTimeout(function () {
        step += 1;
        paint(step);
        if (status) status.textContent = "Étape " + (step + 1) + " sur " + nodes.length + " : " + nodes[step].querySelector("h4").textContent + ".";
        schedule();
      }, STEP_DELAY);
    }
    function restart() {
      stop();
      if (reduced.matches) { step = nodes.length - 1; paint(nodes.length); if (status) status.textContent = DONE_MESSAGE; return; }
      step = -1;
      paint(step);
      schedule();
    }

    var replay = root.querySelector("[data-replay-ia]");
    if (replay) replay.addEventListener("click", restart);
    document.addEventListener("visibilitychange", schedule);
    reduced.addEventListener("change", restart);

    paint(reduced.matches ? nodes.length : -1);
    if (reduced.matches && status) status.textContent = DONE_MESSAGE;
    return { visibility: function (on) { visible = on; if (on && !reduced.matches && step < 0) schedule(); } };
  };
})();
