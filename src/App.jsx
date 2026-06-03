import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import gsap from 'gsap'
import { ParticleSystem } from './three/ParticleSystem'
import { CentralSphere } from './three/CentralSphere'
import { ImageRing } from './three/ImageRing'
import { HeartText } from './three/HeartText'
import styles from './App.module.css'
import MeteorCanvas from './MeteorCanvas'

// ── Loading Screen ──────────────────────────────────────────────────────────
function LoadingScreen({ onDone }) {
  const [fade, setFade] = useState(false)
  useEffect(() => {
    const t1 = setTimeout(() => setFade(true), 1800)
    const t2 = setTimeout(() => onDone(), 2400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])
  return (
    <div className={`${styles.loadingScreen} ${fade ? styles.loadingFade : ''}`}>
      <div className={styles.loadingDots}>
        <span /><span /><span />
      </div>
      <div className={styles.loadingText}>memuat galaksi...</div>
    </div>
  )
}

// Direct Giphy media URLs (no embed widget, just the gif)
const GIF_SAD = 'https://media.giphy.com/media/4KB5f1hQLykphxX1wW/giphy.gif'
const GIF_HAPPY = 'https://media.giphy.com/media/HJibfnd7xqk5hAMD4v/giphy.gif'

// ── Question Screen ─────────────────────────────────────────────────────────
function QuestionScreen({ onDone }) {
  const [answer, setAnswer] = useState(null)
  const [noCount, setNoCount] = useState(0)
  const [noPos, setNoPos] = useState({ x: 50, y: 78 })
  const [fade, setFade] = useState(false)

  const handleYes = () => {
    setAnswer('yes')
    setTimeout(() => {
      setFade(true)
      setTimeout(onDone, 700)
    }, 2200)
  }

  const handleNo = () => {
    const next = noCount + 1
    setNoCount(next)
    const side = Math.random() > 0.5
    const x = side ? 5 + Math.random() * 28 : 67 + Math.random() * 26
    const y = 55 + Math.random() * 35
    setNoPos({ x, y })
    setAnswer('no')
  }

  const gifSize = Math.min(140 + noCount * 45, 440)

  return (
    <div className={`${styles.questionScreen} ${fade ? styles.loadingFade : ''}`}>

      {/* GIF — behind everything */}
      {answer === 'no' && (
        <div className={styles.gifBehind}>
          <img
            src={GIF_SAD}
            alt="sad"
            style={{
              width: `${gifSize}px`,
              height: `${gifSize}px`,
              objectFit: 'cover',
              borderRadius: '16px',
              transition: 'width 0.3s ease, height 0.3s ease',
            }}
          />
          <div className={styles.gifCaption}>yahhh kenapa... 😢</div>
        </div>
      )}

      {answer === 'yes' && (
        <div className={styles.gifBehind}>
          <img
            src={GIF_HAPPY}
            alt="happy"
            style={{ width: '280px', height: '280px', objectFit: 'cover', borderRadius: '16px' }}
          />
          <div className={styles.gifCaption}>yayy makasih!! 💖💖</div>
        </div>
      )}

      {/* Question + YES button — always on top */}
      <div className={styles.questionCard}>
        <div className={styles.questionText}>
          Kamu seneng gak<br />sama <span className={styles.questionName}>Iky</span>? 🌸
        </div>
        <button className={styles.answerBtn} onClick={handleYes}>
          Iya dong 💖
        </button>
      </div>

      {/* NO button — floats around, same style */}
      <button
        className={styles.answerBtn}
        style={{
          position: 'fixed',
          left: `${noPos.x}%`,
          top: `${noPos.y}%`,
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255,255,255,0.1)',
          boxShadow: 'none',
        }}
        onClick={handleNo}
      >
        Ngga 😐
      </button>
    </div>
  )
}

const PRESETS = [
  { label: 'Ungu Biru', color1: '#8B5CF6', color2: '#3B82F6', isGradient: true, diskColor: '#8B5CF6', innerDiskColor: '#A78BFA', outermostColor: '#C4B5FD', bgColor: '#8B5CF6' },
  { label: 'Pink Merah', color1: '#f953c6', color2: '#ff6b6b', isGradient: true, diskColor: '#ec4899', innerDiskColor: '#f472b6', outermostColor: '#f9a8d4', bgColor: '#f953c6' },
  { label: 'Hijau Toska', color1: '#43cea2', color2: '#185a9d', isGradient: true, diskColor: '#3B82F6', innerDiskColor: '#60A5FA', outermostColor: '#93C5FD', bgColor: '#43cea2' },
  { label: 'Emas Pink', color1: '#ec4899', color2: '#f59e0b', isGradient: true, diskColor: '#fbbf24', innerDiskColor: '#fcd34d', outermostColor: '#fde68a', bgColor: '#ec4899' },
  { label: 'Biru Laut', color1: '#00c3ff', color2: '#0891b2', isGradient: false, diskColor: '#0284c7', innerDiskColor: '#0ea5e9', outermostColor: '#38bdf8', bgColor: '#b3e6ff' },
  { label: 'Merah Terang', color1: '#ff6b6b', color2: '#ff6b6b', isGradient: false, diskColor: '#e53e3e', innerDiskColor: '#f56565', outermostColor: '#fc8181', bgColor: '#ff6b6b' },
]

export default function App() {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const controlsRef = useRef(null)
  const particleSystemRef = useRef(null)
  const centralSphereRef = useRef(null)
  const imageRingRef = useRef(null)
  const animFrameRef = useRef(null)
  const heartTextRef = useRef(null)
  const isAnimatingRef = useRef(false)

  // screen: 'loading' | 'question' | 'galaxy'
  const [screen, setScreen] = useState('loading')
  const [showPanel, setShowPanel] = useState(false)
  const [imageCount, setImageCount] = useState(0)
  const [selectedPreset, setSelectedPreset] = useState(0)
  const [meteorActive, setMeteorActive] = useState(true)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [customText, setCustomText] = useState('Only For You "Delfi Suryani"')
  const audioRef = useRef(null)

  // Init audio
  useEffect(() => {
    const audio = new Audio('https://cdn.pixabay.com/audio/2024/11/13/audio_bfa5aa7aef.mp3')
    audio.loop = true
    audio.volume = 0.5
    audioRef.current = audio
    return () => { audio.pause(); audio.src = '' }
  }, [])

  // Auto-play music when entering galaxy screen
  useEffect(() => {
    if (screen === 'galaxy' && audioRef.current) {
      audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {})
    }
  }, [screen])

  // Init Three.js scene
  useEffect(() => {
    const mount = mountRef.current
    const W = window.innerWidth, H = window.innerHeight

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera - sama persis dengan aslinya
    const camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 5000)
    camera.position.set(0, 60, 200)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(W, H)
    renderer.setClearColor(0x000000)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer
    renderer.debug.checkShaderErrors = true

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.14
    controls.rotateSpeed = 0.35
    controls.zoomSpeed = 0.6
    controls.minPolarAngle = 0.35
    controls.maxPolarAngle = Math.PI - 0.35
    controls.enablePan = false
    controls.minDistance = 80
    controls.maxDistance = 800
    controlsRef.current = controls

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const pl = new THREE.PointLight(0xffffff, 1, 500)
    pl.position.set(100, 100, 100)
    scene.add(pl)

    // Systems
    const ps = new ParticleSystem(scene)
    particleSystemRef.current = ps

    const cs = new CentralSphere(scene)
    centralSphereRef.current = cs

    const ir = new ImageRing(scene)
    imageRingRef.current = ir

    const ht = new HeartText(scene)
    heartTextRef.current = ht

    // Apply default preset colors
    const preset = PRESETS[0]
    ps.updateColors(preset.bgColor, preset.diskColor, preset.innerDiskColor, preset.outermostColor)

    // Animation loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)
      ps.animate()
      cs.animate()
      ir.animate()
      ht.animate()
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Resize
    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(animFrameRef.current)
      ps.dispose()
      cs.dispose()
      ir.dispose()
      controls.dispose()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  // Apply preset
  const applyPreset = useCallback((idx) => {
    setSelectedPreset(idx)
    const preset = PRESETS[idx]
    if (centralSphereRef.current) {
      centralSphereRef.current.updateConfig({
        color1: preset.color1,
        color2: preset.color2,
        isGradient: preset.isGradient
      })
    }
    if (particleSystemRef.current) {
      particleSystemRef.current.updateColors(
        preset.bgColor, preset.diskColor, preset.innerDiskColor, preset.outermostColor
      )
    }
  }, [])

  // Double click / double tap camera animation
  const triggerAnimation = useCallback(() => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls || isAnimatingRef.current) return
    isAnimatingRef.current = true
    controls.enabled = false

    gsap.to(camera.position, {
      x: 0, y: 10, z: 80, duration: 5, ease: 'power2.inOut',
      onUpdate: () => camera.lookAt(0, 0, 0),
      onComplete: () => {
        gsap.to(camera.position, {
          x: 0, y: 30, z: 600, duration: 12, ease: 'power2.inOut',
          onUpdate: () => camera.lookAt(0, 0, 0),
          onComplete: () => {
            gsap.to(camera.position, {
              x: -200, y: 400, z: -700, duration: 5, ease: 'power2.inOut',
              onUpdate: () => camera.lookAt(0, 0, 0),
              onComplete: () => {
                isAnimatingRef.current = false
                controls.enabled = true
              }
            })
          }
        })
      }
    })
  }, [])

  // Apply custom text to HeartText
  useEffect(() => {
    if (heartTextRef.current && customText) {
      heartTextRef.current.setText(customText)
    }
  }, [customText])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (musicPlaying) { audio.pause(); setMusicPlaying(false) }
    else { audio.play().then(() => setMusicPlaying(true)).catch(() => {}) }
  }, [musicPlaying])

  // Double click handler
  const handleDblClick = useCallback(() => {
    triggerAnimation()
  }, [triggerAnimation])

  // Double tap handler
  useEffect(() => {
    let lastTap = 0, lastX = 0, lastY = 0
    const onTouchEnd = (e) => {
      const now = Date.now()
      const t = e.changedTouches[0]
      const dx = t.clientX - lastX, dy = t.clientY - lastY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (now - lastTap < 600 && now - lastTap > 80 && dist < 30) {
        e.preventDefault()
        triggerAnimation()
      }
      lastTap = now; lastX = t.clientX; lastY = t.clientY
    }
    document.addEventListener('touchend', onTouchEnd, { passive: false })
    return () => document.removeEventListener('touchend', onTouchEnd)
  }, [triggerAnimation])

  // Image upload handler
  const handleImageUpload = useCallback((e) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    imageRingRef.current?.loadImages(files)
    setImageCount(files.length)
  }, [])

  return (
    <div className={styles.root}>
      {/* Loading screen */}
      {screen === 'loading' && (
        <LoadingScreen onDone={() => setScreen('question')} />
      )}

      {/* Question screen */}
      {screen === 'question' && (
        <QuestionScreen onDone={() => { setScreen('galaxy'); setTimeout(() => triggerAnimation(), 100) }} />
      )}

      {/* Three.js canvas mount */}
      <div
        ref={mountRef}
        className={`${styles.canvas} ${screen !== 'galaxy' ? styles.canvasHidden : ''}`}
        onDoubleClick={handleDblClick}
      />

      {/* Meteor shower overlay */}
      <MeteorCanvas active={screen === 'galaxy' && meteorActive} />

      {/* HUD top-right */}
      {screen === 'galaxy' && (
        <div className={styles.hud}>
          <button className={styles.hudBtn} onClick={() => setShowPanel(p => !p)} title="Kustomisasi">
            ✦
          </button>
          <button className={styles.hudBtn} onClick={toggleMusic} title={musicPlaying ? 'Pause musik' : 'Play musik'}>
            {musicPlaying ? '♫' : '♪'}
          </button>
        </div>
      )}

      {/* Hint */}
      <div className={styles.hint}>
        double tap / click untuk animasi kamera
      </div>

      {/* Side panel */}
      {showPanel && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Kustomisasi</span>
            <button className={styles.closeBtn} onClick={() => setShowPanel(false)}>✕</button>
          </div>

          {/* Upload foto */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>📸 Upload Foto (maks 5)</div>
            <label className={styles.uploadArea}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
              <span className={styles.uploadIcon}>📁</span>
              <span className={styles.uploadText}>
                {imageCount > 0 ? `${imageCount} foto dipilih` : 'Klik untuk pilih foto'}
              </span>
            </label>
          </div>

          {/* Preset warna */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>🎨 Warna Galaksi</div>
            <div className={styles.presetGrid}>
              {PRESETS.map((preset, i) => (
                <button
                  key={i}
                  className={`${styles.presetBtn} ${selectedPreset === i ? styles.presetBtnActive : ''}`}
                  style={{
                    background: preset.isGradient
                      ? `linear-gradient(135deg, ${preset.color1}, ${preset.color2})`
                      : preset.color1
                  }}
                  onClick={() => applyPreset(i)}
                  title={preset.label}
                >
                  <span className={styles.presetLabel}>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom text */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>✏️ Teks Galaksi</div>
            <textarea
              className={styles.textInput}
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              rows={2}
              placeholder="Tulis pesanmu..."
            />
          </div>

          {/* Meteor toggle */}
          <div className={styles.section}>
            <div className={styles.toggleRow}>
              <span className={styles.toggleLabel}>☄️ Hujan meteor</span>
              <button
                className={`${styles.toggleBtn} ${meteorActive ? styles.toggleOn : ''}`}
                onClick={() => setMeteorActive(p => !p)}
              >
                {meteorActive ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.tip}>
              💡 Drag untuk rotate galaksi<br />
              Scroll / pinch untuk zoom
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
