import { Canvas } from '@react-three/fiber';
import './App.css';
import Experience from './Components/Experience';
import { KeyboardControls } from '@react-three/drei';

function App() {
  const keyboardMap = [
    { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
    { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
    { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
    { name: 'right', keys: ['ArrowRight', 'KeyD'] },
    { name: 'run', keys: ['Shift'] },
    { name: 'brake', keys: ['Space'] },
    { name: 'gearUp', keys: ['Period'] },
    { name: 'gearDown', keys: ['Comma'] },
  ];

  return (
    <>
      <div className="App">
        <KeyboardControls map={keyboardMap}>
          <Canvas shadows>
            <Experience />
          </Canvas>
        </KeyboardControls>
      </div>
    </>
  );
}

export default App;
