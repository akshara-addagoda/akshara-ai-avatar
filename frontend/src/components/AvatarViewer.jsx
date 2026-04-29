import {
  Environment,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";

const avatarPath = "/avatar.glb";

function AvatarModel({ isSpeaking }) {
  const { scene, animations } = useGLTF(avatarPath);

  const group = useRef();
  const mixer = useRef();

  // 🎭 Play animation (removes T-pose)
  useEffect(() => {
    if (!animations || animations.length === 0) return;

    mixer.current = new THREE.AnimationMixer(scene);

    animations.forEach((clip) => {
      const action = mixer.current.clipAction(clip);
      action.play();
    });
  }, [scene, animations]);

  // 🔁 Frame loop (smooth + alive feel)
  useFrame((state, delta) => {
    // update animation
    if (mixer.current) mixer.current.update(delta);

    if (!group.current) return;

    const t = state.clock.elapsedTime;

    // subtle idle movement
    group.current.rotation.y = Math.sin(t * 0.5) * 0.04;

    // breathing effect
    group.current.position.y =
      -5.3 + Math.sin(t * 2) * 0.02;

    // speaking movement
    if (isSpeaking) {
      group.current.rotation.y = Math.sin(t * 1.5) * 0.08;
      group.current.position.y =
        -5.3 + Math.sin(t * 6) * 0.03;
    }
  });

  return (
    <group ref={group} scale={3.2} position={[0, -5.3, 0]}>
      <primitive object={scene} />
    </group>
  );
}

function AvatarViewer({ isSpeaking }) {
  return (
    <Canvas camera={{ position: [0, 1.5, 1.8], fov: 25 }}>
      {/* background */}
      <color attach="background" args={["#0a0f1a"]} />

      {/* lighting */}
      <ambientLight intensity={1.6} />
      <directionalLight position={[3, 4, 3]} intensity={2} />

      <Suspense fallback={null}>
        <AvatarModel isSpeaking={isSpeaking} />
        <Environment preset="city" />
      </Suspense>

      {/* controls */}
      <OrbitControls enablePan={false} enableZoom={false} />
    </Canvas>
  );
}

useGLTF.preload(avatarPath);

export default AvatarViewer;