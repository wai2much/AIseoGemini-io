import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';

const HeroRobot: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // --- MATERIALS ---
    const darkMetal = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.3,
    });

    const chromeMetal = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 1.0,
      roughness: 0.15,
    });

    const glowGreen = new THREE.MeshStandardMaterial({
      color: 0x00E676,
      emissive: 0x00E676,
      emissiveIntensity: 2.5,
      metalness: 0.3,
      roughness: 0.2,
    });

    const glowGreenDim = new THREE.MeshStandardMaterial({
      color: 0x00E676,
      emissive: 0x00E676,
      emissiveIntensity: 1.0,
      metalness: 0.5,
      roughness: 0.3,
    });

    const eyeGlow = new THREE.MeshStandardMaterial({
      color: 0x00E676,
      emissive: 0x00E676,
      emissiveIntensity: 4.0,
      metalness: 0.0,
      roughness: 0.0,
    });

    // --- ROBOT GROUP ---
    const robot = new THREE.Group();

    // HEAD - angular mech style
    const headGeo = new THREE.BoxGeometry(1.1, 0.8, 0.9);
    const head = new THREE.Mesh(headGeo, darkMetal);
    head.position.y = 2.8;
    robot.add(head);

    // Head top plate
    const headTopGeo = new THREE.BoxGeometry(0.9, 0.1, 0.7);
    const headTop = new THREE.Mesh(headTopGeo, chromeMetal);
    headTop.position.set(0, 3.25, 0);
    robot.add(headTop);

    // Visor
    const visorGeo = new THREE.BoxGeometry(1.15, 0.2, 0.15);
    const visor = new THREE.Mesh(visorGeo, glowGreen);
    visor.position.set(0, 2.85, 0.48);
    robot.add(visor);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const leftEye = new THREE.Mesh(eyeGeo, eyeGlow);
    leftEye.position.set(-0.25, 2.85, 0.5);
    robot.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeGlow);
    rightEye.position.set(0.25, 2.85, 0.5);
    robot.add(rightEye);

    // Antenna
    const antennaGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
    const antenna = new THREE.Mesh(antennaGeo, chromeMetal);
    antenna.position.set(0.35, 3.5, 0);
    robot.add(antenna);

    const antennaTipGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const antennaTip = new THREE.Mesh(antennaTipGeo, glowGreen);
    antennaTip.position.set(0.35, 3.72, 0);
    robot.add(antennaTip);

    // Jaw / chin plate
    const jawGeo = new THREE.BoxGeometry(0.8, 0.15, 0.6);
    const jaw = new THREE.Mesh(jawGeo, chromeMetal);
    jaw.position.set(0, 2.35, 0.1);
    robot.add(jaw);

    // NECK
    const neckGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.3, 8);
    const neck = new THREE.Mesh(neckGeo, darkMetal);
    neck.position.y = 2.2;
    robot.add(neck);

    // TORSO - wide angular chest
    const torsoGeo = new THREE.BoxGeometry(1.8, 1.4, 0.9);
    const torso = new THREE.Mesh(torsoGeo, darkMetal);
    torso.position.y = 1.3;
    robot.add(torso);

    // Chest plate
    const chestGeo = new THREE.BoxGeometry(1.4, 0.8, 0.15);
    const chest = new THREE.Mesh(chestGeo, chromeMetal);
    chest.position.set(0, 1.5, 0.48);
    robot.add(chest);

    // Chest reactor / core glow
    const reactorGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const reactor = new THREE.Mesh(reactorGeo, eyeGlow);
    reactor.position.set(0, 1.5, 0.58);
    robot.add(reactor);

    // Chest glow lines
    const chestLineGeo = new THREE.BoxGeometry(0.5, 0.04, 0.05);
    [-0.35, 0.35].forEach(x => {
      const line = new THREE.Mesh(chestLineGeo, glowGreenDim);
      line.position.set(x, 1.5, 0.55);
      robot.add(line);
    });

    // Vertical chest lines
    const chestVLineGeo = new THREE.BoxGeometry(0.04, 0.6, 0.05);
    [-0.5, 0.5].forEach(x => {
      const line = new THREE.Mesh(chestVLineGeo, glowGreenDim);
      line.position.set(x, 1.5, 0.52);
      robot.add(line);
    });

    // SHOULDERS - angular armor plates
    [-1, 1].forEach(side => {
      const shoulderGeo = new THREE.BoxGeometry(0.6, 0.35, 0.7);
      const shoulder = new THREE.Mesh(shoulderGeo, chromeMetal);
      shoulder.position.set(side * 1.2, 1.9, 0);
      shoulder.rotation.z = side * -0.15;
      robot.add(shoulder);

      // Shoulder glow strip
      const stripGeo = new THREE.BoxGeometry(0.5, 0.05, 0.05);
      const strip = new THREE.Mesh(stripGeo, glowGreen);
      strip.position.set(side * 1.2, 1.95, 0.36);
      robot.add(strip);

      // Upper arm
      const upperArmGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.8, 8);
      const upperArm = new THREE.Mesh(upperArmGeo, darkMetal);
      upperArm.position.set(side * 1.25, 1.3, 0);
      robot.add(upperArm);

      // Elbow joint
      const elbowGeo = new THREE.SphereGeometry(0.16, 8, 8);
      const elbow = new THREE.Mesh(elbowGeo, chromeMetal);
      elbow.position.set(side * 1.25, 0.85, 0);
      robot.add(elbow);

      // Forearm
      const forearmGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.7, 8);
      const forearm = new THREE.Mesh(forearmGeo, darkMetal);
      forearm.position.set(side * 1.3, 0.4, 0.1);
      forearm.rotation.x = 0.2;
      robot.add(forearm);

      // Forearm glow strip
      const fStripGeo = new THREE.BoxGeometry(0.04, 0.5, 0.04);
      const fStrip = new THREE.Mesh(fStripGeo, glowGreenDim);
      fStrip.position.set(side * 1.3, 0.4, 0.22);
      robot.add(fStrip);

      // Hand
      const handGeo = new THREE.BoxGeometry(0.18, 0.25, 0.15);
      const hand = new THREE.Mesh(handGeo, chromeMetal);
      hand.position.set(side * 1.32, 0.0, 0.15);
      robot.add(hand);
    });

    // WAIST
    const waistGeo = new THREE.BoxGeometry(1.2, 0.3, 0.7);
    const waist = new THREE.Mesh(waistGeo, chromeMetal);
    waist.position.y = 0.45;
    robot.add(waist);

    // Waist glow
    const waistGlowGeo = new THREE.BoxGeometry(1.0, 0.06, 0.05);
    const waistGlow = new THREE.Mesh(waistGlowGeo, glowGreen);
    waistGlow.position.set(0, 0.45, 0.38);
    robot.add(waistGlow);

    // LEGS
    [-1, 1].forEach(side => {
      // Upper leg
      const upperLegGeo = new THREE.CylinderGeometry(0.2, 0.17, 0.9, 8);
      const upperLeg = new THREE.Mesh(upperLegGeo, darkMetal);
      upperLeg.position.set(side * 0.4, -0.2, 0);
      robot.add(upperLeg);

      // Knee
      const kneeGeo = new THREE.SphereGeometry(0.17, 8, 8);
      const knee = new THREE.Mesh(kneeGeo, chromeMetal);
      knee.position.set(side * 0.4, -0.7, 0);
      robot.add(knee);

      // Knee glow
      const kneeGlowGeo = new THREE.SphereGeometry(0.06, 8, 8);
      const kneeGlow = new THREE.Mesh(kneeGlowGeo, glowGreen);
      kneeGlow.position.set(side * 0.4, -0.7, 0.17);
      robot.add(kneeGlow);

      // Lower leg
      const lowerLegGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.9, 8);
      const lowerLeg = new THREE.Mesh(lowerLegGeo, darkMetal);
      lowerLeg.position.set(side * 0.4, -1.3, 0);
      robot.add(lowerLeg);

      // Lower leg glow strip
      const lStripGeo = new THREE.BoxGeometry(0.04, 0.6, 0.04);
      const lStrip = new THREE.Mesh(lStripGeo, glowGreenDim);
      lStrip.position.set(side * 0.4, -1.3, 0.2);
      robot.add(lStrip);

      // Foot
      const footGeo = new THREE.BoxGeometry(0.3, 0.15, 0.5);
      const foot = new THREE.Mesh(footGeo, chromeMetal);
      foot.position.set(side * 0.4, -1.82, 0.08);
      robot.add(foot);
    });

    // Position robot
    robot.position.y = -0.5;
    scene.add(robot);

    // --- FLOATING PARTICLES ---
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 10;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      particleSpeeds[i] = 0.002 + Math.random() * 0.008;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00E676,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0x111111, 0.5);
    scene.add(ambientLight);

    // Main green rim light from below-left
    const greenLight = new THREE.PointLight(0x00E676, 3, 15);
    greenLight.position.set(-3, -2, 3);
    scene.add(greenLight);

    // Top fill
    const topLight = new THREE.PointLight(0xffffff, 1.5, 20);
    topLight.position.set(0, 5, 2);
    scene.add(topLight);

    // Right rim
    const rimLight = new THREE.PointLight(0x00E676, 1.5, 12);
    rimLight.position.set(3, 2, -2);
    scene.add(rimLight);

    // Subtle back light
    const backLight = new THREE.PointLight(0x004D40, 2, 15);
    backLight.position.set(0, 0, -4);
    scene.add(backLight);

    // --- ANIMATE ---
    const clock = new THREE.Clock();

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Mouse parallax - robot follows mouse
      const targetRotY = mouseRef.current.x * 0.4;
      const targetRotX = mouseRef.current.y * -0.15;
      robot.rotation.y += (targetRotY - robot.rotation.y) * 0.04;
      robot.rotation.x += (targetRotX - robot.rotation.x) * 0.04;

      // Floating bob
      robot.position.y = -0.5 + Math.sin(t * 0.8) * 0.12;

      // Reactor pulse
      const pulse = 3.0 + Math.sin(t * 3) * 1.5;
      (reactor.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;

      // Eye pulse (subtle)
      const eyePulse = 3.5 + Math.sin(t * 2.5) * 0.8;
      (leftEye.material as THREE.MeshStandardMaterial).emissiveIntensity = eyePulse;
      (rightEye.material as THREE.MeshStandardMaterial).emissiveIntensity = eyePulse;

      // Antenna tip blink
      (antennaTip.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5 + Math.sin(t * 5) * 1.5;

      // Particles drift upward
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += particleSpeeds[i];
        if (positions[i * 3 + 1] > 5) {
          positions[i * 3 + 1] = -5;
          positions[i * 3] = (Math.random() - 0.5) * 10;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Green light subtle movement
      greenLight.position.x = -3 + Math.sin(t * 0.5) * 0.8;
      greenLight.intensity = 3 + Math.sin(t * 1.5) * 0.5;

      renderer.render(scene, camera);
    };

    animate();

    // Mouse listener
    window.addEventListener('mousemove', handleMouseMove);

    // Resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [handleMouseMove]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 z-0"
      style={{ pointerEvents: 'none' }}
    />
  );
};

export default HeroRobot;
