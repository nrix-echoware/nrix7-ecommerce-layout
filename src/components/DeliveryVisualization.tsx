import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

const DeliveryVisualization = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 30);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0xe5e5e5 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Seller (House)
    const createHouse = (x: number, z: number) => {
      const houseGroup = new THREE.Group();
      
      const baseGeometry = new THREE.BoxGeometry(3, 2, 3);
      const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = 1;
      base.castShadow = true;
      houseGroup.add(base);

      const roofGeometry = new THREE.ConeGeometry(2.5, 1.5, 4);
      const roofMaterial = new THREE.MeshLambertMaterial({ color: 0xdc143c });
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.y = 2.75;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      houseGroup.add(roof);

      houseGroup.position.set(x, 0, z);
      return houseGroup;
    };

    // Package box
    const createPackage = (x: number, z: number) => {
      const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
      const boxMaterial = new THREE.MeshLambertMaterial({ color: 0xcd853f });
      const packageBox = new THREE.Mesh(boxGeometry, boxMaterial);
      packageBox.position.set(x, 0.5, z);
      packageBox.castShadow = true;
      return packageBox;
    };

    // Delivery person
    const createDeliveryPerson = (x: number, z: number) => {
      const personGroup = new THREE.Group();
      
      const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
      const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4169e1 });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 1;
      body.castShadow = true;
      personGroup.add(body);

      const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const headMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.8;
      head.castShadow = true;
      personGroup.add(head);

      personGroup.position.set(x, 0, z);
      return personGroup;
    };

    // Vehicles
    const createVehicle = (x: number, z: number, type: 'truck' | 'plane' | 'train') => {
      const vehicleGroup = new THREE.Group();
      
      if (type === 'truck') {
        const cabinGeometry = new THREE.BoxGeometry(2, 1.5, 1.5);
        const cabinMaterial = new THREE.MeshLambertMaterial({ color: 0xff4500 });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.y = 1;
        cabin.castShadow = true;
        vehicleGroup.add(cabin);

        const containerGeometry = new THREE.BoxGeometry(3, 2, 1.5);
        const containerMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const container = new THREE.Mesh(containerGeometry, containerMaterial);
        container.position.set(-2.5, 1, 0);
        container.castShadow = true;
        vehicleGroup.add(container);
      } else if (type === 'plane') {
        const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 16);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x87ceeb });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.z = Math.PI / 2;
        body.position.y = 5;
        body.castShadow = true;
        vehicleGroup.add(body);

        const wingGeometry = new THREE.BoxGeometry(6, 0.1, 1.5);
        const wingMaterial = new THREE.MeshLambertMaterial({ color: 0x87ceeb });
        const wings = new THREE.Mesh(wingGeometry, wingMaterial);
        wings.position.y = 5;
        wings.castShadow = true;
        vehicleGroup.add(wings);
      } else if (type === 'train') {
        const trainGeometry = new THREE.BoxGeometry(4, 2, 2);
        const trainMaterial = new THREE.MeshLambertMaterial({ color: 0x4b0082 });
        const train = new THREE.Mesh(trainGeometry, trainMaterial);
        train.position.y = 1.5;
        train.castShadow = true;
        vehicleGroup.add(train);
      }

      vehicleGroup.position.set(x, 0, z);
      return vehicleGroup;
    };

    // Create scene elements
    const sellerHouse = createHouse(-15, 0);
    const buyerHouse = createHouse(15, 0);
    const packageBox = createPackage(-15, 3);
    const deliveryPerson = createDeliveryPerson(-15, 5);
    const truck = createVehicle(-15, 8, 'truck');
    const plane = createVehicle(0, 0, 'plane');
    const train = createVehicle(0, 0, 'train');

    scene.add(sellerHouse, buyerHouse, packageBox, deliveryPerson, truck);

    // Animation timeline
    const timeline = gsap.timeline({ repeat: -1, repeatDelay: 2 });

    // Step 1: Order placed - package appears
    timeline.from(packageBox.scale, {
      x: 0,
      y: 0,
      z: 0,
      duration: 0.8,
      ease: 'back.out(1.7)',
    });

    // Step 2: Seller packs (package bounces)
    timeline.to(packageBox.position, {
      y: 1.5,
      duration: 0.5,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut',
    });

    // Step 3: Delivery person picks up
    timeline.to(deliveryPerson.position, {
      z: 3,
      duration: 1,
      ease: 'power2.inOut',
    });

    timeline.to(packageBox.position, {
      x: deliveryPerson.position.x,
      y: 2,
      z: deliveryPerson.position.z,
      duration: 0.5,
      ease: 'power2.out',
    });

    // Step 4: Move to truck
    timeline.to([deliveryPerson.position, packageBox.position], {
      z: 8,
      duration: 1.5,
      ease: 'power2.inOut',
    });

    // Step 5: Truck moves to center
    timeline.to([truck.position, packageBox.position], {
      x: -5,
      duration: 2,
      ease: 'power1.inOut',
    });

    // Step 6: Choose transport (plane or train randomly)
    timeline.call(() => {
      const useAir = Math.random() > 0.5;
      if (useAir) {
        scene.add(plane);
        gsap.to(plane.position, { x: -5, duration: 0.5 });
        gsap.to(packageBox.position, { y: 5, x: 0, duration: 1.5, ease: 'power2.inOut' });
        gsap.to(plane.position, { x: 5, duration: 3, ease: 'power1.inOut' });
        gsap.to(packageBox.position, { x: 5, duration: 3, ease: 'power1.inOut', delay: 0 });
        gsap.to(plane.position, { x: 20, duration: 1, delay: 3, onComplete: () => scene.remove(plane) });
        gsap.to(packageBox.position, { y: 0.5, x: 15, z: 3, duration: 1.5, delay: 3, ease: 'power2.inOut' });
      } else {
        scene.add(train);
        gsap.to(train.position, { x: -5, z: 8, duration: 0.5 });
        gsap.to(packageBox.position, { x: -5, z: 8, duration: 1, ease: 'power2.inOut' });
        gsap.to(train.position, { x: 10, duration: 3, ease: 'power1.inOut' });
        gsap.to(packageBox.position, { x: 10, duration: 3, ease: 'power1.inOut' });
        gsap.to(train.position, { x: 20, duration: 1, delay: 3, onComplete: () => scene.remove(train) });
        gsap.to(packageBox.position, { x: 15, z: 3, duration: 1.5, delay: 3, ease: 'power2.inOut' });
      }
    });

    // Step 7: Final delivery
    timeline.to(packageBox.position, {
      x: 15,
      z: 0,
      y: 0.5,
      duration: 1.5,
      delay: 5,
      ease: 'power2.inOut',
    });

    // Step 8: Package delivered (celebration)
    timeline.to(packageBox.rotation, {
      y: Math.PI * 2,
      duration: 1,
      ease: 'power2.inOut',
    });

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
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      timeline.kill();
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
            Watch your order journey from seller to your doorstep with seamless logistics
          </p>
        </div>

        <div 
          ref={containerRef} 
          className="w-full h-[600px] rounded-2xl shadow-2xl overflow-hidden bg-white"
        />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center p-6 bg-white rounded-xl shadow-md">
            <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              1
            </div>
            <h3 className="text-lg font-medium mb-2 text-neutral-900">Order Placed</h3>
            <p className="text-sm text-neutral-600">Your order is confirmed and the seller begins packaging</p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-md">
            <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              2
            </div>
            <h3 className="text-lg font-medium mb-2 text-neutral-900">Packaged</h3>
            <p className="text-sm text-neutral-600">Seller carefully packs your items with care</p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-md">
            <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              3
            </div>
            <h3 className="text-lg font-medium mb-2 text-neutral-900">In Transit</h3>
            <p className="text-sm text-neutral-600">Package travels via road, rail, or air to reach you faster</p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-md">
            <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              4
            </div>
            <h3 className="text-lg font-medium mb-2 text-neutral-900">Delivered</h3>
            <p className="text-sm text-neutral-600">Package arrives at your doorstep, ready to enjoy!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryVisualization;
