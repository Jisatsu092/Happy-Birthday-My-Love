import { useEffect, useRef } from 'react'

const NUM_GROUPS = 15
const GROUP_INTERVAL = 200

class Meteor {
  constructor(groupIndex, groupDelay) {
    this.groupIndex = groupIndex
    this.groupDelay = groupDelay
    this.individualDelay = Math.random() * 8000
    this.lastStart = Date.now()
    this.active = false

    const screenWidth = window.innerWidth
    const regionWidth = screenWidth / NUM_GROUPS
    const regionStart = this.groupIndex * regionWidth
    this.x = regionStart + Math.random() * regionWidth
    this.y = -50
    this.length = Math.random() * 80 + 60
    this.speed = 4
    const isMobile = window.innerWidth < 768
    this.angle = isMobile
      ? Math.PI / 18 + (Math.random() - 0.5) * 0.1
      : Math.PI / 12 + (Math.random() - 0.5) * 0.2
    this.opacity = 0.1
    this.particles = []
    this.color1 = '#ffffff'
    this.color2 = '#a78bfa'
  }

  update() {
    if (!this.active) {
      if (Date.now() - this.lastStart > this.groupDelay + this.individualDelay) {
        this.active = true
      } else return
    }
    this.x += Math.cos(this.angle) * this.speed
    this.y += Math.sin(this.angle) * this.speed
    this.opacity -= 0.002
    this.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.opacity -= 0.02
    })
    this.particles = this.particles.filter(p => p.opacity > 0)
    if (Math.random() < 0.7) {
      this.particles.push({
        x: this.x, y: this.y,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() + 0.5) * 1.5,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.5,
      })
    }
    if (this.y > window.innerHeight || this.opacity <= 0) {
      this.lastStart = Date.now()
      this.active = false
      this.reset()
    }
  }

  reset() {
    const screenWidth = window.innerWidth
    const regionWidth = screenWidth / NUM_GROUPS
    const regionStart = this.groupIndex * regionWidth
    this.x = regionStart + Math.random() * regionWidth
    this.y = -50
    this.length = Math.random() * 80 + 60
    this.opacity = 1
    this.particles = []
    const isMobile = window.innerWidth < 768
    this.angle = isMobile
      ? Math.PI / 18 + (Math.random() - 0.5) * 0.1
      : Math.PI / 12 + (Math.random() - 0.5) * 0.2
    this.lastStart = Date.now()
    this.active = false
  }

  hexToRgba(hex, alpha) {
    let c = hex.replace('#', '')
    if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2]
    const num = parseInt(c, 16)
    return `rgba(${(num>>16)&255},${(num>>8)&255},${num&255},${alpha})`
  }

  draw(ctx) {
    ctx.save()
    const tailX = this.x - Math.cos(this.angle) * this.length
    const tailY = this.y - Math.sin(this.angle) * this.length
    const grad = ctx.createLinearGradient(this.x, this.y, tailX, tailY)
    grad.addColorStop(0, this.hexToRgba(this.color1, this.opacity))
    grad.addColorStop(1, this.hexToRgba(this.color2, 0))
    ctx.strokeStyle = grad
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(this.x, this.y)
    ctx.lineTo(tailX, tailY)
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(this.x, this.y, 5, 0, Math.PI * 2)
    const headGrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 8)
    headGrad.addColorStop(0, this.hexToRgba(this.color1, 1))
    headGrad.addColorStop(1, this.hexToRgba(this.color2, 0))
    ctx.fillStyle = headGrad
    ctx.fill()

    this.particles.forEach(p => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = this.hexToRgba(this.color1, p.opacity)
      ctx.fill()
    })
    ctx.restore()
  }
}

export default function MeteorCanvas({ active = true }) {
  const canvasRef = useRef(null)
  const meteorsRef = useRef([])
  const rafRef = useRef(null)
  const activeRef = useRef(active)

  useEffect(() => { activeRef.current = active }, [active])

  useEffect(() => {
    // Build meteors
    const groupDelays = Array.from({ length: NUM_GROUPS }, (_, g) => g * GROUP_INTERVAL)
    const all = []
    for (let i = 0; i < 200; i++) {
      const g = i % NUM_GROUPS
      all.push(new Meteor(g, groupDelays[g]))
    }
    meteorsRef.current = all

    const canvas = canvasRef.current

    const draw = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      const ctx = canvas.getContext('2d')

      if (activeRef.current) {
        ctx.fillStyle = 'rgba(0,0,0,0)'
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        meteorsRef.current.forEach(m => { m.update(); m.draw(ctx) })
      }
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)

    const onResize = () => {
      meteorsRef.current.forEach(m => m.reset())
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 5,
      }}
    />
  )
}
