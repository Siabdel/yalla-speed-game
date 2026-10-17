# Yalla Speed — apprendre l'arabe et l'anglais en jouant

Jeu éducatif web pour enfants (4–10 ans) : quiz, devinettes, course de voitures avec panneaux en arabe/anglais, mascotte, cartes à collectionner, espace parent. Fonctionne dans le navigateur, hors-ligne après la première visite, sans envoi de données.

## Démarrage rapide
```
npm install
npm run dev
```

## Mise en place avec Claude Code
1. Créer un dossier de projet et y placer : `CLAUDE.md`, `CAHIER_DES_CHARGES.md`, `PROMPTS_CLAUDE_CODE.md`, `README.md`.
2. Créer `src/data/` et y placer `vocab.json` et `track-config.json`.
3. Lancer Claude Code à la racine, puis coller les prompts de `PROMPTS_CLAUDE_CODE.md` dans l'ordre (commencer par le Prompt 0 : prototypes de risque).

## Architecture
- **Blender** → assets 3D exportés en GLB (hors navigateur).
- **Three.js + Cannon-es** → course 3D. **Vue 3** → interface, quiz, HUD.
- **TTS** : Web Speech API (puis Kokoro-js en option). **STT** : Whisper via Transformers.js.
- **IndexedDB** : profils, progression, cartes. **PWA** : hors-ligne.

## Limites connues
- Voix arabe TTS dépendante de l'appareil.
- Whisper : chargement initial lourd, reconnaissance moins fiable sur voix d'enfants (le clic reste toujours disponible).
- Contenu arabe (fusha) et Darija à faire relire par un locuteur natif avant diffusion.
- Darija : pas d'orthographe standard, pas de voix de synthèse fiable → audio enregistré par un locuteur marocain recommandé (page « Studio de voix »). Whisper reconnaît moins bien la Darija (langue `ar`) : vocabulaire fermé et clic en secours.

## Langues
`ar` (arabe standard), `ary` (arabe marocain, Darija), `en` (anglais).

## Licences
Voir `LICENSES.md` (à compléter : modèles IA, polices, assets).
