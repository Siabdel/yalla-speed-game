const $ = (id) => document.getElementById(id)
const synth = window.speechSynthesis

// getVoices() est souvent vide au 1er appel : attendre 'voiceschanged' (avec délai max, certains navigateurs ne l'émettent pas)
function loadVoices(timeoutMs = 3000) {
  return new Promise((resolve) => {
    if (!synth) return resolve([])
    const now = synth.getVoices()
    if (now.length) return resolve(now)
    const finish = () => { clearTimeout(timer); synth.removeEventListener('voiceschanged', onChange); resolve(synth.getVoices()) }
    const onChange = () => { if (synth.getVoices().length) finish() }
    const timer = setTimeout(finish, timeoutMs)
    synth.addEventListener('voiceschanged', onChange)
  })
}

let voices = []
const isAr = (v) => v.lang.toLowerCase().replace('_', '-').startsWith('ar')
const isArMA = (v) => v.lang.toLowerCase().replace('_', '-') === 'ar-ma'
const isEn = (v) => v.lang.toLowerCase().replace('_', '-').startsWith('en')

function speak(text, lang, voice) {
  return new Promise((resolve) => {
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    if (voice) u.voice = voice
    const t0 = performance.now()
    let startMs = null
    u.onstart = () => { startMs = Math.round(performance.now() - t0) }
    u.onend = () => resolve({ ok: true, startMs, totalMs: Math.round(performance.now() - t0) })
    u.onerror = (e) => resolve({ ok: false, error: e.error })
    synth.speak(u)
    // certains navigateurs n'émettent jamais onend/onerror si aucune voix
    setTimeout(() => { if (startMs === null) resolve({ ok: false, error: 'aucun démarrage après 4 s' }) }, 4000)
  })
}
const report = (label, r) => {
  $('out').textContent += `${label} → ${r.ok ? `OK (début ${r.startMs} ms, total ${r.totalMs} ms)` : 'ÉCHEC : ' + r.error}\n`
}
const chosen = () => voices[+$('voiceSel').value] || null

async function main() {
  if (!synth) { $('verdict').textContent = '❌ speechSynthesis non supporté par ce navigateur.'; return }
  const t0 = performance.now()
  voices = await loadVoices()
  const waited = Math.round(performance.now() - t0)
  const ar = voices.filter(isAr)
  const arMA = voices.filter(isArMA)
  const en = voices.filter(isEn)
  $('verdict').innerHTML = `
    <p>${voices.length} voix détectées (attente : ${waited} ms).</p>
    <p>Voix arabe (ar-*) : <b>${ar.length ? '✅ ' + ar.map((v) => `${v.name} [${v.lang}]`).join(', ') : '❌ aucune'}</b></p>
    <p>Voix Darija (ar-MA) : <b>${arMA.length ? '✅ ' + arMA.map((v) => v.name).join(', ') : '❌ aucune → Darija en texte seul + « audio manquant »'}</b></p>
    <p>Voix anglaise : <b>${en.length ? '✅ ' + en.length : '❌ aucune'}</b></p>
    <p><small>${navigator.userAgent}</small></p>`
  $('voiceSel').innerHTML = voices.map((v, i) => `<option value="${i}">${v.name} [${v.lang}]</option>`).join('')
  $('voices').tBodies[0].innerHTML = voices.map((v) => `<tr class="${isAr(v) ? 'ok' : ''}"><td>${v.name}</td><td>${v.lang}</td><td>${v.localService ? 'locale' : 'réseau ⚠️'}</td><td>${v.default ? '✔' : ''}</td></tr>`).join('')

  const pick = (pred, lang) => chosen() && pred(chosen()) ? chosen() : voices.find(pred) || null
  $('speakAr').onclick = async () => {
    const v = pick(isAr, 'ar')
    report(`Fusha قطة (voix : ${v ? v.name : 'défaut'})`, await speak('قطة', 'ar', v))
  }
  $('speakEn').onclick = async () => {
    const v = pick(isEn, 'en')
    report(`Anglais cat (voix : ${v ? v.name : 'défaut'})`, await speak('cat', 'en-US', v))
  }
  $('speakAry').onclick = async () => {
    const v = arMA[0]
    if (!v) { $('out').textContent += 'Darija قطوس → BLOQUÉ : aucune voix ar-MA (règle du jeu : texte seul + « audio manquant »)\n'; return }
    report(`Darija قطوس (voix : ${v.name})`, await speak('قطوس', 'ar-MA', v))
  }
  $('speakAryAny').onclick = async () => {
    const v = pick(isAr, 'ar')
    report(`DIAGNOSTIC Darija قطوس lue par ${v ? v.name : 'défaut'} (à écouter : est-ce correct ?)`, await speak('قطوس', 'ar', v))
  }
}
main()
