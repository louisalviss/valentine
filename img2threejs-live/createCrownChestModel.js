export function createCrownChestModel(THREE, RoundedBoxGeometry, options = {}) {
  const {
    woodColor = 0x7a4a27,
    metalColor = 0xe0b24b,
    jewelColor = 0x3ce6ff,
    lidOpen = 0.18,
  } = options;

  const root = new THREE.Group();
  root.name = 'CrownChest';
  root.position.y = 0.05;

  const wood = new THREE.MeshPhysicalMaterial({
    color: woodColor,
    roughness: 0.72,
    metalness: 0.03,
    clearcoat: 0.08,
  });
  const woodDark = new THREE.MeshPhysicalMaterial({
    color: 0x5c341b,
    roughness: 0.78,
    metalness: 0.02,
  });
  const gold = new THREE.MeshPhysicalMaterial({
    color: metalColor,
    roughness: 0.28,
    metalness: 0.95,
    clearcoat: 0.7,
    clearcoatRoughness: 0.18,
  });
  const goldDim = new THREE.MeshPhysicalMaterial({
    color: 0xb6882a,
    roughness: 0.34,
    metalness: 0.92,
  });
  const jewel = new THREE.MeshPhysicalMaterial({
    color: jewelColor,
    emissive: 0x0b6d86,
    emissiveIntensity: 1.1,
    roughness: 0.08,
    metalness: 0.0,
    transmission: 0.32,
    thickness: 0.55,
    clearcoat: 1,
  });
  const inner = new THREE.MeshStandardMaterial({
    color: 0x3f1b0f,
    roughness: 0.92,
    metalness: 0.0,
  });

  function setShadow(mesh) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  const body = setShadow(new THREE.Mesh(new RoundedBoxGeometry(3.0, 1.75, 2.1, 6, 0.12), wood));
  body.position.set(0, 0.1, 0);
  root.add(body);

  const cavity = setShadow(new THREE.Mesh(new RoundedBoxGeometry(2.48, 1.15, 1.62, 4, 0.06), inner));
  cavity.position.set(0, 0.43, 0);
  root.add(cavity);

  [0.78, 0.18, -0.42].forEach((y) => {
    const strip = setShadow(new THREE.Mesh(new THREE.BoxGeometry(3.08, 0.12, 0.16), gold));
    strip.position.set(0, y, 1.04);
    root.add(strip);
    const stripBack = strip.clone();
    stripBack.position.z = -1.04;
    root.add(stripBack);
  });

  [-1.08, 0, 1.08].forEach((x) => {
    const band = setShadow(new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.95, 2.18), goldDim));
    band.position.set(x, 0.08, 0);
    root.add(band);
  });

  [-1.08, 1.08].forEach((x) => {
    [-0.74, 0.74].forEach((z) => {
      const foot = setShadow(new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.28, 0.34, 4, 0.05), goldDim));
      foot.position.set(x, -0.92, z);
      root.add(foot);
    });
  });

  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0.85, -0.86);
  root.add(lidPivot);

  const lidGroup = new THREE.Group();
  lidGroup.position.z = 0.16;
  lidPivot.add(lidGroup);

  const lidBottom = setShadow(new THREE.Mesh(new RoundedBoxGeometry(2.92, 0.2, 1.88, 4, 0.05), woodDark));
  lidBottom.position.set(0, 0.08, 0.77);
  lidGroup.add(lidBottom);

  const lidArch = setShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 2.92, 40, 1, false, 0, Math.PI), wood));
  lidArch.rotation.z = Math.PI / 2;
  lidArch.rotation.y = Math.PI / 2;
  lidArch.position.set(0, 0.22, 0.77);
  lidGroup.add(lidArch);

  const lidFrontCap = setShadow(new THREE.Mesh(new THREE.CircleGeometry(0.95, 32, 0, Math.PI), wood));
  lidFrontCap.rotation.y = Math.PI / 2;
  lidFrontCap.position.set(1.46, 0.22, 0.77);
  lidGroup.add(lidFrontCap);
  const lidBackCap = lidFrontCap.clone();
  lidBackCap.rotation.y = -Math.PI / 2;
  lidBackCap.position.x = -1.46;
  lidGroup.add(lidBackCap);

  [-1.1, 0, 1.1].forEach((x) => {
    const rib = setShadow(new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.07, 10, 32, Math.PI), gold));
    rib.rotation.y = Math.PI / 2;
    rib.position.set(x, 0.22, 0.77);
    lidGroup.add(rib);
  });

  const topBand = setShadow(new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.11, 0.14), gold));
  topBand.position.set(0, 1.11, 0.77);
  lidGroup.add(topBand);

  const lockPlate = setShadow(new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.86, 0.16, 4, 0.04), gold));
  lockPlate.position.set(0, 0.15, 1.13);
  root.add(lockPlate);

  const latch = setShadow(new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.42, 0.16, 4, 0.04), goldDim));
  latch.position.set(0, 0.82, 1.11);
  lidGroup.add(latch);

  const jewelMesh = setShadow(new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), jewel));
  jewelMesh.position.set(0, 0.16, 1.23);
  root.add(jewelMesh);

  const crown = new THREE.Group();
  crown.position.set(0, 1.42, 0.15);
  lidGroup.add(crown);

  const crownBase = setShadow(new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.22, 0.58, 4, 0.06), gold));
  crown.add(crownBase);

  [-0.45, 0, 0.45].forEach((x, i) => {
    const spike = setShadow(new THREE.Mesh(new THREE.ConeGeometry(i === 1 ? 0.16 : 0.13, i === 1 ? 0.42 : 0.34, 6), gold));
    spike.position.set(x, 0.28 + (i === 1 ? 0.04 : 0), 0);
    crown.add(spike);

    const jewelTip = setShadow(new THREE.Mesh(new THREE.OctahedronGeometry(i === 1 ? 0.07 : 0.055), jewel));
    jewelTip.position.set(x, 0.52 + (i === 1 ? 0.06 : 0), 0);
    crown.add(jewelTip);
  });

  [-1.62, 1.62].forEach((x) => {
    const hinge = setShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 16), goldDim));
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(x, 0.12, 0);
    root.add(hinge);

    const ring = setShadow(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.045, 8, 22), gold));
    ring.rotation.y = Math.PI / 2;
    ring.position.set(x + (x < 0 ? -0.06 : 0.06), -0.08, 0);
    root.add(ring);
  });

  [-0.55, 0.55].forEach((x) => {
    const trim = setShadow(new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), gold));
    trim.position.set(x, 0.18, 1.08);
    root.add(trim);
  });
  const faceTrim = setShadow(new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.11, 0.12), gold));
  faceTrim.position.set(0, -0.22, 1.08);
  root.add(faceTrim);

  let lidAmount = lidOpen;
  function applyLid(amount) {
    lidAmount = Math.max(0, Math.min(1, amount));
    lidPivot.rotation.x = -lidAmount * 1.12;
  }
  applyLid(lidAmount);

  root.userData.setLidOpen = applyLid;
  root.userData.getLidOpen = () => lidAmount;
  root.userData.animate = (dt, elapsed = 0) => {
    crown.rotation.y += dt * 0.55;
    jewelMesh.rotation.y += dt * 1.8;
    const pulse = 0.85 + Math.sin(elapsed * 3.2) * 0.22;
    jewel.emissiveIntensity = pulse;
    root.position.y = 0.05 + Math.sin(elapsed * 1.4) * 0.035;
  };

  return root;
}
