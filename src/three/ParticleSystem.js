import * as THREE from 'three'

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene
    this.diskRotationSpeed = 0.001
    this.innerDiskRotationSpeed = 0.001
    this.clock = new THREE.Clock()
    this.circleTexture = this._createCircleTexture()
    this._createBackgroundParticles()
    this._createInnerDiskParticles()
    this._createDiskParticles()
    this._createOutermostDiskParticles()
  }

  _createCircleTexture() {
    const canvas = document.createElement('canvas')
    canvas.width = 28
    canvas.height = 28
    const ctx = canvas.getContext('2d')
    ctx.beginPath()
    ctx.arc(14, 14, 14, 0, Math.PI * 2)
    ctx.fillStyle = 'white'
    ctx.fill()
    return new THREE.CanvasTexture(canvas)
  }

  _createBackgroundParticles() {
    const count = 4000
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 3000
      pos[i + 1] = (Math.random() - 0.5) * 3000
      pos[i + 2] = (Math.random() - 0.5) * 3000
      const c = new THREE.Color(
        Math.random() * 0.5 + 0.5,
        Math.random() * 0.3 + 0.7,
        Math.random() * 0.5 + 0.5
      )
      col[i] = c.r; col[i + 1] = c.g; col[i + 2] = c.b
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    const mat = new THREE.PointsMaterial({
      size: 6, vertexColors: true, transparent: true, opacity: 0.8,
      map: this.circleTexture, blending: THREE.NormalBlending
    })
    this.backgroundParticles = new THREE.Points(geo, mat)
    this.scene.add(this.backgroundParticles)
  }

  _createInnerDiskParticles() {
    const count = 6000
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i += 3) {
      const r = Math.sqrt(Math.random()) * 110
      const a = Math.random() * Math.PI * 2
      pos[i] = Math.cos(a) * r
      pos[i + 1] = (Math.random() - 0.5) * 8
      pos[i + 2] = Math.sin(a) * r
      col[i] = 1.0; col[i + 1] = 0.8; col[i + 2] = 0.9
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    const mat = new THREE.PointsMaterial({
      size: 0.7, vertexColors: true, transparent: true, opacity: 1,
      map: this.circleTexture, blending: THREE.NormalBlending
    })
    this.innerParticleDisk = new THREE.Points(geo, mat)
    this.scene.add(this.innerParticleDisk)
  }

  _createDiskParticles() {
    const count = 100000
    const innerR = 110, outerR = 350
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i += 3) {
      const rand = Math.pow(Math.random(), 1.5)
      const r = Math.sqrt(outerR * outerR * rand + (1 - rand) * innerR * innerR)
      const a = Math.random() * Math.PI * 2
      const p = new THREE.Vector3().setFromCylindricalCoords(r, a, (Math.random() - 0.5) * 2)
      pos[i] = p.x; pos[i + 1] = p.y; pos[i + 2] = p.z
      col[i] = 1.0; col[i + 1] = 0.8; col[i + 2] = 0.9
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    const mat = new THREE.PointsMaterial({
      size: 0.3, vertexColors: true, transparent: true, opacity: 1,
      map: this.circleTexture, blending: THREE.AdditiveBlending
    })
    this.particleDisk = new THREE.Points(geo, mat)
    this.scene.add(this.particleDisk)
  }

  _createOutermostDiskParticles() {
    const count = 100000
    const innerR = 350, outerR = 520
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i += 3) {
      const r = innerR + Math.random() * (outerR - innerR)
      const a = Math.random() * Math.PI * 2
      pos[i] = Math.cos(a) * r
      pos[i + 1] = (Math.random() - 0.5) * 4
      pos[i + 2] = Math.sin(a) * r
      col[i] = Math.random() * 0.2 + 0.8
      col[i + 1] = Math.random() * 0.2 + 0.8
      col[i + 2] = Math.random() * 0.2 + 0.8
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))

    const mat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 2.0 * (300.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float d = length(gl_PointCoord.xy - 0.5);
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.1, d);
          gl_FragColor = vec4(vColor, a * 0.6);
        }
      `,
      transparent: true, depthTest: false, blending: THREE.AdditiveBlending
    })
    this.outermostParticleDisk = new THREE.Points(geo, mat)
    this.scene.add(this.outermostParticleDisk)
  }

  updateColors(bgColor, diskColor, innerColor, outermostColor) {
    const update = (points, hexColor) => {
      if (!hexColor || !points) return
      const colors = points.geometry.attributes.color
      const c = new THREE.Color(hexColor)
      for (let i = 0; i < colors.count; i++) colors.setXYZ(i, c.r, c.g, c.b)
      colors.needsUpdate = true
    }
    update(this.backgroundParticles, bgColor)
    update(this.particleDisk, diskColor)
    update(this.innerParticleDisk, innerColor)
    update(this.outermostParticleDisk, outermostColor)
  }

  updateDiskRotationSpeed(s) { this.diskRotationSpeed = s }
  updateInnerDiskRotationSpeed(s) { this.innerDiskRotationSpeed = s }

  animate() {
    this.backgroundParticles.rotation.y += 0.001
    this.particleDisk.rotation.y += this.diskRotationSpeed
    this.innerParticleDisk.rotation.y += this.innerDiskRotationSpeed
    this.outermostParticleDisk.rotation.y += this.diskRotationSpeed
    if (this.outermostParticleDisk.material.uniforms) {
      this.outermostParticleDisk.material.uniforms.time.value = this.clock.getElapsedTime()
    }
  }

  dispose() {
    ;[this.backgroundParticles, this.particleDisk, this.innerParticleDisk, this.outermostParticleDisk]
      .forEach(p => { if (p) { p.geometry.dispose(); p.material.dispose(); this.scene.remove(p) } })
  }
}
