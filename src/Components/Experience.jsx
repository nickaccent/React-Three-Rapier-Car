import Vehicle from './Vehicle';
import { Box, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Physics, RigidBody } from '@react-three/rapier';
import { useMemo, useRef } from 'react';
import { Vector3 } from 'three';
import { useControls } from 'leva';

const Experience = () => {
  const cameraRef = useRef(null);
  const bodyRef = useRef(null);

  const debugOptions = useMemo(() => {
    return {
      debug: false,
    };
  });
  const debugControls = useControls('Debug Options', debugOptions);

  const cameraOptions = useMemo(() => {
    return {
      orbit: false,
      x: { value: -2, min: -20, max: 20, step: 0.01 },
      y: { value: 10, min: 0.2, max: 20, step: 0.01 },
      z: { value: 5, min: -20, max: 20, step: 0.01 },
    };
  });
  const cameraControls = useControls('Camera Controls', cameraOptions);

  useFrame(() => {
    if (bodyRef.current && cameraOptions.orbit == false) {
      // const carPosition = bodyRef.current.translation();
      // cameraRef.current.lookAt(carPosition.x, 0, carPosition.z);
      // cameraRef.current.position.set(
      //   carPosition.x + cameraControls.x,
      //   carPosition.y + cameraControls.y,
      //   carPosition.z + cameraControls.z,
      // );
    }
  });

  return (
    <Physics debug={debugControls.debug} gravity={[0.0, -9.81, 0.0]}>
      <OrbitControls enabled={cameraControls.orbit} />
      <ambientLight intensity={0.5} />

      <directionalLight
        position={[10, 10, 10]}
        intensity={3.5}
        penumbra={1}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        castShadow
      />
      <PerspectiveCamera
        makeDefault
        position={[cameraControls.x, cameraControls.y, cameraControls.z]}
        fov={75}
        near={0.1}
        far={1000}
        ref={cameraRef}
      />
      <RigidBody
        type="fixed"
        colliders="cuboid"
        restitution={0}
        collisionGroups={65542}
        position={[0, 0, -20]}
      >
        <Box position={[0, 0, 0]} args={[10, 2.5, 1.25]} castShadow receiveShadow>
          <meshStandardMaterial color="red" />
        </Box>
      </RigidBody>

      <RigidBody
        type="fixed"
        colliders="cuboid"
        restitution={0}
        collisionGroups={65542}
        position={[0, -1, 0]}
      >
        <Box position={[0, 0, 0]} args={[200, 1, 200]} receiveShadow>
          <meshStandardMaterial color="springgreen" />
        </Box>
      </RigidBody>

      <Vehicle position={new Vector3(0, -0.18, 0)} bodyRef={bodyRef} ground_collision={65542} />
    </Physics>
  );
};

export default Experience;
