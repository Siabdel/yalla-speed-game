# Prompts pour Claude Code — Yalla Speed

Pré-requis : placer `CLAUDE.md`, `CAHIER_DES_CHARGES.md`, `vocab.json` (→ `src/data/`) et `track-config.json` (→ `src/data/`) à la racine/dans le dépôt avant le Prompt 0. Lancer les prompts **dans l'ordre**, un par session ou par étape. Après chaque prompt : `npm run lint && npm run test`.

---

## Prompt 0 — Prototypes de risque (M0)
```
Lis CLAUDE.md et CAHIER_DES_CHARGES.md. Avant de construire le jeu, crée trois
mini-prototypes isolés dans /prototypes (pages Vite simples) pour valider les risques :
1) stt-test : transcription Whisper via @huggingface/transformers (whisper-base,
   WebGPU avec repli WASM), enregistrement micro 3 s, affichage du texte, temps de
   chargement et temps de transcription mesurés, langues ar (fusha et Darija : liste de
   20 mots de vocab.json à prononcer, afficher texte reconnu vs attendu) et en.
2) tts-test : liste speechSynthesis.getVoices() (avec attente de l'événement
   voiceschanged), lit un mot arabe et un mot anglais, affiche si une voix arabe existe.
3) race-perf : scène Three.js avec 200 cubes + une voiture cube sur un plan, affichage FPS.
Ne touche pas au code du jeu. Termine par un fichier docs/RESULTATS_PROTOTYPES.md
décrivant ce qui marche, ce qui ne marche pas et ce que je dois tester sur mes appareils.
```

## Prompt 1 — Initialisation du projet (M1)
```
Crée le projet : Vue 3 + Vite + Pinia + Vue Router (JavaScript), ESLint + Prettier,
Vitest, vite-plugin-pwa, idb, three, cannon-es, @huggingface/transformers.
Respecte l'arborescence de CLAUDE.md. Copie vocab.json et track-config.json dans src/data/.
Ajoute les scripts npm (dev, build, lint, test). Crée des polices arabes locales
(Noto Naskh Arabic ou Cairo, licence libre) dans src/assets/fonts et la CSS globale
(gros boutons, contrastes élevés, variables de thème). Ne crée pas de logique de jeu.
Mets à jour README.md.
```

## Prompt 2 — Données, profils et stockage
```
Crée src/services/storage/db.js (idb) avec les stores : profiles, sessions,
wordProgress, collection, garage, settings (schéma du cahier des charges §5).
Fonctions : createProfile, listProfiles, saveSession, getHistory(profileId, limit),
getBestScore, getWordProgress, upsertWordProgress.
Crée src/stores/profileStore.js (Pinia) et un écran /profiles pour choisir ou créer
un profil (prénom + avatar emoji + langue cible + niveau petits/grands).
Crée src/data/loader.js qui charge vocab.json et expose des helpers :
wordsByTheme, wordsByLevel, getWord(id).
Tests Vitest pour les fonctions pures.
```

## Prompt 3 — Service TTS
```
Crée src/services/tts/index.js : speak(text, lang), stopSpeaking(), isSpeaking(),
hasVoice(lang). Implémentation WebSpeechTTS par défaut ; interface prévue pour brancher
Kokoro-js plus tard. File d'attente : jamais de chevauchement. Gère le chargement
asynchrone des voix. Si aucune voix arabe : retourne une erreur typée et le composant
affiche un message clair + mode « sans voix ». Option vitesse (settingsStore).
Ajoute un composant SpeakButton.vue (gros bouton « écouter / répéter »).
```

## Prompt 3 bis — Support de la Darija marocaine (transversal)
```
Ajoute la langue cible `ary` (Darija marocaine) en plus de `ar` (fusha) et `en`.
Lis la section « 9 bis » du cahier des charges et les règles Darija de CLAUDE.md.
- Crée src/services/lang/langs.js : liste des langues { code, label, dir, ttsLocale,
  whisperLang } : ar → ar-SA/ar ; ary → ar-MA/ar ; en → en-US/en.
- Les loaders de données lisent word[lang] (+ ary_alt) ; plus aucun mot en dur.
- Le sélecteur de langue (profil + réglages) propose 3 choix : « العربية », « الدارجة »,
  « English ». Active dir="rtl" pour ar et ary.
- Étends le service TTS : speak(wordId|text, lang) essaie dans l'ordre
  1) public/audio/{lang}/{wordId}.mp3, 2) Web Speech (voix ar-MA pour ary),
  3) sinon ne lit rien et émet l'événement « audio manquant » (jamais de voix fusha pour
  de la Darija). Le mode « audio manquant » est listé dans l'espace parent.
- Crée docs/A_RELIRE_NATIF.md listant tout le contenu ar/ary à valider.
Tests Vitest : sélection du champ par langue, chaîne de repli audio, normalisation.
```

## Prompt 3 ter — Studio de voix des parents (G21)
```
Crée une page /voice-studio (protégée par le PIN parent) pour enregistrer les audios :
- liste des mots et consignes pour la langue choisie (ar, ary, en), avec état
  « enregistré / manquant » ;
- enregistrement micro (MediaRecorder), écoute, ré-enregistrement, découpage du silence
  de début/fin, normalisation du volume ;
- stockage dans IndexedDB (blobs) lu en priorité par le service TTS, plus un bouton
  « Exporter tout » (zip de fichiers {lang}/{wordId}.webm ou .mp3) pour les intégrer au
  dépôt dans public/audio/.
- Aucune donnée envoyée sur le réseau ; message clair expliquant que les enregistrements
  restent sur l'appareil.
```

## Prompt 4 — Quiz (F2)
```
Crée src/components/quiz/QuizView.vue et src/services/quiz/generator.js.
Le générateur crée les questions à partir de vocab.json : question « Quel est ce mot ? »
(image emoji → 3-4 mots) et « Où est le mot entendu ? » (audio → 3-4 images).
Distracteurs du même thème. 5-10 questions par session. Lecture TTS automatique,
bouton Répéter, feedback animé et sonore (Web Audio, sons synthétiques simples),
points, écran de résultats avec étoiles via ResultsPanel.vue réutilisable.
Niveau « petits » : image + audio seulement. Texte arabe en RTL.
Les erreurs alimentent wordProgress (box → 1). Tests Vitest sur le générateur.
```

## Prompt 5 — Devinettes (F3)
```
Crée src/data/riddles-ar.json et riddles-en.json (au moins 10 chacune, courtes, niveau
enfant, avec wordId, texte, indices progressifs). Signale tout contenu arabe dans
docs/A_RELIRE_NATIF.md. Crée src/components/riddle/RiddleView.vue : devinette lue en TTS,
réponse par choix d'images, indices après 2 échecs, même feedback/points que le quiz.
```

## Prompt 6 — Course 3D : moteur (F4)
```
Crée src/components/race/RaceCanvas.vue et useRaceEngine.js (Three.js + Cannon-es).
Pour l'instant, génère un circuit procédural simple et une voiture cube si les GLB
n'existent pas (fallback), mais charge track.glb/car.glb via GLTFLoader quand présents.
Contrôles : flèches/WASD + boutons tactiles. Caméra de poursuite. Physique arcade
simple. Détection des checkpoints (zones de déclenchement). API : startRace(),
pauseRace(), resetRace(), getScore(), événements onCheckpoint. Boucle propre,
dispose() au démontage, qualité graphique réglable. Pas d'ombres dynamiques par défaut.
```

## Prompt 7 — Course : signalétique, consignes, HUD (F4, G15)
```
Lis src/data/track-config.json. Crée src/services/race/signLogic.js :
getNextInstruction(checkpointId, lang) → { text, audioText, expectedAction, wordId },
validateAction(expected, actual) → boolean (avec tolérance sur la direction).
Les panneaux affichent le mot dans la langue cible via une texture canvas (RTL pour
l'arabe, police locale chargée avant dessin). La consigne est lue en TTS avant le
checkpoint. RaceHUD.vue : score, chrono, checkpoint n/N, consigne texte + icône, micro.
Bonne direction : +10 points, son de réussite, effet visuel. Mauvaise : recentrage doux,
mascotte rappelle le mot, le mot est ajouté à la révision. Panneau de résultats final.
Tests Vitest pour signLogic.
```

## Prompt 8 — STT local
```
Crée src/services/stt/whisper.js (Transformers.js, whisper-base, WebGPU puis WASM,
cache OPFS si possible). initSTT(lang) avec progression, listenOnce(lang, {timeoutMs}),
et src/services/stt/matcher.js : normalisation (arabe : retirer tashkeel/tatweel, unifier
les alefs, ى/ي, ة/ه ; anglais : minuscules, ponctuation) + distance de Levenshtein
avec seuil, comparaison à une liste fermée de réponses. Chargement paresseux avec écran
« préparation de la voix… ». Le micro n'est demandé qu'après un clic de l'adulte
(case à cocher dans les réglages). Fallback total vers le clic. Tests Vitest sur matcher.
Documente COOP/COEP dans le README seulement si nécessaire.
```

## Prompt 9 — Mascotte, cartes, répétition espacée (G1, G2, G4)
```
Crée src/services/srs/leitner.js (boîtes 1-5, intervalles 0/1/3/7/14 jours) et ses tests.
Crée un composant Mascot.vue (animations idle, joie, encouragement, sommeil ; version
2D SVG/CSS si pas de GLB) qui réagit aux événements de jeu et dit les mots (TTS).
Crée l'album de cartes /album : une carte (image emoji + mot AR/EN + audio) se débloque
quand un mot atteint la boîte 3 ; raretés commune/rare/or selon la boîte.
Les quiz, devinettes et checkpoints piochent en priorité les mots dus à la révision.
```

## Prompt 10 — Garage, défi du jour, espace parent (G3, G11, G16)
```
Garage : dépenser des points pour couleurs/stickers/jantes de la voiture ; les noms sont
dans la langue cible (couleurs depuis vocab.json). Défi du jour : un mini-défi généré
chaque jour (clé = date), coffre-surprise, série douce (une série cassée ne punit pas).
Espace parent /parent protégé par un PIN : mots forts/faibles, temps de jeu, limiteur de
session (écran de pause doux), choix des thèmes/niveau, export JSON des sessions,
réglages accessibilité (tashkeel, daltonien, vitesse de voix, réduction des animations).
```

## Prompt 11 — Mémoire et collecte de lettres (G8, G5)
```
Crée src/components/memory/MemoryView.vue : paires image↔mot ou mot AR↔mot EN, grille
4×3 pour les petits, 4×4 pour les grands, audio au retournement.
Ajoute dans la course une variante « Collecte de lettres » : lettres posées sur la piste,
l'enfant les ramasse dans l'ordre pour former le mot cible (affichage des liaisons arabes
correct, mot montré en pointillés). Mots depuis vocab.json.
```

## Prompt 12 — Assets Blender
```
Crée docs/BLENDER_PIPELINE.md : conventions de nommage, échelle, export glTF 2.0 / GLB
(Draco ou Meshopt), budget polygones (voiture < 5 k, circuit < 50 k), matériaux PBR
simples, textures ≤ 1024 px, animations. Écris aussi un script Blender Python
tools/export_glb.py qui exporte la scène en respectant ces règles.
Ajoute un script Node de validation (gltf-transform) qui vérifie poids et noms requis
(Car, Track, Sign_*, Checkpoint_NN).
```

## Prompt 13 — PWA, accessibilité, finitions (M6)
```
Active le mode hors-ligne (Service Worker : app, données, polices ; modèles IA via
cache dédié). Vérifie l'accessibilité : navigation clavier, contrastes, mode daltonien,
sous-titres des consignes, prefers-reduced-motion. Ajoute le plein écran, l'écran de
pause « repos des yeux » après N minutes et un test Playwright du parcours
profil → quiz → résultats.
```

## Prompt 14 — Tracé de lettres, Écho, mode aventure (M7, optionnel)
```
Tracé de lettres (canvas) : guide du sens du tracé, validation tolérante, arabe
(formes isolée/initiale/médiane/finale) puis lettres anglaises. Mode Écho : la mascotte
dit le mot, l'enfant répète, retour visuel (onde, étoiles), jamais de note négative.
Mode aventure : carte avec niveaux par thème qui se débloquent avec les étoiles.
```

## Prompt 14 bis — Darija : Pont, expressions, STT (G19, G20)
```
1) Mini-jeu « Pont Darija ↔ Fusha » : colonnes de mots (Darija à gauche, fusha à droite),
   l'enfant relie les paires ; les cartes de l'album affichent les deux formes si l'option
   parent est active. Audio de chaque forme selon la chaîne de repli.
2) Expressions du quotidien (src/data/phrases-ary.json, 10 expressions : salut, merci,
   s'il te plaît, au revoir, oui, non…) en mini-scènes avec la mascotte. Signale-les dans
   docs/A_RELIRE_NATIF.md.
3) Matcher STT : pour ary, compare à ary + ary_alt + ar normalisés (tashkeel, alefs,
   ة/ه, ى/ي, lettres voisines fréquentes en Darija) avec seuil ; ajoute un écran de test
   dans l'espace parent mesurant le taux de reconnaissance sur 20 mots et exportant le
   résultat en JSON.
```

## Prompt 15 — Revue finale
```
Fais une revue complète : lint, tests, build, Lighthouse (PWA/accessibilité),
vérification du respect de CLAUDE.md (aucun appel réseau de données enfant, jeu
sans micro, pas de pénalité punitive). Produis docs/CHECKLIST_RELEASE.md et mets à jour
README.md et LICENSES.md. Liste ce qui reste à faire relire par un locuteur natif.
```
