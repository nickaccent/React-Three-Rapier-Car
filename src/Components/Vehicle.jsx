import { useGLTF, useKeyboardControls } from '@react-three/drei';
import { useEffect, useRef, useState, forwardRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  RigidBody,
  useRevoluteJoint,
  CylinderCollider,
  CuboidCollider,
  useRapier,
} from '@react-three/rapier';
import { Quaternion, Vector3 } from 'three';
import * as THREE from 'three';
import { Lensflare, LensflareElement } from 'three/examples/jsm/Addons.js';
import { useControls } from 'leva';

const ImpulseJoint = forwardRef(({ body, axel, bodyAnchor, wheelAnchor, rotationAxis }, ref) => {
  const { rapier } = useRapier();
  const joint = useRevoluteJoint(axel, body, [bodyAnchor, wheelAnchor, rotationAxis]);

  useEffect(() => {
    joint.current.configureMotorModel(rapier.MotorModel.ForceBased);
  }, [joint]);

  useEffect(() => {
    if (ref) ref.current = joint.current;
  }, [joint, ref]);
  return null;
});

const WheelJoint = forwardRef(
  ({ body, wheel, bodyAnchor, wheelAnchor, rotationAxis, index }, ref) => {
    const joint = useRevoluteJoint(wheel, body, [bodyAnchor, wheelAnchor, rotationAxis]);
    useEffect(() => {
      if (ref) ref.current = joint.current;
    }, [joint, ref]);
    return null;
  },
);

const Vehicle = ({ position, bodyRef, ground_collision }) => {
  const [{ gear }, set] = useControls(() => ({ gear: { value: 0, min: -1, max: 5, step: 1 } }));
  const [, get] = useKeyboardControls();
  const fixed = 'dynamic';
  const wheelsFixed = 'dynamic';
  const showHeadlights = false;
  const [loaded, setLoaded] = useState(false);

  let wheelBLMotor = useRef(null);
  let wheelBRMotor = useRef(null);
  let wheelFLMotor = useRef(null);
  let wheelFRMotor = useRef(null);
  let wheelFLAxel = useRef(null);
  let wheelFRAxel = useRef(null);

  let axelFLBody = useRef(null);
  let axelFRBody = useRef(null);

  const wheelPositions = [
    [-0.45, 0, 0.66],
    [0.45, 0, 0.66],
    [-0.45, 0, -0.66],
    [0.45, 0, -0.66],
  ];

  const axelRotations = [
    [1, 0, 0],
    [1, 0, 0],
    [1, 0, 0],
    [1, 0, 0],
  ];

  const wheelRotations = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -Math.PI / 2);

  const wheelRefs = useRef(wheelPositions.map(() => useRef(null)));

  const model = `./models/sedanSports.glb`;
  const { scene } = useGLTF(model);
  const [carMesh, setCarMesh] = useState(null);
  const [wheelMeshes, setWheelMeshes] = useState([null, null, null, null]);
  const [lastChangeTime, setLastChangeTime] = useState(0);
  const interval = 500; // 1/2 second interval in milliseconds

  useFrame(({ clock }) => {
    if (loaded) {
      const currentTime = clock.getElapsedTime() * 1000;
      if (currentTime - lastChangeTime >= interval) {
        if (get().gearUp) {
          if (gear < 5) {
            set({ gear: gear + 1 });
            setLastChangeTime(currentTime);
          }
        }
        if (get().gearDown) {
          if (gear > -1) {
            console.log('lower');
            set({ gear: gear - 1 });
            setLastChangeTime(currentTime);
          }
        }
      }

      let targetVelocity = 0;
      let targetStiffness = 2.0;
      if (get().forward) {
        if (gear == 0) {
          targetVelocity = 0;
          targetStiffness = 2.0;
        } else if (gear == 1) {
          targetVelocity = 50;
          targetStiffness = 2.0;
        } else if (gear == 2) {
          targetVelocity = 100;
          targetStiffness = 2.0;
        } else if (gear == 3) {
          targetVelocity = 200;
          targetStiffness = 2.0;
        } else if (gear == 4) {
          targetVelocity = 350;
          targetStiffness = 2.0;
        } else if (gear == 5) {
          targetVelocity = 500;
          targetStiffness = 2.0;
        } else if (gear == -1) {
          targetVelocity = -200;
          targetStiffness = 2.0;
        }
      } else if (get().backward) {
        targetVelocity = 0;
        if (gear == 0) {
          targetStiffness = 2.0;
        } else if (gear == 1) {
          targetStiffness = 200;
        } else if (gear == 2) {
          targetStiffness = 200;
        } else if (gear == 3) {
          targetStiffness = 200;
        } else if (gear == 4) {
          targetStiffness = 300;
        } else if (gear == 5) {
          targetStiffness = 400;
        }
      } else if (get().brake) {
        targetVelocity = 0;
        if (gear == 0) {
          targetStiffness = 2.0;
        } else if (gear == 1) {
          targetStiffness = 200;
        } else if (gear == 2) {
          targetStiffness = 200;
        } else if (gear == 3) {
          targetStiffness = 200;
        } else if (gear == 4) {
          targetStiffness = 300;
        } else if (gear == 5) {
          targetStiffness = 400;
        }
      } else {
        targetVelocity = 0;
        targetStiffness = 200;
      }

      if (wheelBLMotor.current != null) {
        wheelBLMotor.current.configureMotorVelocity(targetVelocity, targetStiffness);
      }
      if (wheelBRMotor.current != null) {
        wheelBRMotor.current.configureMotorVelocity(targetVelocity, targetStiffness);
      }

      let targetSteer = 0;
      if (get().left) {
        targetSteer -= 0.6;
      }
      if (get().right) {
        targetSteer += 0.6;
      }
      if (wheelFLAxel.current != null) {
        wheelFLAxel.current.configureMotorPosition(targetSteer, 100, 10);
      }
      if (wheelFRAxel.current != null) {
        wheelFRAxel.current.configureMotorPosition(targetSteer, 100, 10);
      }
    }
  });

  useEffect(() => {
    setCarMesh(scene.getObjectByName('body'));
    setWheelMeshes([
      scene.getObjectByName('wheel_backLeft'),
      scene.getObjectByName('wheel_backRight'),
      scene.getObjectByName('wheel_frontLeft'),
      scene.getObjectByName('wheel_frontRight'),
    ]);

    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    setLoaded(true);
  }, [scene]);

  useEffect(() => {
    if (carMesh != null && showHeadlights) {
      let lightLeftTarget = new THREE.Object3D();
      lightLeftTarget.position.set(-0.35, 1, -10);
      let lightRightTarget = new THREE.Object3D();
      lightRightTarget.position.set(0.35, 1, -10);

      const textureLoader = new THREE.TextureLoader();
      const textureFlare0 = textureLoader.load('./img/lensflare0.png');
      const textureFlare3 = textureLoader.load('./img/lensflare3.png');

      const lensflareLeft = new Lensflare();
      lensflareLeft.addElement(new LensflareElement(textureFlare0, 1000, 0));
      lensflareLeft.addElement(new LensflareElement(textureFlare3, 500, 0.2));
      lensflareLeft.addElement(new LensflareElement(textureFlare3, 250, 0.8));
      lensflareLeft.addElement(new LensflareElement(textureFlare3, 125, 0.6));
      lensflareLeft.addElement(new LensflareElement(textureFlare3, 62.5, 0.4));

      const headLightLeft = new THREE.SpotLight(undefined, Math.PI * 20);
      headLightLeft.position.set(-0.4, 0.5, -1.01);
      headLightLeft.angle = Math.PI / 4;
      headLightLeft.penumbra = 0.2;
      headLightLeft.castShadow = true;
      headLightLeft.shadow.blurSamples = 5;
      headLightLeft.shadow.radius = 2.5;

      carMesh.add(headLightLeft);
      headLightLeft.target = lightLeftTarget;
      headLightLeft.add(lensflareLeft);
      carMesh.add(lightLeftTarget);
    }
  }, [carMesh]);

  return (
    <>
      {loaded && carMesh && wheelMeshes.every(Boolean) && (
        <group position={position}>
          <RigidBody
            type={fixed}
            colliders="trimesh"
            ref={bodyRef}
            position={[0, 0, 0]}
            canSleep={false}
            restitution={0}
            mass={1}
            friction={1}
            collisionGroups={131073} // Car body collision group
            collisionMask={ground_collision}
          >
            <primitive object={carMesh} position={[0, -0.07, 0]} />
          </RigidBody>

          <group>
            <RigidBody
              position={wheelPositions[0]}
              rotation={wheelRotations.toArray()} // Rotate wheels to align with car
              colliders={false}
              type={wheelsFixed}
              key={0}
              canSleep={false}
              friction={3}
              restitutuion={0}
              ref={wheelRefs.current[0]}
              collisionGroups={262145} // Wheel collision group
              collisionMask={ground_collision}
            >
              <CylinderCollider
                position={[-0.2, 0, 0]}
                rotation={[0, 0, -Math.PI / 2]}
                args={[0.1, 0.3]} // Height and radius
              />
              <primitive object={wheelMeshes[0]} position={[0, 0, 0]} />
            </RigidBody>
            <RigidBody
              position={wheelPositions[1]}
              rotation={wheelRotations.toArray()} // Rotate wheels to align with car
              colliders={false}
              type={wheelsFixed}
              key={1}
              canSleep={false}
              friction={3}
              restitutuion={0}
              ref={wheelRefs.current[1]}
              collisionGroups={262145} // Wheel collision group
              collisionMask={ground_collision}
            >
              <CylinderCollider
                position={[0.2, 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
                args={[0.1, 0.3]} // Height and radius
              />
              <primitive object={wheelMeshes[1]} position={[0, 0, 0]} />
            </RigidBody>
            <RigidBody
              position={wheelPositions[2]}
              colliders={false}
              type="wheelsFixed"
              canSleep={false}
              restitutuion={0}
              ref={axelFLBody}
              collisionGroups={589823}
            >
              <CuboidCollider args={[0.2, 0.2, 0.2]} />
            </RigidBody>
            <RigidBody
              position={wheelPositions[2]}
              rotation={wheelRotations.toArray()} // Rotate wheels to align with car
              colliders={false}
              type={wheelsFixed}
              key={2}
              canSleep={false}
              friction={3}
              restitutuion={0}
              ref={wheelRefs.current[2]}
              collisionGroups={262145} // Wheel collision group
              collisionMask={ground_collision}
            >
              <CylinderCollider
                position={[-0.2, 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
                args={[0.1, 0.3]} // Height and radius
              />
              <primitive object={wheelMeshes[2]} position={[0, 0, 0]} />
            </RigidBody>
            <RigidBody
              position={wheelPositions[3]}
              colliders={false}
              type="wheelsFixed"
              restitutuion={0}
              canSleep={false}
              ref={axelFRBody}
              collisionGroups={589823}
            >
              <CuboidCollider args={[0.2, 0.2, 0.2]} />
            </RigidBody>
            <RigidBody
              position={wheelPositions[3]}
              rotation={wheelRotations.toArray()} // Rotate wheels to align with car
              colliders={false}
              type={wheelsFixed}
              key={3}
              canSleep={false}
              friction={3}
              restitutuion={0}
              ref={wheelRefs.current[3]}
              collisionGroups={262145} // Wheel collision group
              collisionMask={ground_collision}
            >
              <CylinderCollider
                position={[0.2, 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
                args={[0.1, 0.3]} // Height and radius
              />
              <primitive object={wheelMeshes[3]} position={[0, 0, 0]} />
            </RigidBody>
          </group>

          <group>
            <WheelJoint
              key={0}
              body={bodyRef}
              wheel={wheelRefs.current[0]}
              bodyAnchor={[0, 0, 0]}
              wheelAnchor={[wheelPositions[0][0], wheelPositions[0][1], wheelPositions[0][2]]}
              rotationAxis={axelRotations[0]}
              collisionGroups={589823}
              index={0}
              ref={wheelBLMotor}
            />
            <WheelJoint
              key={1}
              body={bodyRef}
              wheel={wheelRefs.current[1]}
              bodyAnchor={[0, 0, 0]}
              wheelAnchor={[wheelPositions[1][0], wheelPositions[1][1], wheelPositions[1][2]]}
              rotationAxis={axelRotations[1]}
              collisionGroups={589823}
              index={1}
              ref={wheelBRMotor}
            />
            <ImpulseJoint
              body={bodyRef}
              axel={axelFLBody}
              bodyAnchor={[0, 0, 0]}
              wheelAnchor={[wheelPositions[2][0], wheelPositions[2][1], wheelPositions[2][2]]}
              rotationAxis={[0, 1, 0]}
              ref={wheelFLAxel}
            />
            <WheelJoint
              key={2}
              body={axelFLBody}
              wheel={wheelRefs.current[2]}
              bodyAnchor={[0, 0, 0]}
              wheelAnchor={[0, 0, 0]}
              rotationAxis={axelRotations[2]}
              collisionGroups={589823}
              index={2}
              ref={wheelFLMotor}
            />
            <ImpulseJoint
              body={bodyRef}
              axel={axelFRBody}
              bodyAnchor={[0, 0, 0]}
              wheelAnchor={[wheelPositions[3][0], wheelPositions[3][1], wheelPositions[3][2]]}
              rotationAxis={[0, 1, 0]}
              ref={wheelFRAxel}
            />
            <WheelJoint
              key={3}
              body={axelFRBody}
              wheel={wheelRefs.current[3]}
              bodyAnchor={[0, 0, 0]}
              wheelAnchor={[0, 0, 0]}
              rotationAxis={axelRotations[3]}
              collisionGroups={589823}
              index={3}
              ref={wheelFRMotor}
            />
          </group>
        </group>
      )}
    </>
  );
};

export default Vehicle;
