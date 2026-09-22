(function () {
  "use strict";
  window.BenDemos = window.BenDemos || {};
  window.BenDemos.sites = function (root) {
    var preview = root.querySelector("[data-sites-preview]");
    var controls = Array.prototype.slice.call(root.querySelectorAll("[data-site-select]"));
    var note = root.querySelector("[data-site-note]");
    var announcement = root.querySelector("[data-site-announcement]");
    var panels = { restaurant: root.querySelector("[data-site-panel='restaurant']") };
    var labels = { restaurant: "Restaurant", avocat: "Cabinet d’avocats", sport: "Salle de sport", tourism: "Tourisme au Sri Lanka" };
    var current = "restaurant";
    var translations = {
      fr: {
        brand: "Tourisme au Sri Lanka", title: "De beaux jours.", titleEnd: "Les chemins d’ici.",
        intro: "Découvrez Ella en tuk-tuk. Poursuivez le voyage au Sri Lanka en voiture ou en van.",
        tag: "À votre rythme.", caption: "Un peu d’aventure. Une belle journée.",
        action: "Découvrir l’excursion", trip: "Ella en tuk-tuk",
        description: "Le Nine Arch Bridge, Little Adam’s Peak et la boucle de Demodara : un aperçu des étapes proposées autour d’Ella.",
        note: "Un itinéraire à préparer selon vos envies.",
        imageAlt: "Un moment partagé près d’un tuk-tuk bleu au Sri Lanka",
        panelLabel: "Extrait d’un site de tourisme au Sri Lanka"
      },
      en: {
        brand: "Travel in Sri Lanka", title: "Good days.", titleEnd: "Local roads.",
        intro: "Discover Ella by tuk-tuk. Keep exploring Sri Lanka by car or van.",
        tag: "At your own pace.", caption: "A little adventure. A good day.",
        action: "Explore the trip", trip: "Ella by tuk-tuk",
        description: "Nine Arch Bridge, Little Adam’s Peak and the Demodara Loop: a glimpse of the stops around Ella.",
        note: "Shape the route around the places you want to see.",
        imageAlt: "A shared moment beside a blue tuk-tuk in Sri Lanka",
        panelLabel: "An excerpt from a travel website in Sri Lanka"
      }
    };

    function changeLanguage(panel, language) {
      var copy = translations[language];
      if (!copy) return;
      panel.lang = language;
      panel.setAttribute("aria-label", copy.panelLabel);
      panel.querySelectorAll("[data-tour-text]").forEach(function (el) {
        var value = copy[el.dataset.tourText];
        if (value) el.textContent = value;
      });
      panel.querySelector("[data-tour-image]").alt = copy.imageAlt;
      panel.querySelectorAll("[data-site-language]").forEach(function (button) {
        button.setAttribute("aria-pressed", String(button.dataset.siteLanguage === language));
      });
      announcement.textContent = language === "fr" ? "L’aperçu touristique est affiché en français." : "L’aperçu touristique est affiché en anglais.";
    }

    function getPanel(name) {
      if (panels[name]) return panels[name];
      var template = root.querySelector("[data-site-template='" + name + "']");
      if (!template) return null;
      var content = template.content.cloneNode(true);
      var panel = content.querySelector("[data-site-panel]");
      panel.hidden = true;
      panel.setAttribute("inert", "");
      panel.setAttribute("aria-hidden", "true");
      preview.appendChild(content);
      panels[name] = panel;
      if (name === "tourism") {
        panel.querySelectorAll("[data-site-language]").forEach(function (button) {
          button.addEventListener("click", function () { changeLanguage(panel, button.dataset.siteLanguage); });
        });
      }
      return panel;
    }

    function activate(name, announce) {
      if (!Object.prototype.hasOwnProperty.call(labels, name)) return;
      var panel = getPanel(name);
      if (!panel) return;
      Object.keys(panels).forEach(function (key) {
        var active = key === name;
        panels[key].hidden = !active;
        panels[key].toggleAttribute("inert", !active);
        if (active) panels[key].removeAttribute("aria-hidden");
        else panels[key].setAttribute("aria-hidden", "true");
      });
      controls.forEach(function (button) {
        button.setAttribute("aria-pressed", String(button.dataset.siteSelect === name));
      });
      note.textContent = name === "tourism" ?
        "Extrait adapté d’une réalisation en cours au Sri Lanka. Essayez aussi le changement de langue." :
        "Exemple de site. Les contenus servent à la démonstration.";
      if (announce && name !== current) announcement.textContent = "Aperçu affiché : " + labels[name] + ".";
      current = name;
    }

    controls.forEach(function (button, index) {
      button.addEventListener("click", function () { activate(button.dataset.siteSelect, true); });
      button.addEventListener("keydown", function (event) {
        var next;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % controls.length;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + controls.length) % controls.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = controls.length - 1;
        else return;
        event.preventDefault();
        controls[next].focus({ preventScroll: true });
        activate(controls[next].dataset.siteSelect, true);
      });
    });
    activate("restaurant", false);
    // Aucun minuteur ni animation autonome : rien à suspendre hors écran.
    return {};
  };
})();
