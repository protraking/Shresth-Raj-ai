import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface HologramSwiftCarProps {
  isSpeaking: boolean;
  isThinking: boolean;
  accentColor?: string; // e.g. '#06b6d4' or '#6366f1'
}

export const HologramSwiftCar: React.FC<HologramSwiftCarProps> = ({
  isSpeaking,
  isThinking,
  accentColor = '#06b6d4',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 380;
    const height = container.clientHeight || 280;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2.2, 5.0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Car Root Group
    const carGroup = new THREE.Group();
    scene.add(carGroup);

    // Hologram Wireframe Material
    const primaryColor = new THREE.Color(accentColor);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: primaryColor,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });

    const glassMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });

    const wheelMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.9,
    });

    // 1. Lower Body / Chassis (Aerodynamic Swift shape)
    const bodyGeo = new THREE.BoxGeometry(1.7, 0.5, 3.2, 8, 4, 12);
    // Taper the front and back for car silhouette
    const pos = bodyGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      const y = pos.getY(i);
      if (z > 1.0) {
        // front hood slope
        pos.setY(i, y - (z - 1.0) * 0.25);
      } else if (z < -1.0) {
        // rear taper
        pos.setX(i, pos.getX(i) * 0.9);
      }
    }
    bodyGeo.computeVertexNormals();
    const bodyMesh = new THREE.Mesh(bodyGeo, glowMaterial);
    bodyMesh.position.y = 0.55;
    carGroup.add(bodyMesh);

    // 2. Cabin / Roof (Swift hatchback curved cabin)
    const cabinGeo = new THREE.BoxGeometry(1.3, 0.55, 1.8, 6, 3, 6);
    const cabinPos = cabinGeo.attributes.position;
    for (let i = 0; i < cabinPos.count; i++) {
      const z = cabinPos.getZ(i);
      const y = cabinPos.getY(i);
      if (y > 0) {
        cabinPos.setX(i, cabinPos.getX(i) * 0.85);
        if (z > 0.4) {
          // windshield rake
          cabinPos.setZ(i, z - 0.25);
        }
      }
    }
    cabinGeo.computeVertexNormals();
    const cabinMesh = new THREE.Mesh(cabinGeo, glassMaterial);
    cabinMesh.position.set(0, 0.95, -0.2);
    carGroup.add(cabinMesh);

    // 3. Four Glowing Holographic Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16);
    wheelGeo.rotateZ(Math.PI / 2);

    const wheelPositions = [
      [-0.92, 0.32, 0.95],  // front-left
      [0.92, 0.32, 0.95],   // front-right
      [-0.92, 0.32, -0.95], // rear-left
      [0.92, 0.32, -0.95],  // rear-right
    ];

    const wheels: THREE.Mesh[] = [];
    wheelPositions.forEach(p => {
      const wMesh = new THREE.Mesh(wheelGeo, wheelMaterial);
      wMesh.position.set(p[0], p[1], p[2]);
      carGroup.add(wMesh);
      wheels.push(wMesh);
    });

    // 4. Glowing Headlights & Taillights
    const lightGeo = new THREE.BoxGeometry(0.3, 0.1, 0.1);
    const frontLightMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: false });
    const rearLightMat = new THREE.MeshBasicMaterial({ color: 0xff0055, wireframe: false });

    const fLeft = new THREE.Mesh(lightGeo, frontLightMat);
    fLeft.position.set(-0.6, 0.5, 1.6);
    const fRight = new THREE.Mesh(lightGeo, frontLightMat);
    fRight.position.set(0.6, 0.5, 1.6);
    carGroup.add(fLeft, fRight);

    const rLeft = new THREE.Mesh(lightGeo, rearLightMat);
    rLeft.position.set(-0.6, 0.55, -1.6);
    const rRight = new THREE.Mesh(lightGeo, rearLightMat);
    rRight.position.set(0.6, 0.55, -1.6);
    carGroup.add(rLeft, rRight);

    // 5. Holographic Circular Scanning Grid on Floor
    const gridHelper = new THREE.PolarGridHelper(3.0, 16, 8, 32, 0x06b6d4, 0x0284c7);
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    // 6. Holographic Outer Rings (Floating HUD rings)
    const ringGeo = new THREE.RingGeometry(2.2, 2.25, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.05;
    scene.add(ringMesh);

    // 7. Ambient Particle Field
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 6;
      particlePositions[i + 1] = Math.random() * 3.5;
      particlePositions[i + 2] = (Math.random() - 0.5) * 6;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.04,
      transparent: true,
      opacity: 0.7,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Interaction Drag to Rotate
    let isDragging = false;
    let prevMouseX = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      carGroup.rotation.y += deltaX * 0.01;
      prevMouseX = e.clientX;
    };
    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop
    let reqId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Rotation speed depends on speaking / thinking state
      const rotationSpeed = isThinking ? 0.03 : isSpeaking ? 0.02 : 0.008;
      if (!isDragging) {
        carGroup.rotation.y += rotationSpeed;
      }

      // Wheels roll as car rotates
      wheels.forEach(w => {
        w.rotation.x += rotationSpeed * 2;
      });

      // Holographic floating levitation bob
      carGroup.position.y = Math.sin(elapsed * 2.5) * 0.06;

      // Pulse ring opacity when speaking
      if (isSpeaking) {
        ringMesh.scale.setScalar(1 + Math.sin(elapsed * 8) * 0.08);
        ringMat.opacity = 0.5 + Math.sin(elapsed * 10) * 0.4;
      } else {
        ringMesh.scale.setScalar(1);
        ringMat.opacity = 0.4;
      }

      // Rotate ground grid slowly
      gridHelper.rotation.y -= 0.003;

      renderer.render(scene, camera);
    };

    animate();

    // Resize handling
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 380;
      const h = container.clientHeight || 280;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
      bodyGeo.dispose();
      cabinGeo.dispose();
      wheelGeo.dispose();
      particleGeo.dispose();
    };
  }, [isSpeaking, isThinking, accentColor]);

  return (
    <div className="relative w-full h-[260px] md:h-[300px] flex items-center justify-center overflow-hidden">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      {/* Hologram HUD status overlay */}
      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-cyan-400/80 pointer-events-none select-none">
        <span>SWIFT HUD // 3D HOLOGRAM ACTIVE</span>
        <span>DRAG TO ROTATE 360°</span>
      </div>
    </div>
  );
};
