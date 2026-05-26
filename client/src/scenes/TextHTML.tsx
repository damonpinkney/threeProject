import { useState, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { OrbitControls, Text, Html, Billboard, useCursor, Float, Environment } from '@react-three/drei'
import * as THREE from 'three'

export const meta = {
  title: 'Text, HTML & Billboard in 3D',
  category: 'UI / UX',
  tags: ['Text', 'Html', 'Billboard', 'useCursor', 'Drei', 'annotation'],
  description: `Blending UI into 3D space requires three distinct tools: Text for rendered 3D text geometry (powered by troika-three-text), Html for injecting real DOM elements into 3D space with correct depth/occlusion, and Billboard for sprites that always face the camera.

Text supports full font loading, multi-line, anchors, and even SDF rendering for crisp scaling at any zoom level. Html occlude={[meshRef]} hides the annotation when the 3D object blocks it.

useCursor from Drei manages the pointer CSS cursor — call it with hover state and it sets cursor:pointer automatically.`,
  tips: [
    'Text downloads fonts lazily. Wrap your scene in <Suspense> to show a fallback during load.',
    'Html transform positions the element in 3D space. Without it, it floats in screen-space.',
    'Billboard lockX/lockY lets you control which axes are constrained — e.g. lock vertical trees to Y only.',
    'useCursor(hovered) from Drei handles cursor CSS for you — no manual document.body.style.cursor needed.',
    'Text letterSpacing, lineHeight, textAlign all mirror CSS properties. Use maxWidth for auto-wrapping.',
  ],
  code: `// 3D rendered text (troika-three-text under the hood)
<Text
  font="/fonts/Inter-Bold.woff"
  fontSize={0.5}
  color="white"
  anchorX="center"
  anchorY="middle"
  maxWidth={4}
  textAlign="center"
  letterSpacing={-0.02}
>
  Hello World
</Text>

// Real DOM injected into 3D space with occlusion
<Html
  position={[0, 2, 0]}
  center
  occlude={[meshRef]}
  distanceFactor={8}
>
  <div className="annotation">
    Hover me!
  </div>
</Html>

// Sprite that always faces camera
<Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
  <mesh>
    <planeGeometry args={[1, 0.4]} />
    <meshBasicMaterial color="hotpink" transparent opacity={0.8} />
  </mesh>
</Billboard>

// Cursor management
const [hovered, setHovered] = useState(false)
useCursor(hovered)
<mesh
  onPointerOver={() => setHovered(true)}
  onPointerOut={() => setHovered(false)}
/>`,
}

function HoverMesh({ position, label, color }: {
  position: [number, number, number]
  label: string
  color: string
}) {
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)
  const ref = useRef<THREE.Mesh>(null!)
  useCursor(hovered)

  useFrame((_, delta) => {
    const target = hovered ? 1.2 : 1.0
    ref.current.scale.x = THREE.MathUtils.lerp(ref.current.scale.x, target, delta * 8)
    ref.current.scale.y = THREE.MathUtils.lerp(ref.current.scale.y, target, delta * 8)
    ref.current.scale.z = THREE.MathUtils.lerp(ref.current.scale.z, target, delta * 8)
    ref.current.rotation.y += delta * (hovered ? 1.5 : 0.3)
  })

  return (
    <group position={position}>
      <mesh
        ref={ref}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true) }}
        onPointerOut={() => setHovered(false)}
        onClick={() => setClicked(v => !v)}
      >
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshStandardMaterial
          color={hovered ? '#ffffff' : color}
          emissive={color}
          emissiveIntensity={hovered ? 0.5 : 0.1}
          roughness={0.1} metalness={0.8}
        />
      </mesh>

      <Html center position={[0, 0.7, 0]} distanceFactor={6}
        style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{
          background: 'rgba(9,9,15,0.9)',
          border: `1px solid ${hovered ? color : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 6, padding: '3px 8px',
          fontSize: 11, fontFamily: 'monospace',
          color: hovered ? '#fff' : '#94a3b8',
          whiteSpace: 'nowrap', transition: 'all 0.2s',
          boxShadow: hovered ? `0 0 12px ${color}44` : 'none',
        }}>
          {clicked ? '✓ clicked!' : label}
        </div>
      </Html>
    </group>
  )
}

function TextScene() {
  return (
    <>
      <Float speed={0.5} floatIntensity={0.2}>
        <Text
          fontSize={0.7}
          color="#f1f5f9"
          anchorX="center"
          anchorY="middle"
          letterSpacing={-0.03}
          position={[0, 2.5, 0]}
        >
          React Three Fiber
        </Text>
      </Float>
      <Float speed={0.8} floatIntensity={0.15}>
        <Text
          fontSize={0.32}
          color="#a78bfa"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.02}
          position={[0, 1.9, 0]}
        >
          Advanced 3D Guide
        </Text>
      </Float>

      <HoverMesh position={[-2, 0, 0]} label="hover me" color="#a855f7" />
      <HoverMesh position={[0, 0, 0]} label="click me" color="#06b6d4" />
      <HoverMesh position={[2, 0, 0]} label="interact!" color="#f59e0b" />
    </>
  )
}

function BillboardScene() {
  const labels = [
    { pos: [-2.5, 1.5, -1] as [number, number, number], text: 'Billboard Label', color: '#a855f7' },
    { pos: [2.5, 0.8, 1] as [number, number, number], text: 'Always Faces You', color: '#06b6d4' },
    { pos: [0, 2.2, -2] as [number, number, number], text: '3D Annotation', color: '#f59e0b' },
  ]

  return (
    <>
      <mesh position={[0, 0, 0]}>
        <dodecahedronGeometry args={[0.8]} />
        <meshStandardMaterial color="#a855f7" roughness={0.1} metalness={0.8} />
      </mesh>

      {labels.map(({ pos, text, color }, i) => (
        <group key={i} position={pos}>
          {/* connector line idea: small sphere */}
          <mesh>
            <sphereGeometry args={[0.04]} />
            <meshBasicMaterial color={color} />
          </mesh>
          <Billboard follow>
            <Html center distanceFactor={5} style={{ pointerEvents: 'none' }}>
              <div style={{
                background: 'rgba(9,9,15,0.92)',
                border: `1px solid ${color}66`,
                borderRadius: 5, padding: '4px 10px',
                fontSize: 11, fontFamily: 'monospace', color: '#f1f5f9',
                whiteSpace: 'nowrap',
              }}>
                {text}
              </div>
            </Html>
          </Billboard>
        </group>
      ))}
    </>
  )
}

type Demo = 'text' | 'billboard'

export default function TextHTMLScene() {
  const [demo, setDemo] = useState<Demo>('text')

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [0, 1.5, 6], fov: 55 }} dpr={[1, 2]}>
        <color attach="background" args={['#050508']} />
        <ambientLight intensity={0.3} />
        <Environment preset="studio" />

        {demo === 'text' && <TextScene />}
        {demo === 'billboard' && <BillboardScene />}

        <OrbitControls />
      </Canvas>

      <div className="overlay">
        <div className="ctrl-card">
          <div className="ctrl-title">Demo</div>
          <div className="ctrl-row">
            <button className={`cbtn ${demo === 'text' ? 'on' : ''}`} onClick={() => setDemo('text')} style={{ width: '100%' }}>
              Text + Html + Hover
            </button>
          </div>
          <div className="ctrl-row">
            <button className={`cbtn ${demo === 'billboard' ? 'on' : ''}`} onClick={() => setDemo('billboard')} style={{ width: '100%' }}>
              Billboard Labels
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
