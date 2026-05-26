import { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Instances, Instance, PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'

export const meta = {
  title: 'GPU Instancing & Performance',
  category: 'Performance',
  tags: ['InstancedMesh', 'Instances', 'PerformanceMonitor', 'useFrame', 'Object3D'],
  description: `Rendering thousands of individual meshes kills performance — each is a separate draw call. GPU instancing collapses N meshes into one draw call by uploading a transform matrix per instance.

R3F exposes Two instancing patterns: raw <instancedMesh> (full manual control, best for animated instances) and Drei's <Instances> + <Instance> (declarative React API, syncs on render).

For per-frame animation, the Object3D dummy pattern is the most efficient: mutate dummy.position/rotation/scale, call dummy.updateMatrix(), then setMatrixAt(i, dummy.matrix) and mark instanceMatrix.needsUpdate = true.`,
  tips: [
    'Create the dummy Object3D with useMemo — never inside useFrame, that allocates every frame.',
    '<Instances> is convenient but rebuilds on count change. Use raw instancedMesh when instances are dynamic.',
    'PerformanceMonitor adjusts DPR and scales COUNT automatically. Set onDecline to reduce work.',
    'frustumCulled={false} on instancedMesh disables per-instance culling (expensive). Only disable if needed.',
    'For colored instances: use instancedMesh + setColorAt(i, color). Color buffer needs colorsNeedUpdate = true.',
  ],
  code: `const COUNT = 800
const dummy = useMemo(() => new THREE.Object3D(), [])

useFrame(({ clock }) => {
  const t = clock.elapsedTime
  for (let i = 0; i < COUNT; i++) {
    const angle = (i / COUNT) * Math.PI * 2
    const radius = 2 + (i / COUNT) * 3
    const speed = 0.2 + (i / COUNT) * 0.3
    dummy.position.set(
      Math.cos(angle + t * speed) * radius,
      Math.sin(t * 0.5 + i * 0.1) * 1.5,
      Math.sin(angle + t * speed) * radius,
    )
    dummy.rotation.set(t + i, t * 0.5, 0)
    dummy.scale.setScalar(0.05 + Math.sin(t + i) * 0.02)
    dummy.updateMatrix()
    meshRef.current.setMatrixAt(i, dummy.matrix)
  }
  meshRef.current.instanceMatrix.needsUpdate = true
})

return (
  <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="royalblue" />
  </instancedMesh>
)`,
}

function AnimatedInstances({ count }: { count: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const colorObj = useMemo(() => new THREE.Color(), [])

  useEffect(() => {
    if (!meshRef.current) return
    for (let i = 0; i < count; i++) {
      colorObj.setHSL(i / count, 0.8, 0.55)
      meshRef.current.setColorAt(i, colorObj)
    }
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [count, colorObj])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const radius = 1.5 + (i / count) * 3.5
      const speed = 0.15 + (i / count) * 0.4
      const yOffset = (i % 7) - 3
      dummy.position.set(
        Math.cos(angle + t * speed) * radius,
        Math.sin(t * 0.4 + i * 0.1) * 1.2 + yOffset * 0.3,
        Math.sin(angle + t * speed) * radius,
      )
      dummy.rotation.set(t * 0.8 + i * 0.1, t * 0.5, t * 0.3)
      dummy.scale.setScalar(0.06 + Math.sin(t * 1.5 + i) * 0.015)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.3} metalness={0.6} />
    </instancedMesh>
  )
}

function DeclaredInstances({ count }: { count: number }) {
  const positions = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2
      const r = 1.5 + (i / count) * 3
      return [Math.cos(angle) * r, (Math.random() - 0.5) * 4, Math.sin(angle) * r] as [number, number, number]
    })
  }, [count])

  return (
    <Instances limit={count}>
      <sphereGeometry args={[0.07, 12, 12]} />
      <meshStandardMaterial color="#a855f7" roughness={0.2} metalness={0.8} />
      {positions.map((pos, i) => (
        <Instance key={i} position={pos} color={`hsl(${(i / count) * 300},80%,60%)`} />
      ))}
    </Instances>
  )
}

type Mode = 'animated' | 'declared'

export default function InstancingScene() {
  const [count, setCount] = useState(600)
  const [mode, setMode] = useState<Mode>('animated')
  const [dpr, setDpr] = useState(1.5)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 5, 10], fov: 55 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#050508']} />
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={2} />
        <pointLight position={[-10, -5, -5]} intensity={50} color="#a855f7" />

        <PerformanceMonitor
          onDecline={() => setDpr(d => Math.max(0.5, d - 0.25))}
          onIncline={() => setDpr(d => Math.min(2, d + 0.25))}
        />

        {mode === 'animated'
          ? <AnimatedInstances count={count} />
          : <DeclaredInstances count={count} />}

        <OrbitControls />
      </Canvas>

      <div className="overlay">
        <div className="ctrl-card">
          <div className="ctrl-title">Mode</div>
          <div className="ctrl-row">
            <button className={`cbtn ${mode === 'animated' ? 'on' : ''}`} onClick={() => setMode('animated')}>Animated GPU</button>
          </div>
          <div className="ctrl-row">
            <button className={`cbtn ${mode === 'declared' ? 'on' : ''}`} onClick={() => setMode('declared')}>Drei Instances</button>
          </div>
        </div>
        <div className="ctrl-card">
          <div className="ctrl-title">Instance Count</div>
          <div className="ctrl-row">
            <span className="ctrl-lbl">Count</span>
            <input type="range" className="cslider" min={50} max={2000} step={50}
              value={count} onChange={e => setCount(+e.target.value)} />
            <span className="cval">{count}</span>
          </div>
          <div className="ctrl-row">
            <span className="ctrl-lbl">DPR</span>
            <span className="cval">{dpr.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
