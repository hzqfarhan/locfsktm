'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Floor } from '../types/directory';
import { FLOORS_DATA } from '../data/floors';
import {
  Layers,
  Camera,
  RotateCw,
  Eye,
  Sparkles,
  Info,
  Maximize2,
  ChevronRight,
  Maximize
} from 'lucide-react';

interface Building3DViewerProps {
  selectedFloorId: number;
  onSelectFloor: (floorId: number) => void;
}

export default function Building3DViewer({
  selectedFloorId,
  onSelectFloor,
}: Building3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [hoveredFloor, setHoveredFloor] = useState<Floor | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // References to keep Three.js scene objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const floorGroupsRef = useRef<Map<number, THREE.Group>>(new Map());
  const floorMaterialsRef = useRef<Map<number, THREE.MeshStandardMaterial[]>>(new Map());
  const fountainParticlesRef = useRef<THREE.Points | null>(null);
  const reqAnimIdRef = useRef<number | null>(null);

  // Set camera preset
  const setCameraPreset = useCallback((type: 'lake' | 'iso' | 'tower' | 'top') => {
    const controls = controlsRef.current;
    const camera = cameraRef.current;
    if (!controls || !camera) return;

    switch (type) {
      case 'lake':
        // Lakefront view matching FSKTM.jpg (across the lake looking at tower and fountain)
        camera.position.set(0, 18, 55);
        controls.target.set(0, 14, 0);
        break;
      case 'iso':
        // 45 degree isometric perspective view
        camera.position.set(38, 28, 42);
        controls.target.set(0, 12, 0);
        break;
      case 'tower':
        // Close-up on 8-storey tower
        camera.position.set(0, 16, 26);
        controls.target.set(0, 16, 0);
        break;
      case 'top':
        // Architectural top-down view
        camera.position.set(0, 60, 2);
        controls.target.set(0, 0, 0);
        break;
    }
    controls.update();
  }, []);

  // Update floor slab vertical heights for Exploded View
  useEffect(() => {
    const floorGroups = floorGroupsRef.current;
    floorGroups.forEach((group, floorId) => {
      const baseHeight = floorId * 3.2;
      const targetY = isExploded ? floorId * 5.8 : baseHeight;
      // Smoothly animate or set position
      group.userData.targetY = targetY;
    });
  }, [isExploded]);

  // Update selected floor highlight material
  useEffect(() => {
    const floorMaterials = floorMaterialsRef.current;
    floorMaterials.forEach((materials, floorId) => {
      const isSelected = floorId === selectedFloorId;
      materials.forEach((mat) => {
        if (mat.name === 'wall') {
          if (isSelected) {
            mat.emissive.setHex(0x991B1B);
            mat.emissiveIntensity = 0.45;
          } else {
            mat.emissive.setHex(0x000000);
            mat.emissiveIntensity = 0;
          }
        } else if (mat.name === 'accent') {
          if (isSelected) {
            mat.color.setHex(0xDC2626);
            mat.emissive.setHex(0xEF4444);
            mat.emissiveIntensity = 0.6;
          } else {
            mat.color.setHex(0x991B1B);
            mat.emissive.setHex(0x000000);
            mat.emissiveIntensity = 0;
          }
        }
      });
    });
  }, [selectedFloorId]);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 580;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF1F5F9); // Light clean daylight sky
    scene.fog = new THREE.FogExp2(0xF1F5F9, 0.008);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 500);
    camera.position.set(0, 18, 55); // Front lake view matching FSKTM.jpg
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't dip below ground
    controls.minDistance = 12;
    controls.maxDistance = 120;
    controls.target.set(0, 14, 0);
    controlsRef.current = controls;

    // 5. Lighting (Bright, sunny Malaysian daylight)
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.85);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xE0F2FE, 0xFEF2F2, 0.5);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xFFFBEB, 1.25);
    sunLight.position.set(35, 50, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 150;
    sunLight.shadow.camera.left = -40;
    sunLight.shadow.camera.right = 40;
    sunLight.shadow.camera.top = 40;
    sunLight.shadow.camera.bottom = -40;
    scene.add(sunLight);

    // 6. Architectural Materials
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      roughness: 0.35,
      metalness: 0.05,
    });
    concreteMat.name = 'wall';

    const redAccentMat = new THREE.MeshStandardMaterial({
      color: 0x991B1B,
      roughness: 0.3,
      metalness: 0.1,
    });
    redAccentMat.name = 'accent';

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38BDF8,
      roughness: 0.1,
      metalness: 0.85,
      transparent: true,
      opacity: 0.75,
    });

    const windowLouverMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
    });

    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x4ADE80,
      roughness: 0.8,
    });

    const pavementMat = new THREE.MeshStandardMaterial({
      color: 0xE2E8F0,
      roughness: 0.7,
    });

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284C7,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.88,
    });

    // 7. Site Environment: Ground, Lawn & Parking
    const groundGroup = new THREE.Group();

    // Grass perimeter
    const grassMesh = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), grassMat);
    grassMesh.rotation.x = -Math.PI / 2;
    grassMesh.position.y = -0.05;
    grassMesh.receiveShadow = true;
    groundGroup.add(grassMesh);

    // Plaza & Parking paving
    const plazaMesh = new THREE.Mesh(new THREE.BoxGeometry(60, 0.1, 36), pavementMat);
    plazaMesh.position.set(0, 0, 8);
    plazaMesh.receiveShadow = true;
    groundGroup.add(plazaMesh);

    // 8. Iconic Tasik UTHM (Lake in foreground with fountain)
    const lakeMesh = new THREE.Mesh(new THREE.CylinderGeometry(28, 28, 0.4, 48), waterMat);
    lakeMesh.position.set(0, 0.1, 38);
    groundGroup.add(lakeMesh);

    // Fountain Basin Rim
    const rimMesh = new THREE.Mesh(
      new THREE.TorusGeometry(28, 0.5, 12, 48),
      new THREE.MeshStandardMaterial({ color: 0xCBD5E1, roughness: 0.5 })
    );
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.set(0, 0.3, 38);
    groundGroup.add(rimMesh);

    // Decorative Palm Trees & Shrubbery along driveway
    const palmPositions = [
      [-26, 0, 18], [-22, 0, 20], [-18, 0, 22],
      [18, 0, 22], [22, 0, 20], [26, 0, 18],
      [-28, 0, 0], [28, 0, 0]
    ];
    palmPositions.forEach(([x, y, z]) => {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.25, 4.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x78350F, roughness: 0.9 })
      );
      trunk.position.set(x, 2.25, z);
      groundGroup.add(trunk);

      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(1.4, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x15803D, roughness: 0.7 })
      );
      crown.scale.set(1.5, 0.6, 1.5);
      crown.position.set(x, 4.5, z);
      groundGroup.add(crown);
    });

    scene.add(groundGroup);

    // 9. Interactive Building Construction (Floors 0 to 7)
    const floorGroups = new Map<number, THREE.Group>();
    const floorMaterials = new Map<number, THREE.MeshStandardMaterial[]>();

    // Central Tower Slabs (8 Levels: G to 7)
    for (let floorId = 0; floorId <= 7; floorId++) {
      const floorGroup = new THREE.Group();
      const baseHeight = floorId * 3.2;
      floorGroup.position.y = baseHeight;
      floorGroup.userData = { floorId, targetY: baseHeight };

      const floorMats: THREE.MeshStandardMaterial[] = [];

      const fConcreteMat = concreteMat.clone();
      fConcreteMat.name = 'wall';
      floorMats.push(fConcreteMat);

      const fAccentMat = redAccentMat.clone();
      fAccentMat.name = 'accent';
      floorMats.push(fAccentMat);

      // Floor Slab (Menara Tower center block)
      // Width = 16, Height = 3.0, Depth = 14
      const towerSlab = new THREE.Mesh(
        new THREE.BoxGeometry(16, 2.9, 14),
        fConcreteMat
      );
      towerSlab.position.set(0, 1.45, 0);
      towerSlab.castShadow = true;
      towerSlab.receiveShadow = true;
      towerSlab.userData = { floorId, isClickable: true };
      floorGroup.add(towerSlab);

      // Curved Front Protrusion (The iconic curved aerodynamic front facade of FSKTM)
      const curvedFront = new THREE.Mesh(
        new THREE.CylinderGeometry(4.5, 4.5, 2.9, 24, 1, false, 0, Math.PI),
        fConcreteMat
      );
      curvedFront.position.set(0, 1.45, 7);
      curvedFront.castShadow = true;
      curvedFront.userData = { floorId, isClickable: true };
      floorGroup.add(curvedFront);

      // Windows band on the front curve
      const curvedWindow = new THREE.Mesh(
        new THREE.CylinderGeometry(4.55, 4.55, 1.4, 24, 1, false, 0.2, Math.PI - 0.4),
        glassMat
      );
      curvedWindow.position.set(0, 1.5, 7);
      floorGroup.add(curvedWindow);

      // Window Louver Shades
      const shadeMesh = new THREE.Mesh(
        new THREE.BoxGeometry(9.6, 0.15, 1.2),
        windowLouverMat
      );
      shadeMesh.position.set(0, 2.25, 7.3);
      floorGroup.add(shadeMesh);

      // Red Architectural Accent Strip (UTHM corporate red detail band)
      const redBand = new THREE.Mesh(
        new THREE.BoxGeometry(16.2, 0.25, 14.2),
        fAccentMat
      );
      redBand.position.set(0, 2.85, 0);
      floorGroup.add(redBand);

      // Add Side Wings for Levels 0, 1, 2, 3 (Wings exist up to level 3)
      if (floorId <= 3) {
        // SAYAP KIRI (Left Wing - angled forward)
        const leftWing = new THREE.Mesh(
          new THREE.BoxGeometry(18, 2.9, 11),
          fConcreteMat
        );
        leftWing.position.set(-15, 1.45, 2);
        leftWing.rotation.y = 0.2;
        leftWing.castShadow = true;
        leftWing.receiveShadow = true;
        leftWing.userData = { floorId, isClickable: true };
        floorGroup.add(leftWing);

        // Left Wing Windows
        const leftWindows = new THREE.Mesh(
          new THREE.BoxGeometry(16, 1.2, 11.2),
          glassMat
        );
        leftWindows.position.set(-15, 1.5, 2);
        leftWindows.rotation.y = 0.2;
        floorGroup.add(leftWindows);

        // SAYAP KANAN (Right Wing - long horizontal block)
        const rightWing = new THREE.Mesh(
          new THREE.BoxGeometry(22, 2.9, 11),
          fConcreteMat
        );
        rightWing.position.set(17, 1.45, -1);
        rightWing.castShadow = true;
        rightWing.receiveShadow = true;
        rightWing.userData = { floorId, isClickable: true };
        floorGroup.add(rightWing);

        // Right Wing Windows
        const rightWindows = new THREE.Mesh(
          new THREE.BoxGeometry(20, 1.2, 11.2),
          glassMat
        );
        rightWindows.position.set(17, 1.5, -1);
        floorGroup.add(rightWindows);
      }

      // Ground Floor Entrance Canopy & Glass Lobby
      if (floorId === 0) {
        const entranceCanopy = new THREE.Mesh(
          new THREE.BoxGeometry(10, 0.4, 6),
          redAccentMat
        );
        entranceCanopy.position.set(0, 3.2, 11.5);
        entranceCanopy.castShadow = true;
        floorGroup.add(entranceCanopy);

        // Glass entrance vestibule
        const entranceGlass = new THREE.Mesh(
          new THREE.BoxGeometry(8, 2.8, 4),
          glassMat
        );
        entranceGlass.position.set(0, 1.4, 9);
        floorGroup.add(entranceGlass);
      }

      // Level 3 Roof Cap for the Wings
      if (floorId === 3) {
        const leftWingRoof = new THREE.Mesh(
          new THREE.BoxGeometry(19, 0.6, 12),
          new THREE.MeshStandardMaterial({ color: 0x64748B, roughness: 0.4 })
        );
        leftWingRoof.position.set(-15, 3.1, 2);
        leftWingRoof.rotation.y = 0.2;
        floorGroup.add(leftWingRoof);

        const rightWingRoof = new THREE.Mesh(
          new THREE.BoxGeometry(23, 0.6, 12),
          new THREE.MeshStandardMaterial({ color: 0x64748B, roughness: 0.4 })
        );
        rightWingRoof.position.set(17, 3.1, -1);
        floorGroup.add(rightWingRoof);
      }

      // Level 7 Roof Crown (The Iconic Curved Aerodynamic Top with FSKTM Signage)
      if (floorId === 7) {
        // Aerodynamic roof canopy overhang matching FSKTM.jpg
        const roofCap = new THREE.Mesh(
          new THREE.CylinderGeometry(9, 9, 0.8, 32),
          new THREE.MeshStandardMaterial({ color: 0x94A3B8, roughness: 0.3 })
        );
        roofCap.scale.set(1.1, 1, 1.2);
        roofCap.position.set(0, 3.5, 2);
        floorGroup.add(roofCap);

        // Upper Curved Signboard Wall ("UTHM FSKTM")
        const signWall = new THREE.Mesh(
          new THREE.CylinderGeometry(4.6, 4.6, 1.8, 24, 1, false, 0.4, Math.PI - 0.8),
          new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.2 })
        );
        signWall.position.set(0, 3.8, 7);
        floorGroup.add(signWall);

        // Signage Plate
        const signPlate = new THREE.Mesh(
          new THREE.BoxGeometry(5.5, 0.8, 0.2),
          new THREE.MeshStandardMaterial({ color: 0x991B1B, roughness: 0.3 })
        );
        signPlate.position.set(0, 3.8, 8.1);
        floorGroup.add(signPlate);
      }

      scene.add(floorGroup);
      floorGroups.set(floorId, floorGroup);
      floorMaterials.set(floorId, floorMats);
    }

    floorGroupsRef.current = floorGroups;
    floorMaterialsRef.current = floorMaterials;

    // 10. Water Fountain Geyser Particle System (matching FSKTM.jpg fountain spray!)
    const particleCount = 280;
    const fountainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1.5;
      positions[i * 3 + 1] = Math.random() * 16;
      positions[i * 3 + 2] = 38 + (Math.random() - 0.5) * 1.5;

      velocities[i * 3] = (Math.random() - 0.5) * 0.12;
      velocities[i * 3 + 1] = 0.2 + Math.random() * 0.35; // upward speed
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
    }

    fountainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    fountainGeo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const fountainMat = new THREE.PointsMaterial({
      color: 0xE0F2FE,
      size: 0.65,
      transparent: true,
      opacity: 0.85,
    });

    const fountain = new THREE.Points(fountainGeo, fountainMat);
    scene.add(fountain);
    fountainParticlesRef.current = fountain;

    // 11. Raycasting for Floor Hover & Click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getIntersectedFloorId = (e: MouseEvent): number | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (const hit of intersects) {
        let curr: THREE.Object3D | null = hit.object;
        while (curr && curr !== scene) {
          if (curr.userData && curr.userData.floorId !== undefined) {
            return curr.userData.floorId;
          }
          curr = curr.parent;
        }
      }
      return null;
    };

    const handlePointerMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      const fId = getIntersectedFloorId(e);
      if (fId !== null && fId >= 0 && fId <= 7) {
        setHoveredFloor(FLOORS_DATA[fId] || null);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHoveredFloor(null);
        renderer.domElement.style.cursor = 'default';
      }
    };

    const handleClick = (e: MouseEvent) => {
      const fId = getIntersectedFloorId(e);
      if (fId !== null && fId >= 0 && fId <= 7) {
        onSelectFloor(fId);
      }
    };

    renderer.domElement.addEventListener('mousemove', handlePointerMove);
    renderer.domElement.addEventListener('click', handleClick);

    // 12. Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      reqAnimIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Controls update & auto-rotate
      if (controls) {
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = 1.0;
        controls.update();
      }

      // Animate floor slab heights for Exploded View
      floorGroups.forEach((group) => {
        if (group.userData.targetY !== undefined) {
          group.position.y += (group.userData.targetY - group.position.y) * 0.12;
        }
      });

      // Animate Fountain Geyser Particles
      if (fountain) {
        const posAttr = fountain.geometry.attributes.position as THREE.BufferAttribute;
        const velAttr = fountain.geometry.attributes.velocity as THREE.BufferAttribute;
        const posArr = posAttr.array as Float32Array;
        const velArr = velAttr.array as Float32Array;

        for (let i = 0; i < particleCount; i++) {
          posArr[i * 3] += velArr[i * 3];
          posArr[i * 3 + 1] += velArr[i * 3 + 1];
          posArr[i * 3 + 2] += velArr[i * 3 + 2];

          // Gravity effect
          velArr[i * 3 + 1] -= 0.009;

          // Reset to base if fallen below water level
          if (posArr[i * 3 + 1] <= 0.2) {
            posArr[i * 3] = (Math.random() - 0.5) * 1.5;
            posArr[i * 3 + 1] = 0.2;
            posArr[i * 3 + 2] = 38 + (Math.random() - 0.5) * 1.5;
            velArr[i * 3 + 1] = 0.25 + Math.random() * 0.35;
          }
        }
        posAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 13. Handle Window Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 580;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (reqAnimIdRef.current) cancelAnimationFrame(reqAnimIdRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handleClick);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [onSelectFloor, autoRotate]);

  const activeFloor = FLOORS_DATA[selectedFloorId] || FLOORS_DATA[0];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#F8FAFC',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 3D Viewer Toolbar */}
      <div
        style={{
          padding: '10px 16px',
          paddingRight: '220px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FEF2F2',
              color: '#991B1B',
              padding: '4px 10px',
              borderRadius: '8px',
              border: '1px solid #FEE2E2',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <Layers size={14} color="#B91C1C" />
            <span>Digital Twin 3D FSKTM • Aras {activeFloor.levelCode} Dipilih</span>
          </div>
          <span style={{ fontSize: '11px', color: '#64748B' }} className="hide-mobile">
            (Klik tingkat pada bangunan untuk beralih aras)
          </span>
        </div>

        {/* View Actions & Camera Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {/* Exploded View Toggle */}
          <button
            onClick={() => setIsExploded(!isExploded)}
            title="Pecahan Aras Bertingkat"
            aria-label="Pecahan aras"
            style={{
              padding: '5px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: isExploded ? '#B91C1C' : '#FFFFFF',
              color: isExploded ? '#FFFFFF' : '#475569',
              border: isExploded ? '1px solid #B91C1C' : '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              transition: 'all 120ms ease',
            }}
          >
            <Layers size={13} />
            <span>{isExploded ? 'Cantumkan Semula' : 'Pecahan Aras'}</span>
          </button>

          {/* Auto Rotate */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title="Pusingan Automatik"
            aria-label="Pusingan automatik"
            style={{
              padding: '5px 8px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: autoRotate ? '#FEF2F2' : '#FFFFFF',
              color: autoRotate ? '#991B1B' : '#475569',
              border: autoRotate ? '1px solid #FECACA' : '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            <RotateCw size={13} />
            <span className="hide-mobile">Pusing</span>
          </button>

          <div style={{ width: '1px', height: '18px', backgroundColor: '#E2E8F0', margin: '0 2px' }} />

          {/* Camera Presets */}
          <button
            onClick={() => setCameraPreset('lake')}
            title="Pandangan Tasik & Air Pancut (FSKTM.jpg)"
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: '#F8FAFC',
              color: '#334155',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
            }}
          >
            Tasik
          </button>
          <button
            onClick={() => setCameraPreset('iso')}
            title="Pandangan Isometrik 3D"
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: '#F8FAFC',
              color: '#334155',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
            }}
          >
            Isometrik
          </button>
          <button
            onClick={() => setCameraPreset('tower')}
            title="Fokus Menara 8 Tingkat"
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: '#F8FAFC',
              color: '#334155',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
            }}
          >
            Menara
          </button>
        </div>
      </div>

      {/* 3D Canvas Mount Point */}
      <div
        ref={mountRef}
        style={{
          width: '100%',
          flex: 1,
          height: '100%',
          minHeight: '580px',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#F1F5F9',
        }}
      >
        {/* Floating Active Floor Badge on Top-Left */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #FECACA',
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: '0 4px 14px rgba(185, 28, 28, 0.1)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 5,
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '18px',
            }}
          >
            {activeFloor.levelCode}
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>
              {activeFloor.nameMalay} ({activeFloor.name})
            </div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              {activeFloor.stats.totalRooms} Ruang • {activeFloor.highlights[0]}
            </div>
          </div>
        </div>

        {/* Floating Reference Note on Bottom-Left */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '4px 8px',
            fontSize: '10px',
            color: '#64748B',
            fontWeight: 600,
            pointerEvents: 'none',
            zIndex: 5,
          }}
        >
          Model 3D berasaskan foto sebenar Menara & Tasik FSKTM
        </div>

        {/* Floor Quick-Jump Bar on Bottom-Right */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(6px)',
            border: '1px solid #FECACA',
            borderRadius: '10px',
            padding: '4px 6px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            zIndex: 5,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#991B1B', padding: '0 4px' }}>
            Aras:
          </span>
          {FLOORS_DATA.map((f) => {
            const isCurrent = f.id === selectedFloorId;
            return (
              <button
                key={f.id}
                onClick={() => onSelectFloor(f.id)}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: isCurrent ? '#B91C1C' : '#FFFFFF',
                  color: isCurrent ? '#FFFFFF' : '#475569',
                  border: isCurrent ? '1px solid #B91C1C' : '1px solid #E2E8F0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 120ms ease',
                }}
              >
                {f.levelCode}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hover Tooltip Overlay for 3D Slabs */}
      {hoveredFloor && (
        <div
          style={{
            position: 'fixed',
            top: mousePos.y + 14,
            left: Math.min(mousePos.x + 14, typeof window !== 'undefined' ? window.innerWidth - 220 : 200),
            backgroundColor: '#FFFFFF',
            border: '1px solid #FECACA',
            borderRadius: '10px',
            padding: '8px 12px',
            boxShadow: '0 10px 25px -5px rgba(185, 28, 28, 0.2)',
            pointerEvents: 'none',
            zIndex: 9999,
            minWidth: '160px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 900,
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                padding: '1px 5px',
                borderRadius: '4px',
              }}
            >
              ARAS {hoveredFloor.levelCode}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A' }}>
              {hoveredFloor.nameMalay}
            </span>
          </div>
          <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px' }}>
            {hoveredFloor.description.slice(0, 50)}...
          </div>
          <div style={{ fontSize: '10px', color: '#B91C1C', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
            <ChevronRight size={12} />
            <span>Klik untuk pilih aras ini</span>
          </div>
        </div>
      )}
    </div>
  );
}
