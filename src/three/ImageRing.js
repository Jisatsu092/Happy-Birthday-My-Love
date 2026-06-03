import * as THREE from 'three'

export class ImageRing {
  constructor(scene) {
    this.scene = scene
    this.group = new THREE.Group()
    this.scene.add(this.group)
    this.sprites = []
    this.textures = []
    this.materials = []
    this.rotationSpeed = 0.002
    // Load default photos dari public/photos/ kalau ada, fallback ke dots
    this._loadDefaultPhotos()
  }

  // Coba load foto dari public/photos/1.jpg sampai 5.jpg
  _loadDefaultPhotos() {
    const loader = new THREE.TextureLoader()
    const urls = ['photos/1.jpg','photos/2.jpg','photos/3.jpg','photos/4.jpg','photos/5.jpg']
    const promises = urls.map(url =>
      new Promise(resolve => {
        loader.load(url,
          tex => resolve(tex),
          undefined,
          () => resolve(null) // 404 = skip
        )
      })
    )
    Promise.all(promises).then(textures => {
      const valid = textures.filter(Boolean)
      if (valid.length > 0) {
        const mats = valid.map(t => this._makeMaterial(t))
        this.materials = mats
        this.textures = valid
        this._buildSprites(mats)
      } else {
        this._buildDotSprites()
      }
    })
  }

  _makeMaterial(texture) {
    // Proses texture supaya rounded corners
    if (texture.image) {
      const processed = this._processImageToTexture(texture.image)
      texture.dispose()
      return new THREE.SpriteMaterial({
        map: processed, transparent: true, alphaTest: 0.05,
        depthTest: true, depthWrite: false
      })
    }
    return new THREE.SpriteMaterial({
      map: texture, transparent: true, alphaTest: 0.05
    })
  }

  _processImageToTexture(img) {
    const size = 128 // Fixed output size untuk konsistensi
    const canvas = document.createElement('canvas')
    canvas.width = size; canvas.height = size
    const ctx = canvas.getContext('2d')

    // Crop center square dari source image
    const srcSize = Math.min(img.width || size, img.height || size)
    const ox = ((img.width || size) - srcSize) / 2
    const oy = ((img.height || size) - srcSize) / 2

    // Rounded corners clip
    const r = size * 0.1
    ctx.beginPath()
    ctx.moveTo(r, 0)
    ctx.lineTo(size - r, 0)
    ctx.quadraticCurveTo(size, 0, size, r)
    ctx.lineTo(size, size - r)
    ctx.quadraticCurveTo(size, size, size - r, size)
    ctx.lineTo(r, size)
    ctx.quadraticCurveTo(0, size, 0, size - r)
    ctx.lineTo(0, r)
    ctx.quadraticCurveTo(0, 0, r, 0)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(img, ox, oy, srcSize, srcSize, 0, 0, size, size)

    const tex = new THREE.CanvasTexture(canvas)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    return tex
  }

  _buildDotSprites() {
    // Fallback: dot kecil pink kalau tidak ada foto
    const canvas = document.createElement('canvas')
    canvas.width = 32; canvas.height = 32
    const ctx = canvas.getContext('2d')
    const grd = ctx.createRadialGradient(16,16,0,16,16,14)
    grd.addColorStop(0, 'rgba(255,150,200,1)')
    grd.addColorStop(1, 'rgba(255,100,180,0)')
    ctx.fillStyle = grd
    ctx.beginPath()
    ctx.arc(16,16,14,0,Math.PI*2)
    ctx.fill()
    const tex = new THREE.CanvasTexture(canvas)
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending })
    this.materials = [mat]
    this._buildSprites([mat])
  }

  _buildSprites(materials) {
    // Cleanup old
    this.sprites.forEach(s => {
      this.group.remove(s)
    })
    this.sprites = []

    const numSprites = 800
    const innerR = 130, outerR = 530

    for (let i = 0; i < numSprites; i++) {
      const mat = materials[Math.floor(Math.random() * materials.length)]
      const sprite = new THREE.Sprite(mat)

      const angle = Math.random() * Math.PI * 2
      const r = innerR + Math.random() * (outerR - innerR)
      const h = (Math.random() - 0.5) * 16

      sprite.position.set(Math.cos(angle) * r, h, Math.sin(angle) * r)

      // Ukuran SAMA dengan asli: 10-13 unit
      // Tapi kamera kita di z=700, asli di z=200-ish, jadi scale down
      const sz = 10 + Math.random() * 3
      sprite.scale.set(sz, sz, 1)

      this.sprites.push(sprite)
      this.group.add(sprite)
    }
  }

  // Upload foto dari input file
  loadImages(files) {
    // Dispose old user-uploaded textures
    this.textures.forEach(t => t.dispose())
    this.textures = []
    this.materials = []

    const promises = Array.from(files).slice(0, 5).map(file => {
      return new Promise(resolve => {
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => {
          const tex = this._processImageToTexture(img)
          URL.revokeObjectURL(url)
          resolve(tex)
        }
        img.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
        img.src = url
      })
    })

    Promise.all(promises).then(textures => {
      const valid = textures.filter(Boolean)
      if (valid.length === 0) return
      this.textures = valid
      const mats = valid.map(t => new THREE.SpriteMaterial({
        map: t, transparent: true, alphaTest: 0.05,
        depthTest: true, depthWrite: false
      }))
      this.materials = mats
      this._buildSprites(mats)
    })
  }

  animate() {
    this.group.rotation.y += this.rotationSpeed
  }

  dispose() {
    this.sprites.forEach(s => this.group.remove(s))
    this.textures.forEach(t => t.dispose())
    this.materials.forEach(m => m.dispose())
    this.scene.remove(this.group)
  }
}
