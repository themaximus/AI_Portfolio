import * as THREE from 'three';
import { AsciiEffect } from 'three/addons/effects/AsciiEffect.js';

export function init3DScene() {
  // ─── Scene & Camera ───────────────────────────────────────────────────────
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    2000
  );
  camera.position.set(0, 100, 600);

  // ─── Renderer (hidden — AsciiEffect wraps it) ─────────────────────────────
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Don't append renderer.domElement — AsciiEffect owns the visual output

  // ─── Lights ───────────────────────────────────────────────────────────────
  const light1 = new THREE.PointLight(0xffffff, 5, 2000);
  light1.position.set(600, 600, 600);
  scene.add(light1);

  const light2 = new THREE.PointLight(0xffffff, 2, 2000);
  light2.position.set(-600, -400, -300);
  scene.add(light2);

  const ambLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambLight);

  // ─── 3D Geometry: Cyber Mountain Landscape ───────────────────────────────
  const geometry = new THREE.PlaneGeometry(1300, 1300, 48, 48);
  
  // Set initial mountain displacement
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = Math.sin(x * 0.012) * Math.cos(y * 0.012) * 80 +
              Math.sin(x * 0.005) * 50;
    pos.setZ(i, z);
  }
  geometry.computeVertexNormals();

  const material = new THREE.MeshPhongMaterial({ flatShading: true });
  const landscape = new THREE.Mesh(geometry, material);
  landscape.rotation.x = -Math.PI / 2.2; // Tilt for retro wireframe valley perspective
  scene.add(landscape);
 
  // ─── AsciiEffect ──────────────────────────────────────────────────────────
  // characters from light → dark (invert: true reverses this for shading)
  const effect = new AsciiEffect(renderer, ' .,:;i1tfLCG08@#', { invert: true });
  effect.setSize(window.innerWidth, window.innerHeight);
 
  // Style the domElement directly — this is the real visual output
  const el = effect.domElement;
  el.classList.add('ascii-3d-scene');
  el.style.position   = 'fixed';
  el.style.top        = '0';
  el.style.left       = '0';
  el.style.width      = '100vw';
  el.style.height     = '100vh';
  el.style.zIndex     = '0';
  el.style.pointerEvents = 'none';
  el.style.overflow   = 'hidden';
  // ─── Shimmering + transparent background ──────────────────────────────────
  el.style.backgroundColor  = 'transparent';
  el.style.opacity          = '0.38';
  el.style.fontFamily       = '"Fira Code", "Courier New", monospace';
  el.style.fontSize         = '9px';
  el.style.lineHeight       = '9px';
  
  document.body.appendChild(el);
  
  // Force any inner pre/div to inherit transparent bg
  // AsciiEffect renders into a <pre> tag — override its style
  const forceClear = () => {
    const inner = el.querySelector('pre') || el.querySelector('div');
    if (inner) {
      inner.style.backgroundColor = 'transparent';
      inner.style.margin = '0';
      inner.style.padding = '0';
    }
  };
  // Run once after first render frame
  setTimeout(forceClear, 100);
 
  // ─── Mouse Parallax ───────────────────────────────────────────────────────
  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;
 
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 500;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 300;
  });
 
  // ─── Resize ───────────────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    effect.setSize(window.innerWidth, window.innerHeight);
  });
 
  // ─── Animation Loop ───────────────────────────────────────────────────────
  const t0 = performance.now();
 
  function animate() {
    requestAnimationFrame(animate);
 
    const t = (performance.now() - t0) * 0.001;
 
    // Hypnotic landscape rotation & endless flowing mountain waves
    landscape.rotation.z = t * 0.04;
 
    const posAttribute = geometry.attributes.position;
    for (let i = 0; i < posAttribute.count; i++) {
      const x = posAttribute.getX(i);
      const y = posAttribute.getY(i);
      // Displace vertices dynamically over time (t)
      const z = Math.sin(x * 0.012 + t * 0.6) * Math.cos(y * 0.012 + t * 0.4) * 90 +
                Math.sin(x * 0.005 - t * 0.15) * 60;
      posAttribute.setZ(i, z);
    }
    posAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
 
    // Smooth camera drift following mouse
    targetX += (mouseX - targetX) * 0.05;
    targetY += (mouseY - targetY) * 0.05;
    camera.position.x = targetX;
    camera.position.y = 120 - targetY;
    camera.lookAt(scene.position);
 
    effect.render(scene, camera);
  }
 
  animate();
}
