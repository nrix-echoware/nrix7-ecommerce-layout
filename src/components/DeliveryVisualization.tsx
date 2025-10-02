import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

const DeliveryVisualization = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    sceneRef.current = scene;

    // Root group for responsive scaling
    const graphGroup = new THREE.Group();
    scene.add(graphGroup);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(-4, 8.5, 18);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.65);
    dirLight.position.set(6, 12, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Helper: pill label with border and shadow (floating above node)
    const makeLabel = (
      text: string,
      options?: { fontSize?: number; bg?: string; fg?: string; padX?: number; padY?: number; border?: string }
    ) => {
      const size = 1024;
      const fontSize = options?.fontSize ?? 56;
      const bg = options?.bg ?? '#111111';
      const fg = options?.fg ?? '#ffffff';
      const border = options?.border ?? '#e5e5e5';

      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, size, size);

      const pillW = size * 0.72;
      const pillH = size * 0.22;
      const x = (size - pillW) / 2;
      const y = (size - pillH) / 2;
      const r = pillH / 2;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.beginPath();
      ctx.moveTo(x + r, y + pillH + 8);
      ctx.arcTo(x + pillW, y + pillH + 8, x + pillW, y + r + 8, r);
      ctx.arcTo(x + pillW, y + 8, x + r, y + 8, r);
      ctx.arcTo(x, y + 8, x, y + r + 8, r);
      ctx.arcTo(x, y + pillH + 8, x + r, y + pillH + 8, r);
      ctx.closePath();
      ctx.fill();

      // Border
      ctx.fillStyle = border;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + pillW, y, x + pillW, y + r, r);
      ctx.arcTo(x + pillW, y + pillH, x + r, y + pillH, r);
      ctx.arcTo(x, y + pillH, x, y + r, r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
      ctx.fill();

      // Fill
      ctx.fillStyle = bg;
      const inset = 6;
      ctx.beginPath();
      ctx.moveTo(x + r + inset, y + inset);
      ctx.arcTo(x + pillW - inset, y + inset, x + pillW - inset, y + r, r - inset);
      ctx.arcTo(x + pillW - inset, y + pillH - inset, x + r + inset, y + pillH - inset, r - inset);
      ctx.arcTo(x + inset, y + pillH - inset, x + inset, y + r, r - inset);
      ctx.arcTo(x + inset, y + inset, x + r + inset, y + inset, r - inset);
      ctx.closePath();
      ctx.fill();

      // Text
      ctx.fillStyle = fg;
      ctx.font = `700 ${fontSize}px Inter, Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, size / 2, size / 2);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(7.2, 2.2, 1);
      sprite.center.set(0.5, 0.5);

      // Float animation
      const floatOffset = Math.random() * Math.PI * 2;
      gsap.to(sprite.position, {
        y: "+=0.15",
        duration: 1.8 + Math.random() * 0.6,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: floatOffset,
      });

      return sprite;
    };

    const makeCheck = () => {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(size/2, size/2, size*0.35, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 40;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(size*0.38, size*0.52);
      ctx.lineTo(size*0.48, size*0.62);
      ctx.lineTo(size*0.66, size*0.42);
      ctx.stroke();
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0, depthTest: false });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(1.3, 1.3, 1.3);
      sprite.position.set(1.1, 1.5, 0);
      return sprite;
    };

    const makePulseRing = () => {
      const ringGeo = new THREE.RingGeometry(1.2, 1.5, 64);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      return ring;
    };

    const makeNode = (label: string, color: number) => {
      const group = new THREE.Group();
      const geo = new THREE.SphereGeometry(0.9, 32, 32);
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.2, emissive: 0x000000 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      const lbl = makeLabel(label, { fontSize: 50 });
      lbl.position.set(0, 2.4, 0); // raise above node
      lbl.visible = false; // hide label per request
      const check = makeCheck();
      const ring = makePulseRing();
      group.add(mesh, lbl, check, ring);
      return { group, mesh, check, ring, label: lbl };
    };

    const makeCurve = (from: THREE.Vector3, to: THREE.Vector3, midOffset: THREE.Vector3) => {
      const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5).add(midOffset);
      const curve = new THREE.CatmullRomCurve3([from.clone(), mid, to.clone()], false, 'catmullrom', 0.2);
      return curve;
    };

    const makeTube = (curve: THREE.Curve<THREE.Vector3>, color = 0x111111) => {
      const tubularSegments = 96;
      const radius = 0.18;
      const radialSegments = 10;
      const closed = false;
      const geom = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, closed);
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05 });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.receiveShadow = true;
      return mesh;
    };

    // Graph nodes positions (x,z plane)
    const nodes = [
      { label: 'Order Placed', pos: new THREE.Vector3(-12, 0, 0), color: 0x111111 },
      { label: 'Seller Packs', pos: new THREE.Vector3(-6, 0, 0), color: 0x111111 },
      { label: 'Delivery Agent', pos: new THREE.Vector3(0, 0, 0), color: 0x111111 },
      { label: 'Transport', pos: new THREE.Vector3(6, 0, 0), color: 0x111111 },
      { label: 'Delivered & Paid', pos: new THREE.Vector3(12, 0, 0), color: 0x111111 },
    ];

    // Create nodes into graphGroup
    const nodeObjects: { group: THREE.Group; mesh: THREE.Mesh; check: THREE.Sprite; ring: THREE.Mesh; pos: THREE.Vector3; label: THREE.Sprite }[] = [];
    nodes.forEach((n) => {
      const { group, mesh, check, ring, label } = makeNode(n.label, n.color);
      group.position.copy(n.pos);
      graphGroup.add(group);
      nodeObjects.push({ group, mesh, check, ring, pos: n.pos.clone(), label });
    });

    // Curved segments
    const segments: { curve: THREE.Curve<THREE.Vector3>; fromIndex: number; toIndex: number }[] = [];
    const segDefs = [
      { from: 0, to: 1, off: new THREE.Vector3(0, 0.0, 2.0) },
      { from: 1, to: 2, off: new THREE.Vector3(0, 0.0, -2.0) },
      { from: 2, to: 3, off: new THREE.Vector3(0, 0.0, 2.2) },
    ];
    segDefs.forEach((s) => {
      const curve = makeCurve(nodes[s.from].pos, nodes[s.to].pos, s.off);
      segments.push({ curve, fromIndex: s.from, toIndex: s.to });
      graphGroup.add(makeTube(curve, 0x222222));
    });

    // Branch
    const railCurve = makeCurve(nodes[3].pos, nodes[4].pos, new THREE.Vector3(0, 0.0, -2.5));
    const airCurve = new THREE.CatmullRomCurve3([
      nodes[3].pos.clone(),
      new THREE.Vector3(8.5, 2.5, 2.5),
      nodes[4].pos.clone(),
    ], false, 'catmullrom', 0.2);
    graphGroup.add(makeTube(railCurve, 0x222222));
    graphGroup.add(makeTube(airCurve, 0x222222));

    // Animated marker
    const markerGeo = new THREE.IcosahedronGeometry(0.55, 0);
    const markerMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.2, metalness: 0.45, emissive: 0x0b6ea1, emissiveIntensity: 0.8 });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.castShadow = true;
    marker.position.copy(nodes[0].pos);
    graphGroup.add(marker);

    // Sub-label near transport
    const transportLabel = makeLabel('Rail / Air', { fontSize: 44, fg: '#e5e5e5', bg: '#171717' });
    transportLabel.scale.set(5.2, 2.0, 1);
    transportLabel.position.set(nodes[3].pos.x, 2.8, nodes[3].pos.z);
    transportLabel.visible = false; // hide label per request
    graphGroup.add(transportLabel);

    // Ground grid
    const grid = new THREE.GridHelper(60, 30, 0xeaeaea, 0xf2f2f2);
    const gMat = grid.material as THREE.Material;
    (gMat as any).transparent = true;
    (gMat as any).opacity = 0.6;
    scene.add(grid);

    // Camera follow
    const followCameraTo = (target: THREE.Vector3, duration = 0.6) => {
      const camTarget = target.clone().add(new THREE.Vector3(-2, 5.5, 9));
      gsap.to(camera.position, { x: camTarget.x, y: camTarget.y, z: camTarget.z, duration, ease: 'power2.inOut', onUpdate: () => camera.lookAt(marker.position) });
    };

    // Node pulse + ring + check
    const pulseNode = (index: number) => {
      const node = nodeObjects[index];
      gsap.fromTo(node.mesh.scale, { x: 1, y: 1, z: 1 }, { x: 1.25, y: 1.25, z: 1.25, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.out' });
      gsap.to((node.check.material as THREE.SpriteMaterial), { opacity: 1, duration: 0.35, ease: 'power2.out' });
      node.ring.scale.set(0.8, 0.8, 0.8);
      gsap.to(node.ring.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 0.8, ease: 'power1.out' });
      (node.ring.material as THREE.MeshBasicMaterial).opacity = 0.22;
      gsap.to((node.ring.material as THREE.MeshBasicMaterial), { opacity: 0, duration: 0.8, ease: 'power1.out' });
    };

    // Animate along a curve
    const animateAlongCurve = (curve: THREE.Curve<THREE.Vector3>, duration: number, onStart?: () => void, onComplete?: () => void) => {
      const proxy = { t: 0 };
      const temp = new THREE.Vector3();
      return gsap.to(proxy, {
        t: 1,
        duration,
        ease: 'power2.inOut',
        onStart: () => { onStart && onStart(); },
        onUpdate: () => {
          curve.getPointAt(proxy.t, temp);
          marker.position.copy(temp);
          marker.position.y += Math.sin(proxy.t * Math.PI * 2) * 0.09;
          followCameraTo(marker.position, 0.25);
        },
        onComplete: () => { onComplete && onComplete(); }
      });
    };

    // Timeline
    const tl = gsap.timeline();

    setCurrentStep(0);
    pulseNode(0);
    followCameraTo(nodes[0].pos, 0.5);

    segments.forEach((seg) => {
      tl.add(animateAlongCurve(seg.curve, 1.1, () => {
        setCurrentStep(seg.fromIndex);
      }, () => {
        setCurrentStep(seg.toIndex);
        pulseNode(seg.toIndex);
      }));
    });

    const useAir = Math.random() > 0.5;
    const branchCurve = useAir ? airCurve : railCurve;
    tl.add(() => { setCurrentStep(3); });
    tl.add(animateAlongCurve(branchCurve, useAir ? 1.4 : 1.2, undefined, () => {
      setCurrentStep(4);
      pulseNode(4);
    }));

    // Responsive scaling based on container width
    const applyResponsiveScale = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      // reference width ~ 1200 => scale 1, shrink on small screens
      const scale = Math.max(0.7, Math.min(1.0, w / 1200));
      graphGroup.scale.set(scale, scale, scale);
    };
    applyResponsiveScale();

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      applyResponsiveScale();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      tl.kill();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16 bg-neutral-50">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-light text-neutral-900 mb-4 tracking-tight">
            How We <span className="italic font-serif">Work</span>
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Order ➝ Seller Packs ➝ Delivery Agent ➝ Rail/Air ➝ Delivered & Paid
          </p>
        </div>

        <div 
          ref={containerRef} 
          className="w-full h-[520px] sm:h-[560px] rounded-2xl shadow-2xl overflow-hidden bg-white border border-neutral-100"
        />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-5 gap-6">
          {['Order Placed', 'Seller Packs', 'Delivery Agent', 'Rail / Air', 'Delivered & Paid'].map((step, idx) => (
            <div
              key={idx}
              className={
                `text-center p-5 rounded-xl border transition-colors ` +
                (currentStep >= idx
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-md'
                  : 'bg-white text-neutral-900 border-neutral-200 shadow-sm')
              }
            >
              <div className={(currentStep >= idx ? 'bg-white text-neutral-900' : 'bg-neutral-900 text-white') + ' w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-semibold'}>
                {idx + 1}
              </div>
              <h3 className="text-base font-medium mb-1">{step}</h3>
              <p className={currentStep >= idx ? 'text-white/80 text-xs' : 'text-neutral-600 text-xs'}>
                {idx === 0 ? 'Your order is confirmed' : idx === 1 ? 'Seller prepares and packs' : idx === 2 ? 'Picked up for transit' : idx === 3 ? 'Smart routing to reach you' : 'Pay on delivery (COD)'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeliveryVisualization;
