# CLAUDE.md — Yalla Speed (jeu éducatif arabe/anglais pour enfants)

## Contexte
Jeu web 3D éducatif (4–10 ans) : quiz, devinettes, course de voitures avec panneaux AR/EN, mascotte, cartes à collectionner. Spécification complète : `CAHIER_DES_CHARGES.md`. Prompts d'étapes : `PROMPTS_CLAUDE_CODE.md`.

## Stack
Vue 3 (Composition API, `<script setup>`), Vite, Pinia, Vue Router, Three.js, Cannon-es, `@huggingface/transformers` (Whisper), `idb`, `vite-plugin-pwa`, Vitest, Playwright. JavaScript (pas de TypeScript sauf demande).

## Règles non négociables
- **Blender n'est pas exécuté dans le navigateur.** Il sert à produire des GLB ; le runtime est Three.js.
- **Vie privée** : aucun envoi réseau de données de l'enfant ni d'audio. Pas d'analytics, pas de CDN tiers au runtime (polices et modèles servis localement ou mis en cache).
- **Tout est jouable sans micro** ni voix ; la voix est un bonus avec repli propre.
- **Aucune pénalité punitive** : pas de « game over », ton toujours encourageant.
- **Source unique de contenu** : `src/data/vocab.json`. Ne pas dupliquer les mots ailleurs.
- Ne jamais inventer de contenu arabe ou Darija sans le signaler dans `docs/A_RELIRE_NATIF.md`.
- **Langues cibles : `ar` (fusha), `ary` (Darija marocaine), `en`.** Les composants lisent le champ correspondant à la langue cible (`word[lang]`) ; aucun mot en dur. Ne jamais mélanger fusha et Darija dans une même activité (sauf mini-jeu « Pont »).
- **Darija : ne jamais la faire lire par une voix fusha.** Chaîne de repli audio : audio enregistré → voix `ar-MA` → texte seul + signalement « audio manquant ».
- Ne pas ajouter de chansons, lyrics ou personnages protégés. Contenu original seulement.

## Conventions
- Dossiers : `src/components/{quiz,riddle,race,memory,common}`, `src/services/{tts,stt,storage,srs,race}`, `src/stores`, `src/data`, `src/assets/models`.
- Services = fonctions pures ou modules sans dépendance à Vue quand c'est possible (testables).
- Les composants arabes utilisent `dir="rtl"` et `lang="ar"` ; polices arabes locales.
- Nommage GLB stable : `Car`, `Track`, `Sign_*`, `Checkpoint_NN`, `Mascot`.
- Une boucle de rendu Three.js doit être arrêtée et libérée (`dispose`) au démontage.
- Le TTS passe toujours par `speak(text, lang)` (file d'attente, jamais de chevauchement).
- UI : gros boutons (≥ 56 px), contrastes élevés, icônes + audio, textes courts.

## Commandes
```
npm install
npm run dev
npm run build
npm run lint
npm run test        # Vitest
npm run test:e2e    # Playwright
```

## Méthode de travail
1. Lire `CAHIER_DES_CHARGES.md` et le prompt de l'étape en cours.
2. Avancer par petites étapes livrables ; lancer lint + tests avant de conclure une étape.
3. Écrire des tests Vitest pour : Leitner, validation d'actions, Levenshtein/normalisation arabe, lecture de `track-config.json`.
4. Mettre à jour le `README.md` à chaque étape qui change l'usage.
5. Signaler clairement ce qui n'a pas pu être vérifié (voix arabe, perf, WebGPU).

## Pièges connus
- Voix arabe TTS : varie selon l'OS ; détecter via `speechSynthesis.getVoices()` (chargement asynchrone) et afficher un message si absente.
- Whisper : chargement lourd → lazy-load, barre de progression, cache OPFS. Voix d'enfants moins bien reconnues : vocabulaire fermé + bouton clic toujours visible.
- Arabe : normaliser avant comparaison (retirer tashkeel et tatweel, unifier أ/إ/آ → ا, ى → ي, ة → ه selon le cas).
- Texte arabe dans une texture canvas : régler `ctx.direction = 'rtl'` et utiliser une police chargée avant le dessin (`document.fonts.load`).
- COOP/COEP : seulement si les threads WASM sont activés ; documenter dans le README.
- Darija : pas d'orthographe standard → toujours comparer l'entrée de l'enfant à `ary` + `ary_alt` (+ fusha) normalisés. Whisper n'a pas de code Darija : utiliser `ar`, vocabulaire fermé, clic toujours disponible.
- Code de langue : utiliser `ary` en interne ; `ar-MA` pour `speechSynthesis` ; `ar` pour Whisper.
