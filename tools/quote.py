# -*- coding: utf-8 -*-
"""Gabarit du devis : le formulaire complet existe avant toute exécution JS."""

from html import escape


def quote_markup(SITE, SERVICES, icon):
    """Renvoie le questionnaire et les accès directs, sans dépendance au build."""
    labels = {
        "cartes-restaurant": ("Carte de restaurant", "Le menu et les commandes sur téléphone"),
        "sites-internet": ("Site internet", "Présenter votre activité et être contacté"),
        "cartes-nfc": ("Carte de visite", "Partager vos coordonnées en un geste"),
        "audit-marketing": ("Faire le point", "Savoir quoi améliorer pour attirer des clients"),
        "applications": ("Outil sur mesure", "Réservations, suivi clients, organisation"),
        "ia-automatisation": ("Gagner du temps", "Simplifier les tâches qui se répètent"),
        "closing": ("Suivre mes prospects", "Relancer les demandes et conclure"),
    }
    by_slug = {service["slug"]: service for service in SERVICES}
    service_cards = ""
    for slug, (title, description) in labels.items():
        service = by_slug[slug]
        service_cards += _choice("service", slug, title, description, icon(service["icon"]))

    activities = [
        ("restaurant", "Restaurant", "Café, bar, restauration"),
        ("salon", "Salon", "Coiffure, beauté, bien-être"),
        ("artisan", "Artisan", "Un savoir-faire et des clients locaux"),
        ("commerce", "Commerce", "Boutique ou vente en ligne"),
        ("autre", "Autre activité", "Votre projet a aussi sa place ici"),
    ]
    situations = [
        ("depart", "Rien pour l’instant", "Tout est à créer"),
        ("refonte", "Un site à refaire", "Il ne me correspond plus"),
        ("reseaux", "Les réseaux seulement", "Une page Instagram, Facebook…"),
        ("incertain", "Je ne sais pas", "J’aimerais être conseillé"),
    ]
    deadlines = [
        ("urgent", "Dès que possible", "C’est urgent"),
        ("mois", "Ce mois-ci", "Le projet est prêt à démarrer"),
        ("trimestre", "Dans les 3 mois", "J’anticipe la suite"),
        ("information", "Je me renseigne", "Je prends le temps d’y réfléchir"),
    ]
    question_fields = _step("service", "Quel service vous intéresse ?", service_cards,
                            "Choisissez ce qui se rapproche le plus de votre besoin.", service=True)
    for name, title, items in [
        ("activite", "Quelle est votre activité ?", activities),
        ("situation", "Où en êtes-vous aujourd’hui ?", situations),
        ("delai", "Pour quand aimeriez-vous avancer ?", deadlines),
    ]:
        question_fields += _step(name, title, "".join(_choice(name, *item) for item in items))

    return f"""
  <section class="quote-section" aria-label="Demande de devis">
    <div class="container quote-container">
      <div class="quote-panel">
        <div class="quote-progress" data-quote-progress hidden>
          <p><span data-quote-step-label>Étape 1 sur 5</span><span>Votre projet</span></p>
          <progress value="1" max="5" aria-label="Progression du questionnaire">1 sur 5</progress>
        </div>
        <form class="quote-form" name="devis" method="POST" action="{escape(SITE['quote_endpoint'], quote=True)}" data-quote-form>
          <p class="quote-honeypot" hidden>
            <label>Ne pas remplir ce champ <input name="_gotcha" autocomplete="off" tabindex="-1"></label>
          </p>
          {question_fields}
          <fieldset class="quote-step" data-quote-step="coordonnees">
            <legend tabindex="-1">Comment vous recontacter ?</legend>
            <p class="quote-hint">Votre nom et votre e-mail suffisent. Les autres champs sont facultatifs.</p>
            <dl class="quote-recap" data-quote-recap hidden></dl>
            <div class="quote-fields">
              <div class="quote-field">
                <label for="devis-nom">Votre nom <span>(obligatoire)</span></label>
                <input id="devis-nom" name="nom" autocomplete="name" required maxlength="120" aria-describedby="devis-nom-error">
                <span class="quote-field-error" id="devis-nom-error"></span>
              </div>
              <div class="quote-field">
                <label for="devis-email">Votre e-mail <span>(obligatoire)</span></label>
                <input id="devis-email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254" aria-describedby="devis-email-error">
                <span class="quote-field-error" id="devis-email-error"></span>
              </div>
              <div class="quote-field quote-field--full">
                <label for="devis-telephone">Votre téléphone <span>(facultatif)</span></label>
                <input id="devis-telephone" name="telephone" type="tel" autocomplete="tel" inputmode="tel" maxlength="40">
              </div>
              <div class="quote-field quote-field--full">
                <label for="devis-message">Un détail à ajouter ? <span>(facultatif)</span></label>
                <textarea id="devis-message" name="message" rows="4" maxlength="4000" placeholder="Votre besoin, le nom de votre établissement…"></textarea>
              </div>
            </div>
            <p class="quote-privacy">Ces informations servent à vous répondre au sujet de votre projet.
              <a href="confidentialite.html">Utilisation de vos données</a>.</p>
          </fieldset>
          <p class="quote-error" id="devis-error" role="alert" aria-atomic="true" data-quote-error></p>
          <p class="quote-send-status" role="status" aria-atomic="true" data-quote-send-status></p>
          <div class="quote-actions">
            <button class="quote-back" type="button" data-quote-back hidden>← Retour</button>
            <button class="btn quote-next" type="button" data-quote-next hidden>Continuer <span aria-hidden="true">→</span></button>
            <button class="btn" type="submit" data-quote-submit>Envoyer ma demande <span aria-hidden="true">↗</span></button>
          </div>
          <p class="quote-save-note" data-quote-save-note hidden>Vos réponses restent dans cet onglet.
            <button type="button" data-quote-reset>Effacer mes réponses</button></p>
        </form>
        <div class="quote-confirmation" data-quote-success hidden>
          <span class="quote-confirmation-mark" aria-hidden="true">✓</span>
          <h2 tabindex="-1">Votre demande est envoyée.</h2>
          <p>Merci ! Je reviens vers vous par e-mail pour parler de votre projet.</p>
          <a class="btn btn--ghost" href="index.html">Revenir à l’accueil</a>
        </div>
      </div>
      <div class="quote-direct">
        <p>Vous préférez discuter directement ?</p>
        <div>
          <a href="{escape(SITE['whatsapp_link'], quote=True)}" target="_blank" rel="noopener noreferrer">WhatsApp <span class="quote-visually-hidden">(nouvel onglet)</span><span aria-hidden="true">↗</span></a>
          <a href="mailto:{escape(SITE['email'], quote=True)}">{escape(SITE['email'])} <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </div>
  </section>
"""


def quote_success_markup():
    """Confirmation de la soumission POST native, utilisable sans JavaScript."""
    return """
  <section class="page-hero page-hero--contact">
    <div class="container">
      <span class="eyebrow">Demande de devis</span>
      <h1 class="display">Votre demande<br><em>est envoyée.</em></h1>
      <p class="lead">Merci ! Je reviens vers vous par e-mail pour parler de votre projet.</p>
      <a class="btn" href="index.html">Revenir à l’accueil</a>
    </div>
  </section>
"""


def _choice(name, value, title, description="", illustration=""):
    icon_markup = f'<span class="quote-choice-icon">{illustration}</span>' if illustration else ""
    return f"""
              <label class="quote-choice{' quote-choice--service' if illustration else ''}">
                <input type="radio" name="{escape(name)}" value="{escape(value)}" required>
                <span class="quote-choice-body">
                  {icon_markup}
                  <span class="quote-choice-copy"><strong>{escape(title)}</strong><span>{escape(description)}</span></span>
                  <span class="quote-selected" aria-hidden="true"></span>
                </span>
              </label>"""


def _step(name, title, choices, hint="", service=False):
    hint_markup = f'<p class="quote-hint">{escape(hint)}</p>' if hint else ""
    return f"""
          <fieldset class="quote-step" data-quote-step="{escape(name)}">
            <legend tabindex="-1">{escape(title)}</legend>
            {hint_markup}
            <p class="quote-choice-help" id="devis-{escape(name)}-help" hidden data-quote-choice-help>Un clic sur une carte passe à la suite.<span class="quote-visually-hidden"> Au clavier, choisissez avec les flèches puis validez avec Entrée ou Continuer.</span></p>
            <div class="quote-choices{' quote-choices--services' if service else ''}">{choices}
            </div>
          </fieldset>"""
