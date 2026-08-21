import * as THREE from 'three';

const PRESETS = {
  nocturne: {
    background: 0x070908,
    fog: 0x070908,
    primary: 0xd7e2d5,
    accent: 0x9effbf,
    secondary: 0x62786d,
    particle: 0xbaffcf,
    exposure: 0.86,
    density: 1,
    motion: 0.72,
    cameraZ: 10.8,
  },
  mineral: {
    background: 0x0d0d0c,
    fog: 0x0d0d0c,
    primary: 0xd8d0c4,
    accent: 0xf1b980,
    secondary: 0x73685e,
    particle: 0xf5d4ad,
    exposure: 0.95,
    density: 0.72,
    motion: 0.52,
    cameraZ: 11.6,
  },
  signal: {
    background: 0x050607,
    fog: 0x050607,
    primary: 0xd9e7ef,
    accent: 0x7dd8ff,
    secondary: 0x536a77,
    particle: 0x98e7ff,
    exposure: 0.92,
    density: 1.18,
    motion: 0.92,
    cameraZ: 10.2,
  },
};

function hash(n) {
  const x = Math.sin(n * 127.1) * 43758.5453123;
  return x - Math.floor(x);
}

function qualityProfile(mode, mobile) {
  if (mode === 'low') return { pixelRatio: 1, particles: 90, rings: 4, segments: 48 };
  if (mode === 'high') return { pixelRatio: 1.8, particles: 280, rings: 7, segments: 96 };
  return mobile
    ? { pixelRatio: 1.15, particles: 110, rings: 4, segments: 52 }
    : { pixelRatio: 1.6, particles: 220, rings: 6, segments: 80 };
}

export function createReactiveField({
  canvas,
  variant = 'nocturne',
  intensity = 0.7,
  interaction = 'proximity',
  quality = 'auto',
} = {}) {
  if (!canvas) throw new Error('createReactiveField requires a canvas');

  const mobile = matchMedia('(max-width: 760px)').matches;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const profile = qualityProfile(quality, mobile);
  const preset = PRESETS[variant] || PRESETS.nocturne;
  const clampedIntensity = THREE.MathUtils.clamp(intensity, 0, 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(preset.background);
  scene.fog = new THREE.FogExp2(preset.fog, mobile ? 0.055 : 0.042);

  const camera = new THREE.PerspectiveCamera(mobile ? 48 : 42, 1, 0.1, 80);
  camera.position.set(mobile ? 0.4 : 1.2, 0.25, preset.cameraZ + (mobile ? 1.8 : 0));
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !mobile,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = preset.exposure;
  renderer.setPixelRatio(Math.min(devicePixelRatio, profile.pixelRatio));

  const root = new THREE.Group();
  root.rotation.set(-0.18, 0.28, -0.08);
  scene.add(root);

  const hemi = new THREE.HemisphereLight(preset.primary, preset.background, 0.9);
  scene.add(hemi);

  const key = new THREE.PointLight(preset.accent, 5.5, 20, 2);
  key.position.set(4.8, 4.2, 5.5);
  scene.add(key);

  const fill = new THREE.PointLight(preset.secondary, 2.0, 18, 2);
  fill.position.set(-5, -2.2, 3.4);
  scene.add(fill);

  const rings = [];
  const ringMaterial = new THREE.MeshPhysicalMaterial({
    color: preset.primary,
    roughness: 0.32,
    metalness: 0.18,
    clearcoat: 0.5,
    clearcoatRoughness: 0.3,
  });

  for (let i = 0; i < profile.rings; i++) {
    const major = 1.65 + i * 0.34;
    const tube = 0.018 + i * 0.0035;
    const geo = new THREE.TorusGeometry(major, tube, 8, profile.segments);
    const material = ringMaterial.clone();
    material.color = new THREE.Color(i % 3 === 0 ? preset.accent : preset.primary);
    material.transparent = true;
    material.opacity = 0.35 + i * 0.055;
    const mesh = new THREE.Mesh(geo, material);
    mesh.rotation.set(
      Math.PI * (0.18 + hash(i + 1) * 0.55),
      Math.PI * hash(i + 5),
      Math.PI * hash(i + 9) * 0.45,
    );
    mesh.userData = {
      speed: (0.05 + hash(i + 20) * 0.08) * preset.motion,
      phase: hash(i + 40) * Math.PI * 2,
      baseScale: 0.9 + hash(i + 60) * 0.18,
    };
    mesh.scale.setScalar(mesh.userData.baseScale);
    root.add(mesh);
    rings.push(mesh);
  }

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(mobile ? 0.7 : 0.82, 3),
    new THREE.MeshPhysicalMaterial({
      color: preset.background,
      emissive: preset.accent,
      emissiveIntensity: 0.55 + clampedIntensity * 1.1,
      roughness: 0.2,
      metalness: 0.12,
      transmission: 0.12,
      clearcoat: 0.8,
      clearcoatRoughness: 0.18,
    }),
  );
  root.add(core);

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(mobile ? 1.1 : 1.28, 32, 24),
    new THREE.MeshBasicMaterial({
      color: preset.accent,
      transparent: true,
      opacity: 0.035 + clampedIntensity * 0.05,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  );
  root.add(halo);

  const count = Math.round(profile.particles * preset.density);
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const radius = 2.2 + hash(i * 1.3) * 5.8;
    const angle = hash(i * 2.1 + 7) * Math.PI * 2;
    const elevation = (hash(i * 3.7 + 13) - 0.5) * 4.8;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = elevation;
    positions[i * 3 + 2] = Math.sin(angle) * radius - 1.2;
    seeds[i] = hash(i * 5.1 + 17);
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

  const particleMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixel: { value: renderer.getPixelRatio() },
      uColor: { value: new THREE.Color(preset.particle) },
      uMotion: { value: reduceMotion ? 0 : preset.motion },
    },
    vertexShader: `
      attribute float aSeed;
      uniform float uTime;
      uniform float uPixel;
      uniform float uMotion;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        p.y += sin(uTime * (.08 + aSeed * .11) + aSeed * 18.) * .28 * uMotion;
        p.x += cos(uTime * (.05 + aSeed * .08) + aSeed * 27.) * .2 * uMotion;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (1.1 + aSeed * 2.4) * uPixel * (7.0 / max(1.0, -mv.z));
        vAlpha = .16 + aSeed * .5;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        vec2 q = gl_PointCoord - .5;
        float a = smoothstep(.5, .0, length(q)) * vAlpha;
        gl_FragColor = vec4(uColor, a);
      }
    `,
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  const targetPointer = new THREE.Vector2();
  const pointer = new THREE.Vector2();
  let running = false;
  let frame = 0;
  let last = performance.now();
  let elapsed = 0;

  function setPointer(clientX, clientY) {
    if (interaction === 'none') return;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / Math.max(1, rect.width);
    const y = (clientY - rect.top) / Math.max(1, rect.height);
    targetPointer.set(x * 2 - 1, -(y * 2 - 1));
  }

  function resize() {
    const width = Math.max(1, canvas.clientWidth || innerWidth);
    const height = Math.max(1, canvas.clientHeight || innerHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function draw(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    elapsed += dt;

    pointer.lerp(targetPointer, reduceMotion ? 0 : 0.045);

    if (!reduceMotion) {
      const reaction = interaction === 'proximity' ? clampedIntensity : 0;
      root.rotation.y += (0.28 + pointer.x * 0.12 * reaction - root.rotation.y) * 0.025;
      root.rotation.x += (-0.18 - pointer.y * 0.08 * reaction - root.rotation.x) * 0.025;
      root.position.x += (pointer.x * 0.25 * reaction - root.position.x) * 0.02;
      root.position.y += (pointer.y * 0.16 * reaction - root.position.y) * 0.02;

      rings.forEach((ring, i) => {
        const speed = ring.userData.speed;
        ring.rotation.z += speed * dt * (i % 2 ? 1 : -1);
        const pulse = 1 + Math.sin(elapsed * (0.22 + i * 0.025) + ring.userData.phase) * 0.025;
        ring.scale.setScalar(ring.userData.baseScale * pulse);
      });

      core.rotation.x += 0.045 * dt * preset.motion;
      core.rotation.y -= 0.07 * dt * preset.motion;
      particles.rotation.y += 0.012 * dt * preset.motion;
    }

    particleMat.uniforms.uTime.value = elapsed;
    renderer.render(scene, camera);
    frame = requestAnimationFrame(draw);
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    resize();
    frame = requestAnimationFrame(draw);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(frame);
  }

  function destroy() {
    stop();
    rings.forEach((ring) => {
      ring.geometry.dispose();
      ring.material.dispose();
    });
    core.geometry.dispose();
    core.material.dispose();
    halo.geometry.dispose();
    halo.material.dispose();
    particleGeo.dispose();
    particleMat.dispose();
    renderer.dispose();
  }

  resize();
  renderer.render(scene, camera);

  return { start, stop, resize, setPointer, destroy, variant };
}

export const reactiveFieldVariants = Object.freeze(Object.keys(PRESETS));
