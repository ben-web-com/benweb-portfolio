(function () {
  "use strict";
  window.BenDemos = window.BenDemos || {};
  window.BenDemos.nfc = function (root) {
    var demo = root.querySelector(".nfc-demo");
    var card = root.querySelector("[data-nfc-card]");
    var front = root.querySelector("[data-nfc-front]");
    var back = root.querySelector("[data-nfc-back]");
    var stage = root.querySelector("[data-nfc-stage]");
    var phone = root.querySelector("[data-nfc-phone]");
    var waiting = root.querySelector("[data-nfc-waiting]");
    var contact = root.querySelector("[data-nfc-contact]");
    var flip = root.querySelector("[data-nfc-flip]");
    var cardTrigger = root.querySelector("[data-nfc-card-trigger]");
    var flipLabel = root.querySelector("[data-nfc-flip-label]");
    var tap = root.querySelector("[data-nfc-tap]");
    var tapLabel = root.querySelector("[data-nfc-tap-label]");
    var save = root.querySelector("[data-nfc-save]");
    var status = root.querySelector("[data-nfc-status]");
    var preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    var visible = root.dataset.visible === "true";
    var flipped = false;
    var busy = false;
    var timer = null;

    function openContact(announce) {
      window.clearTimeout(timer);
      timer = null;
      busy = false;
      stage.classList.remove("is-approaching");
      phone.classList.remove("is-receiving");
      waiting.hidden = true;
      contact.hidden = false;
      tap.disabled = false;
      flip.disabled = false;
      cardTrigger.disabled = false;
      tapLabel.textContent = "Rejouer le geste";
      if (announce) status.textContent = "La fiche est ouverte. Vous pouvez enregistrer le contact.";
      else status.textContent = "";
    }

    flip.addEventListener("click", function () {
      flipped = !flipped;
      card.classList.toggle("is-flipped", flipped);
      flipLabel.textContent = flipped ? "Revenir au recto" : "Retourner la carte";
      cardTrigger.setAttribute("aria-label", flipLabel.textContent);
      front.setAttribute("aria-hidden", String(flipped));
      back.setAttribute("aria-hidden", String(!flipped));
      front.toggleAttribute("inert", flipped);
      back.toggleAttribute("inert", !flipped);
    });

    cardTrigger.addEventListener("click", function () { flip.click(); });

    tap.addEventListener("click", function () {
      if (busy) return;
      if (preference.matches || !visible) {
        openContact(true);
        return;
      }
      busy = true;
      tap.disabled = true;
      flip.disabled = true;
      cardTrigger.disabled = true;
      waiting.hidden = false;
      contact.hidden = true;
      stage.classList.add("is-approaching");
      phone.classList.add("is-receiving");
      status.textContent = "Ouverture de la fiche de contact…";
      timer = window.setTimeout(function () { openContact(true); }, 800);
    });

    save.addEventListener("click", function () {
      var lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        "N:Ikhmim;Benjamin;;;",
        "FN:Benjamin Ikhmim",
        "ORG:BEN WEB",
        "TITLE:Freelance digital & IA",
        "TEL;TYPE=CELL:+66970499155",
        "EMAIL;TYPE=INTERNET:contact@ben-web.com",
        "URL:https://ben-web.com",
        "END:VCARD",
        ""
      ];
      var url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/vcard;charset=utf-8" }));
      var link = document.createElement("a");
      link.href = url;
      link.download = "benjamin-ikhmim.vcf";
      link.hidden = true;
      root.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      status.textContent = "La fiche de contact est prête à être enregistrée sur votre appareil.";
    });

    function motionChanged(event) {
      if (event.matches) openContact(busy);
    }
    if (preference.addEventListener) preference.addEventListener("change", motionChanged);
    else preference.addListener(motionChanged);

    back.hidden = false;
    if (preference.matches) openContact(false);
    else {
      waiting.hidden = false;
      contact.hidden = true;
    }

    return {
      visibility: function (on) {
        visible = on;
        demo.classList.toggle("is-offscreen", !on);
        if (!on && busy) openContact(false);
      }
    };
  };
})();
