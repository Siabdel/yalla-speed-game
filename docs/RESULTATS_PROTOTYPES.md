# Résultats des prototypes M0

Prototypes isolés dans `prototypes/` (projet Vite séparé, `package.json` propre). Le code du jeu n'a pas été modifié ; `src/data/vocab.json` est seulement lu.

```
cd prototypes && npm install && npm run dev      # http://localhost:5173
```
Le micro exige `localhost` ou HTTPS. Pour tester sur tablette/mobile : `npx vite --host` derrière HTTPS (ou un tunnel), sinon `getUserMedia` est bloqué.

## Ce qui a été vérifié (machine de dev : Chrome 155 sous Linux, RTX 3060)

| Prototype | Vérifié | Résultat |
|---|---|---|
| Build `vite build` des 4 pages | oui | OK |
| **race-perf** | oui (onglet au premier plan) | 60 FPS stable (min 60), 200 cubes, 84 draw calls, ~1000 triangles, ombres désactivées. |
| **tts-test** | oui, mais sans voix | Le code d'attente `voiceschanged` (timeout 3 s) fonctionne. Ce Chrome expose **0 voix** : le verdict « aucune voix arabe » s'affiche correctement. Aucune parole n'a pu être testée. |
| **stt-test** chargement | oui | whisper-base chargé en **WASM** (WebGPU indisponible dans ce Chrome). Chargement 3,6 s, 1re inférence (échauffement) 5,6 s. |
| **stt-test** reconnaissance | **non** | Pas de micro dans cet environnement. Aucune mesure de qualité ar / ary / en, ni de temps de transcription sur vraie voix. |

Cette machine est bien plus puissante que le « laptop intégré » visé (critère ≥ 30 fps) : **le 60 FPS ne prouve rien pour ce critère**.

## Ce qui ne marche pas / limites constatées
- **WebGPU absent** dans ce Chrome Linux (pas d'adaptateur) : le repli WASM s'est déclenché comme prévu. Le gain WebGPU n'est pas mesuré.
- **Aucune voix `speechSynthesis`** sur cette machine : la présence d'une voix arabe, et surtout `ar-MA`, ne peut pas être supposée. Le cas « texte seul + audio manquant » est à prévoir sérieusement.
- Un onglet en arrière-plan est bridé à ~1 FPS : mesurer uniquement avec l'onglet visible.
- Le modèle vient de **huggingface.co** au premier chargement. C'est acceptable pour un prototype, pas pour le jeu : CLAUDE.md impose de le servir localement (`env.localModelPath`, `allowRemoteModels = false`) ou de le mettre en cache. Aucun audio ne quitte l'appareil.
- Le WASM d'onnxruntime-web pèse ~27 Mo, hors modèle : à prévoir pour le hors-ligne/PWA.
- Whisper n'a pas de code Darija : le mode `ary` envoie `language: arabic`. La qualité est à mesurer.
- Les threads WASM (COOP/COEP) ne sont pas activés : la transcription WASM est mono-thread, donc plus lente.

## À tester sur vos appareils

### 1. stt-test (le plus important)
1. Cliquer « Charger whisper-base » (mode auto). Noter backend, temps de chargement, échauffement.
2. Refaire en « WASM seul » et, si possible, « WebGPU seul » pour comparer.
3. Pour chaque mode (**ar**, **ary**, **en**) × chaque locuteur (**adulte**, **enfant**) : prononcer les 20 mots, noter le taux de match exact, le taux de vocabulaire fermé et le temps moyen de transcription.
4. « Exporter » le JSON pour archiver. Les mots Darija sont à faire dire par un locuteur marocain.
5. À décider : temps de transcription acceptable (< ~2 s ?) et taux de vocabulaire fermé minimal pour garder la voix comme bonus.

### 2. tts-test
Sur chaque appareil cible (Windows, Android, iOS/Safari, macOS, ChromeOS) et navigateur :
- Y a-t-il une voix `ar-*` ? Une voix `ar-MA` ? (Android/Chrome dépend du moteur TTS installé.)
- Les voix sont-elles « locales » ou « réseau » ? Une voix réseau envoie le texte à un tiers, ce qui contredit la règle vie privée.
- Le mot fusha et le mot anglais sont-ils bien prononcés ?
- Le bouton « diagnostic » lit la Darija avec une voix fusha : à n'utiliser que pour constater l'erreur, ce cas est interdit dans le jeu.

### 3. race-perf
Sur le laptop modeste et la tablette/mobile le plus faible :
- Relever FPS moyen/min et pire frame pour 200 / 1000 / 5000 cubes, avec/sans ombres, pixel ratio 1 / 2 / 0.75, meshes séparés vs `InstancedMesh`.
- Seuil à valider : ≥ 30 fps stable avec 200 cubes. Sinon : pixel ratio réduit, ombres coupées, instancing.
- Vérifier le GPU affiché (un rendu logiciel type SwiftShader donnerait des chiffres inutilisables).

## Non couvert
Texte arabe en texture canvas (RTL, police chargée), physique Cannon-es, GLB/Draco, cache OPFS du modèle, COOP/COEP, hors-ligne.
