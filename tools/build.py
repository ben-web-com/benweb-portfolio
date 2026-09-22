#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Génère les 15 pages statiques du site BEN WEB à partir de content.py.

    python3 tools/build.py

Le site produit reste du HTML/CSS/JS pur : ce script n'est qu'un gabarit
partagé pour éviter de dupliquer l'en-tête, le pied de page et la navigation
sur les pages générées.
"""
import os
import sys
import json
sys.dont_write_bytecode = True

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from content import SITE, SERVICES, CASES, ICONS  # noqa: E402
from demos import demo_markup  # noqa: E402
from quote import quote_markup, quote_success_markup  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Version des assets : évite qu'un navigateur serve un ancien CSS après mise à jour.
ASSET_V = "20260915a"

ARROW = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
         'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>')
EXT = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
       'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>')


def icon(name, cls=""):
    return (f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[name]}</svg>')


# ---------------------------------------------------------------------------
# Gabarits communs
# ---------------------------------------------------------------------------
def head(title, desc, path, jsonld=""):
    url = SITE["domain"] + "/" + (path if path != "index.html" else "")
    demo_css = "".join(
        f'<link rel="stylesheet" href="assets/demos/{s["demo"]["css"]}?v={ASSET_V}">'
        for s in SERVICES if s.get("demo", {}).get("css") and path == s["slug"] + ".html")
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="author" content="Benjamin Ikhmim">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="theme-color" content="#08090a">
<meta name="color-scheme" content="dark">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="{SITE['brand']} · {SITE['baseline']}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE['domain']}/assets/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{SITE['domain']}/assets/og.jpg">
<link rel="icon" href="assets/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="assets/favicon-64.png" sizes="64x64" type="image/png">
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
<link rel="preload" as="font" type="font/woff2" href="assets/fonts/InterTight-300_800.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="assets/fonts/InstrumentSerif-400-italic.woff2" crossorigin>
<link rel="stylesheet" href="assets/css/style.css?v={ASSET_V}">
<link rel="stylesheet" href="assets/css/accessibility.css?v={ASSET_V}">
{f'<link rel="stylesheet" href="assets/css/quote.css?v={ASSET_V}">' if path == "contact.html" else ""}
{f'<link rel="stylesheet" href="assets/demos/demos.css?v={ASSET_V}">' if any(s.get('demo') and path == s['slug'] + '.html' for s in SERVICES) else ''}
{demo_css}
<noscript><style>[data-reveal]{{opacity:1!important;transform:none!important;filter:none!important}}.hero h1 .line>span{{transform:none!important}}</style></noscript>
{jsonld}</head>
<body>
<a class="skip-link" href="#main">Aller au contenu</a>
<div class="progress" id="progress" aria-hidden="true"></div>
"""


def brand(tag="a", href="index.html"):
    return (f'<{tag} class="brand" href="{href}" aria-label="{SITE["brand"]}, accueil">'
            f'<img class="brand-mark" src="assets/logo-mark.png" alt="" width="34" height="34" decoding="async">'
            f'<span>{SITE["brand"]}<small>{SITE["baseline"]}</small></span></{tag}>')


def services_menu_items(active):
    return "".join(
        f'<a href="{s["slug"]}.html"{" aria-current=\"page\"" if active == s["slug"] else ""}>'
        f'<span class="mi-ico">{icon(s["icon"])}</span>'
        f'<span><b>{s["nav"]}</b><small>{s["hub_line"]}</small></span></a>'
        for s in SERVICES)


def header(active=""):
    def cls(name):
        return ' class="is-active"' if active == name else ""

    return f"""<header class="header" id="header">
  <div class="container nav">
    {brand()}
    <nav class="nav-links" aria-label="Navigation principale">
      <a href="index.html"{cls('index')}>Accueil</a>
      <div class="nav-drop">
        <a class="nav-services-fallback" href="index.html#services">Services</a>
        <button type="button" class="nav-drop-btn{' is-active' if active in [s['slug'] for s in SERVICES] else ''}" aria-expanded="false" aria-controls="services-menu">
          Services
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
        </button>
        <div class="nav-menu" id="services-menu">{services_menu_items(active)}</div>
      </div>
      <a href="infos.html"{cls('infos')}>Infos</a>
      <a href="contact.html"{cls('contact')}>Contact</a>
    </nav>
    <div class="nav-actions">
      <a class="btn" href="contact.html">Demander un devis {ARROW}</a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-panel" aria-label="Ouvrir le menu">
        <span></span><span></span>
      </button>
    </div>
  </div>
</header>

<div class="mobile-panel" id="mobile-panel" hidden>
  <nav aria-label="Navigation mobile">
    <a href="index.html" style="--i:1">Accueil</a>
    <p class="mobile-label" style="--i:2">Services</p>
    {"".join(f'<a class="mobile-sub" href="{s["slug"]}.html" style="--i:{3 + i}">{s["nav"]}</a>' for i, s in enumerate(SERVICES))}
    <a href="infos.html" style="--i:9">Infos</a>
    <a href="contact.html" style="--i:10">Contact</a>
  </nav>
  <div class="mobile-foot">
    <a class="btn" href="contact.html">Demander un devis</a>
    <p class="mobile-meta">Réponse sous 24 h · FR / EN</p>
  </div>
</div>

<main id="main">
"""


def cta_band(title, text, label="Demander un devis", href="contact.html"):
    return f"""<section class="section cta-band">
  <div class="container">
    <div class="cta-inner" data-reveal data-spot>
      <div>
        <h2 class="h2">{title}</h2>
        <p class="lead" style="margin-top:1.1rem">{text}</p>
      </div>
      <a class="btn btn--lg" href="{href}">{label} {ARROW}</a>
    </div>
  </div>
</section>
"""


def footer(active="", quote=False, demo=False):
    cols = "".join(f'<a href="{s["slug"]}.html">{s["nav"]}</a>' for s in SERVICES)
    return f"""</main>

<footer class="footer">
  <div class="container">
    <div class="footer-top">
      {brand('div', 'index.html').replace('<div class="brand" href="index.html"', '<div class="brand"')}
      <div class="footer-cols">
        <div class="footer-col footer-services">
          <h4>Services</h4>
          <div class="footer-service-links">{cols}</div>
        </div>
        <div class="footer-col">
          <h4>Le studio</h4>
          <a href="index.html">Accueil</a>
          <a href="infos.html">Méthode &amp; FAQ</a>
          <a href="contact.html">Contact</a>
        </div>
        <div class="footer-col">
          <h4>Contact</h4>
          <a href="mailto:{SITE['email']}">{SITE['email']}</a>
          <a href="{SITE['whatsapp_link']}" target="_blank" rel="noopener noreferrer">WhatsApp {SITE['whatsapp_display']}</a>
          <a href="{SITE['instagram']}" target="_blank" rel="noopener noreferrer">Instagram {SITE['handle']}</a>
          <a href="{SITE['tiktok']}" target="_blank" rel="noopener noreferrer">TikTok {SITE['handle']}</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© <span id="year">2026</span> {SITE['brand']} · Benjamin Ikhmim, micro-entreprise. Tous droits réservés.</p>
      <p class="footer-legal">
        <a href="cgv.html">CGV</a>
        <a href="mentions-legales.html">Mentions légales</a>
        <a href="confidentialite.html">Politique de confidentialité</a>
      </p>
    </div>
  </div>
</footer>

<script src="assets/js/main.js?v={ASSET_V}" defer></script>
{f'<script src="assets/demos/loader.js?v={ASSET_V}" defer></script>' if demo else ""}
{f'<script src="assets/js/quote.js?v={ASSET_V}" defer></script>' if quote else ""}
</body>
</html>
"""


def write(path, html):
    with open(os.path.join(ROOT, path), "w", encoding="utf-8") as f:
        f.write("\n".join(line.rstrip() for line in html.splitlines()) + "\n")
    print(f"  {path:26} {len(html) // 1024} Ko")


# ---------------------------------------------------------------------------
# Blocs réutilisables
# ---------------------------------------------------------------------------
def case_visual(c):
    """Capture réelle, galerie ou couverture schématique selon la réalisation."""
    frame = (f'<div class="case-frame" aria-hidden="true"><i></i><i></i><i></i>'
             f'<u>{c["frame"]}</u></div>')
    if "cover" in c:
        cov = c["cover"]
        nodes = "".join(f'<div class="cover-node"><b>{a}</b><span>{b}</span></div>' for a, b in cov["nodes"])
        inner = f"""<div class="case-cover">
              <div><span class="eyebrow">{cov['eyebrow']}</span>
                <p class="cover-title" style="margin-top:.9rem">{cov['title']}</p></div>
              <div class="cover-map">{nodes}</div>
              <div class="cover-foot"><span>{cov['foot'][0]}</span><span>{cov['foot'][1]}</span></div>
            </div>"""
    else:
        inner = (f'<div class="case-media"><img src="{c["img"]}" alt="{c["alt"]}" width="1440" height="1000" '
                 f'loading="lazy" decoding="async"></div>')
        if c.get("gallery"):
            imgs = "".join(f'<img src="{src}" alt="{alt}" width="1440" height="1000" loading="lazy" decoding="async">'
                           for src, alt in c["gallery"])
            inner += f'<div class="case-gallery">{imgs}</div>'
    return f'<div class="case-visual" data-spot>{frame}{inner}</div>'


def case_block(key, index=None):
    c = CASES[key]
    tags = "".join(f'<span class="chip{" chip--type" if i == 0 else ""}">{t}</span>'
                   for i, t in enumerate(c["tags"]))
    feats = "".join(f"<li>{f}</li>" for f in c["features"])
    stack = "".join(f'<span class="chip">{s}</span>' for s in c["stack"])
    num = f'<span class="case-index">{index}</span>' if index else ""

    foot = ""
    if c.get("links"):
        foot = "".join(f'<a class="link-arrow" href="{href}" target="_blank" rel="noopener noreferrer">{label} {EXT}</a>'
                       for href, label in c["links"])
    elif c.get("status"):
        foot = f'<span class="chip">{c["status"]}</span><p class="case-note">{c.get("note", "")}</p>'

    return f"""<article class="case" data-reveal>
          {case_visual(c)}
          <div class="case-body">
            {num}
            <div class="case-tags">{tags}</div>
            <h3>{c['title']}</h3>
            <p class="case-sub">{c['sub']}</p>
            <div class="case-block"><h4>Problématique</h4><p>{c['problem']}</p></div>
            <div class="case-block"><h4>Solution</h4><p>{c['solution']}</p></div>
            <ul class="case-features">{feats}</ul>
            <div class="case-stack">{stack}</div>
            <div class="case-foot">{foot}</div>
          </div>
        </article>"""


def other_services(current):
    items = "".join(
        f'<a class="os-card" href="{s["slug"]}.html" data-spot><span class="os-ico">{icon(s["icon"])}</span>'
        f'<span><b>{s["nav"]}</b><small>{s["hub_line"]}</small></span>'
        f'<span class="os-arrow">{ARROW}</span></a>'
        for s in SERVICES if s["slug"] != current)
    return f"""<section class="section section--tight">
  <div class="container">
    <div class="section-head" data-reveal>
      <div><span class="eyebrow">Autres services</span>
        <h2 class="h2" style="margin-top:1rem">Explorer le reste</h2></div>
    </div>
    <div class="os-grid" data-reveal>{items}</div>
  </div>
</section>
"""


# ---------------------------------------------------------------------------
# Page 1 — Accueil : le menu des services
# ---------------------------------------------------------------------------
def build_index():
    jsonld = f"""<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@graph": [
    {{
      "@type": "Person",
      "@id": "{SITE['domain']}/#benjamin",
      "name": "Benjamin Ikhmim",
      "jobTitle": "Freelance Digital & IA : web, applications et automatisation",
      "email": "mailto:{SITE['email']}",
      "telephone": "+66970499155",
      "url": "{SITE['domain']}/",
      "sameAs": ["{SITE['instagram']}", "{SITE['tiktok']}"],
      "knowsLanguage": ["fr", "en"]
    }},
    {{
      "@type": "ProfessionalService",
      "name": "{SITE['brand']}",
      "founder": {{ "@id": "{SITE['domain']}/#benjamin" }},
      "description": "Cartes digitales NFC, cartes de restaurant connectées, marketing, sites internet, applications web et mobile et automatisations IA pour les professionnels.",
      "areaServed": "Monde",
      "availableLanguage": ["fr", "en"],
      "url": "{SITE['domain']}/",
      "email": "mailto:{SITE['email']}",
      "priceRange": "Sur devis",
      "hasOfferCatalog": {{
        "@type": "OfferCatalog",
        "name": "Services",
        "itemListElement": [{", ".join('{ "@type": "Offer", "itemOffered": { "@type": "Service", "name": "%s", "url": "%s/%s.html" } }' % (s["nav"], SITE["domain"], s["slug"]) for s in SERVICES)}]
      }}
    }}
  ]
}}
</script>
"""

    cards = ""
    for s in SERVICES:
        if s.get("thumb"):
            media = (f'<div class="hub-media{" hub-media--contain" if s.get("thumb_contain") else ""}"><img src="{s["thumb"]}" alt="{s.get("thumb_alt", "")}" '
                     f'width="{s.get("thumb_width", 1440)}" height="{s.get("thumb_height", 1000)}" loading="lazy" decoding="async"></div>')
        else:
            media = f'<div class="hub-media hub-media--icon">{icon(s["icon"], "hub-glyph")}</div>'
        cards += f"""
        <a class="hub-card{' hub-card--featured' if s.get('featured') else ''}" href="{s['slug']}.html" data-reveal data-spot>
          {media}
          <div class="hub-body">
            <span class="hub-num">{s['num']}</span>
            <h3>{s['nav']}</h3>
            <p>{s['hub_line']}</p>
            <span class="hub-link">Découvrir le service {ARROW}</span>
          </div>
        </a>"""

    html = head(
        f"{SITE['brand']} · Sites web, applications, cartes NFC &amp; automatisations IA",
        "Freelance digital &amp; IA pour les professionnels : cartes de visite NFC, cartes de restaurant connectées, marketing, sites internet, applications web et mobile et automatisations. Première version en 48–72 h.",
        "index.html", jsonld)
    html += header("index")
    html += f"""
  <section class="hero hero--hub" id="top">
    <div class="hero-bg" aria-hidden="true"></div>
    <div class="grid-lines" aria-hidden="true"></div>
    <div class="container">
      <div class="hub-intro">
        <span class="pill-status"><span class="dot" aria-hidden="true"></span> Disponible pour de nouveaux projets</span>
        <h1 class="display">
          <span class="line" style="--i:1"><span>Votre activité mérite <em>d’être vue.</em></span></span>
          <span class="line" style="--i:2"><span>Et de donner envie.</span></span>
        </h1>
      </div>
    </div>
  </section>

  <section class="section section--tight" id="services">
    <div class="container">
      <div class="hub-grid">{cards}
      </div>
    </div>
  </section>

"""
    html += cta_band("Vous ne savez pas<br><em>par où commencer ?</em>",
                     "Décrivez votre besoin en trois lignes.",
                     "Parlons de votre projet")
    html += footer()
    write("index.html", html)


# ---------------------------------------------------------------------------
# Pages des services
# ---------------------------------------------------------------------------
def case_mini(key):
    """Version resserrée d'une réalisation, pour les pages qui ont déjà une vitrine."""
    c = CASES[key]
    tags = "".join(f'<span class="chip{" chip--type" if i == 0 else ""}">{t}</span>'
                   for i, t in enumerate(c["tags"][:2]))
    if c.get("links"):
        foot = "".join(f'<a class="link-arrow" href="{href}" target="_blank" rel="noopener noreferrer">{label} {EXT}</a>'
                       for href, label in c["links"][:1])
    else:
        foot = f'<span class="chip">{c.get("status", "")}</span>'

    return f"""<article class="case-mini" data-reveal data-spot>
          {case_visual(c)}
          <div class="case-mini-body">
            <div class="case-tags">{tags}</div>
            <h3>{c['title']}</h3>
            <p>{c['sub']}</p>
            <div class="case-foot">{foot}</div>
          </div>
        </article>"""


def showcase(s):
    """Vitrine interactive : la maquette, la fiche produit, et les trois univers."""
    if not s.get("universes"):
        return ""

    shots = "".join(
        f'<figure class="sc-shot{" is-active" if i == 0 else ""}" id="u-{u["id"]}"'
        f'{"" if i == 0 else " aria-hidden=\"true\""}>'
        f'<img src="{u["img"]}" alt="{u["alt"]}" width="1440" height="1000" '
        f'{"fetchpriority=\"high\"" if i == 0 else "loading=\"lazy\""} decoding="async"></figure>'
        for i, u in enumerate(s["universes"]))

    boutons = "".join(
        f'<button type="button" class="sc-tab" data-target="u-{u["id"]}" aria-pressed="{"true" if i == 0 else "false"}">'
        f'<span class="sc-thumb"><img src="{u["img"]}" alt="" width="1440" height="1000" loading="lazy" decoding="async"></span>'
        f'<span class="sc-lab"><b>{u["nom"]}</b><small>{u["lieu"]}</small></span></button>'
        for i, u in enumerate(s["universes"]))

    items = "".join(f'<li><b>{t}</b><span>{d}</span></li>' for t, d in s["includes"])
    chips = "".join(f'<span class="chip">{c}</span>' for c in s["chips"])

    return f"""<section class="section section--tight showcase" id="apercu">
  <div class="container">
    <div class="sc-grid">
      <div class="sc-left">
        <div class="sc-stage" data-spot>
          {shots}
        </div>
        <div class="sc-switch" role="group" aria-label="Changer d'univers">
          {boutons}
        </div>
        <p class="sc-note">Exemples d'interfaces conçus pour la démonstration. Les noms et les enseignes sont fictifs.</p>
      </div>

      <aside class="sc-sheet" data-reveal>
        <span class="eyebrow">La prestation</span>
        <h2 class="h3">{s['nav']}</h2>
        <p>{s['solution'].split('. ')[0]}.</p>
        <ul class="sc-list">{items}</ul>
        <div class="sc-chips">{chips}</div>
        <a class="btn" href="contact.html">Contactez-moi {ARROW}</a>
      </aside>
    </div>
  </div>
</section>
"""


def build_service(s):
    jsonld = f"""<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "{s['nav']}",
  "serviceType": "{s['nav']}",
  "description": "{s['meta_desc']}",
  "provider": {{ "@type": "ProfessionalService", "name": "{SITE['brand']}", "url": "{SITE['domain']}/" }},
  "areaServed": "Monde",
  "url": "{SITE['domain']}/{s['slug']}.html"
}}
</script>
"""
    chips = "".join(f'<span class="chip">{c}</span>' for c in s["chips"])

    def cartes(items):
        return "".join(
            f'<div class="inc-card" data-reveal style="--d:{i % 3}"><b>{t}</b><p>{d}</p></div>'
            for i, (t, d) in enumerate(items))

    if s.get("includes_groups"):
        includes = "\n      ".join(
            f'<h3 class="inc-label" data-reveal><span>{gi:02d}</span>{titre}</h3>'
            f'<div class="inc-grid">{cartes(items)}</div>'
            for gi, (titre, items) in enumerate(s["includes_groups"], 1))
    else:
        includes = f'<div class="inc-grid">{cartes(s["includes"])}</div>' 
    mini = bool(s.get("universes") or s.get("demo"))
    cases = "".join((case_mini(k) if mini else case_block(k)) for k in s["cases"])
    a_des_cas = bool(s["cases"])
    note = (f'<p class="honest-note" data-reveal><span>À savoir</span>{s["note"]}</p>'
            if s.get("note") else "")

    corps = "" if s.get("universes") else f"""<section class="section section--paper">
    <div class="container">
      <div class="two-col">
        <div data-reveal>
          <span class="eyebrow">Le problème</span>
          <p class="big-text">{s['problem']}</p>
        </div>
        <div data-reveal style="--d:1">
          <span class="eyebrow">Ma réponse</span>
          <p class="big-text">{s['solution']}</p>
        </div>
      </div>

      <div class="section-head" style="margin-top:clamp(3.5rem,7vw,6rem)" data-reveal>
        <div><span class="eyebrow">Ce qui est inclus</span>
          <h2 class="h2" style="margin-top:1rem">Le détail<br><em>de la prestation.</em></h2></div>
      </div>
      {includes}
      {note}
    </div>
  </section>"""

    if s.get("demo"):
        corps = f'''<section class="section section--tight service-inclusions">
  <div class="container"><details class="service-details">
    <summary>Ce qui est inclus dans votre projet <span aria-hidden="true">+</span></summary>
    <div class="service-details-body"><p class="lead">{s['solution']}</p>{includes}{note}</div>
  </details></div>
</section>'''
    vitrine = demo_markup(s) if s.get("demo") else showcase(s)

    realisations = f"""  <section class="section" id="realisations">
    <div class="container">
      <div class="section-head" data-reveal>
        <div><span class="eyebrow">Réalisations</span>
          <h2 class="h2" style="margin-top:1rem">Quelques<br><em>réalisations.</em></h2></div>
        <p class="lead">Des projets à découvrir, avec leur contexte et leur statut.</p>
      </div>
      <div class="{'cases cases--mini' if mini else 'cases'}">{cases}</div>
    </div>
  </section>""" if a_des_cas else ""

    html = head(f"{s['meta_title']} · {SITE['brand']}", s["meta_desc"], f"{s['slug']}.html", jsonld)
    html += header(s["slug"])
    html += f"""
  <section class="page-hero{' page-hero--demo' if s.get('demo') else ''}">
    <div class="hero-bg" aria-hidden="true"></div>
    <div class="grid-lines" aria-hidden="true"></div>
    <div class="container">
      <nav class="crumbs" aria-label="Fil d'Ariane">
        <a href="index.html">Accueil</a><span aria-hidden="true">/</span>
        <a href="index.html#services">Services</a><span aria-hidden="true">/</span>
        <span aria-current="page">{s['nav']}</span>
      </nav>
      <span class="eyebrow">Service {s['num']} / {len(SERVICES):02d}</span>
      <h1 class="display">{s['h1']}</h1>
      <p class="lead">{s['lead']}</p>
      <div class="hero-cta">
        <a class="btn btn--lg" href="contact.html?service={s['slug']}">Demander mon devis {ARROW}</a>
        {'<a class="btn btn--ghost btn--lg" href="#demo">Essayer la démo ↓</a>' if s.get('demo') else '<a class="btn btn--ghost btn--lg" href="#realisations">Voir les réalisations</a>' if a_des_cas else '<a class="btn btn--ghost btn--lg" href="infos.html">Comment ça se passe</a>'}
      </div>
      <div class="chip-row">{chips}</div>
    </div>
  </section>

  {vitrine}
  {corps}

  {realisations}
"""
    html += cta_band(f"Un projet de<br><em>{s['nav'].lower()}</em> ?",
                     "Décrivez-le en quelques lignes. Vous recevez sous 24 h un avis honnête, un délai et un prix fixe, sans engagement.",
                     "Demander mon devis", href=f"contact.html?service={s['slug']}")
    html += other_services(s["slug"])
    html += footer(demo=bool(s.get("demo")))
    write(f"{s['slug']}.html", html)


# ---------------------------------------------------------------------------
# Page 10 — Infos essentielles
# ---------------------------------------------------------------------------
FAQ = [
    ("Combien coûte un projet ?",
     "Le prix est fixe et annoncé avant de commencer, après un échange de cadrage. Il dépend du périmètre : une carte digitale, un site vitrine, une boutique et une application métier n'engagent pas le même travail. Vous savez exactement ce que vous payez, sans facturation à l'heure ni surprise en cours de route."),
    ("Une livraison rapide, cela veut-il dire un travail bâclé ?",
     "Non, la rapidité vient des outils, pas des raccourcis. J'utilise l'IA et des briques déjà éprouvées pour supprimer le temps mécanique : structure du projet, code répétitif, contenus de départ. Le temps gagné est réinvesti là où cela compte : le design, la clarté du message et les détails d'interaction. Vous jugez sur pièces, pas sur une promesse."),
    ("À qui appartient le site une fois livré ?",
     "À vous, entièrement : le code, le nom de domaine, l'hébergement et tous les accès. Aucun abonnement obligatoire, aucun verrou technique. Si vous souhaitez ensuite travailler avec quelqu'un d'autre, le projet est repris sans difficulté. C'est aussi pour cela que j'écris un code propre et documenté."),
    ("Je n'ai ni textes, ni images, ni identité visuelle.",
     "C'est le cas le plus fréquent, et ce n'est pas un problème. Je peux rédiger les textes, définir la direction artistique et produire les visuels nécessaires. Vous apportez la matière brute : ce que vous faites, pour qui, et ce qui vous différencie. Je m'occupe de la mise en forme."),
    ("Travaillez-vous avec des particuliers ?",
     "Mes prestations s'adressent aux professionnels : entreprises, commerçants, restaurateurs, associations et travailleurs indépendants, dans le cadre de leur activité. C'est ce qui me permet de garder des délais courts et une organisation simple, sans alourdir chaque projet de formalités."),
    ("Comment se passe le paiement ?",
     "En micro-entreprise, sans TVA : le prix annoncé est le prix payé. Le règlement se fait en une seule fois, au lancement du projet, juste après le premier échange en visio. La facture est fournie systématiquement."),
    ("Et après la mise en ligne ?",
     "Je vous montre comment gérer votre outil en autonomie et je reste joignable pour les ajustements qui suivent le lancement. Pour les évolutions plus importantes, on définit simplement un nouveau périmètre. Aucun engagement de maintenance n'est imposé."),
]


def build_infos():
    faq_items = "".join(f"""
        <div class="faq-item">
          <button class="faq-q" type="button" aria-expanded="true" aria-controls="faq-{i}">
            {q} <span class="faq-icon" aria-hidden="true"></span>
          </button>
          <div class="faq-a" id="faq-{i}"><div><p>{a}</p></div></div>
        </div>""" for i, (q, a) in enumerate(FAQ, 1))

    jsonld = """<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[%s]}
</script>
""" % ",".join(
        '{"@type":"Question","name":%s,"acceptedAnswer":{"@type":"Answer","text":%s}}'
        % (json.dumps(q, ensure_ascii=False), json.dumps(a, ensure_ascii=False)) for q, a in FAQ)

    html = head(f"Rapidité, méthode et questions fréquentes · {SITE['brand']}",
                "Pourquoi les délais sont courts sans sacrifier la finition, comment se déroule un projet, ce qui est livré à chaque fois, et les réponses aux questions qui reviennent avant de démarrer.",
                "infos.html", jsonld)
    html += header("infos")
    html += f"""
  <section class="page-hero">
    <div class="hero-bg" aria-hidden="true"></div>
    <div class="grid-lines" aria-hidden="true"></div>
    <div class="container">
      <span class="eyebrow">Infos essentielles</span>
      <h1 class="display">Comment ça se passe,<br><em>concrètement.</em></h1>
      <p class="lead">
        Pourquoi les délais sont courts, comment se déroule un projet, ce qui est
        livré à chaque fois, et les réponses aux questions qui reviennent avant de
        démarrer. Si quelque chose manque, écrivez-moi : je préfère une question de
        plus qu'un malentendu.
      </p>
      <div class="hero-cta">
        <a class="btn btn--lg" href="contact.html">Contactez-moi {ARROW}</a>
        <a class="btn btn--ghost btn--lg" href="index.html#services">Voir les 7 services</a>
      </div>
    </div>
  </section>

  <section class="section section--paper">
    <div class="container">
      <div class="speed-grid">
        <div data-reveal>
          <span class="eyebrow">Rapidité</span>
          <h2 class="h2" style="margin-top:1.1rem">Vite fait,<br><em>bien fait.</em></h2>
          <p class="lead" style="margin-top:1.5rem">
            Les outils modernes et l'IA réduisent considérablement le temps de
            développement, pas le niveau de finition. Vous achetez un résultat en
            ligne, pas un nombre d'heures passées derrière un écran.
          </p>

          <div class="speed-points">
            <div class="speed-point">
              <span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4.5 13.5H12l-1 8.5 8.5-11.5H12z"/></svg></span>
              <div><h4>Un workflow assisté par IA</h4>
                <p>Génération, refactorisation et tests accélérés : ce qui prenait une semaine se construit en quelques jours, avec le même niveau d'exigence sur le rendu final.</p></div>
            </div>
            <div class="speed-point">
              <span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg></span>
              <div><h4>Des briques éprouvées</h4>
                <p>Composants, structures et automatisations réutilisés d'un projet à l'autre. Je ne repars jamais d'une page blanche, et vous ne payez pas pour que je réinvente la roue.</p></div>
            </div>
            <div class="speed-point">
              <span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span>
              <div><h4>Une seule personne à convaincre</h4>
                <p>Pas de chaîne de validation interne : vous envoyez un retour le matin, il est intégré dans la journée. C'est souvent là que se gagnent les vrais délais.</p></div>
            </div>
          </div>
        </div>

        <div data-reveal style="--d:1">
          <span class="eyebrow">Délais</span>
          <h2 class="h2" style="font-size:clamp(1.6rem,3vw,2.4rem);margin:1.1rem 0 2rem">Annoncés à l'avance</h2>
          <div class="steps">
            <div class="step"><span class="step-num">1</span><div>
              <h4>Carte digitale, NFC, landing page</h4>
              <p>Le format le plus rapide : une page, un message, une action. Contenu fourni, mise en ligne comprise.</p>
              <span class="step-time">48 h</span></div></div>
            <div class="step"><span class="step-num">2</span><div>
              <h4>Site vitrine, site de présentation</h4>
              <p>Plusieurs sections, une direction artistique dédiée, du contenu rédigé ensemble et un référencement propre.</p>
              <span class="step-time">48 à 72 h</span></div></div>
            <div class="step"><span class="step-num">3</span><div>
              <h4>Boutique, carte restaurant connectée</h4>
              <p>Catalogue, commandes, paiement et back-office : la première version tourne vite, on affine ensuite avec vous.</p>
              <span class="step-time">2 à 5 jours</span></div></div>
            <div class="step"><span class="step-num">4</span><div>
              <h4>Application métier, plateforme</h4>
              <p>Périmètre défini au cadrage, livraisons intermédiaires régulières : vous voyez l'outil grandir chaque semaine.</p>
              <span class="step-time">Annoncé au cadrage</span></div></div>
          </div>
        </div>
      </div>

      <div class="quote-band" data-reveal>
        <p>« Le client achète le résultat,<br>pas le nombre d'heures passées derrière l'écran. »</p>
      </div>

      <div class="section-head" style="margin-top:clamp(3.5rem,7vw,6rem)" data-reveal>
        <div><span class="eyebrow">Méthode</span>
          <h2 class="h2" style="margin-top:1rem">Quatre étapes,<br><em>pas une de plus.</em></h2></div>
        <p class="lead">Le même déroulé pour tous les projets, quelle que soit leur taille. Vous savez toujours où vous en êtes.</p>
      </div>

      <div class="steps steps--wide">
        <div class="step" data-reveal><span class="step-num">1</span><div>
          <h4>Échange &amp; cadrage</h4>
          <p>30 minutes en visio ou par écrit pour comprendre votre activité, votre objectif et vos contraintes. J'en ressors avec un périmètre clair et un prix fixe.</p>
          <span class="step-time">Jour 0 · gratuit</span></div></div>
        <div class="step" data-reveal><span class="step-num">2</span><div>
          <h4>Première version</h4>
          <p>Je construis directement une version réelle et navigable plutôt qu'une maquette figée. Vous voyez le vrai rendu, sur votre téléphone, très tôt.</p>
          <span class="step-time">48 à 72 h sur les projets adaptés</span></div></div>
        <div class="step" data-reveal><span class="step-num">3</span><div>
          <h4>Itérations</h4>
          <p>Vos retours sont intégrés par cycles courts : contenu, design, détails d'interaction. Trois séries de retours sont comprises dans le prix.</p>
          <span class="step-time">Cycles de 24 h</span></div></div>
        <div class="step" data-reveal><span class="step-num">4</span><div>
          <h4>Mise en ligne &amp; transfert</h4>
          <p>Nom de domaine, hébergement, performances, SEO technique, analytics. Puis le code et les accès vous sont transmis : tout vous appartient.</p>
          <span class="step-time">Livraison finale</span></div></div>
      </div>

      <div class="section-head" style="margin-top:clamp(3.5rem,7vw,6rem)" data-reveal>
        <div><span class="eyebrow">Ce que vous obtenez</span>
          <h2 class="h2" style="margin-top:1rem">Livré à chaque fois,<br><em>sans supplément.</em></h2></div>
      </div>
      <div class="deliverables" data-reveal>
        <div class="deliverable"><svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          <b>Responsive irréprochable</b><span>Testé sur mobile, tablette et grand écran.</span></div>
        <div class="deliverable"><svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          <b>Performance &amp; SEO technique</b><span>Structure sémantique, métadonnées, chargement optimisé.</span></div>
        <div class="deliverable"><svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          <b>Code propre et documenté</b><span>Maintenable par vous ou par un autre développeur.</span></div>
        <div class="deliverable"><svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          <b>Garantie 30 jours</b><span>Tout dysfonctionnement corrigé gratuitement après la livraison.</span></div>
      </div>
    </div>
  </section>

  <section class="section" id="faq">
    <div class="container">
      <div class="section-head" data-reveal style="justify-content:center;text-align:center">
        <div style="margin-inline:auto">
          <span class="eyebrow">Questions fréquentes</span>
          <h2 class="h2" style="margin-top:1.1rem">Ce que l'on me demande<br><em>avant de démarrer.</em></h2>
        </div>
      </div>
      <div class="faq" data-reveal>{faq_items}
      </div>
    </div>
  </section>
"""
    html += cta_band("Il reste une question ?",
                     "Posez-la directement. Je réponds sous 24 h, même quand la réponse est « ce n'est pas pour moi ».",
                     "Contactez-moi")
    html += footer()
    write("infos.html", html)


# ---------------------------------------------------------------------------
# Page 11 — Contact
# ---------------------------------------------------------------------------
def build_contact():
    html = head(f"Demander un devis · {SITE['brand']}",
                "Un projet pour votre activité ? Quelques choix suffisent pour expliquer votre besoin et recevoir un devis personnalisé, sans engagement.",
                "contact.html")
    html += header("contact")
    html += """<section class="page-hero page-hero--contact quote-hero">
    <div class="hero-bg" aria-hidden="true"></div>
    <div class="container"><span class="eyebrow">Votre projet commence ici</span>
      <h1 class="display">Quelques questions.<br><em>Un projet qui vous ressemble.</em></h1>
      <p class="lead">Choisissez ce dont vous avez besoin. Je vous réponds personnellement, avec un devis adapté.</p>
    </div></section>"""
    html += quote_markup(SITE, SERVICES, icon)
    html += footer(quote=True)
    write("contact.html", html)


def build_thanks():
    html = head(f"Merci pour votre demande · {SITE['brand']}", "Votre demande de devis a été envoyée.", "merci.html")
    html = html.replace('content="index,follow,max-image-preview:large"', 'content="noindex,follow"')
    html += header("contact") + quote_success_markup() + footer()
    write("merci.html", html)


def build_cgv():
    corps = f"""
        <p class="prose-intro">
          Les présentes conditions générales de vente régissent les prestations
          réalisées par {SITE['brand']} (Benjamin Ikhmim, entrepreneur individuel),
          ci-après « le Prestataire », pour ses clients professionnels, ci-après
          « le Client ». Toute commande implique leur acceptation sans réserve.
        </p>

        <h2>1. Champ d'application</h2>
        <p>
          Les prestations proposées s'adressent exclusivement à des professionnels :
          entreprises, commerçants, restaurateurs, associations et travailleurs
          indépendants agissant dans le cadre de leur activité. Elles ne constituent
          pas une vente à des consommateurs au sens du Code de la consommation.
        </p>
        <p>
          Les contrats sont conclus à distance, par échange écrit ou en visioconférence.
          Le droit de rétractation prévu par le Code de la consommation n'est pas
          applicable aux relations entre professionnels.
        </p>

        <h2>2. Devis et commande</h2>
        <p>
          Chaque prestation fait l'objet d'un devis écrit précisant le périmètre, le
          prix et le délai. Le devis est valable trente jours. La commande est ferme
          dès son acceptation écrite par le Client, par signature ou par simple accord
          par e-mail.
        </p>
        <p>
          Toute demande n'apparaissant pas au devis constitue une prestation
          complémentaire, faisant l'objet d'un nouveau devis.
        </p>

        <h2>3. Prix</h2>
        <p>
          Les prix sont fixes, exprimés en euros et annoncés avant le démarrage.
          TVA non applicable, article 293 B du Code général des impôts.
        </p>
        <p>
          Restent à la charge du Client et ne sont pas compris dans le prix : le nom de
          domaine, l'hébergement, les licences et abonnements tiers, l'impression des
          supports physiques (cartes NFC notamment), les frais des prestataires
          d'encaissement et, de manière générale, tout service souscrit auprès d'un
          tiers.
        </p>

        <h2>4. Paiement</h2>
        <p>
          La prestation est payable <strong>en totalité à la commande</strong>, à la
          suite du premier échange de cadrage. Les travaux démarrent à réception du
          paiement. Une facture est établie systématiquement.
        </p>
        <p>
          Pour les projets dont le paiement est échelonné d'un commun accord, tout
          retard entraîne de plein droit des pénalités égales à trois fois le taux
          d'intérêt légal, ainsi qu'une indemnité forfaitaire de recouvrement de
          40 euros, conformément aux articles L.441-10 et D.441-5 du Code de commerce.
        </p>

        <h2>5. Obligations du Client</h2>
        <p>
          Le Client fournit en temps utile les éléments nécessaires à la réalisation :
          textes, images, logos, accès techniques et informations sur son activité. Il
          garantit détenir les droits d'exploitation des contenus qu'il transmet et
          garantit le Prestataire contre tout recours à ce titre.
        </p>
        <p>
          Le Client désigne un interlocuteur unique, habilité à valider les étapes du
          projet.
        </p>

        <h2>6. Déroulement, retours et validation</h2>
        <p>
          Après la remise de la première version, le prix comprend
          <strong>trois séries de retours</strong>. Chaque série regroupe l'ensemble
          des demandes du Client en un seul envoi. Les retours supplémentaires sont
          facturés au tarif en vigueur, communiqué avant toute intervention.
        </p>
        <p>
          À défaut de retour écrit du Client dans un délai de
          <strong>sept jours</strong> suivant la mise à disposition d'une version,
          celle-ci est réputée validée et le projet poursuit son cours ou est clôturé.
        </p>

        <h2>7. Délais</h2>
        <p>
          Les délais annoncés courent à compter de la réception du paiement et de
          l'ensemble des éléments nécessaires. Ils sont suspendus pendant toute période
          d'attente d'un contenu, d'un accès ou d'une validation du Client.
        </p>
        <p>
          Les délais indiqués sur ce site sont donnés à titre indicatif ; seul le délai
          porté au devis engage le Prestataire.
        </p>

        <h2>8. Livraison</h2>
        <p>
          La livraison intervient par la mise en ligne de la prestation ou par la
          transmission des fichiers et des accès. Elle vaut réception des travaux.
        </p>

        <h2>9. Garantie</h2>
        <p>
          Le Prestataire corrige gratuitement, pendant <strong>trente jours</strong>
          après la livraison, tout dysfonctionnement du travail livré qui lui serait
          signalé par écrit.
        </p>
        <p>
          Sont exclus de cette garantie : les évolutions et ajouts de fonctionnalités,
          les modifications réalisées par le Client ou par un tiers, les défaillances
          des services tiers (hébergeur, plateforme, fournisseur d'accès), ainsi que
          les incompatibilités liées à des équipements ou navigateurs obsolètes.
        </p>

        <h2>10. Annulation</h2>
        <p>
          En cas d'annulation par le Client après le démarrage des travaux, les sommes
          versées <strong>restent intégralement acquises</strong> au Prestataire, les
          moyens ayant été engagés et le travail entamé. Les éléments réalisés à la
          date de l'annulation sont remis au Client.
        </p>
        <p>
          En cas d'annulation par le Prestataire, les sommes correspondant aux
          prestations non réalisées sont remboursées au Client sous trente jours.
        </p>

        <h2>11. Propriété intellectuelle</h2>
        <p>
          Les droits d'exploitation des livrables sont cédés au Client
          <strong>au paiement intégral</strong> de la prestation. Avant complet
          paiement, les livrables demeurent la propriété du Prestataire et leur
          utilisation est interdite.
        </p>
        <p>
          Le Prestataire conserve la propriété des outils, bibliothèques, scripts et
          composants génériques développés antérieurement et réutilisés, dont le Client
          reçoit un droit d'usage dans le cadre du projet.
        </p>
        <p>
          Sauf refus écrit du Client, le Prestataire peut citer le projet et en
          présenter des visuels à titre de référence professionnelle.
        </p>

        <h2>12. Hébergement et services tiers</h2>
        <p>
          Le nom de domaine, l'hébergement et les comptes de services tiers sont
          souscrits au nom du Client et demeurent sa propriété. Le Prestataire peut
          assurer leur mise en place, sans être responsable des interruptions,
          modifications tarifaires ou défaillances de ces services.
        </p>

        <h2>13. Responsabilité</h2>
        <p>
          Le Prestataire est tenu à une obligation de moyens. Sa responsabilité
          éventuelle est limitée au montant effectivement payé par le Client pour la
          prestation concernée.
        </p>
        <p>
          Sont exclus les dommages indirects, notamment la perte de chiffre d'affaires,
          de clientèle, de données ou d'image. Le Client demeure responsable du contenu
          qu'il diffuse et du respect de la réglementation applicable à son activité.
        </p>

        <h2>14. Confidentialité</h2>
        <p>
          Chaque partie s'engage à ne pas divulguer les informations confidentielles
          portées à sa connaissance à l'occasion du projet, pendant toute sa durée et
          les deux années suivantes.
        </p>

        <h2>15. Force majeure</h2>
        <p>
          Aucune des parties ne peut être tenue responsable d'un manquement résultant
          d'un cas de force majeure au sens de l'article 1218 du Code civil. Les délais
          sont alors suspendus pour la durée de l'événement.
        </p>

        <h2>16. Données personnelles</h2>
        <p>
          Le traitement des données est décrit dans la
          <a href="confidentialite.html">politique de confidentialité</a>.
        </p>

        <h2>17. Droit applicable et litiges</h2>
        <p>
          Les présentes conditions sont soumises au droit français. En cas de
          différend, les parties s'engagent à rechercher une solution amiable avant
          toute action. À défaut d'accord, le litige sera porté devant les tribunaux
          français compétents.
        </p>
    """

    legal_page(
        "cgv", "Conditions générales de vente",
        f"Conditions générales de vente de {SITE['brand']} : devis, paiement, retours inclus, délais, garantie, annulation et propriété des livrables.",
        "Conditions<br><em>générales de vente.</em>",
        "Les règles qui encadrent chaque prestation : commande, paiement, retours inclus, délais, garantie et propriété des livrables.",
        corps)


def build_404():
    liens = "".join(
        f'<a class="os-card" href="{x["slug"]}.html" data-spot><span class="os-ico">{icon(x["icon"])}</span>'
        f'<span><b>{x["nav"]}</b><small>{x["hub_line"]}</small></span>'
        f'<span class="os-arrow">{ARROW}</span></a>'
        for x in SERVICES[:3])

    html = head(f"Page introuvable · {SITE['brand']}",
                "Cette page n'existe pas ou a été déplacée. Retrouvez les services, les réalisations et le contact.",
                "404.html")
    html = html.replace('<meta name="robots" content="index,follow,max-image-preview:large">',
                        '<meta name="robots" content="noindex,follow">')
    html += header("")
    html += f"""
  <section class="page-hero page-hero--404">
    <div class="hero-bg" aria-hidden="true"></div>
    <div class="grid-lines" aria-hidden="true"></div>
    <div class="container">
      <span class="eyebrow">Erreur 404</span>
      <h1 class="display">Cette page<br><em>n'existe pas.</em></h1>
      <p class="lead">
        Le lien est peut-être ancien, ou la page a changé d'adresse. Voici par où
        continuer.
      </p>
      <div class="hero-cta">
        <a class="btn btn--lg" href="index.html">Retour à l'accueil {ARROW}</a>
        <a class="btn btn--ghost btn--lg" href="contact.html">Contactez-moi</a>
      </div>
    </div>
  </section>

  <section class="section section--tight">
    <div class="container">
      <div class="section-head" data-reveal>
        <div><span class="eyebrow">Services</span>
          <h2 class="h2" style="margin-top:1rem">Les plus demandés</h2></div>
      </div>
      <div class="os-grid" data-reveal>{liens}</div>
    </div>
  </section>
"""
    html += footer()
    write("404.html", html)


# ---------------------------------------------------------------------------
def build_sitemap():
    pages = ([""] + [s["slug"] + ".html" for s in SERVICES]
             + ["infos.html", "contact.html", "cgv.html", "mentions-legales.html", "confidentialite.html"])
    urls = "".join(
        f"\n  <url>\n    <loc>{SITE['domain']}/{p}</loc>\n"
        f"    <changefreq>monthly</changefreq>\n"
        f"    <priority>{'1.0' if p == '' else '0.8'}</priority>\n  </url>"
        for p in pages)
    write("sitemap.xml", f'<?xml version="1.0" encoding="UTF-8"?>\n'
                        f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}\n</urlset>\n')
    write("robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {SITE['domain']}/sitemap.xml\n")


def main():
    print("Génération du site BEN WEB :")
    build_index()
    for s in SERVICES:
        build_service(s)
    build_infos()
    build_contact()
    build_thanks()
    build_legal()
    build_cgv()
    build_404()
    build_sitemap()
    print(f"\n{len(SERVICES) + 8} pages générées dans {ROOT}")



# ---------------------------------------------------------------------------
# Pages 12 et 13 — mentions légales & confidentialité
# ---------------------------------------------------------------------------
MAJ = "15 septembre 2026"


def todo(txt):
    return f'<span class="todo">{txt}</span>'


def legal_page(slug, title, desc, h1, lead, body):
    html = head(f"{title} · {SITE['brand']}", desc, f"{slug}.html")
    html += header("")
    html += f"""
  <section class="page-hero page-hero--legal">
    <div class="hero-bg" aria-hidden="true"></div>
    <div class="container">
      <nav class="crumbs" aria-label="Fil d'Ariane">
        <a href="index.html">Accueil</a><span aria-hidden="true">/</span>
        <span aria-current="page">{title}</span>
      </nav>
      <h1 class="h2">{h1}</h1>
      <p class="lead" style="margin-top:1.25rem">{lead}</p>
      <p class="legal-date">Dernière mise à jour : {MAJ}</p>
    </div>
  </section>

  <section class="section section--tight">
    <div class="container">
      <div class="prose">{body}</div>
    </div>
  </section>
"""
    html += footer()
    write(f"{slug}.html", html)


def build_legal():
    # ---------------------------- Mentions légales ----------------------------
    mentions = f"""
        <h2>1. Éditeur du site</h2>
        <p>Le présent site est édité par :</p>
        <dl class="legal-dl">
          <div><dt>Nom</dt><dd>Benjamin Ikhmim</dd></div>
          <div><dt>Nom commercial</dt><dd>{SITE['brand']}</dd></div>
          <div><dt>Statut</dt><dd>Entrepreneur individuel, micro-entreprise</dd></div>
          <div><dt>Adresse</dt><dd>{todo('adresse de l&rsquo;entreprise à compléter')}</dd></div>
          <div><dt>SIREN</dt><dd>109 873 612</dd></div>
          <div><dt>TVA</dt><dd>TVA non applicable, article 293 B du Code général des impôts</dd></div>
          <div><dt>E-mail</dt><dd><a href="mailto:{SITE['email']}">{SITE['email']}</a></dd></div>
          <div><dt>Téléphone</dt><dd>{SITE['whatsapp_display']}</dd></div>
          <div><dt>Directeur de la publication</dt><dd>Benjamin Ikhmim</dd></div>
        </dl>

        <h2>2. Hébergement</h2>
        <p>Le site est hébergé par :</p>
        <dl class="legal-dl">
          <div><dt>Hébergeur</dt><dd>Netlify, Inc. {todo('à remplacer si vous choisissez un autre hébergeur')}</dd></div>
          <div><dt>Adresse</dt><dd>512 2nd Street, Suite 200, San Francisco, CA 94107, États-Unis</dd></div>
          <div><dt>Site</dt><dd><a href="https://www.netlify.com" target="_blank" rel="noopener noreferrer">www.netlify.com</a></dd></div>
        </dl>

        <h2>3. Propriété intellectuelle</h2>
        <p>
          L'ensemble de ce site (structure, textes, mise en page, code source, identité
          visuelle et logo) relève de la législation française et internationale sur le
          droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction
          sont réservés.
        </p>
        <p>
          Toute reproduction, représentation, modification ou adaptation, totale ou
          partielle, de tout ou partie du site, par quelque procédé que ce soit, est
          interdite sans autorisation écrite préalable de l'éditeur.
        </p>

        <h2>4. Réalisations présentées</h2>
        <p>
          Les projets présentés dans la rubrique « Réalisations » illustrent des travaux
          effectivement conçus et développés par l'éditeur. Les marques, noms commerciaux,
          logos et contenus qui y apparaissent demeurent la propriété exclusive de leurs
          titulaires respectifs et sont reproduits à titre de références professionnelles.
        </p>
        <p>
          Les projets identifiés comme personnels ou comme démonstrations sont signalés
          en tant que tels sur les pages concernées. Aucun témoignage, résultat commercial
          ou avis client n'est présenté sur ce site.
        </p>

        <h2>5. Liens hypertextes</h2>
        <p>
          Ce site contient des liens vers des sites tiers (réalisations en ligne, réseaux
          sociaux, services de messagerie). L'éditeur n'exerce aucun contrôle sur ces sites
          et décline toute responsabilité quant à leur contenu, à leur disponibilité ou aux
          pratiques de leurs exploitants en matière de données personnelles.
        </p>

        <h2>6. Responsabilité</h2>
        <p>
          L'éditeur s'efforce de fournir des informations exactes et tenues à jour. Les
          délais, périmètres et prestations décrits sur ce site sont donnés à titre
          indicatif : ils sont précisés et contractualisés au cas par cas, par devis, avant
          le démarrage de toute mission.
        </p>
        <p>
          L'éditeur ne saurait être tenu responsable des dommages directs ou indirects
          résultant de l'accès au site ou de son utilisation, notamment en cas
          d'indisponibilité temporaire ou d'erreur typographique.
        </p>

        <h2>7. Données personnelles</h2>
        <p>
          Le traitement des données transmises via le formulaire de contact est détaillé
          dans la <a href="confidentialite.html">politique de confidentialité</a>.
        </p>

        <h2>8. Droit applicable et litiges</h2>
        <p>
          Les présentes mentions légales sont soumises au droit français. En cas de litige,
          et à défaut de résolution amiable, les tribunaux français seront seuls compétents.
        </p>
        <p>
          Les prestations présentées sur ce site s'adressent exclusivement à des
          professionnels : entreprises, commerçants, restaurateurs, associations et
          travailleurs indépendants agissant dans le cadre de leur activité. Elles ne
          constituent pas une vente à des consommateurs au sens du Code de la
          consommation.
        </p>
    """

    legal_page(
        "mentions-legales", "Mentions légales",
        f"Mentions légales du site {SITE['brand']} : éditeur, hébergement, propriété intellectuelle, responsabilité et médiation.",
        "Mentions<br><em>légales.</em>",
        "Les informations légales relatives à l'éditeur de ce site, à son hébergement et aux conditions d'utilisation de son contenu.",
        mentions)

    # -------------------------- Confidentialité (RGPD) -------------------------
    confid = f"""
        <h2>1. Responsable du traitement</h2>
        <p>
          Les échanges liés à ce site sont traités par Benjamin Ikhmim
          ({SITE['brand']}), entrepreneur individuel, joignable à l'adresse
          <a href="mailto:{SITE['email']}">{SITE['email']}</a>.
        </p>

        <h2>2. Votre demande de devis</h2>
        <p>
          Le questionnaire recueille le service souhaité, votre activité, l’état de
          votre projet, son échéance, votre nom et votre e-mail. Le téléphone et
          le message sont facultatifs. Ces informations servent à répondre à votre
          demande et à préparer un devis. Les champs obligatoires sont nécessaires
          pour comprendre votre besoin et vous recontacter.
        </p>
        <p>
          Le traitement repose sur les mesures précontractuelles prises à votre demande.
          Les réponses envoyées sont reçues par Benjamin Ikhmim et traitées par
          Formspree, le service utilisé pour recevoir les formulaires. Elles ne servent
          pas à vous inscrire à une liste publicitaire.
        </p>
        <p>
          Avant l’envoi, votre navigateur conserve vos réponses dans le stockage de
          session de l’onglet afin de reprendre le questionnaire après un
          rafraîchissement. Vous pouvez les effacer avec « Effacer mes réponses ».
          Elles sont retirées de ce stockage après un envoi confirmé. Les commandes
          des démonstrations restent dans votre navigateur et ne sont pas envoyées.
        </p>
        <p>
          Formspree étant un prestataire américain, le traitement peut impliquer un
          transfert hors de l’Union européenne. Les conditions de traitement et
          garanties proposées par ce prestataire sont consultables dans son
          <a href="https://formspree.io/legal/privacy-policy/" target="_blank" rel="noopener noreferrer">document relatif à la confidentialité</a>.
        </p>

        <h2>3. Cookies et mesure d'audience</h2>
        <p>
          <strong>Ce site n'utilise aucun cookie</strong> : ni cookie publicitaire,
          ni traceur tiers, ni outil de mesure d'audience. Aucune bannière de
          consentement n'est donc nécessaire.
        </p>
        <p>
          Si un outil de statistiques venait à être ajouté, la présente politique
          serait mise à jour et, le cas échéant, votre consentement recueilli au
          préalable.
        </p>

        <h2>4. Journaux techniques de l'hébergeur</h2>
        <p>
          Comme tout site accessible en ligne, les serveurs de l'hébergeur
          enregistrent des journaux techniques de connexion (adresse IP, date,
          page demandée, type de navigateur). Ces informations servent uniquement
          à assurer la sécurité et le bon fonctionnement du service, relèvent de
          l'hébergeur et ne sont ni exploitées ni conservées par l'éditeur.
          {todo('à adapter si vous changez d&rsquo;hébergeur')}
        </p>

        <h2>5. Lorsque vous me contactez</h2>
        <p>
          Vous pouvez aussi me contacter par e-mail, WhatsApp, Instagram ou TikTok. Dans ce
          cas, les informations que vous transmettez volontairement (nom, adresse,
          numéro, contenu du message) sont traitées dans le seul but de répondre à
          votre demande, d'établir un devis puis d'assurer le suivi de la mission.
        </p>
        <p>
          Ces échanges transitent par les services que vous choisissez d'utiliser,
          chacun appliquant sa propre politique de confidentialité. Vos données ne
          sont jamais vendues, louées, ni transmises à des fins commerciales ou
          publicitaires.
        </p>

        <h2>6. Durée de conservation</h2>
        <p>
          Les échanges sont conservés pendant trois ans à compter du dernier
          contact, puis supprimés. Les documents liés à une mission facturée sont
          conservés pendant la durée légale applicable en matière comptable et
          fiscale.
        </p>

        <h2>7. Vos droits</h2>
        <p>
          Conformément au Règlement général sur la protection des données et à la
          loi Informatique et Libertés, vous disposez des droits suivants sur vos
          données :
        </p>
        <ul>
          <li>droit d'accès et de copie ;</li>
          <li>droit de rectification ;</li>
          <li>droit à l'effacement ;</li>
          <li>droit à la limitation du traitement ;</li>
          <li>droit d'opposition ;</li>
          <li>droit à la portabilité.</li>
        </ul>
        <p>
          Pour les exercer, il suffit d'écrire à
          <a href="mailto:{SITE['email']}">{SITE['email']}</a> : une réponse vous
          est apportée sous un mois au maximum.
        </p>
        <p>
          Si vous estimez, après m'avoir contacté, que vos droits ne sont pas
          respectés, vous pouvez adresser une réclamation à la CNIL, sur
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>.
        </p>

        <h2>8. Modification de cette politique</h2>
        <p>
          Cette politique peut être modifiée pour tenir compte d'évolutions
          techniques ou réglementaires. La date de dernière mise à jour figure en
          haut de cette page.
        </p>
    """

    legal_page(
        "confidentialite", "Politique de confidentialité",
        f"Politique de confidentialité de {SITE['brand']} : questionnaire de devis, conservation des réponses et exercice de vos droits.",
        "Politique de<br><em>confidentialité.</em>",
        "Voici comment sont utilisées les informations de votre demande de devis et de vos échanges, et comment exercer vos droits.",
        confid)

if __name__ == "__main__":
    main()
