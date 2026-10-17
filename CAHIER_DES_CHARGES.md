# Cahier des charges v2 — « Yalla Speed » (nom provisoire)

Jeu éducatif web pour apprendre l'**arabe** et l'**anglais** (enfants 4–10 ans), jouable dans le navigateur, hors-ligne après la première visite.

## 1. Vision

Un enfant conduit une voiture dans un monde 3D coloré. Il lit et écoute des **panneaux en arabe ou en anglais**, s'oriente correctement, gagne des points, collectionne des cartes de mots et personnalise sa voiture. Une mascotte parlante l'accompagne. Les parents suivent la progression dans un espace protégé.

Principes :
- **Jouer d'abord, apprendre sans s'en rendre compte** : chaque mot appris a une récompense visible.
- **Aucune pression** : pas de « game over », seulement des encouragements et des retries.
- **Vie privée** : tout en local (audio, scores). Pas de compte, pas de tracking.
- **Voix facultative** : tout est jouable au clic/toucher. La voix est un bonus.

## 2. Public et contraintes

- 4–10 ans, deux profils : « petits » (4–6, images + audio, pas de lecture) et « grands » (7–10, lecture simple).
- Appareils : laptop modeste, tablette, mobile. ≥ 30 fps sur laptop intégré.
- Langue de l'interface : français (extensible). Langue apprise : **arabe standard (fusha)**, **arabe marocain (Darija, code `ary`)** ou **anglais**. Voir §9 bis pour la Darija.
- Arabe : affichage **RTL** correct, option **tashkeel** (voyelles) activable.

## 3. Architecture (rappel)

- **Blender** : production d'assets uniquement → export **GLB** (Draco/Meshopt). Jamais exécuté dans le navigateur.
- **Three.js** + **Cannon-es** : course 3D. **Vue 3 + Vite + Pinia + Vue Router** : UI, HUD, jeux 2D.
- **Audio / TTS** : abstraction `speak(text, lang)` qui essaie dans l'ordre (1) **audio enregistré** `public/audio/{lang}/{wordId}.mp3`, (2) Web Speech API (voix `ar-MA` si disponible pour la Darija), (3) Kokoro-js/modèle local (v2). Pour la Darija, l'audio enregistré par un locuteur marocain est la source principale.
- **STT** : Whisper via **Transformers.js** (`@huggingface/transformers`), modèle `whisper-base`, WebGPU avec repli WASM, cache OPFS. Vocabulaire fermé + tolérance (Levenshtein).
- **Stockage** : IndexedDB (profils, progression, cartes, répétition espacée), OPFS (modèles).
- **PWA** : Service Worker pour le hors-ligne.
- **Source unique de contenu** : `src/data/vocab.json` ; quiz, devinettes, panneaux, mémoire et cartes en sont **dérivés**.

> À valider par un mini-prototype avant de figer : Whisper navigateur (qualité sur voix d'enfants), voix arabe TTS sur les appareils cibles, perf WebGPU/WASM.

## 4. Fonctionnalités

### 4.1 Socle (MVP)

| ID | Fonction | Détails |
|----|----------|---------|
| F1 | Profils & langue | Plusieurs enfants (prénom + avatar), langue cible AR (fusha) / ARY (Darija) / EN, niveau petits/grands |
| F2 | Quiz | 3–4 choix (image/texte), question lue à voix haute, 5–10 questions, résultats |
| F3 | Devinettes | Texte + audio, réponse par image ou voix, indices progressifs |
| F4 | Course signalétique | Circuit 3D, panneaux AR/EN, consigne audio, bonne direction = points, chrono, HUD |
| F5 | Voix | TTS + STT local, indicateur micro, fallback clic |
| F6 | Progression | Score, étoiles, historique, déblocages |
| F7 | Confort enfant | Gros boutons, icônes + audio, bouton « répéter », plein écran |

### 4.2 Nouvelles fonctionnalités ludiques (proposées)

Priorité : **P1** = v1.1 (fort impact, faible coût), **P2** = v2, **P3** = plus tard.

| ID | Fonction | Intérêt pédagogique | Prio |
|----|----------|---------------------|------|
| G1 | **Mascotte compagnon** (ex. chameau/renard) qui guide, félicite, mime les mots, réagit selon l'humeur de l'enfant | Engagement émotionnel, voix constante | P1 |
| G2 | **Album de cartes à collectionner** : chaque mot maîtrisé = une carte (image + mot AR/EN + audio). Raretés (commune/rare/or) | Motivation de collection, révision spontanée | P1 |
| G3 | **Garage / personnalisation** : points → couleurs, stickers, jantes, klaxons. Les couleurs et pièces sont nommées dans la langue cible | Vocabulaire couleurs/objets, récompense | P1 |
| G4 | **Répétition espacée douce (Leitner)** : les mots ratés reviennent dans les courses, quiz et cartes à intervalles croissants | Mémorisation durable | P1 |
| G5 | **Course « Collecte de lettres »** : sur la piste, ramasser les lettres dans le bon ordre pour former un mot (ex. ق-ط-ة) | Lecture, orthographe, formes des lettres | P1 |
| G6 | **Tracé de lettres** au doigt/souris (canvas) avec guide du sens du tracé ; arabe (formes initiale/médiane/finale) et lettres anglaises | Écriture, motricité fine | P2 |
| G7 | **Mode « Écho » (prononciation)** : la mascotte dit le mot, l'enfant répète, retour visuel (onde sonore, étoiles) — jamais de note négative | Oral, confiance | P2 |
| G8 | **Jeu de mémoire (paires)** : image ↔ mot, ou mot AR ↔ mot EN | Association bilingue | P1 |
| G9 | **Atelier des mots** : glisser-déposer des lettres arabes pour construire un mot (affichage correct des liaisons) | Orthographe arabe | P2 |
| G10 | **Carte du monde / mode aventure** : niveaux par thèmes (animaux, couleurs, nombres, famille, ville, nourriture, corps), un décor 3D par thème | Progression guidée, curriculum | P2 |
| G11 | **Défi du jour & série (streak) douce** : un mini-défi quotidien, coffre-surprise ; une série interrompue ne punit pas | Régularité | P1 |
| G12 | **Mode duo** (2 joueurs, même écran, tour à tour) : frère/sœur ou parent/enfant | Convivialité, apprentissage partagé | P2 |
| G13 | **Devinettes sonores** : cris d'animaux, bruits de la ville → deviner le mot | Écoute, vocabulaire | P2 |
| G14 | **Chansons et comptines originales** (nombres, jours, couleurs) en boucle rythmée avec mots surlignés. Contenu original uniquement, pas de chansons protégées | Mémorisation par le rythme | P3 |
| G15 | **Vrais panneaux routiers** : stop, école, sens interdit, passage piéton, avec noms bilingues | Éducation routière + vocabulaire | P1 |
| G16 | **Espace parent** (PIN) : mots forts/faibles, temps de jeu, limiteur de session, export JSON, choix du niveau et des thèmes | Suivi, sécurité | P1 |
| G17 | **Accessibilité** : mode daltonien, police adaptée dyslexie (latin), vitesse de la voix, sous-titres des consignes, réduction des animations | Inclusion | P1 |
| G18 | **Pause « Repos des yeux »** : rappel doux après N minutes, mascotte qui s'endort | Bien-être | P2 |
| G19 | **Pont Darija ↔ Fusha** : mini-jeu qui montre le mot de la maison (Darija) et le mot de l'école (fusha), l'enfant les relie ; les cartes affichent les deux | Passerelle entre langue parlée et langue écrite | P1 |
| G20 | **Expressions du quotidien en Darija** (salut, merci, s'il te plaît, au revoir…) en mini-scènes avec la mascotte | Communication réelle en famille | P2 |
| G21 | **Studio de voix des parents** : page d'enregistrement pour que parents/grands-parents enregistrent les mots (voix familière, accent authentique) | Qualité audio, lien familial, résout la faiblesse du TTS en Darija | P1 |

### 4.3 Détail de la course signalétique (F4 + G5 + G15)

- Circuit défini par `track-config.json` (checkpoints, panneaux, consigne, action attendue).
- Panneau visible à l'avance → consigne TTS → l'enfant choisit la voie au carrefour.
- Actions : `left`, `right`, `straight`, `stop`, `slow`, `school` (ralentir).
- Bonne action : +10 pts, son de réussite, carte potentielle. Mauvaise : la voiture est recentrée, **aucune pénalité lourde**, mot rappelé par la mascotte et ajouté à la file de révision (G4).
- HUD : score, chrono, checkpoint n/N, consigne courante (texte + icône), micro.
- Niveaux « petits » : panneaux = icône + mot, grandes voies. Niveaux « grands » : mots seuls, plusieurs panneaux enchaînés.

## 5. Modèle de données (IndexedDB)

- `profiles` : `{ id, name, avatar, targetLang, level, createdAt }`
- `sessions` : `{ id, profileId, activity, lang, score, maxScore, date, durationSec }`
- `wordProgress` : `{ profileId, wordId, box (1–5), nextReview, successes, failures }`
- `collection` : `{ profileId, wordId, rarity, unlockedAt }`
- `garage` : `{ profileId, unlockedItems[], equipped{} }`
- `settings` : `{ voiceRate, subtitles, tashkeel, colorblind, sessionLimitMin, parentPinHash }`

Boîtes Leitner : intervalles 0 j / 1 j / 3 j / 7 j / 14 j. Succès → boîte +1, échec → boîte 1.

## 6. Format des données de contenu

`vocab.json` (source unique) :
```json
{ "id": "cat", "theme": "animals", "ar": "قطة", "translit": "qiṭṭa",
  "en": "cat", "fr": "chat", "emoji": "🐱", "level": 1, "audio": null }
```
`track-config.json` : voir fichier fourni.

## 7. Exigences techniques

- **T1 Stack** : Vue 3 (Composition API), Vite, Pinia, Vue Router, Three.js, Cannon-es, Transformers.js, `idb`, `vite-plugin-pwa`.
- **T2 Assets** : GLB nommés de façon stable (`Car`, `Track`, `Sign_Left`, `Checkpoint_01`…), low-poly, < 5 Mo par scène, textures KTX2/PNG optimisés. Texte des panneaux via texture canvas (supporte l'arabe).
- **T3 Performance** : modèles IA chargés à la demande avec barre de progression ; pas d'ombres dynamiques coûteuses ; LOD si nécessaire ; qualité graphique réglable.
- **T4 Audio** : une seule source vocale à la fois (file d'attente), sons du jeu baissés pendant la voix.
- **T5 Confidentialité** : audio jamais envoyé hors de l'appareil ; micro demandé uniquement après un geste de l'adulte ; données locales ; pas d'analytics.
- **T6 i18n/RTL** : `dir="rtl"` dynamique pour les contenus arabes, polices arabes lisibles (ex. Noto Naskh Arabic / Cairo), tests visuels RTL.
- **T7 Qualité** : ESLint + Prettier, Vitest pour la logique (Leitner, validation d'actions, Levenshtein), test e2e Playwright du parcours quiz.
- **T8 Hébergement** : statique ; headers COOP/COEP documentés si les threads WASM sont utilisés.
- **T9 Licences** : vérifier chaque modèle IA, police et asset (Whisper MIT, Kokoro Apache 2.0, etc.). Tenir `LICENSES.md`.

## 8. Contenu minimal à livrer

- 60 mots (6 thèmes × 10), arabe + anglais + français + emoji.
- 10 questions de quiz et 10 devinettes par langue (générées depuis `vocab.json`, relues).
- 1 circuit de démonstration (6 checkpoints), 1 voiture, 8 panneaux.
- 1 mascotte (modèle simple + 4 animations : idle, joie, encouragement, sommeil).

> Les textes arabes doivent être **relus par un locuteur natif** avant diffusion.

## 9. Roadmap

| Étape | Contenu |
|-------|---------|
| M0 | Prototypes de risque : STT enfant, TTS arabe, perf course |
| M1 | Squelette + services TTS/stockage + profils |
| M2 | Quiz + devinettes + résultats |
| M3 | Course 3D + panneaux + HUD |
| M4 | STT, mascotte, cartes (G1, G2) |
| M5 | Leitner, garage, défi du jour, espace parent (G4, G3, G11, G16) |
| M6 | Mémoire, collecte de lettres, accessibilité, PWA (G8, G5, G17) |
| M7 | Tracé de lettres, Écho, mode aventure (G6, G7, G10) |

## 9 bis. Variante Arabe marocain (Darija)

**Principe** : trois langues cibles au choix : `ar` (fusha), `ary` (Darija marocaine), `en`. L'enfant choisit une langue par profil, modifiable dans les réglages. Fusha et Darija ne sont **jamais mélangées** dans une même activité, sauf dans le mini-jeu « Pont » (G19).

**Particularités de la Darija**
- Langue surtout **parlée**, sans orthographe standard : plusieurs graphies existent. Le contenu retient une graphie principale (`ary`) et des variantes acceptées (`ary_alt`).
- Nombreux mots d'origine française ou amazighe (ex. طوموبيل, ستوب).
- Écriture en caractères arabes, RTL ; pas de tashkeel par défaut.

**Contenu**
- Chaque mot de `vocab.json` a les champs `ary`, `ary_translit`, `ary_alt`.
- `track-config.json` contient `instructions.*.ary` et `feedback.*.ary`.
- Quiz, devinettes, panneaux, mémoire et cartes lisent le champ de la langue cible (`ar` / `ary` / `en`) ; aucun mot en dur dans les composants.
- Devinettes : fichier `riddles-ary.json` (au moins 10), écrit par ou relu avec un locuteur natif marocain.
- Contenu minimal : 60 mots, 6 thèmes, comme pour les autres langues ; + 10 expressions du quotidien (G20).
- Tout le contenu Darija est listé dans `docs/A_RELIRE_NATIF.md`.

**Voix (TTS)**
- Les voix de synthèse arabes sont en général en fusha ou dans un autre dialecte ; **une voix fusha lisant du texte Darija sera incorrecte**. Règle : si aucun audio enregistré ni voix `ar-MA` n'existe pour un mot, afficher le texte sans le lire et signaler « audio manquant » à l'espace parent (jamais de lecture avec la mauvaise voix).
- Priorité 1 : audio enregistré (G21, studio de voix des parents). Livrer au minimum les 60 mots + consignes de course enregistrés.
- À tester sur les appareils cibles : présence d'une voix `ar-MA`.

**Reconnaissance vocale (STT)**
- Whisper n'a pas de code de langue dédié à la Darija : utiliser `ar` ; la reconnaissance du dialecte est moins fiable, d'autant plus sur voix d'enfants.
- Stratégie : **vocabulaire fermé**. Le matcher compare à la liste `{ary} + ary_alt + {ar}` normalisée, avec seuil de tolérance ; le clic reste toujours disponible.
- À évaluer au Prompt 0 : taux de reconnaissance sur 20 mots Darija prononcés par un enfant et un adulte ; envisager plus tard un modèle ajusté à la Darija si la qualité est insuffisante (licence à vérifier).

**Interface**
- Sélecteur de langue avec 3 choix (drapeaux ou icônes + noms : « العربية », « الدارجة », « English »).
- Mascotte : version qui parle Darija (audio enregistré).
- Réglage parent : « afficher le mot fusha à côté du mot Darija » (G19).

**Feuille de route Darija**
| Étape | Contenu |
|-------|---------|
| D0 | Étendre `vocab.json`, `track-config.json`, `riddles-ary.json` ; relecture native |
| D1 | Sélecteur de langue à 3 choix, lecture par champ de langue, RTL |
| D2 | Studio de voix (G21) + chaîne de repli audio |
| D3 | Matcher STT Darija + évaluation |
| D4 | Pont Darija ↔ Fusha (G19), expressions (G20) |

## 10. Critères d'acceptation (MVP)

1. Un enfant peut jouer quiz, devinette et course sans micro.
2. Les consignes sont lues en arabe et en anglais (ou message clair si voix absente).
3. L'arabe s'affiche correctement en RTL, y compris sur les panneaux 3D.
4. Score, étoiles et panneau de résultats s'affichent à chaque fin de session.
5. Les données persistent après rechargement ; l'app fonctionne hors-ligne après la 1re visite.
6. ≥ 30 fps sur laptop intégré.
7. Aucun appel réseau envoyant des données de l'enfant.
8. En mode Darija, aucun mot n'est lu par une voix inadaptée : audio enregistré, voix `ar-MA`, ou texte seul avec signalement.
9. Les trois langues (`ar`, `ary`, `en`) fonctionnent dans le quiz, les devinettes et la course.
