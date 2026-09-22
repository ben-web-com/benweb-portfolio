# BEN WEB — démonstrations et demandes de devis

Site de Benjamin Ikhmim, freelance digital & IA. Les sept services sont
présentés par un aperçu intégré et un accès direct à un questionnaire de devis.
Le site reste en HTML, CSS et JavaScript vanilla, sans dépendance npm,
framework, bundler, service applicatif à installer ni étape de build supplémentaire.

## Pages et sources

Le générateur produit actuellement **15 pages HTML** :

| Fichier | Rôle |
| --- | --- |
| `index.html` | Accueil et sept services |
| `sites-internet.html` | Aperçus restaurant, cabinet, sport et tourisme |
| `cartes-restaurant.html` | Commande sur téléphone, suivi en cuisine, tableau de bord admin |
| `cartes-nfc.html` | Carte recto-verso, geste NFC simulé, fiche contact |
| `audit-marketing.html` | Exemple de rapport d’audit |
| `applications.html` | Exemple d’outil de suivi |
| `ia-automatisation.html` | Exemple de tâches reliées entre elles |
| `closing.html` | Suivi d’une demande jusqu’à la décision |
| `infos.html` | Méthode, délais et FAQ |
| `contact.html` | Questionnaire et coordonnées directes |
| `merci.html` | Confirmation après soumission native du formulaire |
| `cgv.html` | Conditions générales de vente |
| `mentions-legales.html` | Mentions légales |
| `confidentialite.html` | Informations sur les données du questionnaire |
| `404.html` | Page introuvable |

`merci.html` et `404.html` sont en `noindex`. Le sitemap conserve les
**13 URL publiques indexables**, sans doublon ni URL de démonstration autonome.

```text
portfolio/
├── tools/
│   ├── content.py          Services, coordonnées et réalisations
│   ├── build.py            Générateur, gabarits partagés et pages légales
│   ├── demos.py            Insertion des fragments publics dans les pages
│   ├── quote.py            HTML statique du questionnaire et confirmation
│   ├── mockups/            Anciennes maquettes sources, conservées
│   ├── photos/             Photos sources et LICENCES.txt
│   └── .preview/           Captures et profil Chrome locaux, ignorés par Git
├── assets/
│   ├── css/                Identité, accessibilité et questionnaire
│   ├── js/                 Navigation et questionnaire
│   ├── demos/              Fragments, styles et comportements des démos
│   │   └── images/         Images publiques et SOURCES.md
│   ├── fonts/              Inter Tight et Instrument Serif, locales
│   ├── work/               Aperçus WebP existants, conservés
│   ├── ben.webp · ben.png  Portrait original et version WebP sans perte
│   └── logo-full.webp · logo-full.png
├── firebase.json          Configuration Hosting, cible dédiée ben-web
├── netlify.toml           Ancienne configuration conservée
└── robots.txt · sitemap.xml
```

## Modifier et régénérer

**Ne jamais modifier à la main un HTML à la racine.** Depuis `portfolio/` :

```bash
python3 tools/build.py
```

- Coordonnées et présentation des services : `tools/content.py`.
- En-tête, pied de page, structure des pages, FAQ, mentions et confidentialité : `tools/build.py`.
- Libellés et champs du devis : `tools/quote.py` ; comportement : `assets/js/quote.js`.
- Démo : son fragment et ses fichiers dans `assets/demos/`, puis configuration
  `demo` du service dans `tools/content.py`.
- CSS partagé : `assets/css/style.css`, sans changer ses tokens de couleur
  ou ses polices. Les compléments accessibles sont dans `accessibility.css`.

Après un changement de CSS ou JS, incrémenter `ASSET_V` dans `build.py` pour
renouveler les URL des ressources. Relancer ensuite le générateur.

## Démos intégrées

`tools/demos.py` lit un fragment de `assets/demos/` **pendant la génération**
et l’insère dans le HTML de la page. Aucun iframe, chargement de fichier depuis
`tools/`, import de site tiers ou service distant n’est nécessaire en production.

| Service | Fragment | Comportement |
| --- | --- | --- |
| Restaurant | `restaurant.html` | Menu de 6 plats avec photo, quantités, envoi simulé, ticket correspondant, trois états, tableau de bord admin (stats, rupture de stock synchronisée en direct, historique, plats populaires), nouvelle commande |
| NFC | `nfc.html` | Recto-verso, approche simulée, coordonnées réelles et téléchargement vCard local |
| Sites | `sites.html` | Quatre univers, volets natifs et bascule FR/EN dans l’aperçu touristique |
| Audit | `audit.html` | Scores d’exemple et recommandations révélés progressivement |
| Applications | `application.html` | Dossiers à traiter, filtres et changement de statut |
| Automatisation | `automatisation.html` | Étapes activées successivement jusqu’à une réponse à valider |
| Closing | `closing.html` | Une demande suivie de la première réponse à la décision |

Le HTML et les styles du service sont disponibles immédiatement. Le petit
`loader.js` charge son comportement à l’entrée dans l’écran, avec
`IntersectionObserver`. Chaque module peut renvoyer une fonction `visibility(on)`
qui suspend ses animations hors écran. Les quatre démos animées réutilisent
`story.js` et `story.css` ; leurs fragments restent distincts.

- Les séquences sont courtes et se jouent une fois. L’audit, l’automatisation
  et le parcours commercial proposent un bouton pour les rejouer.
- Les temporisations/séquences se suspendent hors écran ou dans un onglet caché.
- `prefers-reduced-motion: reduce` affiche directement le résultat final.
- Sans JS, les informations restent lisibles ; les commandes nécessitant du JS
  ne sont pas présentées comme utilisables. L’aperçu restaurant des sites conserve
  ses volets natifs.
- Sur mobile, les compositions sont adaptées à la largeur disponible. La démo
  restaurant passe de la vue client à la cuisine après l’envoi.
- Les autres univers de sites restent dans des `template` jusqu’à leur sélection ;
  leurs photos ne sont pas chargées avec le premier aperçu.
- Aucune commande, réservation, automatisation, action commerciale ou demande de
  contact des **démos** n’est réellement envoyée.

Les scores sont signalés comme données de démonstration, jamais comme des
résultats clients. Aucun prix de prestation ni champ budget n’est affiché.
Les noms génériques des maquettes ne représentent pas des clients.
L’aperçu touristique est un extrait adapté d’un projet réel en cours, avec un
libellé générique tant que son nom public n’est pas confirmé.

## Questionnaire de devis

**Hébergement : Firebase Hosting.** Première publication effectuée le
22 septembre 2026 sur https://ben-web-ab59e.web.app/ (projet `ben-web-ab59e`,
forfait Spark). Les 77 fichiers publics ont été vérifiés en ligne. La configuration
`firebase.json` exclut aussi le contenu des dossiers cachés avec `**/.*/**`.
Elle conserve les URL `.html`, les en-têtes et la page 404, et exclut les outils
et fichiers locaux. La cible explicite `ben-web` est associée au site vitrine `ben-web-ab59e`
dans `.firebaserc` ; ne pas la faire pointer vers le site de trading.
`app.ben-web.com` et les enregistrements de messagerie restent indépendants.

### Formspree

Le formulaire statique `devis` existe intégralement dans `contact.html` et envoie
ses huit réponses par POST à `https://formspree.io/f/mwlkgrjo`. Cette adresse publique
est configurée dans `SITE["quote_endpoint"]`, dans `tools/content.py`.
Le honeypot `_gotcha` reste vide pour un visiteur. Aucune clé privée, dépendance
ou bibliothèque Formspree n’est ajoutée au navigateur.

Sans JavaScript, les cinq questions et les coordonnées sont visibles sur une
seule page avec validation native ; la confirmation est assurée par Formspree.
Avec JavaScript, l’envoi demande une réponse JSON et n’affiche la confirmation
locale qu’après un statut HTTP réussi et `ok: true`. Un refus, une erreur réseau
ou une réponse HTML inattendue conserve les réponses et permet de réessayer.
`merci.html` est conservée en `noindex`, mais n’est plus la destination du POST.

Dans le tableau de bord Formspree, vérifier la notification e-mail pour
`contact@ben-web.com` et la validation du destinataire. Le champ `email` correspond
à l’adresse du prospect, pour lui répondre. Les demandes sont consultables dans
**Submissions**. La réception en boîte mail doit être confirmée par un test réel.
L’offre gratuite annonce 50 soumissions par mois et 30 jours d’historique ;
les e-mails reçus restent dans votre messagerie selon vos règles de conservation.
Voir les [limites du compte](https://help.formspree.io/articles/account-management/account-limits).

Avec JavaScript : cinq écrans, progression, retour arrière, récapitulatif,
validation et erreurs annoncées. Un clic sur une carte avance à la suite ;
au clavier, les flèches changent le choix, puis Entrée ou Continuer valide.
Le téléphone et le message sont facultatifs, le nom et l’e-mail obligatoires.

Les liens des pages service utilisent `contact.html?service=slug` pour préremplir
la première réponse et commencer à l’activité : il reste trois choix avant les
coordonnées. Un accès direct à la page contact présente les cinq étapes.
Aucune réponse n’est inventée pour raccourcir le parcours.

L’état est conservé dans `sessionStorage`, clé `ben-web.devis.v1`. Il est effacé
après envoi confirmé ou avec « Effacer mes réponses ». Une indisponibilité du
stockage ne bloque pas le parcours. Une erreur réseau conserve la saisie ; les
doubles soumissions sont bloquées pendant l’envoi. Mail et WhatsApp restent visibles.

### Champs pour une future liaison Google Sheets / Drive

| Champ | Valeurs |
| --- | --- |
| `service` | Slug du service, par exemple `cartes-restaurant` |
| `activite` | `restaurant`, `salon`, `artisan`, `commerce`, `autre` |
| `situation` | `depart`, `refonte`, `reseaux`, `incertain` |
| `delai` | `urgent`, `mois`, `trimestre`, `information` |
| `nom` | Nom saisi |
| `email` | Adresse de réponse |
| `telephone` | Facultatif |
| `message` | Facultatif |

`_gotcha` est un champ anti-spam, pas une question.
Ne pas renommer ces champs lors d’une simple retouche de leurs libellés.

**La liaison Google Sheets / Drive n’est pas encore branchée.** Le futur point
se trouve dans l’onglet **Workflow** du formulaire Formspree : une intégration
ou un webhook transmettra les réponses à l’automatisation choisie. Vérifier la
disponibilité et le tarif de cette fonction avant activation ; elle n’est pas
nécessaire à la réception par e-mail. Les clés Google et les URL privées restent
dans la configuration des services, jamais dans le JavaScript public.

## Prévisualiser

Depuis `portfolio/`, ouvrir un terminal :

```bash
python3 -m http.server 4180 --bind 127.0.0.1
```

Ouvrir ensuite `http://127.0.0.1:4180/`. Le serveur Python sert les fichiers.
**Le formulaire utilise la véritable adresse Formspree même en local** : cliquer
sur Envoyer transmet une demande réelle. La suite `tools/check-quote.mjs`
intercepte les requêtes pour tester les refus et le succès sans envoi externe.

## Déployer sur Firebase Hosting

Le dossier publié contient les HTML générés, `assets/`, `robots.txt` et
`sitemap.xml`. `firebase.json` exclut les outils, `.git/`, les fichiers locaux,
les caches, les consignes et l’ancienne configuration `netlify.toml`.
La cible dédiée `ben-web` est associée au site `ben-web-ab59e` du projet
`ben-web-ab59e`. La connexion Firebase CLI a été effectuée par le propriétaire.

1. Utiliser un projet dédié au site vitrine, avec le forfait Spark gratuit.
2. Associer la cible Hosting `ben-web` à son site après connexion au compte.
3. Régénérer les pages avec `python3 tools/build.py` et vérifier le formulaire.
4. Déployer uniquement cette cible Hosting ; conserver le fonctionnement
   indépendant de `app.ben-web.com` et les enregistrements de messagerie.
5. Sur l’adresse de prévisualisation Firebase, tester une demande clairement
   identifiée, la retrouver dans Formspree et confirmer la réception e-mail.
6. Raccorder `ben-web.com` avec les enregistrements demandés par Firebase.

Les commandes Firebase servent uniquement à la publication : aucun SDK Firebase,
bundler, serveur applicatif ou étape de build supplémentaire n’est ajouté au site.
Les informations d’hébergement des mentions légales sont à remplacer lors de la
bascule effective. Le site est publié sur l’adresse Firebase ; aucun changement DNS n’a été effectué.
Le raccordement de `ben-web.com` reste à faire. Le destinataire doit encore
confirmer la réception en boîte mail du test Formspree accepté le 15 septembre.

## Vérifications de développement

Aucune installation npm n’est nécessaire. Les contrôles navigateur utilisent
Chrome installé sur le poste et les API natives de Node (version 22 ou ultérieure).
Dans un autre terminal, depuis `portfolio/` :

```bash
mkdir -p tools/.preview
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --remote-debugging-port=9222 --user-data-dir="$PWD/tools/.preview/chrome" \
  --disk-cache-dir="$PWD/tools/.preview/cache" --no-first-run about:blank
```

Puis, avec le serveur local actif :

```bash
node tools/check-navigation.mjs
node tools/check-quote.mjs
node tools/check-demos.mjs
python3 tools/check-static.py
```

Ces outils vérifient les clics/clavier, la navigation mobile, le mode sans JS,
les démos à 320 px, le mouvement réduit, la suspension hors écran, les liens et
le sitemap, la restauration des réponses et les erreurs d’envoi. Le succès du POST est
**simulé localement** ; aucune demande n’est envoyée à un compte extérieur.
Les captures sont écrites dans `tools/.preview/`. Ces vérifications sont
facultatives au déploiement et n’ajoutent aucune étape de build.

## Identité et images

Les tokens de palette restent ceux de `style.css` : noir, blanc chaud et lime.
Inter Tight et Instrument Serif sont servis localement. Les animations
ornementales continues du fond et du point de disponibilité ont été calmées.

Le portrait et le logo ont été convertis en WebP **sans perte** : dimensions,
transparence et pixels identiques aux PNG. Le portrait affiché utilise `picture`
avec repli PNG. Le logo complet est également conservé dans les deux formats ;
le petit monogramme de navigation reste son asset distinct. Aucun visage n’a été
retouché. Les anciens aperçus WebP ne sont pas supprimés.

Les photos des trois maquettes de sites viennent de `tools/photos/` ; leur
licence est documentée dans `LICENCES.txt`. Les images Tuktuk ont une provenance
séparée, sans leur attribuer une licence ouverte non vérifiée. Voir
`assets/demos/images/SOURCES.md`.
