# Mission : transformer le site BEN WEB en démonstration interactive

Tu travailles sur le site vitrine de **BEN WEB** (https://ben-web.com), freelance
digital & IA français (Benjamin Ikhmim), basé à Bangkok. Le site vend 7 services
à des professionnels.

**Racine de travail : `SITE CV/portfolio/`.**
Tu peux LIRE n'importe quoi ailleurs sur le disque pour t'inspirer (notamment le
site Tuktuk Ella, voir plus bas), mais tu n'ÉCRIS QUE dans `portfolio/`.

Réponds-moi en français.

---

## 1. Ce que tu dois lire avant d'écrire la moindre ligne

Dans cet ordre, sans rien modifier :

1. `README.md` — l'architecture, écrite par l'auteur du site
2. `tools/content.py` (369 l.) — **tout le texte du site**
3. `tools/build.py` (1342 l.) — les gabarits HTML
4. `assets/css/style.css` (2078 l.) — le design system, tokens en tête de fichier
5. `assets/js/main.js` (367 l.) — nav, révélations, FAQ, halo curseur, parallaxe
6. `tools/mockups/_base.css` puis les 8 maquettes du dossier
7. `contact.html` et `index.html` — le rendu final actuel

---

## 2. Contraintes absolues

**Ne les enfreins sous aucun prétexte.**

- **Site 100 % statique** : HTML, CSS, JS vanilla. AUCUN framework, AUCUNE
  dépendance npm, AUCUN bundler, AUCUNE étape de build supplémentaire.
- **Les 11 pages sont GÉNÉRÉES.** Ne modifie JAMAIS un `.html` à la racine :
  il sera écrasé. Édite `tools/content.py` (contenu) ou `tools/build.py`
  (gabarits), puis lance `python3 tools/build.py`.
- **Palette et typographie sont figées.** Les tokens CSS de `style.css` et les
  polices (Inter Tight, Instrument Serif) ne bougent pas. Tu peux en revanche
  ajuster espacements, hiérarchie et tailles si ça sert la lisibilité ou la
  conversion — tu as la main sur le visuel tant que l'identité reste.
- **Déploiement Netlify**, pas de backend. Tout doit tourner côté client.
- **Performance** : le site fait 6 Mo et se charge vite. C'est un acquis à ne
  pas sacrifier. Chaque kilo-octet ajouté doit être justifié : lazy-loading,
  WebP, `content-visibility`, chargement différé des démos hors écran.
- **Accessibilité** : navigation clavier complète, focus visibles, contrastes
  AA, `prefers-reduced-motion` respecté sur toute animation. Une démo
  interactive inaccessible est un échec, pas une réussite.

---

## 3. Le piège technique à connaître avant de commencer

Les maquettes de `tools/mockups/` sont du **vrai HTML/CSS**, mais elles sont
aujourd'hui **aplaties en images WebP** via une capture Chrome headless
(procédure décrite dans `README.md` l.120-130), puis rangées dans `assets/work/`.

Or `README.md` précise : *« Le dossier `tools/` n'est pas nécessaire au
fonctionnement du site et peut être exclu du déploiement. »*

**Conséquence :** si tu te contentes de pointer vers `tools/mockups/*.html`
depuis une page publique, le site marchera en local et sera cassé en
production. Les maquettes que tu rends vivantes doivent migrer vers
`assets/` (par exemple `assets/demos/`), et `netlify.toml` doit être vérifié
en conséquence.

---

## 4. La mission

Le site est techniquement propre mais il **ne convertit pas** :

- `contact.html` ne contient **aucun formulaire** — uniquement des liens
  `mailto:` et WhatsApp. Chaque visiteur doit ouvrir son client mail et
  rédiger une demande depuis une page blanche. C'est là que les prospects
  se perdent.
- Aucune preuve : ni témoignage, ni chiffre, ni logo client. Et il n'y en
  aura pas — **n'en invente jamais**.

La stratégie retenue remplace la preuve sociale par la **démonstration** :
au lieu de dire ce qu'il sait faire, le site le montre en direct.

**Cible prioritaire : les commerces locaux** — restaurants, salons, artisans.
Budget 500-3000 €, décision rapide, peu à l'aise avec le vocabulaire technique.
Écris pour eux : concret, visuel, zéro jargon. Un restaurateur doit comprendre
en trois secondes ce qu'il achète.

---

## CHANTIER 1 — Les démos interactives *(le cœur du projet)*

Chaque page service reçoit une maquette **vivante**, intégrée dans la page
(pas de `<iframe>` vers un fichier isolé, sauf si tu démontres que c'est la
seule option viable — dans ce cas, explique pourquoi).

Le niveau d'interactivité est **mixte** : pleinement interactif là où ça vend,
animé en autonomie ailleurs.

| Page | Source | Interaction attendue |
|---|---|---|
| `cartes-restaurant.html` | `tools/mockups/restaurant.html` | **Interactif.** Le visiteur compose une commande sur le téléphone, elle apparaît en temps réel sur l'écran cuisine, change d'état (reçue → en préparation → prête). Le mockup contient déjà l'écran cuisine et les tickets colorés par état : la matière est là, il faut la câbler. |
| `cartes-nfc.html` | **à créer** | **Interactif.** Une carte de visite digitale que l'on retourne au clic, avec l'effet d'approche NFC. Utilise `assets/ben.png` (portrait 800×800, déjà copié dans le dossier). **Ne retouche jamais son visage** : recadrage, détourage et ombres sont permis, aucune modification des traits. |
| `sites-internet.html` | `site-resto.html`, `site-avocat.html`, `site-sport.html` | **Interactif.** Un sélecteur qui fait basculer entre les trois styles dans un cadre de navigateur. Inspire-toi aussi du vrai site Tuktuk Ella (`SRI LANKA/Tuktuk Ella/`, lecture seule) : c'est une réalisation réelle, multilingue — si tu peux en tirer une quatrième démo crédible, fais-le. |
| `audit-marketing.html` | `tools/mockups/audit.html` | **Animé.** Un rapport d'audit sur un restaurant qui se construit au défilement : scores qui montent, barres qui se remplissent, recommandations qui apparaissent. Conçois-le comme un vrai livrable — c'est le produit lui-même. |
| `applications.html` | `tools/mockups/application.html` | **Animé**, avec un ou deux points cliquables. |
| `ia-automatisation.html` | `tools/mockups/automatisation.html` | **Animé.** Un workflow dont les nœuds s'activent en cascade. |
| `closing.html` | `tools/mockups/closing.html` | **Animé.** Un lead qui progresse dans le pipeline. |

**Règles pour les démos :**
- Rien de lourd : pas de bibliothèque d'animation, du CSS et du JS vanilla.
- Chargement différé : une démo hors écran ne consomme rien
  (`IntersectionObserver`).
- `prefers-reduced-motion: reduce` → état final affiché immédiatement, sans
  mouvement.
- Sur mobile, une démo illisible vaut moins qu'une belle image statique :
  prévois un repli propre.
- Tout est manipulable au clavier.
- Les images WebP existantes de `assets/work/` restent utiles en aperçu ou
  en repli. Ne les supprime pas.

---

## CHANTIER 2 — Le questionnaire de devis

**Il n'y a jamais de prix affiché sur ce site. Tout passe par devis.**
Ne crée ni grille tarifaire, ni fourchette, ni champ « budget ».

Remplace la page contact par un **questionnaire multi-étapes**, 4 à 5 écrans
avec barre de progression :

1. **Quel service ?** — les 7, en cartes illustrées cliquables
2. **Quel type d'activité ?** — restaurant, salon, artisan, commerce, autre
3. **Où en es-tu ?** — rien pour l'instant / un site à refaire / une page
   réseaux seulement / je ne sais pas
4. **Pour quand ?** — urgent / ce mois-ci / dans les 3 mois / je me renseigne
5. **Tes coordonnées** — nom, email, téléphone (facultatif), message libre

**Exigences :**
- Cartes cliquables plutôt que champs de saisie : deux ou trois clics
  suffisent pour arriver à l'étape finale.
- Une seule question par écran, transitions fluides, retour arrière possible.
- L'état est conservé dans `sessionStorage` : un rafraîchissement ne fait pas
  tout recommencer.
- **Envoi via Netlify Forms** : `data-netlify="true"` + honeypot anti-spam.
  Le formulaire complet doit exister dans le HTML statique pour que Netlify
  le détecte au déploiement — attention si tu génères les étapes en JS.
- **Les réponses seront ensuite branchées sur Google Drive / Sheets.**
  Structure les données en conséquence : un champ nommé par question, des
  valeurs courtes et stables, et une note dans le README expliquant où
  brancher le webhook.
- Fonctionne **sans JavaScript** en repli : un formulaire simple d'une page.
- Les liens WhatsApp et mail directs restent visibles pour qui préfère.
- Accessible : `fieldset`/`legend`, erreurs annoncées, focus déplacé à chaque
  étape.

---

## CHANTIER 3 — Corrections

- **`README.md` est périmé** : il annonce 6 services et un `marketing.html`
  qui n'existe plus. Il y en a 7, le bon fichier est `audit-marketing.html`,
  et `closing.html` n'est documenté nulle part. Mets-le à jour, et documente
  au passage le système de démos que tu auras construit.
- **`assets/logo-full.png` pèse 296 Ko** : convertis en WebP avec repli PNG.
  Vérifie aussi `assets/ben.png` (752 Ko).
- **Vérifie `sitemap.xml`** après tes modifications (il est correct
  aujourd'hui, ne le casse pas).
- **Audite l'accessibilité** de l'existant : parcours clavier complet, focus
  visibles, contrastes AA.

---

## 5. Méthode de travail

**Étape 1 — Exploration.** Lis les fichiers de la section 1. N'écris rien.

**Étape 2 — Questions.** Pose-moi toutes tes questions avant de coder.
En particulier : ce qui te manque pour construire la démo NFC, la faisabilité
d'intégrer Tuktuk, les arbitrages techniques que tu anticipes sur l'intégration
des maquettes dans les pages générées.

**Étape 3 — Plan.** Attends mes réponses, puis propose un plan ordonné avec
une estimation d'effort par chantier. Attends ma validation.

**Étape 4 — Implémentation.** Une démo à la fois. Après chaque étape :
`python3 tools/build.py`, puis vérification du rendu. Montre-moi le résultat
avant de passer à la suivante.

**Ne fais jamais :**
- inventer un témoignage, un chiffre, un logo ou un nom de client
- modifier le visage sur la photo
- ajouter une dépendance
- éditer un `.html` de la racine à la main
- afficher un prix
- écrire hors de `portfolio/`

---

## 6. Critère de réussite

Un restaurateur de 45 ans arrive sur `cartes-restaurant.html` depuis son
téléphone. En moins de dix secondes, il a **touché** la démo, vu une commande
partir en cuisine, compris ce qu'il achetait — et il est dans le questionnaire
de devis.

C'est tout. Le reste est au service de ça.

---

## 7. Précisions du 22/09 — à respecter en plus de ce qui précède

**La grille d'accueil existe déjà, ne la reconstruis pas.** `index.html`, section
`#services` (`.hub-grid`), affiche déjà les 7 services en un seul bloc de
cartes cliquables (`.hub-card`), chacune menant à sa page. Le seul chantier
ici est que `hub-media` pointe aujourd'hui vers des captures figées de
`assets/work/` : quand une démo devient interactive dans le CHANTIER 1,
remplace la capture correspondante par une nouvelle capture de la démo
finalisée. Ne change ni le markup de la grille, ni son CSS, ni l'ordre des
7 cartes.

**Sections « réalisations » : seulement 2 pages sur 7.** Une section montrant
de vraies réalisations passées ne s'ajoute que sur `sites-internet.html`
(déjà présente : Azzeddine, et potentiellement Tuktuk Ella si tu l'intègres)
et `cartes-nfc.html` (à étoffer si des designs de cartes déjà livrés à des
clients existent dans le dossier, réutilisables tels quels sans les modifier).
Les 5 autres pages (`cartes-restaurant`, `audit-marketing`, `applications`,
`ia-automatisation`, `closing`) reçoivent uniquement la démo interactive du
CHANTIER 1 — n'y ajoute aucune section « réalisations », il n'y a pas encore
de vrais clients à y montrer.

**Photos pour la démo restaurant.** Le mockup `restaurant.html` actuel n'a
qu'un écran cuisine (tickets texte) — s'il devient un vrai flux « le
visiteur commande, ça arrive en cuisine », il faut un menu visuel. Des
photos de plats génériques (pas de vrai client, clairement une démo) seront
fournies dans `assets/demo-food/` avant que tu démarres ce chantier. Utilise-
les seulement si elles sont présentes ; sinon construis le menu en attendant
avec des blocs de couleur nommés, sans placeholder photo générique.
