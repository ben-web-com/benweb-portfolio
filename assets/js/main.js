/* =============================================================================
   Benjamin Ikhmim — interactions du site
   Vanilla JS, aucune dépendance. Tout est dégradable : sans JS, le contenu
   reste lisible et le formulaire fonctionne en POST classique.
   ============================================================================= */
(function () {
  "use strict";

  var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = motionPreference.matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  function observePreference(query, callback) {
    if (query.addEventListener) query.addEventListener("change", callback);
    else query.addListener(callback);
  }

  /* ---------------------------------------------------------------------------
     1. Barre de progression + comportement du header
     --------------------------------------------------------------------------- */
  var header = $("#header");
  var progress = $("#progress");
  var lastY = window.scrollY;
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;

    if (progress) {
      progress.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
    }

    if (header) {
      header.classList.toggle("is-stuck", y > 24);
      var goingDown = y > lastY && y > 480;
      header.classList.toggle("is-hidden", goingDown && !reduced &&
        !header.contains(document.activeElement) && !document.body.classList.contains("menu-open"));
    }

    lastY = y;
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  if (header) {
    header.addEventListener("focusin", function () { header.classList.remove("is-hidden"); });
  }
  onScroll();

  /* ---------------------------------------------------------------------------
     2. Menu mobile
     --------------------------------------------------------------------------- */
  var toggle = $(".nav-toggle");
  var panel = $("#mobile-panel");
  var desktopPreference = window.matchMedia("(min-width: 861px)");
  var menuOpen = false;
  var menuFrame = null;
  var menuTimer = null;
  var frozenRegions = [];
  var previousOverflow = "";

  function menuControls() {
    return [toggle].concat($$("a[href], button:not([disabled]), [tabindex='0']", panel))
      .filter(function (el) { return el && el.getClientRects().length && !el.closest("[hidden], [inert]"); });
  }

  function setMenu(open, restoreFocus) {
    if (!panel || !toggle || menuOpen === open) return;
    menuOpen = open;
    window.cancelAnimationFrame(menuFrame);
    window.clearTimeout(menuTimer);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    document.body.classList.toggle("menu-open", open);
    if (open) {
      panel.hidden = false;
      panel.removeAttribute("inert");
      if (header) header.classList.remove("is-hidden");
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      frozenRegions = $$("main, footer").map(function (el) {
        var wasInert = el.hasAttribute("inert");
        el.setAttribute("inert", "");
        return { element: el, wasInert: wasInert };
      });
      menuFrame = window.requestAnimationFrame(function () {
        panel.classList.add("is-open");
        var firstLink = $("a[href]", panel);
        if (firstLink) firstLink.focus({ preventScroll: true });
      });
    } else {
      panel.classList.remove("is-open");
      panel.setAttribute("inert", "");
      frozenRegions.forEach(function (region) {
        if (!region.wasInert) region.element.removeAttribute("inert");
      });
      frozenRegions = [];
      document.body.style.overflow = previousOverflow;
      if (restoreFocus !== false) toggle.focus({ preventScroll: true });
      menuTimer = window.setTimeout(function () {
        if (!menuOpen) panel.hidden = true;
      }, reduced ? 0 : 420);
    }
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
  }
  if (panel) {
    $$("a", panel).forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false, false); });
    });
  }
  document.addEventListener("keydown", function (e) {
    if (!menuOpen) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setMenu(false);
    } else if (e.key === "Tab") {
      var controls = menuControls();
      if (!controls.length) return;
      var current = controls.indexOf(document.activeElement);
      var next = current < 0 ? (e.shiftKey ? controls.length - 1 : 0) :
        (current + (e.shiftKey ? -1 : 1) + controls.length) % controls.length;
      e.preventDefault();
      controls[next].focus();
    }
  });
  observePreference(desktopPreference, function (e) {
    if (!e.matches || !menuOpen) return;
    setMenu(false, false);
    var brand = header && $("a.brand", header);
    if (brand) brand.focus({ preventScroll: true });
  });

  /* ---------------------------------------------------------------------------
     3. Apparition au scroll
     --------------------------------------------------------------------------- */
  var revealables = $$("[data-reveal]");
  if (!("IntersectionObserver" in window) || reduced) {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    revealables.forEach(function (el) { revealObserver.observe(el); });

    // Filet de sécurité : si un élément déjà visible n'a pas été révélé
    // (redimensionnement, restauration de scroll, onglet en arrière-plan),
    // on le force après le chargement complet.
    window.addEventListener("load", function () {
      window.setTimeout(function () {
        revealables.forEach(function (el) {
          if (el.classList.contains("is-in")) return;
          var box = el.getBoundingClientRect();
          if (box.top < window.innerHeight && box.bottom > 0) el.classList.add("is-in");
        });
      }, 900);
    });
  }

  /* ---------------------------------------------------------------------------
     4. Lien de navigation actif
     --------------------------------------------------------------------------- */
  var navLinks = $$(".nav-links a");
  var sections = navLinks
    .map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ---------------------------------------------------------------------------
     5. FAQ (accordéon accessible)
     --------------------------------------------------------------------------- */
  $$(".faq-q").forEach(function (btn) {
    var answer = document.getElementById(btn.getAttribute("aria-controls"));
    btn.setAttribute("aria-expanded", "false");
    btn.closest(".faq-item").classList.remove("is-open");
    if (answer) answer.hidden = true;
    btn.addEventListener("click", function () {
      var item = btn.closest(".faq-item");
      var isOpen = btn.getAttribute("aria-expanded") === "true";

      $$(".faq-item.is-open").forEach(function (other) {
        if (other !== item) {
          other.classList.remove("is-open");
          $(".faq-q", other).setAttribute("aria-expanded", "false");
          var otherAnswer = $(".faq-a", other);
          if (otherAnswer) otherAnswer.hidden = true;
        }
      });

      item.classList.toggle("is-open", !isOpen);
      btn.setAttribute("aria-expanded", String(!isOpen));
      if (answer) answer.hidden = isOpen;
    });
  });

  /* ---------------------------------------------------------------------------
     6. Menu déroulant « Services »
     --------------------------------------------------------------------------- */
  var dropBtn = $(".nav-drop-btn");
  var drop = $(".nav-drop");

  if (dropBtn && drop) {
    var closeTimer = null;

    function setDrop(open) {
      dropBtn.setAttribute("aria-expanded", String(open));
    }

    dropBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      setDrop(dropBtn.getAttribute("aria-expanded") !== "true");
    });

    drop.addEventListener("mouseenter", function () {
      window.clearTimeout(closeTimer);
      if (window.matchMedia("(pointer: fine)").matches) setDrop(true);
    });
    drop.addEventListener("mouseleave", function () {
      if (!window.matchMedia("(pointer: fine)").matches) return;
      closeTimer = window.setTimeout(function () {
        if (!drop.contains(document.activeElement)) setDrop(false);
      }, 180);
    });

    document.addEventListener("click", function (e) {
      if (!drop.contains(e.target)) setDrop(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.defaultPrevented || e.key !== "Escape" ||
          dropBtn.getAttribute("aria-expanded") !== "true") return;
      var focusInMenu = drop.contains(document.activeElement);
      window.clearTimeout(closeTimer);
      setDrop(false);
      if (focusInMenu) {
        e.preventDefault();
        dropBtn.focus({ preventScroll: true });
      }
    });
    drop.addEventListener("focusout", function (e) {
      if (!drop.contains(e.relatedTarget)) setDrop(false);
    });
  }

  /* ---------------------------------------------------------------------------
     7. Copier l'adresse e-mail
     --------------------------------------------------------------------------- */
  $$("[data-copy]").forEach(function (btn) {
    var label = $("span", btn);
    var initial = label ? label.textContent : "";

    btn.addEventListener("click", function () {
      var value = btn.getAttribute("data-copy");

      function done() {
        btn.classList.add("is-done");
        if (label) label.textContent = "Copié !";
        window.setTimeout(function () {
          btn.classList.remove("is-done");
          if (label) label.textContent = initial;
        }, 2000);
      }

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(value).then(done, fallback);
      } else {
        fallback();
      }

      function fallback() {
        var tmp = document.createElement("textarea");
        tmp.value = value;
        tmp.setAttribute("readonly", "");
        tmp.style.position = "absolute";
        tmp.style.left = "-9999px";
        document.body.appendChild(tmp);
        tmp.select();
        try { document.execCommand("copy"); done(); } catch (err) { /* silencieux */ }
        document.body.removeChild(tmp);
      }
    });
  });


  /* ---------------------------------------------------------------------------
     9. Halo qui suit le curseur sur les cartes
     --------------------------------------------------------------------------- */
  if (window.matchMedia("(pointer: fine)").matches) {
    var spotEl = null, spotX = 0, spotY = 0, spotFrame = null;

    function applySpot() {
      spotFrame = null;
      if (!spotEl || reduced) return;
      spotEl.style.setProperty("--mx", spotX + "px");
      spotEl.style.setProperty("--my", spotY + "px");
    }

    document.addEventListener("pointermove", function (e) {
      if (reduced) return;
      var el = e.target && e.target.closest ? e.target.closest("[data-spot]") : null;
      if (!el) return;
      var box = el.getBoundingClientRect();
      spotEl = el;
      spotX = e.clientX - box.left;
      spotY = e.clientY - box.top;
      if (!spotFrame) spotFrame = window.requestAnimationFrame(applySpot);
    }, { passive: true });
  }

  /* ---------------------------------------------------------------------------
     10. Décalage automatique des apparitions entre éléments voisins
     --------------------------------------------------------------------------- */
  (function () {
    var groupes = new Map();
    revealables.forEach(function (el) {
      var parent = el.parentElement;
      if (!parent) return;
      if (!groupes.has(parent)) groupes.set(parent, []);
      groupes.get(parent).push(el);
    });
    groupes.forEach(function (liste) {
      if (liste.length < 2) return;
      liste.forEach(function (el, i) {
        if (!el.style.getPropertyValue("--d")) el.style.setProperty("--d", Math.min(i, 5));
      });
    });
  })();

  /* ---------------------------------------------------------------------------
     11. Parallaxe douce sur les captures d'études de cas
     --------------------------------------------------------------------------- */
  var parallaxImgs = $$(".case-media img");
  if (parallaxImgs.length) {
    var pTicking = false;

    function updateParallax() {
      pTicking = false;
      if (reduced || !desktopPreference.matches) {
        parallaxImgs.forEach(function (img) { img.style.removeProperty("--py"); });
        return;
      }
      var vh = window.innerHeight;
      parallaxImgs.forEach(function (img) {
        var box = img.getBoundingClientRect();
        if (box.bottom < -200 || box.top > vh + 200) return;
        var ratio = (box.top + box.height / 2 - vh / 2) / vh;
        img.style.setProperty("--py", (ratio * -20).toFixed(1) + "px");
      });
    }

    window.addEventListener("scroll", function () {
      if (reduced || !desktopPreference.matches) return;
      if (!pTicking) { window.requestAnimationFrame(updateParallax); pTicking = true; }
    }, { passive: true });
    window.addEventListener("resize", updateParallax);
    updateParallax();
  }

  /* ---------------------------------------------------------------------------
     12. Fondu entre les pages
     --------------------------------------------------------------------------- */
  (function () {
    document.addEventListener("click", function (e) {
      if (reduced || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target && e.target.closest ? e.target.closest("a") : null;
      if (!a || !a.getAttribute("href")) return;
      if (a.target === "_blank" || a.hasAttribute("download")) return;

      var href = a.getAttribute("href");
      if (href.charAt(0) === "#") return;

      var url;
      try { url = new URL(a.href, window.location.href); } catch (err) { return; }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;

      e.preventDefault();
      document.body.classList.add("is-leaving");
      window.setTimeout(function () { window.location.href = a.href; }, 170);
    });

    window.addEventListener("pageshow", function (e) {
      if (e.persisted) document.body.classList.remove("is-leaving");
    });
  })();

  observePreference(motionPreference, function (e) {
    reduced = e.matches;
    if (reduced) {
      revealables.forEach(function (el) { el.classList.add("is-in"); });
      if (revealObserver) revealObserver.disconnect();
      parallaxImgs.forEach(function (img) { img.style.removeProperty("--py"); });
      document.body.classList.remove("is-leaving");
      if (header) header.classList.remove("is-hidden");
    }
  });


  /* ---------------------------------------------------------------------------
     12. Vitrine interactive : changer d'univers
     --------------------------------------------------------------------------- */
  $$(".showcase").forEach(function (bloc) {
    var onglets = $$(".sc-tab", bloc);
    var vues = $$(".sc-shot", bloc);
    if (!onglets.length || !vues.length) return;

    function activer(cible) {
      onglets.forEach(function (o) {
        o.setAttribute("aria-pressed", String(o.getAttribute("data-target") === cible));
      });
      vues.forEach(function (v) {
        var visible = v.id === cible;
        v.classList.toggle("is-active", visible);
        if (visible) v.removeAttribute("aria-hidden");
        else v.setAttribute("aria-hidden", "true");
      });
    }

    onglets.forEach(function (o, i) {
      o.addEventListener("click", function () { activer(o.getAttribute("data-target")); });
      o.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        var suivant = onglets[(i + (e.key === "ArrowRight" ? 1 : onglets.length - 1)) % onglets.length];
        suivant.focus();
        activer(suivant.getAttribute("data-target"));
      });
    });
  });
  /* ---------------------------------------------------------------------------
     13. Détails
     --------------------------------------------------------------------------- */
  var year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
  // Le repli CSS reste actif si l'initialisation du script n'aboutit pas.
  document.documentElement.classList.add("js");
})();
