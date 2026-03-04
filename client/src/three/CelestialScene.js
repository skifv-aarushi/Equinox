import * as THREE from 'three';

export default class CelestialScene {
  constructor(container) {
    this.container = container;
    this.width = container.clientWidth || window.innerWidth;
    this.height = container.clientHeight || window.innerHeight;
    this.mouse = { x: 0, y: 0 };
    this.scrollY = 0;
    this.frameId = null;

    // Store bound handlers so removeEventListener works correctly
    this._onResize = this.onResize.bind(this);
    this._onMouseMove = this.onMouseMove.bind(this);
    this._onScroll = this.onScroll.bind(this);

    this.init();
    this.createRevolvingStars();
    this.animate();

    window.addEventListener('resize', this._onResize);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('scroll', this._onScroll);
  }

  /* ─────────────────────── renderer / scene ─────────────────────── */
  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 1000);
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.container.appendChild(this.renderer.domElement);
  }

  /* ─────────────────────── glow sprite texture ───────────────────── */
  _makeGlowTexture(size = 128) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const half = size / 2;
    const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0.00, 'rgba(255,255,255,1.0)');
    grad.addColorStop(0.08, 'rgba(255,255,255,0.97)');
    grad.addColorStop(0.22, 'rgba(190,220,255,0.65)');
    grad.addColorStop(0.50, 'rgba(120,170,255,0.18)');
    grad.addColorStop(1.00, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }

  /* ─────────────────────── main build ───────────────────────────── */
  createRevolvingStars() {
    this.starGroups = [];

    const accentColors = [
      new THREE.Color(0x1B2735), // deep midnight blue
      new THREE.Color(0x090A0F), // void black
      new THREE.Color(0x2E3192), // cosmic indigo
      new THREE.Color(0x736EFE), // soft violet ray
      new THREE.Color(0x5EEAD4), // starlight teal
      new THREE.Color(0xBAE6FD), // icy stellar blue
      new THREE.Color(0xFDE68A), // distant star gold
      new THREE.Color(0xE879F9), // nebula magenta
    ];

    const glowTex = this._makeGlowTexture(128);

    const TIERS = [
      { rMin: 0.12, rMax: 0.75,  speed: 0.0075, count: 5   },
      { rMin: 0.40, rMax: 1.60,  speed: 0.0052, count: 10  },
      { rMin: 0.90, rMax: 2.90,  speed: 0.0035, count: 45  },
      { rMin: 1.80, rMax: 4.30,  speed: 0.0022, count: 160 },
      { rMin: 3.00, rMax: 6.00,  speed: 0.0012, count: 200 },
      { rMin: 4.50, rMax: 8.00,  speed: 0.0005, count: 310 },
      { rMin: 6.50, rMax: 10.50, speed: 0.0008, count: 300 },
      { rMin: 9.00, rMax: 14.00, speed: 0.0003, count: 200 },
    ];

    const TRAIL_PTS = 12;

    const sharedLineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const sharedDotMat = new THREE.PointsMaterial({
      map: glowTex,
      color: new THREE.Color(0xBBCCFF),
      size: 0.30,
      transparent: true,
      opacity: 0.70,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      alphaTest: 0.003,
      vertexColors: true,
    });

    TIERS.forEach(({ rMin, rMax, speed, count }) => {
      const group = new THREE.Group();

      const allLinePositions = [];
      const allLineColors    = [];
      const allDotPositions  = [];
      const allDotColors     = [];

      for (let i = 0; i < count; i++) {
        const angle   = Math.random() * Math.PI * 2;
        const radius  = rMin + Math.sqrt(Math.random()) * (rMax - rMin);
        const z       = (Math.random() - 0.5) * 1.0;
        const arcSpan = 0.16 + Math.random() * 0.32 + radius * 0.018;

        const isColored = Math.random() < 0.10;
        let color;
        if (isColored) {
          color = accentColors[Math.floor(Math.random() * accentColors.length)].clone();
        } else {
          const b = 0.72 + Math.random() * 0.28;
          color = new THREE.Color(b * 0.83, b * 0.91, 1.0);
        }

        const opacity = isColored
          ? 0.60 + Math.random() * 0.40
          : 0.28 + Math.random() * 0.58;

        for (let s = 0; s < TRAIL_PTS - 1; s++) {
          const t0 = s / (TRAIL_PTS - 1);
          const t1 = (s + 1) / (TRAIL_PTS - 1);
          const a0 = angle + arcSpan * (1 - t0);
          const a1 = angle + arcSpan * (1 - t1);

          allLinePositions.push(
            Math.cos(a0) * radius, Math.sin(a0) * radius, z,
            Math.cos(a1) * radius, Math.sin(a1) * radius, z,
          );
          const fade0 = t0 * t0 * opacity;
          const fade1 = t1 * t1 * opacity;
          allLineColors.push(
            color.r * fade0, color.g * fade0, color.b * fade0,
            color.r * fade1, color.g * fade1, color.b * fade1,
          );
        }

        const hx = Math.cos(angle) * radius;
        const hy = Math.sin(angle) * radius;
        allDotPositions.push(hx, hy, z + 0.01);
        allDotColors.push(color.r * opacity, color.g * opacity, color.b * opacity);
      }

      const lineGeom = new THREE.BufferGeometry();
      lineGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(allLinePositions), 3));
      lineGeom.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(allLineColors),    3));
      group.add(new THREE.LineSegments(lineGeom, sharedLineMat));

      const dotGeom = new THREE.BufferGeometry();
      dotGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(allDotPositions), 3));
      dotGeom.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(allDotColors),    3));
      group.add(new THREE.Points(dotGeom, sharedDotMat));

      group.userData.speed = speed;
      this.starGroups.push(group);
      this.scene.add(group);
    });

    this._addPoleGlow(glowTex);
  }

  _addPoleGlow(glowTex) {
    const pt = (x, y, z) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([x, y, z]), 3));
      return g;
    };

    // Wide soft halo
    this.scene.add(new THREE.Points(pt(0, 0, 0.2), new THREE.PointsMaterial({
      map: glowTex, color: new THREE.Color(0x6699FF),
      size: 2.8, transparent: true, opacity: 0.28,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
    })));

    // Mid glow
    this.scene.add(new THREE.Points(pt(0, 0, 0.3), new THREE.PointsMaterial({
      map: glowTex, color: new THREE.Color(0xAADDFF),
      size: 0.90, transparent: true, opacity: 0.75,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
    })));

    // Bright core
    this.scene.add(new THREE.Points(pt(0, 0, 0.4), new THREE.PointsMaterial({
      map: glowTex, color: new THREE.Color(0xEEF5FF),
      size: 0.32, transparent: true, opacity: 1.0,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
    })));
  }

  onResize() {
    this.width  = this.container.clientWidth;
    this.height = this.container.clientHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  onMouseMove(e) {
    this.mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  onScroll() { this.scrollY = window.scrollY; }

  animate() {
    this.frameId = requestAnimationFrame(this.animate.bind(this));

    this.starGroups.forEach((group) => {
      group.rotation.z -= group.userData.speed;
      group.rotation.x  = this.mouse.y * 0.025;
      group.rotation.y  = this.mouse.x * 0.025;
    });

    this.renderer.render(this.scene, this.camera);
  }

  /* ─────────────────────── cleanup ──────────────────────────────── */
  dispose() {
    if (this.frameId) cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize',    this._onResize);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('scroll',    this._onScroll);

    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (obj.material.map) obj.material.map.dispose();
        obj.material.dispose();
      }
    });
    this.renderer.dispose();
    if (this.renderer.domElement && this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
