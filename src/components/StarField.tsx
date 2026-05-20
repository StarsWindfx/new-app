import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function StarField() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(70, mount.clientWidth / mount.clientHeight, 0.1, 3000)
    camera.position.z = 1

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // ── STARS (shader-based round glowing points) ──────────────────────
    const starCount = 2200
    const starPos = new Float32Array(starCount * 3)
    const starColor = new Float32Array(starCount * 3)
    const starSeed = new Float32Array(starCount)
    const starSpeed = new Float32Array(starCount)

    for (let i = 0; i < starCount; i++) {
      starPos[i * 3]     = (Math.random() - 0.5) * 2400
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 2400
      starPos[i * 3 + 2] = -Math.random() * 2200 - 100

      const pick = Math.random()
      if (pick < 0.18) {
        // violet
        starColor[i * 3] = 0.72; starColor[i * 3 + 1] = 0.27; starColor[i * 3 + 2] = 0.87
      } else if (pick < 0.36) {
        // blue
        starColor[i * 3] = 0.23; starColor[i * 3 + 1] = 0.48; starColor[i * 3 + 2] = 0.72
      } else if (pick < 0.46) {
        // warm white
        starColor[i * 3] = 1.0; starColor[i * 3 + 1] = 0.96; starColor[i * 3 + 2] = 0.88
      } else {
        // cool white
        starColor[i * 3] = 0.88; starColor[i * 3 + 1] = 0.90; starColor[i * 3 + 2] = 1.0
      }

      starSeed[i]  = Math.random() * Math.PI * 2
      starSpeed[i] = 0.25 + Math.random() * 0.6
    }

    const starsGeo = new THREE.BufferGeometry()
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    starsGeo.setAttribute('color',    new THREE.BufferAttribute(starColor, 3))
    starsGeo.setAttribute('seed',     new THREE.BufferAttribute(starSeed, 1))

    const starsMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0.0 } },
      vertexShader: `
        attribute vec3 color;
        attribute float seed;
        varying vec3  vColor;
        varying float vSeed;
        varying float vDist;
        void main() {
          vColor = color;
          vSeed  = seed;
          vec4 mvp = modelViewMatrix * vec4(position, 1.0);
          vDist = max(-mvp.z, 1.0);
          gl_PointSize = clamp(2800.0 / vDist, 0.5, 6.0);
          gl_Position = projectionMatrix * mvp;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3  vColor;
        varying float vSeed;
        varying float vDist;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = dot(uv, uv);
          if (d > 0.25) discard;
          float core  = 1.0 - smoothstep(0.0, 0.08, d);
          float halo  = 1.0 - smoothstep(0.0, 0.25, d);
          float alpha = core * 0.95 + halo * 0.45;
          float twinkle = 0.75 + 0.25 * sin(uTime * 2.8 + vSeed * 6.28);
          gl_FragColor = vec4(vColor * (1.0 + core * 0.6), alpha * twinkle);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    })

    const stars = new THREE.Points(starsGeo, starsMat)
    scene.add(stars)

    // ── NEBULA (volumetric soft clouds) ────────────────────────────────
    const nebulaCenters = [
      { x: -350, y:  220, z:  -900, cr: 0.52, cg: 0.04, cb: 0.47, r: 280 },
      { x:  420, y: -160, z: -1400, cr: 0.14, cg: 0.32, cb: 0.49, r: 340 },
      { x:   60, y: -280, z:  -700, cr: 0.66, cg: 0.25, cb: 0.80, r: 220 },
      { x: -200, y:  -80, z: -1100, cr: 0.10, cg: 0.28, cb: 0.55, r: 260 },
    ]

    const nebulaCount = 1000
    const nebPos   = new Float32Array(nebulaCount * 3)
    const nebColor = new Float32Array(nebulaCount * 3)

    for (let i = 0; i < nebulaCount; i++) {
      const c = nebulaCenters[i % nebulaCenters.length]
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const rad   = c.r * Math.cbrt(Math.random())
      nebPos[i * 3]     = c.x + rad * Math.sin(phi) * Math.cos(theta)
      nebPos[i * 3 + 1] = c.y + rad * Math.sin(phi) * Math.sin(theta)
      nebPos[i * 3 + 2] = c.z + rad * Math.cos(phi)
      const intensity = 0.15 + Math.random() * 0.25
      nebColor[i * 3]     = c.cr * intensity
      nebColor[i * 3 + 1] = c.cg * intensity
      nebColor[i * 3 + 2] = c.cb * intensity
    }

    const nebGeo = new THREE.BufferGeometry()
    nebGeo.setAttribute('position', new THREE.BufferAttribute(nebPos, 3))
    nebGeo.setAttribute('color',    new THREE.BufferAttribute(nebColor, 3))

    const nebMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0.0 } },
      vertexShader: `
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvp = modelViewMatrix * vec4(position, 1.0);
          float dist = max(-mvp.z, 1.0);
          gl_PointSize = clamp(18000.0 / dist, 2.0, 60.0);
          gl_Position = projectionMatrix * mvp;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vColor;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = dot(uv, uv);
          if (d > 0.25) discard;
          float alpha = (1.0 - smoothstep(0.0, 0.25, d)) * 0.18;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    })

    const nebula = new THREE.Points(nebGeo, nebMat)
    scene.add(nebula)

    // ── SHOOTING STARS ─────────────────────────────────────────────────
    const shootMax = 4
    type Shoot = { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; maxLife: number }
    const shoots: Shoot[] = []
    let shootTimer = 0

    const shootGeo = new THREE.BufferGeometry()
    const shootPos = new Float32Array(shootMax * 6) // 2 points per trail
    const shootAlpha = new Float32Array(shootMax * 2)
    shootGeo.setAttribute('position', new THREE.BufferAttribute(shootPos, 3))

    // ── INPUT ──────────────────────────────────────────────────────────
    let mouseX = 0
    let mouseY = 0
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth  - 0.5) * 0.3
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.3
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true })

    // ── ANIMATION ─────────────────────────────────────────────────────
    let animId: number
    let lastTime = 0
    const targetFPS = 30
    const interval  = 1000 / targetFPS

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate)
      const delta = now - lastTime
      if (delta < interval) return
      lastTime = now - (delta % interval)

      const t = now * 0.001
      starsMat.uniforms.uTime.value = t
      nebMat.uniforms.uTime.value   = t

      // Warp stars forward
      const posArr = starsGeo.attributes.position.array as Float32Array
      for (let i = 0; i < starCount; i++) {
        posArr[i * 3 + 2] += starSpeed[i]
        if (posArr[i * 3 + 2] > 400) {
          posArr[i * 3]     = (Math.random() - 0.5) * 2400
          posArr[i * 3 + 1] = (Math.random() - 0.5) * 2400
          posArr[i * 3 + 2] = -2200
        }
      }
      starsGeo.attributes.position.needsUpdate = true

      // Nebula slow drift
      nebula.rotation.y += 0.00025
      nebula.rotation.x += 0.0001

      // Shooting stars
      shootTimer += delta
      if (shootTimer > 3500 + Math.random() * 4000) {
        shootTimer = 0
        if (shoots.length < shootMax) {
          const z = -800 - Math.random() * 800
          shoots.push({
            x: (Math.random() - 0.5) * 1200,
            y: 300 + Math.random() * 300,
            z,
            vx: (Math.random() - 0.2) * 12,
            vy: -5 - Math.random() * 8,
            vz: 0,
            life: 0,
            maxLife: 60 + Math.random() * 40,
          })
        }
      }
      for (let i = shoots.length - 1; i >= 0; i--) {
        const s = shoots[i]
        s.x += s.vx; s.y += s.vy; s.life++
        if (s.life >= s.maxLife) { shoots.splice(i, 1); continue }
      }

      // Smooth camera tilt
      camera.rotation.x += (mouseY - camera.rotation.x) * 0.018
      camera.rotation.y += (mouseX - camera.rotation.y) * 0.018

      renderer.render(scene, camera)
    }
    animId = requestAnimationFrame(animate)

    const onResize = () => {
      if (!mount) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize, { passive: true })

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      starsGeo.dispose(); starsMat.dispose()
      nebGeo.dispose();   nebMat.dispose()
      shootGeo.dispose()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className="absolute inset-0 w-full h-full" />
}
