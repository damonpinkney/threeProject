import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, OrthographicCamera, GizmoHelper, GizmoViewport, Grid, Stats } from '@react-three/drei'

export const meta = {
  title: 'Canvas Architecture & Cameras',
  category: 'Fundamentals',
  tags: ['Canvas', 'PerspectiveCamera', 'OrthographicCamera', 'dpr', 'frameloop'],
  description: `The Canvas component is your gateway into the WebGL world. Understanding its configuration unlocks major performance and visual wins.

The \`dpr\` prop controls device pixel ratio — clamp it to [1,2] to prevent performance issues on high-DPI screens. \`frameloop="demand"\` stops rendering when nothing moves, saving GPU cycles.

Camera selection fundamentally changes how your scene reads: Perspective (natural depth) vs Orthographic (no foreshortening, great for UI/isometric).`,
  tips: [
    'Use frameloop="demand" + invalidate() for static scenes — saves massive GPU power.',
    'Set gl={{ antialias: false }} on mobile targets, then use FXAA postprocessing instead.',
    'The camera prop accepts both object configs and refs. Drei\'s <PerspectiveCamera makeDefault> overrides the Canvas default at runtime.',
    'performance.min/max lets R3F auto-throttle DPR during heavy frames.',
  ],
  code: `// Canvas with full configuration
<Canvas
  shadows                        // enable shadow maps
  dpr={[1, 2]}                   // clamp device pixel ratio
  frameloop="always"             // "demand" | "always" | "never"
  gl={{
    antialias: true,
    toneMapping: THREE.ACESFilmicToneMapping,
    outputColorSpace: THREE.SRGBColorSpace,
  }}
  camera={{ fov: 75, near: 0.1, far: 1000, position: [5, 5, 5] }}
  performance={{ min: 0.5 }}     // auto-throttle DPR to 50% min
>

  {/* Runtime camera switch — makeDefault claims the active camera */}
  <PerspectiveCamera makeDefault fov={75} position={[5, 5, 5]} />
  {/* OR */}
  <OrthographicCamera makeDefault zoom={60} position={[5, 5, 5]} />

</Canvas>`,
}

function Scene({ camType }: { camType: 'perspective' | 'orthographic' }) {
  return (
    <>
      {camType === 'perspective' ? (
        <PerspectiveCamera makeDefault fov={60} position={[6, 5, 6]} />
      ) : (
        <OrthographicCamera makeDefault zoom={55} position={[6, 5, 6]} />
      )}

      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />

      <Grid
        args={[20, 20]}
        cellSize={1} cellThickness={0.5}
        sectionSize={5} sectionThickness={1}
        cellColor="#1a1a3a" sectionColor="#2d2d60"
        fadeDistance={25} fadeStrength={1}
      />

      {[[-2, 0], [0, 0], [2, 0], [-1, 2], [1, 2]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.5 + i * 0.1, z as number]} castShadow receiveShadow>
          <boxGeometry args={[0.8, 1, 0.8]} />
          <meshStandardMaterial color={`hsl(${200 + i * 30},70%,55%)`} />
        </mesh>
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0a0a18" />
      </mesh>

      <OrbitControls />
      <GizmoHelper alignment="bottom-right" margin={[70, 70]}>
        <GizmoViewport axisColors={['#e74c3c', '#2ecc71', '#3498db']} labelColor="white" />
      </GizmoHelper>
    </>
  )
}

export default function CanvasCameraScene() {
  const [camType, setCamType] = useState<'perspective' | 'orthographic'>('perspective')
  const [showStats, setShowStats] = useState(false)
  const [dpr, setDpr] = useState<[number, number]>([1, 2])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas shadows dpr={dpr} camera={{ position: [6, 5, 6] }}>
        <color attach="background" args={['#050508']} />
        <Scene camType={camType} />
        {showStats && <Stats />}
      </Canvas>

      <div className="overlay">
        <div className="ctrl-card">
          <div className="ctrl-title">Camera</div>
          <div className="ctrl-row">
            <span className="ctrl-lbl">Type</span>
            <button
              className={`cbtn ${camType === 'perspective' ? 'on' : ''}`}
              onClick={() => setCamType(camType === 'perspective' ? 'orthographic' : 'perspective')}
            >
              {camType === 'perspective' ? 'Perspective' : 'Orthographic'}
            </button>
          </div>
        </div>
        <div className="ctrl-card">
          <div className="ctrl-title">Renderer</div>
          <div className="ctrl-row">
            <span className="ctrl-lbl">DPR cap</span>
            <button
              className={`cbtn ${dpr[1] === 2 ? 'on' : ''}`}
              onClick={() => setDpr(dpr[1] === 2 ? [1, 1] : [1, 2])}
            >
              {dpr[1] === 2 ? 'High' : 'Low'}
            </button>
          </div>
          <div className="ctrl-row">
            <span className="ctrl-lbl">Stats</span>
            <button className={`cbtn ${showStats ? 'on' : ''}`} onClick={() => setShowStats(s => !s)}>
              {showStats ? 'On' : 'Off'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
