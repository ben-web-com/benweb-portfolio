(function () {
  "use strict";
  window.BenDemos = window.BenDemos || {};
  window.BenDemos.story = function (root) {
    var items = Array.from(root.querySelectorAll("[data-seq]"));
    var scores = Array.from(root.querySelectorAll("[data-score]"));
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    var visible = root.dataset.visible === "true", elapsed = 0, previous = null, frame = null;
    var duration = Math.max(1500, (items.length - 1) * 650 + 500);
    var replay = root.querySelector("[data-replay-story]");
    var status = root.querySelector("[data-story-status]");
    var labels = items.map(function (item) { return item.dataset.stepLabel || ""; });
    var lastStep = -1;
    function paint(time) {
      items.forEach(function (item, index) {
        item.classList.toggle("is-revealed", time >= index * 650);
        item.classList.toggle("is-current", time >= index * 650 && (index === items.length - 1 || time < (index + 1) * 650));
      });
      scores.forEach(function (item) {
        var amount = Number(item.dataset.score);
        var progress = Math.min(1, time / 1100);
        item.textContent = Math.round(amount * progress);
        var fill = item.closest(".audit-metric").querySelector(".audit-fill");
        if (fill) fill.style.width = amount * progress + "%";
      });
      var step = Math.min(items.length - 1, Math.floor(time / 650));
      if (status && step !== lastStep && labels[step]) status.textContent = labels[step];
      lastStep = step;
      root.classList.toggle("is-story-complete", time >= duration);
    }
    function stop() { if (frame !== null) cancelAnimationFrame(frame); frame = null; previous = null; }
    function tick(now) {
      frame = null;
      if (reduced.matches) { elapsed = duration; previous = null; paint(duration); return; }
      if (!visible || document.hidden) { previous = null; return; }
      if (previous !== null) elapsed = Math.min(duration, elapsed + now - previous);
      previous = now;
      paint(elapsed);
      if (elapsed < duration) frame = requestAnimationFrame(tick); else previous = null;
    }
    function synchronize() {
      stop();
      if (reduced.matches) { elapsed = duration; paint(duration); return; }
      if (visible && !document.hidden && elapsed < duration) frame = requestAnimationFrame(tick);
    }
    if (replay) replay.addEventListener("click", function () {
      elapsed = reduced.matches ? duration : 0;
      lastStep = -1; paint(elapsed); synchronize();
    });
    var records = Array.from(root.querySelectorAll("[data-app-record]"));
    if (records.length) {
      var filters = Array.from(root.querySelectorAll("[data-app-filter]"));
      var filter = "all";
      function updateRecords() {
        var finished = records.filter(function (record) { return record.dataset.appRecord === "done"; }).length;
        root.querySelector("[data-app-count]").textContent = (records.length - finished) + " à traiter · " + finished + " terminé" + (finished > 1 ? "s" : "");
        records.forEach(function (record) { record.hidden = filter !== "all" && record.dataset.appRecord !== filter; });
        root.querySelector("[data-app-empty]").hidden = records.some(function (record) { return !record.hidden; });
        filters.forEach(function (button) { button.setAttribute("aria-pressed", String(button.dataset.appFilter === filter)); });
      }
      filters.forEach(function (button) { button.addEventListener("click", function () { filter = button.dataset.appFilter; updateRecords(); }); });
      root.querySelectorAll("[data-app-complete]").forEach(function (button) {
        button.addEventListener("click", function () {
          var record = button.closest("[data-app-record]");
          var done = record.dataset.appRecord !== "done";
          record.dataset.appRecord = done ? "done" : "pending";
          record.querySelector("[data-app-badge]").textContent = done ? "Terminé" : "À traiter";
          button.textContent = done ? "Rouvrir" : "Marquer comme traité";
          button.setAttribute("aria-label", (done ? "Rouvrir : " : "Marquer comme traité : ") + record.querySelector("h4").textContent);
          updateRecords();
          if (record.hidden) filters.find(function (item) { return item.dataset.appFilter === filter; }).focus();
        });
      });
      updateRecords();
    }
    root.classList.add("story-enhanced");
    paint(reduced.matches ? duration : 0);
    if (reduced.matches) elapsed = duration;
    document.addEventListener("visibilitychange", synchronize);
    reduced.addEventListener("change", synchronize);
    return { visibility: function (on) { visible = on; synchronize(); } };
  };
})();
