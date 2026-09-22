(function () {
  "use strict";
  var instances = new Map();
  var version = new URL(document.currentScript.src).searchParams.get("v") || "1";
  function activate(root) {
    if (root.dataset.loading) return;
    root.dataset.loading = "true";
    var name = root.dataset.demo;
    if (!/^[a-z-]+$/.test(name)) return;
    var script = document.createElement("script");
    script.src = "assets/demos/" + name + ".js?v=" + encodeURIComponent(version);
    script.onload = function () {
      try {
        var init = window.BenDemos && window.BenDemos[name];
        if (!init) return;
        var instance = init(root) || {};
        instances.set(root, instance);
        root.classList.add("is-ready");
        if (instance.visibility) instance.visibility(root.dataset.visible === "true");
      } catch (error) { root.classList.remove("is-ready"); }
    };
    root.append(script);
  }
  var demos = document.querySelectorAll("[data-demo]");
  if (!("IntersectionObserver" in window)) {
    demos.forEach(function (root) { root.dataset.visible = "true"; activate(root); });
    return;
  }
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var root = entry.target;
      root.dataset.visible = String(entry.isIntersecting);
      if (entry.isIntersecting) activate(root);
      var instance = instances.get(root);
      if (instance && instance.visibility) instance.visibility(entry.isIntersecting);
    });
  }, { threshold: 0.01 });
  demos.forEach(function (root) { observer.observe(root); });
})();
