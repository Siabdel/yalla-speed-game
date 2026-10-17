import { pipeline, env } from '@huggingface/transformers'
import vocab from '../../src/data/vocab.json'

env.allowLocalModels = false

const $ = (id) => document.getElementById(id)
const MODEL = 'onnx-community/whisper-base'
const REC_MS = 3000
let asr = null
let usedDevice = null
const results = {} // clé "mode:index" -> résultat

// ---------- Normalisation arabe + Levenshtein (copie locale, le prototype est isolé) ----------
function normalize(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[ً-ٰٟۖ-ۭ]/g, '') // tashkeel
    .replace(/ـ/g, '') // tatweel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}
function lev(a, b) {
  const m = a.length, n = b.length
  if (!m) return n
  if (!n) return m
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const cur = [i]
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[n]
}
const sim = (a, b) => (a || b ? 1 - lev(a, b) / Math.max(a.length, b.length) : 1)

// ---------- Chargement modèle ----------
async function hasWebGPU() {
  try {
    return !!navigator.gpu && !!(await navigator.gpu.requestAdapter())
  } catch { return false }
}
const fileProgress = {}
function onProgress(p) {
  if (p.status === 'progress' && p.file) {
    fileProgress[p.file] = { loaded: p.loaded, total: p.total }
    const tot = Object.values(fileProgress).reduce((s, f) => s + f.total, 0)
    const ld = Object.values(fileProgress).reduce((s, f) => s + f.loaded, 0)
    $('prog').value = tot ? (ld / tot) * 100 : 0
    $('loadInfo').textContent = `Téléchargement ${(ld / 1e6).toFixed(1)} / ${(tot / 1e6).toFixed(1)} Mo`
  }
}
async function build(device) {
  const dtype = device === 'webgpu'
    ? { encoder_model: 'fp32', decoder_model_merged: 'q4' }
    : { encoder_model: 'q8', decoder_model_merged: 'q8' }
  return pipeline('automatic-speech-recognition', MODEL, { device, dtype, progress_callback: onProgress })
}
$('load').onclick = async () => {
  $('load').disabled = true
  const choice = $('device').value
  const t0 = performance.now()
  const log = []
  try {
    const gpu = await hasWebGPU()
    log.push(`WebGPU disponible : ${gpu}`)
    if (choice === 'wasm' || (choice === 'auto' && !gpu)) {
      asr = await build('wasm'); usedDevice = 'wasm'
    } else {
      try { asr = await build('webgpu'); usedDevice = 'webgpu' }
      catch (e) {
        log.push(`WebGPU a échoué : ${e.message}`)
        if (choice === 'webgpu') throw e
        asr = await build('wasm'); usedDevice = 'wasm'
      }
    }
    const loadMs = performance.now() - t0
    log.push(`Backend utilisé : ${usedDevice}`, `Temps de chargement : ${(loadMs / 1000).toFixed(1)} s (inclut téléchargement si 1re fois)`)
    // échauffement : la 1re inférence compile les shaders / initialise WASM
    const w0 = performance.now()
    await asr(new Float32Array(16000), { language: 'english', task: 'transcribe' })
    log.push(`Échauffement (1re inférence sur 1 s de silence) : ${Math.round(performance.now() - w0)} ms`)
    $('rec').disabled = false
    document.querySelectorAll('.wrec').forEach((b) => (b.disabled = false))
  } catch (e) {
    log.push('ERREUR : ' + e.message)
    $('load').disabled = false
  }
  $('loadInfo').textContent = log.join('\n')
}

// ---------- Enregistrement ----------
async function recordFloat32(ms = REC_MS) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
  try {
    const mr = new MediaRecorder(stream)
    const chunks = []
    mr.ondataavailable = (e) => chunks.push(e.data)
    const done = new Promise((r) => (mr.onstop = r))
    mr.start()
    await new Promise((r) => setTimeout(r, ms))
    mr.stop()
    await done
    const buf = await new Blob(chunks).arrayBuffer()
    const ctx = new AudioContext({ sampleRate: 16000 }) // rééchantillonne à 16 kHz au décodage
    const audio = await ctx.decodeAudioData(buf)
    ctx.close()
    return audio.getChannelData(0)
  } finally {
    stream.getTracks().forEach((t) => t.stop())
  }
}
async function transcribe(audio, language) {
  const t0 = performance.now()
  const out = await asr(audio, { language, task: 'transcribe' })
  return { text: (out.text || '').trim(), ms: Math.round(performance.now() - t0) }
}

// ---------- Test libre ----------
$('rec').onclick = async () => {
  $('rec').disabled = true
  $('freeOut').textContent = '🎤 Parlez maintenant (3 s)…'
  try {
    const audio = await recordFloat32()
    $('freeOut').textContent = 'Transcription…'
    const r = await transcribe(audio, $('freeLang').value)
    $('freeOut').textContent = `Texte : « ${r.text} »\nTranscription : ${r.ms} ms (backend ${usedDevice}, audio ${(audio.length / 16000).toFixed(1)} s)`
  } catch (e) { $('freeOut').textContent = 'ERREUR : ' + e.message }
  $('rec').disabled = false
}

// ---------- Liste de 20 mots ----------
const words = vocab.words.slice(0, 20)
const modeLang = { ar: 'arabic', ary: 'arabic', en: 'english' } // Whisper n'a pas de code Darija → 'arabic'

function candidates(w, mode) {
  if (mode === 'en') return [w.en]
  if (mode === 'ar') return [w.ar]
  return [w.ary, ...(w.ary_alt || []), w.ar] // Darija : ary + ary_alt + fusha
}
function expectedLabel(w, mode) {
  return mode === 'ary' ? w.ary : w[mode]
}
function judge(text, w, mode) {
  const heard = normalize(text)
  const own = candidates(w, mode).map(normalize)
  const exact = own.some((c) => heard === c || heard.split(' ').includes(c))
  // vocabulaire fermé : meilleur mot parmi les 20 de la liste
  let best = null
  for (const o of words) {
    const s = Math.max(...candidates(o, mode).map((c) => sim(heard, normalize(c))))
    if (!best || s > best.s) best = { id: o.id, s }
  }
  const closed = best && best.id === w.id && best.s >= 0.5
  return { exact, closed, bestId: best?.id, bestSim: best ? +best.s.toFixed(2) : 0 }
}

function renderTable() {
  const mode = $('mode').value
  const tb = $('words').tBodies[0]
  tb.innerHTML = ''
  words.forEach((w, i) => {
    const r = results[`${mode}:${i}`]
    const tr = document.createElement('tr')
    if (r) tr.className = r.exact ? 'ok' : r.closed ? 'near' : 'ko'
    const dir = mode === 'en' ? 'ltr' : 'rtl'
    tr.innerHTML = `<td>${i + 1}</td>
      <td class="${mode === 'en' ? '' : 'ar'}" dir="${dir}" lang="${mode === 'ary' ? 'ar-MA' : mode}">${w.emoji} ${expectedLabel(w, mode)}${mode === 'ary' && w.ary_alt?.length ? ' <small>(' + w.ary_alt.join(' / ') + ')</small>' : ''}</td>
      <td dir="auto">${r ? r.text || '(vide)' : ''}</td>
      <td>${r ? (r.exact ? '✅' : '❌') : ''}</td>
      <td>${r ? (r.closed ? '✅' : '❌') + ` <small>→ ${r.bestId} (${r.bestSim})</small>` : ''}</td>
      <td>${r ? r.ms : ''}</td>
      <td><button class="wrec" data-i="${i}" ${asr ? '' : 'disabled'}>🎤</button></td>`
    tb.appendChild(tr)
  })
  const done = words.map((_, i) => results[`${mode}:${i}`]).filter(Boolean)
  const ex = done.filter((r) => r.exact).length
  const cl = done.filter((r) => r.closed).length
  const avg = done.length ? Math.round(done.reduce((s, r) => s + r.ms, 0) / done.length) : 0
  $('summary').textContent = done.length
    ? `${done.length}/20 testés — match exact : ${ex} (${Math.round((100 * ex) / done.length)} %) — vocabulaire fermé : ${cl} (${Math.round((100 * cl) / done.length)} %) — transcription moyenne : ${avg} ms`
    : 'Aucun mot testé.'
}
$('mode').onchange = renderTable
$('reset').onclick = () => { for (const k of Object.keys(results)) delete results[k]; renderTable() }
$('words').addEventListener('click', async (e) => {
  const b = e.target.closest('.wrec')
  if (!b) return
  const i = +b.dataset.i
  const mode = $('mode').value
  document.querySelectorAll('.wrec').forEach((x) => (x.disabled = true))
  b.textContent = '…🎙'
  try {
    const audio = await recordFloat32()
    const t = await transcribe(audio, modeLang[mode])
    results[`${mode}:${i}`] = { ...t, ...judge(t.text, words[i], mode), speaker: $('speaker').value, wordId: words[i].id, mode, device: usedDevice }
  } catch (err) { alert('Erreur : ' + err.message) }
  renderTable()
})
$('export').onclick = () => {
  const blob = new Blob([JSON.stringify(Object.values(results), null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'stt-results.json'
  a.click()
  URL.revokeObjectURL(a.href)
}
renderTable()
