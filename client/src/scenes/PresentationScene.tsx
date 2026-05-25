import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  PresentationControls, Stage, Float, Environment,
  MeshTransmissionMaterial, MeshDistortMaterial,
} from '@react-three/drei'
import * as THREE from 'three'

export const meta = {
  title: 'PresentationControls & Stage',
  category: 'UX Patterns',
  tags: ['PresentationControls', 'Stage', 'spring', 'snap', 'product showcase'],
  description: `PresentationControls replaces OrbitControls for product/model showcases. It adds spring physics — drag to rotate, release, and it snaps back to the rest position with configurable tension and mass.

The snap prop accepts spring config { mass, tension } and enables the auto-return behavior. polar and azimuth clamp the rotation range. The global prop makes the entire canvas the drag target instead of requiring pointer-down on the mesh.

Stage is a complete studio setup: auto-centers geometry, adds an environment preset, sets up contact shadows, and computes ideal camera framing. It's the fastest path from model to presentable.`,
  tips: [
    'Set config={{ mass: 2, tension: 400 }} for springy/bouncy feel. Higher tension = snappier.',
    'snap={false} disables auto-return; snap={{ mass:4, tension: 1500 }} makes it snap back faster.',
    'Stage adjusts itself to any geometry bounds. Pass adjustCamera={false} if you want manual camera control.',
    'PresentationControls works great with @react-spring/three for gesture-driven GSAP-style animations.',
    'The polar and azimuth ranges are in radians. [-Math.PI/3, Math.PI/3] gives 60° tilt range.',
  ],
  code: `// Self-returning spring drag controls for model showcase
<PresentationControls
  global                           // canvas-wide drag target
  config={{ mass: 2, tension: 500 }}
  snap={{ mass: 4, tension: 1500 }}// spring-back on release
  rotation={[0, 0.3, 0]}          // initial rotation
  polar={[-Math.PI / 3, Math.PI / 3]}    // vertical range
  azimuth={[-Math.PI / 1.4, Math.PI / 2]} // horizontal range
>
  <Float rotationIntensity={0.4}>
    <mesh>
      <torusKnotGeometry args={[0.8, 0.3, 200, 32]} />
      <meshStandardMaterial roughness={0.1} metalness={0.9} />
    </mesh>
  </Float>
</PresentationControls>

// Auto-framed studio with IBL + contact shadows
<Stage
  preset="rembrandt"   // "rembrandt" | "portrait" | "upfront" | "soft"
  intensity={0.5}
  shadows="contact"
  adjustCamera={1.2}
  environment="studio"
>
  <mesh>...</mesh>
</Stage>`,
}

function ShowcaseKnot({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame(({ clock }) => {
    ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.3) * 0.1
  })
  return (
    <mesh ref={ref} castShadow>
      <torusKnotGeometry args={[0.9, 0.32, 256, 32]} />
      <meshStandardMaterial color={color} roughness={0.05} metalness={0.9} />
    </mesh>
  )
}

function GlassObject() {
  return (
    <mesh castShadow>
      <sphereGeometry args={[1.1, 64, 64]} />
      <MeshTransmissionMaterial
        backside samples={10} resolution={256}
        transmission={1} roughness={0.05}
        thickness={0.5} ior={1.5}
        chromaticAberration={0.06}
        distortionScale={0.3} temporalDistortion={0.5}
        iridescence={0.8} iridescenceIOR={1}
        iridescenceThicknessRange={[0, 1400]}
      />
    </mesh>
  )
}

function MorphBlob() {
  return (
    <Float speed={1} floatIntensity={0.3}>
      <mesh castShadow>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial distort={0.5} speed={2} color="#a855f7" roughness={0.1} metalness={0.6} />
      </mesh>
    </Float>
  )
}

type Obj = 'knot' | 'glass' | 'blob'

export default function PresentationSceneDemo() {
  const [obj, setObj] = useState<Obj>('knot')
  const [color, setColor] = useState('#06b6d4')
  const [snap, setSnap] = useState(true)
  const [useStage, setUseStage] = useState(false)

  const colors = ['#06b6d4', '#a855f7', '#f59e0b', '#22c55e', '#ef4444']

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 5], fov: 45 }}>
        <color attach="background" args={['#050508']} />

        {useStage ? (
          <Stage
            preset="rembrandt"
            intensity={0.6}
            shadows="contact"
            environment="studio"
          >
            {obj === 'knot' && <ShowcaseKnot color={color} />}
            {obj === 'glass' && <GlassObject />}
            {obj === 'blob' && <MorphBlob />}
          </Stage>
        ) : (
          <>
            <ambientLight intensity={0.1} />
            <Environment preset="studio" />
            <PresentationControls
              global
              config={{ mass: 2, tension: 500 }}
              snap={snap ? { mass: 4, tension: 1500 } : false}
              rotation={[0, 0.3, 0]}
              polar={[-Math.PI / 3, Math.PI / 3]}
              azimuth={[-Math.PI / 1.4, Math.PI / 2]}
            >
              <Float rotationIntensity={0.3} floatIntensity={0.4} speed={1.5}>
                {obj === 'knot' && <ShowcaseKnot color={color} />}
                {obj === 'glass' && <GlassObject />}
                {obj === 'blob' && <MorphBlob />}
              </Float>
            </PresentationControls>
          </>
        )}
      </Canvas>

      <div className="overlay">
        <div className="ctrl-card">
          <div className="ctrl-title">Controls Mode</div>
          <div className="ctrl-row">
            <button className={`cbtn ${!useStage ? 'on' : ''}`} onClick={() => setUseStage(false)} style={{ width: '100%' }}>
              PresentationControls
            </button>
          </div>
          <div className="ctrl-row">
            <button className={`cbtn ${useStage ? 'on' : ''}`} onClick={() => setUseStage(true)} style={{ width: '100%' }}>
              Stage (auto-lit)
            </button>
          </div>
          {!useStage && (
            <div className="ctrl-row">
              <span className="ctrl-lbl">Snap back</span>
              <button className={`cbtn ${snap ? 'on' : ''}`} onClick={() => setSnap(v => !v)}>
                {snap ? 'On' : 'Off'}
              </button>
            </div>
          )}
        </div>
        <div className="ctrl-card">
          <div className="ctrl-title">Object</div>
          {(['knot', 'glass', 'blob'] as Obj[]).map(o => (
            <div className="ctrl-row" key={o}>
              <button className={`cbtn ${obj === o ? 'on' : ''}`} onClick={() => setObj(o)} style={{ width: '100%' }}>
                {o === 'knot' ? 'Torus Knot' : o === 'glass' ? 'Glass Sphere' : 'Morph Blob'}
              </button>
            </div>
          ))}
        </div>
        {obj === 'knot' && (
          <div className="ctrl-card">
            <div className="ctrl-title">Color</div>
            <div className="ctrl-row" style={{ flexWrap: 'wrap', gap: 6 }}>
              {colors.map(c => (
                <div key={c} onClick={() => setColor(c)} style={{
                  width: 22, height: 22, borderRadius: 6, background: c, cursor: 'pointer',
                  border: color === c ? '2px solid white' : '2px solid transparent',
                }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
