import * as THREE from 'three'

const hud = document.getElementById('hud')
const $ = (id) => document.getElementById(id)

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'default' })
document.body.appendChild(renderer.domElement)
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x87ceeb)
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 500)
scene.add(new THREE.HemisphereLight(0xffffff, 0x446644, 1.0))
const sun = new THREE.DirectionalLight(0xffffff, 1.5)
sun.position.set(30, 50, 20)
sun.shadow.mapSize.set(1024, 1024)
Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, far: 150 })
scene.add(sun)

const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x66aa55 }))
ground.rotation.x = -Math.PI / 2
ground.receiveShadow = true
scene.add(ground)

const car = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 3), new THREE.MeshStandardMaterial({ color: 0xff3333 }))
car.castShadow = true
scene.add(car)

// Décor : cubes répartis hors de la piste circulaire (rayon 25)
const geo = new THREE.BoxGeometry(1, 1, 1)
const mat = new THREE.MeshStandardMaterial({ color: 0xffffff })
let decor = null
const rnd = (() => { let s = 42; return () => ((s = (s * 16807) % 2147483647) / 2147483647) })()

function buildDecor(n, instanced) {
  if (decor) { scene.remove(decor); decor.traverse?.((o) => o.material && o.material !== mat && o.material.dispose()); decor.dispose?.() }
  const place = () => {
    const a = rnd() * Math.PI * 2
    const r = rnd() < 0.5 ? 8 + rnd() * 10 : 33 + rnd() * 55
    return [Math.cos(a) * r, Math.sin(a) * r, 0.5 + rnd() * 2, rnd() * 3]
  }
  if (instanced) {
    const im = new THREE.InstancedMesh(geo, mat, n)
    const m = new THREE.Matrix4(), c = new THREE.Color()
    for (let i = 0; i < n; i++) {
      const [x, z, h, rot] = place()
      m.compose(new THREE.Vector3(x, h / 2, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot), new THREE.Vector3(1, h, 1))
      im.setMatrixAt(i, m)
      im.setColorAt(i, c.setHSL(rnd(), 0.6, 0.55))
    }
    im.castShadow = im.receiveShadow = true
    decor = im
  } else {
    const g = new THREE.Group()
    g.dispose = () => {}
    for (let i = 0; i < n; i++) {
      const [x, z, h, rot] = place()
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(rnd(), 0.6, 0.55) }))
      mesh.position.set(x, h / 2, z); mesh.scale.y = h; mesh.rotation.y = rot
      mesh.castShadow = mesh.receiveShadow = true
      g.add(mesh)
    }
    decor = g
  }
  scene.add(decor)
}

function applySettings() {
  renderer.setPixelRatio(Math.min(+$('pr').value, window.devicePixelRatio * 1)) // 'écran natif' = min(2, dpr)
  renderer.shadowMap.enabled = $('shadow').value === '1'
  sun.castShadow = renderer.shadowMap.enabled
  scene.traverse((o) => { if (o.material) o.material.needsUpdate = true })
  resize()
}
function resize() {
  renderer.setSize(innerWidth, innerHeight)
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
}
addEventListener('resize', resize)
for (const id of ['shadow', 'pr']) $(id).onchange = applySettings
for (const id of ['count', 'inst']) $(id).onchange = () => { buildDecor(+$('count').value, $('inst').value === '1'); resetStats() }

// ---------- FPS ----------
let frames = 0, last = performance.now(), fps = 0, minFps = Infinity, worstFrame = 0, prev = performance.now(), sumFps = 0, samples = 0
function resetStats() { minFps = Infinity; worstFrame = 0; sumFps = 0; samples = 0 }
$('shadow').onchange = () => { applySettings(); resetStats() }
$('pr').onchange = () => { applySettings(); resetStats() }

let raf = 0
function loop(now) {
  raf = requestAnimationFrame(loop)
  worstFrame = Math.max(worstFrame, now - prev); prev = now
  const t = now / 1000
  const a = t * 0.6 // vitesse angulaire
  car.position.set(Math.cos(a) * 25, 0.4, Math.sin(a) * 25)
  car.rotation.y = -a
  camera.position.set(Math.cos(a - 0.35) * 33, 7, Math.sin(a - 0.35) * 33)
  camera.lookAt(car.position)
  renderer.render(scene, camera)
  frames++
  if (now - last >= 500) {
    fps = (frames * 1000) / (now - last)
    frames = 0; last = now
    if (t > 2) { minFps = Math.min(minFps, fps); sumFps += fps; samples++ } // ignorer le démarrage
    const i = renderer.info.render
    const gl = renderer.getContext()
    const dbg = gl.getExtension('WEBGL_debug_renderer_info')
    hud.textContent =
      `FPS : ${fps.toFixed(0)}   (moy ${samples ? (sumFps / samples).toFixed(0) : '-'}, min ${isFinite(minFps) ? minFps.toFixed(0) : '-'})\n` +
      `Pire frame : ${worstFrame.toFixed(0)} ms\n` +
      `Draw calls : ${i.calls}   Triangles : ${i.triangles}\n` +
      `Résolution : ${renderer.domElement.width}×${renderer.domElement.height} (pr ${renderer.getPixelRatio()})\n` +
      `GPU : ${dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'inconnu'}`
  }
}
buildDecor(200, false)
applySettings()
raf = requestAnimationFrame(loop)

// Arrêt + libération (règle du projet : dispose au démontage)
addEventListener('pagehide', () => {
  cancelAnimationFrame(raf)
  scene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.() })
  renderer.dispose()
})
