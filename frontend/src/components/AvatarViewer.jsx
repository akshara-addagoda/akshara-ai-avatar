import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

// ✅ Always use local model (stable)
const avatarPath = "/avatar.glb";

function AvatarModel({ isSpeaking }) {
  const groupRef = useRef();
  const jawRef = useRef(null);

  const { scene } = useGLTF(avatarPath);

  // ✅ Normalize + center model
  const avatar = useMemo(() => {
    const clone = scene.clone(true);

    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(size);
    box.getCenter(center);

    const maxDimension = Math.max(size.x, size.y, size.z) || 1;
    const scale = 2.5 / maxDimension;

    clone.position.sub(center);
    clone.scale.setScalar(scale);

    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return clone;
  }, [scene]);

  // ✅ Find mouth mesh
  useEffect(() => {
    jawRef.current = findMouthTarget(avatar);
  }, [avatar]);

  // 🎭 Animation loop
  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    // subtle idle movement
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.4) * 0.05;

    // breathing effect
    const pulse = isSpeaking
      ? 1 + Math.sin(clock.elapsedTime * 12) * 0.03
      : 1;

    groupRef.current.scale.setScalar(pulse);

    // 👄 mouth animation
    if (jawRef.current?.morphTargetInfluences) {
      const dict = jawRef.current.morphTargetDictionary;

      const key = Object.keys(dict).find((k) =>
        /mouth|jaw|viseme|open/i.test(k)
      );

      if (key) {
        const i = dict[key];

        jawRef.current.morphTargetInfluences[i] = isSpeaking
          ? Math.abs(Math.sin(clock.elapsedTime * 18)) * 0.8
          : 0;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, -1.2, 0]}>
      <primitive object={avatar} />
    </group>
  );
}

// 🔍 detect mouth mesh
function findMouthTarget(root) {
  let target = null;

  root.traverse((child) => {
    if (target || !child.isMesh || !child.morphTargetDictionary) return;

    const keys = Object.keys(child.morphTargetDictionary);

    if (keys.some((k) => /mouth|jaw|viseme|open/i.test(k))) {
      target = child;
    }
  });

  return target;
}

// 🟡 fallback if model loading fails
function AvatarFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.8, 32, 32]} />
      <meshStandardMaterial color="#66ccff" />
    </mesh>
  );
}

// 🎥 main viewer
function AvatarViewer({ isSpeaking }) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0.5, 4], fov: 35 }}
      gl={{ antialias: true }}
    >
      {/* background */}
      <color attach="background" args={["#0a0f1a"]} />

      {/* lights */}
      <ambientLight intensity={1.4} />

      <directionalLight
        position={[3, 4, 3]}
        intensity={2.5}
        castShadow
      />

      <spotLight
        position={[-3, 3, 2]}
        angle={0.4}
        penumbra={0.6}
        intensity={2}
      />

      {/* model */}
      <Suspense fallback={<AvatarFallback />}>
        <AvatarModel isSpeaking={isSpeaking} />
        <Environment preset="city" />
      </Suspense>

      {/* controls */}
      <OrbitControls
        enablePan={false}
        minDistance={2.5}
        maxDistance={5}
      />
    </Canvas>
  );
}

// preload model
useGLTF.preload(avatarPath);

export default AvatarViewer;