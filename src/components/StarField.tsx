import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function StarField() {
  const mountRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const observer = new IntersectionObserver(
      ([entry]) => { visibleRef.current = entry.isIntersecting; },
      { threshold: 0 }
    );
    observer.observe(mount);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 2000);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    mount.appendChild(renderer.domElement);

    const starCount = 1200;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const speeds = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 2] = -Math.random() * 1800 - 50;

      const r = Math.random();
      if (r < 0.25) {
        colors[i * 3] = 0.54; colors[i * 3 + 1] = 0.04; colors[i * 3 + 2] = 0.6;
      } else if (r < 0.5) {
        colors[i * 3] = 0.15; colors[i * 3 + 1] = 0.33; colors[i * 3 + 2] = 0.49;
      } else {
        colors[i * 3] = 0.85; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 1.0;
      }
      speeds[i] = 0.15 + Math.random() * 0.35;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    const stars = new THREE.Points(geometry, material);
    scene.add(stars);

    let mouseX = 0, mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.25;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.25;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    let animId: number;
    let lastTime = 0;
    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;

    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);

      if (!visibleRef.current) return;

      const delta = time - lastTime;
      if (delta < frameInterval) return;
      lastTime = time - (delta % frameInterval);

      const posArr = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < starCount; i++) {
        posArr[i * 3 + 2] += speeds[i];
        if (posArr[i * 3 + 2] > 200) posArr[i * 3 + 2] = -1800;
      }
      geometry.attributes.position.needsUpdate = true;

      camera.rotation.x += (mouseY - camera.rotation.x) * 0.015;
      camera.rotation.y += (mouseX - camera.rotation.y) * 0.015;

      renderer.render(scene, camera);
    };
    animId = requestAnimationFrame(animate);

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full" />;
}
