import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function FloatOrb() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const w = mount.clientWidth
    const h = mount.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100)
    camera.position.z = 4.5

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const group = new THREE.Group()
    scene.add(group)

    // Icosahedron cage
    const icoGeo = new THREE.IcosahedronGeometry(1, 1)
    const edgesGeo = new THREE.EdgesGeometry(icoGeo)

    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x690B78,
      transparent: true,
      opacity: 0.55,
    })
    const wireframe = new THREE.LineSegments(edgesGeo, edgeMat)
    group.add(wireframe)

    // Outer icosahedron
    const outerIcoGeo = new THREE.IcosahedronGeometry(1.35, 1)
    const outerEdgesGeo = new THREE.EdgesGeometry(outerIcoGeo)
    const outerEdgeMat = new THREE.LineBasicMaterial({
      color: 0x26547C,
      transparent: true,
      opacity: 0.22,
    })
    const outerWire = new THREE.LineSegments(outerEdgesGeo, outerEdgeMat)
    group.add(outerWire)

    // Vertex points
    const dotsMat = new THREE.PointsMaterial({
      color: 0xC46FD4,
      size: 0.055,
      transparent: true,
      opacity: 0.95,
      sizeAttenuation: true,
    })
    const dots = new THREE.Points(icoGeo, dotsMat)
    group.add(dots)

    // Outer vertex points (blue)
    const outerDotsMat = new THREE.PointsMaterial({
      color: 0x3A7AB5,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    })
    const outerDots = new THREE.Points(outerIcoGeo, outerDotsMat)
    group.add(outerDots)

    // Inner glow core
    const coreGeo = new THREE.SphereGeometry(0.42, 32, 32)
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x690B78,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
    })
    const core = new THREE.Mesh(coreGeo, coreMat)
    group.add(core)

    // Halo
    const haloGeo = new THREE.SphereGeometry(1.6, 16, 16)
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x690B78,
      transparent: true,
      opacity: 0.025,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    })
    const halo = new THREE.Mesh(haloGeo, haloMat)
    group.add(halo)

    // Particle ring
    const ringCount = 120
    const ringPos = new Float32Array(ringCount * 3)
    for (let i = 0; i < ringCount; i++) {
      const angle = (i / ringCount) * Math.PI * 2
      const r = 1.7 + (Math.random() - 0.5) * 0.3
      ringPos[i * 3] = Math.cos(angle) * r
      ringPos[i * 3 + 1] = (Math.random() - 0.5) * 0.3
      ringPos[i * 3 + 2] = Math.sin(angle) * r
    }
    const ringGeo = new THREE.BufferGeometry()
    ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3))
    const ringMat = new THREE.PointsMaterial({
      color: 0x8B1EA0,
      size: 0.03,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    })
    const ring = new THREE.Points(ringGeo, ringMat)
    group.add(ring)

    let targetRotX = 0
    let targetRotY = 0

    const onMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect()
      if (!rect.width) return
      targetRotX = -((e.clientY - rect.top) / rect.height - 0.5) * 0.8
      targetRotY = ((e.clientX - rect.left) / rect.width - 0.5) * 0.8
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true })

    let animId: number
    let t = 0

    const animate = () => {
      animId = requestAnimationFrame(animate)
      t += 0.012

      const breathe = 1 + 0.035 * Math.sin(t * 1.8)
      wireframe.scale.setScalar(breathe)
      dots.scale.setScalar(breathe)
      core.scale.setScalar(1 + 0.06 * Math.sin(t * 1.8))

      const outerBreathe = 1 + 0.025 * Math.sin(t * 1.4 + 1)
      outerWire.scale.setScalar(outerBreathe)
      outerDots.scale.setScalar(outerBreathe)

      group.rotation.y += 0.0045
      group.rotation.x += 0.0018
      ring.rotation.y -= 0.006

      group.rotation.x += (targetRotX - group.rotation.x) * 0.04
      group.rotation.y += (targetRotY - group.rotation.y) * 0.04

      coreMat.opacity = 0.06 + 0.04 * Math.sin(t * 1.8)
      haloMat.opacity = 0.02 + 0.015 * Math.sin(t * 1.4)
      edgeMat.opacity = 0.4 + 0.15 * Math.sin(t * 0.9)
      dotsMat.opacity = 0.8 + 0.2 * Math.sin(t * 2.2)

      renderer.render(scene, camera)
    }
    animId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMouseMove)
      ;[icoGeo, edgesGeo, outerIcoGeo, outerEdgesGeo, coreGeo, haloGeo, ringGeo].forEach(g => g.dispose())
      ;[edgeMat, outerEdgeMat, dotsMat, outerDotsMat, coreMat, haloMat, ringMat].forEach(m => m.dispose())
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
}
