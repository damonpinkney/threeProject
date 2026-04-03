import './App.css'
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import ThreeElement from "./ThreeElement";



export default function App() {
  return (
    <>
    <Canvas
     shadows
    camera={{
      /* fov:75,
      near:3,
      far:20, */
      position:[5,5,5]

    }}>

      <color attach="background" args={['black']} />
      <OrbitControls />
      <axesHelper args={[6]} />
      <gridHelper args={[10, 10]} />
      <ThreeElement />

    </Canvas>
    </>
  )
}