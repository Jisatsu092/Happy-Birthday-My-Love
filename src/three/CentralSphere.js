import * as THREE from 'three'

export class CentralSphere {
  constructor(scene) {
    this.scene = scene
    this.clock = new THREE.Clock()
    this.config = {
      color1: '#8B5CF6',
      color2: '#3B82F6',
      size: 9,
      rotationSpeed: 0.005,
      particleSpeed: 2.0,
      points: 15000,
      radius: { MIN: 55, MAX: 60 },
      isGradient: true
    }
    this.uniforms = { time: { value: 0 }, particleSpeed: { value: 2.0 } }
    this.object = null
    this._build()
  }

  _build() {
    const { points, radius } = this.config
    const positions = []
    const sizes = []
    const shifts = []

    for (let i = 0; i < points; i++) {
      sizes.push(Math.random() * 1.5 + 0.5)
      shifts.push(
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2,
        (Math.random() * 0.9 + 0.1) * Math.PI,
        Math.random() * 0.9 + 0.1
      )
      const v = new THREE.Vector3()
        .randomDirection()
        .multiplyScalar(Math.random() * (radius.MAX - radius.MIN) + radius.MIN)
      positions.push(v)
    }

    const geo = new THREE.BufferGeometry().setFromPoints(positions)
    geo.setAttribute('sizes', new THREE.Float32BufferAttribute(sizes, 1))
    geo.setAttribute('shift', new THREE.Float32BufferAttribute(shifts, 4))

    const mat = new THREE.PointsMaterial({
      size: 0.15 * this.config.size,
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending
    })

    const c1 = new THREE.Color(this.config.color1)
    const c2 = new THREE.Color(this.config.color2)

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.time = this.uniforms.time
      shader.uniforms.particleSpeed = this.uniforms.particleSpeed
      shader.uniforms.color1 = { value: new THREE.Vector3(c1.r, c1.g, c1.b) }
      shader.uniforms.color2 = { value: new THREE.Vector3(c2.r, c2.g, c2.b) }
      shader.uniforms.isGradient = { value: this.config.isGradient }
      shader.uniforms.size = { value: 0.15 * this.config.size }

      shader.vertexShader = `
        uniform float time;
        uniform float particleSpeed;
        uniform float size;
        uniform vec3 color1;
        uniform vec3 color2;
        uniform bool isGradient;
        attribute float sizes;
        attribute vec4 shift;
        varying vec3 vColor;
        const float PI2 = 6.28318530718;
        void main() {
          vColor = isGradient ? mix(color1, color2, mod(shift.x + shift.y, 1.0)) : color1;
          vec3 pos = position;
          float t = time * particleSpeed;
          float moveT = mod(shift.x + shift.z * t, PI2);
          float moveS = mod(shift.y + shift.z * t, PI2);
          pos += vec3(cos(moveS)*sin(moveT), cos(moveT), sin(moveS)*sin(moveT)) * shift.w;
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * sizes * (300.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `
      shader.fragmentShader = `
        varying vec3 vColor;
        void main() {
          float d = length(gl_PointCoord.xy - 0.5);
          if (d > 0.5) discard;
          gl_FragColor = vec4(vColor, smoothstep(0.5, 0.1, d) * 0.8);
        }
      `
      this.uniforms = shader.uniforms
    }

    if (this.object) this.scene.remove(this.object)
    this.object = new THREE.Points(geo, mat)
    this.object.rotation.order = 'ZYX'
    this.object.rotation.z = 0.2
    this.scene.add(this.object)
  }

  updateConfig(cfg) {
    Object.assign(this.config, cfg)
    this._build()
  }

  animate() {
    if (!this.object) return
    const t = this.clock.getElapsedTime()
    if (this.uniforms.time) this.uniforms.time.value = t
    if (this.uniforms.particleSpeed) this.uniforms.particleSpeed.value = this.config.particleSpeed
    this.object.rotation.y = t * this.config.rotationSpeed
  }

  dispose() {
    if (this.object) {
      this.object.geometry.dispose()
      this.object.material.dispose()
      this.scene.remove(this.object)
    }
  }
}
