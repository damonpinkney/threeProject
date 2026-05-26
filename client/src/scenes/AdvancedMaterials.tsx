import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  OrbitControls, Environment, MeshReflectorMaterial,
  MeshTransmissionMaterial, MeshDistortMaterial, MeshWobbleMaterial, Float,
} from '@react-three/drei'
import * as THREE from 'three'

export const meta = {
  title: 'Advanced Drei Materials',
  category: 'Materials',
  tags: ['MeshReflectorMaterial', 'MeshTransmissionMaterial', 'MeshDistortMaterial', 'PBR', 'IBL'],
  description: `Drei ships several sophisticated materials that would take days to implement from scratch. Each wraps complex shader logic behind a clean React API.

MeshReflectorMaterial creates real-time reflective floors using a render-to-texture pass — perfect for product showcases. MeshTransmissionMaterial simulates glass/crystal with chromatic aberration, IOR, and subsurface scattering.

MeshDistortMaterial and MeshWobbleMaterial animate vertex positions using noise and sine waves respectively — great for organic "alive" objects.`,
  tips: [
    'MeshTransmissionMaterial is expensive — use samples={4} on mobile and reserve samples={16} for desktop.',
    'MeshReflectorMaterial needs blur={[300, 100]} for a polished look; set mixBlur={1} to blend sharp + blurry.',
    'Environment drives IBL for all Drei materials. Use resolution={512} for good quality/cost balance.',
    'Both Distort and Wobble accept a speed prop. Set it to 0 to freeze the animation via state.',
  ],
  code: `// Perfect mirror floor with blur
<mesh rotation={[-Math.PI / 2, 0, 0]}>
  <planeGeometry args={[20, 20]} />
  <MeshReflectorMaterial
    blur={[300, 100]} resolution={1024}
    mixBlur={1} mixStrength={60}
    roughness={0.6} depthScale={1.2}
    minDepthThreshold={0.4} maxDepthThreshold={1.4}
    metalness={0.4}
  />
</mesh>

// Crystal/glass sphere with physics-accurate IOR
<mesh>
  <sphereGeometry args={[1, 64, 64]} />
  <MeshTransmissionMaterial
    backside samples={16} resolution={512}
    transmission={1} roughness={0.05}
    thickness={0.3} ior={1.5}
    chromaticAberration={0.06} anisotropy={0.1}
    iridescence={1} iridescenceIOR={1}
    iridescenceThicknessRange={[0, 1400]}
  />
</mesh>

// Organic animated mesh
<MeshDistortMaterial distort={0.4} speed={2} color="hotpink" />
<MeshWobbleMaterial factor={0.4} speed={2} color="royalblue" />`,
}

type MatType = 'reflector' | 'transmission' | 'distort' | 'wobble'

function Scene({ mat }: { mat: MatType }) {
  const spinRef = useRef<THREE.Mesh>(null!)
  useFrame(({ clock }) => {
    if (spinRef.current) spinRef.current.rotation.y = clock.elapsedTime * 0.4
  })

  return (
    <>
      <ambientLight intensity={0.1} />
      <Environment preset="studio" />

      {mat === 'reflector' && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
            <planeGeometry args={[20, 20]} />
            <MeshReflectorMaterial
              blur={[300, 100]} resolution={1024}
              mixBlur={1} mixStrength={60}
              roughness={0.6} depthScale={1.2}
              minDepthThreshold={0.4} maxDepthThreshold={1.4}
              metalness={0.5} color="#080818" mirror={0}
            />
          </mesh>
          {[-1.5, 0, 1.5].map((x, i) => (
            <Float key={i} speed={1 + i * 0.4} floatIntensity={0.5}>
              <mesh ref={i === 1 ? spinRef : undefined} position={[x, 1.2 + i * 0.2, 0]} castShadow>
                {i === 0 ? <sphereGeometry args={[0.5, 64, 64]} /> :
                  i === 1 ? <torusKnotGeometry args={[0.35, 0.12, 128, 32]} /> :
                    <octahedronGeometry args={[0.5]} />}
                <meshStandardMaterial color={['#a855f7', '#06b6d4', '#f59e0b'][i]} roughness={0.05} metalness={0.9} />
              </mesh>
            </Float>
          ))}
        </>
      )}

      {mat === 'transmission' && (
        <>
          <mesh ref={spinRef}>
            <torusKnotGeometry args={[0.7, 0.25, 200, 32]} />
            <MeshTransmissionMaterial
              backside samples={12} resolution={512}
              transmission={1} roughness={0.05}
              thickness={0.4} ior={1.5}
              chromaticAberration={0.06} anisotropy={0.1}
              distortionScale={0.3} temporalDistortion={0.5}
              iridescence={1} iridescenceIOR={1}
              iridescenceThicknessRange={[0, 1400]}
            />
          </mesh>
          <mesh position={[0, 0, -3]}>
            <planeGeometry args={[6, 6]} />
            <meshStandardMaterial color="#1a0050" side={THREE.DoubleSide} />
          </mesh>
          {[[-2, 0.5, -1], [2, -0.5, -1], [0, 1.5, -2]].map(([x, y, z], i) => (
            <mesh key={i} position={[x, y, z]}>
              <sphereGeometry args={[0.3, 32, 32]} />
              <meshStandardMaterial color={['#ff6b6b', '#4ecdc4', '#f7dc6f'][i]} />
            </mesh>
          ))}
          <OrbitControls />
        </>
      )}

      {mat === 'distort' && (
        <Float speed={0.5} floatIntensity={0.3}>
          <mesh ref={spinRef} scale={1.2}>
            <sphereGeometry args={[1, 64, 64]} />
            <MeshDistortMaterial
              distort={0.5} speed={2.5}
              color="#a855f7" roughness={0.1} metalness={0.5}
            />
          </mesh>
        </Float>
      )}

      {mat === 'wobble' && (
        <>
          {[0, 1, 2, 3, 4].map(i => (
            <Float key={i} speed={0.5 + i * 0.3} floatIntensity={0.4}>
              <mesh position={[Math.cos(i / 5 * Math.PI * 2) * 2, Math.sin(i * 1.3) * 0.5, Math.sin(i / 5 * Math.PI * 2) * 2]}>
                <sphereGeometry args={[0.45, 32, 32]} />
                <MeshWobbleMaterial factor={0.3 + i * 0.05} speed={1 + i * 0.5}
                  color={`hsl(${200 + i * 30},80%,60%)`} roughness={0.2} metalness={0.4} />
              </mesh>
            </Float>
          ))}
        </>
      )}

      {mat !== 'transmission' && <OrbitControls />}
    </>
  )
}

export default function AdvancedMaterialsScene() {
  const [mat, setMat] = useState<MatType>('reflector')

  const options: { id: MatType; label: string }[] = [
    { id: 'reflector', label: 'Reflector Floor' },
    { id: 'transmission', label: 'Glass / IOR' },
    { id: 'distort', label: 'Distort Morph' },
    { id: 'wobble', label: 'Wobble Spheres' },
  ]

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 2, 5], fov: 50 }}>
        <color attach="background" args={['#050508']} />
        <Scene mat={mat} />
      </Canvas>

      <div className="overlay">
        <div className="ctrl-card">
          <div className="ctrl-title">Material Demo</div>
          {options.map(o => (
            <div className="ctrl-row" key={o.id}>
              <button className={`cbtn ${mat === o.id ? 'on' : ''}`} onClick={() => setMat(o.id)}
                style={{ width: '100%' }}>
                {o.label}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
