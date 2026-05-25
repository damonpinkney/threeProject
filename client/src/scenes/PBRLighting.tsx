import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  OrbitControls, AccumulativeShadows, RandomizedLight,
  Environment, ContactShadows, Float,
} from '@react-three/drei'
import * as THREE from 'three'

export const meta = {
  title: 'PBR Lighting & Shadow Mastery',
  category: 'Lighting',
  tags: ['AccumulativeShadows', 'Environment', 'ContactShadows', 'Lightformer', 'SoftShadows'],
  description: `Production-quality lighting is the difference between a toy demo and a photorealistic render. React Three Fiber exposes the full Three.js light stack plus Drei supercharges it.

AccumulativeShadows renders hundreds of shadow samples and accumulates them — producing the soft, multi-directional shadows you'd get from a studio light box. Pair it with RandomizedLight for distributed area-light simulation.

Environment maps drive Image-Based Lighting (IBL), replacing hand-placed fill lights with a full HDR sky that realistically tints reflections and ambient response.`,
  tips: [
    'AccumulativeShadows needs temporal={true} + frames={200} for progressive refinement. Reset() it when objects move.',
    'ContactShadows is a cheap screen-space fake — use it when a ground plane isn\'t needed in the scene.',
    'Lightformers inside <Environment> create custom rectangular/circular area lights baked into the env map.',
    'PCFSoftShadowMap (the default) is good. VSMShadowMap gives softer penumbra but more artifacts.',
  ],
  code: `// Photorealistic shadow accumulation
<AccumulativeShadows
  temporal frames={200} color="#3b0764"
  colorBlend={0.5} opacity={0.9} scale={12}
  position={[0, -0.499, 0]}
>
  <RandomizedLight
    amount={8} radius={5} ambient={0.5}
    position={[5, 5, -5]} bias={0.001}
  />
</AccumulativeShadows>

// HDR Image-Based Lighting with custom Lightformers
<Environment resolution={512} background blur={0.4}>
  <Lightformer
    intensity={2} color="white"
    position={[0, 5, -9]} rotation={[0, 0, Math.PI / 3]}
    scale={[10, 10, 1]} form="rect"
  />
</Environment>

// Fast screen-space contact shadow (no real shadow map needed)
<ContactShadows
  position={[0, -0.5, 0]} opacity={0.75}
  scale={10} blur={2.5} far={4}
/>`,
}

function SpinningObject({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.elapsedTime * 0.5
    ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.3) * 0.3
  })
  return (
    <mesh ref={ref} castShadow position={[0, 0.6, 0]}>
      <dodecahedronGeometry args={[0.8, 0]} />
      <meshStandardMaterial color={color} roughness={0.1} metalness={0.8} />
    </mesh>
  )
}

function Scene({ lightMode, envPreset, objColor }: {
  lightMode: 'accumulative' | 'contact' | 'manual'
  envPreset: 'studio' | 'city' | 'sunset'
  objColor: string
}) {
  const presets: Record<string, string> = { studio: 'studio', city: 'city', sunset: 'sunset' }

  return (
    <>
      <ambientLight intensity={lightMode === 'manual' ? 0.8 : 0.1} />
      {lightMode === 'manual' && (
        <>
          <spotLight position={[5, 8, 5]} intensity={200} castShadow penumbra={0.5} angle={Math.PI / 6} />
          <spotLight position={[-5, 5, -5]} intensity={80} color="#4060ff" penumbra={0.8} angle={Math.PI / 5} />
          <pointLight position={[0, 3, 3]} intensity={50} color="#ff4060" />
        </>
      )}

      {(lightMode === 'contact' || lightMode === 'accumulative') && (
        <Environment preset={presets[envPreset] as any} />
      )}

      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
        <SpinningObject color={objColor} />
      </Float>

      {/* Side spheres to show IBL */}
      {[-2.2, -1.1, 1.1, 2.2].map((x, i) => (
        <mesh key={i} position={[x, 0.3, 0]} castShadow>
          <sphereGeometry args={[0.25, 32, 32]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={i * 0.33}
            metalness={1 - i * 0.2}
          />
        </mesh>
      ))}

      {lightMode === 'accumulative' && (
        <AccumulativeShadows
          temporal frames={200} color="#3b0764"
          colorBlend={0.5} opacity={0.9} scale={12}
          position={[0, -0.499, 0]}
        >
          <RandomizedLight amount={8} radius={5} ambient={0.5} position={[5, 5, -5]} bias={0.001} />
        </AccumulativeShadows>
      )}

      {lightMode === 'contact' && (
        <ContactShadows position={[0, -0.5, 0]} opacity={0.75} scale={10} blur={2.5} far={4} />
      )}

      {lightMode === 'manual' && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#0a0a18" />
        </mesh>
      )}

      <OrbitControls enablePan={false} minDistance={3} maxDistance={12} />
    </>
  )
}

export default function PBRLightingScene() {
  const [lightMode, setLightMode] = useState<'accumulative' | 'contact' | 'manual'>('accumulative')
  const [envPreset, setEnvPreset] = useState<'studio' | 'city' | 'sunset'>('studio')
  const [objColor, setObjColor] = useState('#a855f7')

  const colors = ['#a855f7', '#06b6d4', '#f59e0b', '#ef4444', '#22c55e']

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas shadows camera={{ position: [0, 2, 6], fov: 50 }} dpr={[1, 2]}>
        <color attach="background" args={['#050508']} />
        <Scene lightMode={lightMode} envPreset={envPreset} objColor={objColor} />
      </Canvas>

      <div className="overlay">
        <div className="ctrl-card">
          <div className="ctrl-title">Shadow Type</div>
          {(['accumulative', 'contact', 'manual'] as const).map(m => (
            <div className="ctrl-row" key={m}>
              <button className={`cbtn ${lightMode === m ? 'on' : ''}`} onClick={() => setLightMode(m)}
                style={{ width: '100%', textAlign: 'left' }}>
                {m === 'accumulative' ? 'Accumulative' : m === 'contact' ? 'Contact (fast)' : 'Manual Lights'}
              </button>
            </div>
          ))}
        </div>
        {lightMode !== 'manual' && (
          <div className="ctrl-card">
            <div className="ctrl-title">Environment</div>
            {(['studio', 'city', 'sunset'] as const).map(p => (
              <div className="ctrl-row" key={p}>
                <button className={`cbtn ${envPreset === p ? 'on' : ''}`} onClick={() => setEnvPreset(p)}
                  style={{ width: '100%' }}>
                  {p}
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="ctrl-card">
          <div className="ctrl-title">Object Color</div>
          <div className="ctrl-row" style={{ flexWrap: 'wrap', gap: 6 }}>
            {colors.map(c => (
              <div key={c} onClick={() => setObjColor(c)} style={{
                width: 22, height: 22, borderRadius: 6, background: c, cursor: 'pointer',
                border: objColor === c ? '2px solid white' : '2px solid transparent',
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
