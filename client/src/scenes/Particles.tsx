import { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sparkles, Stars, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

export const meta = {
  title: 'Particle Systems',
  category: 'Effects',
  tags: ['Points', 'BufferGeometry', 'Sparkles', 'Stars', 'PointMaterial', 'bufferAttribute'],
  description: `Particles are the secret weapon for ambient atmosphere — galaxy fields, magic dust, rain, fire. In Three.js they're rendered as <points> with a BufferGeometry carrying position attributes.

The key pattern: a Float32Array of [x, y, z, x, y, z, ...] positions, uploaded to the GPU via bufferAttribute. For animation, either update the array each frame (dynamic) or animate via shader uniforms (GPU-side, much faster).

Drei's Sparkles and Stars are pre-built particle effects with smart defaults. Use them for quick wins, then build custom when you need full control.`,
  tips: [
    'Use Float32Array (not regular arrays) for BufferGeometry data — they map directly to GPU buffer layout.',
    'sizeAttenuation on PointsMaterial makes particles smaller with distance, giving natural depth perception.',
    'For 100k+ particles, animate in a vertex shader using a time uniform — no CPU-side array updates needed.',
    'alphaMap with a soft circle texture makes particles look like glowing orbs instead of hard squares.',
    'depthWrite={false} on particle materials prevents sorting artifacts when particles overlap.',
  ],
  code: `// Custom galaxy particle system
const COUNT = 8000
const positions = useMemo(() => {
  const pos = new Float32Array(COUNT * 3)
  for (let i = 0; i < COUNT; i++) {
    const r = Math.random() * 6
    const spin = r * 3
    const branch = (i % 3) / 3 * Math.PI * 2
    const rand = (Math.random() - 0.5) * Math.pow(Math.random(), 3) * 2
    pos[i*3]   = Math.cos(branch + spin) * r + rand
    pos[i*3+1] = rand * 0.4
    pos[i*3+2] = Math.sin(branch + spin) * r + rand
  }
  return pos
}, [])

// Rotate galaxy each frame
useFrame(({ clock }) => {
  ref.current.rotation.y = clock.elapsedTime * 0.05
})

<points ref={ref}>
  <bufferGeometry>
    <bufferAttribute
      attach="attributes-position"
      array={positions}
      count={COUNT}
      itemSize={3}
    />
  </bufferGeometry>
  <pointsMaterial
    size={0.02} sizeAttenuation
    color="#a78bfa" depthWrite={false}
    blending={THREE.AdditiveBlending}
  />
</points>`,
}

const GALAXY_COUNT = 7000

function Galaxy({ branches, spin }: { branches: number; spin: number }) {
  const ref = useRef<THREE.Points>(null!)

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(GALAXY_COUNT * 3)
    const colors = new Float32Array(GALAXY_COUNT * 3)
    const inside = new THREE.Color('#a855f7')
    const outside = new THREE.Color('#06b6d4')

    for (let i = 0; i < GALAXY_COUNT; i++) {
      const r = Math.random() * 6
      const spinAngle = r * spin
      const branchAngle = ((i % branches) / branches) * Math.PI * 2
      const rand = (x: number) => Math.pow(Math.random(), x) * (Math.random() < 0.5 ? 1 : -1)

      positions[i * 3]     = Math.cos(branchAngle + spinAngle) * r + rand(3) * 0.5
      positions[i * 3 + 1] = rand(3) * 0.25
      positions[i * 3 + 2] = Math.sin(branchAngle + spinAngle) * r + rand(3) * 0.5

      const mixed = inside.clone().lerp(outside, r / 6)
      colors[i * 3]     = mixed.r
      colors[i * 3 + 1] = mixed.g
      colors[i * 3 + 2] = mixed.b
    }
    return { positions, colors }
  }, [branches, spin])

  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.elapsedTime * 0.05
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={GALAXY_COUNT} itemSize={3} />
        <bufferAttribute attach="attributes-color" array={colors} count={GALAXY_COUNT} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.018} sizeAttenuation vertexColors
        depthWrite={false} blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function FloatingDust() {
  const ref = useRef<THREE.Points>(null!)
  const COUNT = 3000

  const positions = useMemo(() => {
    const pos = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 16
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16
    }
    return pos
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.1
    for (let i = 0; i < COUNT; i++) {
      const pi = i * 3
      positions[pi + 1] = ((positions[pi + 1] + t * 0.005) % 8) - 4
    }
    const geo = ref.current.geometry
    const attr = geo.attributes.position as THREE.BufferAttribute
    attr.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={COUNT} itemSize={3} />
      </bufferGeometry>
      <PointMaterial size={0.02} color="#ffffff" depthWrite={false} sizeAttenuation opacity={0.6} transparent />
    </points>
  )
}

type Demo = 'galaxy' | 'dust' | 'sparkles' | 'stars'

export default function ParticlesScene() {
  const [demo, setDemo] = useState<Demo>('galaxy')
  const [branches, setBranches] = useState(3)
  const [spin, setSpin] = useState(3)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [0, 3, 8], fov: 55 }} dpr={[1, 2]}>
        <color attach="background" args={['#020205']} />

        {demo === 'galaxy' && <Galaxy branches={branches} spin={spin} />}

        {demo === 'dust' && <FloatingDust />}

        {demo === 'sparkles' && (
          <>
            <ambientLight intensity={0.2} />
            <mesh>
              <torusKnotGeometry args={[1.2, 0.4, 200, 32]} />
              <meshStandardMaterial color="#a855f7" roughness={0.2} metalness={0.8} />
            </mesh>
            <Sparkles count={200} scale={4} size={4} speed={0.4} color="#a78bfa" />
            <Sparkles count={100} scale={6} size={2} speed={0.2} color="#06b6d4" />
          </>
        )}

        {demo === 'stars' && (
          <>
            <Stars radius={80} depth={60} count={6000} factor={4} saturation={0.5} fade speed={0.5} />
            <ambientLight intensity={0.1} />
            <mesh>
              <sphereGeometry args={[1, 64, 64]} />
              <meshStandardMaterial color="#0050ff" emissive="#001040" roughness={0.3} metalness={0.7} />
            </mesh>
          </>
        )}

        <OrbitControls />
      </Canvas>

      <div className="overlay">
        <div className="ctrl-card">
          <div className="ctrl-title">Particle System</div>
          {(['galaxy', 'dust', 'sparkles', 'stars'] as Demo[]).map(d => (
            <div className="ctrl-row" key={d}>
              <button className={`cbtn ${demo === d ? 'on' : ''}`}
                onClick={() => setDemo(d)} style={{ width: '100%' }}>
                {d === 'galaxy' ? 'Custom Galaxy' : d === 'dust' ? 'Floating Dust' :
                  d === 'sparkles' ? 'Drei Sparkles' : 'Drei Stars'}
              </button>
            </div>
          ))}
        </div>
        {demo === 'galaxy' && (
          <div className="ctrl-card">
            <div className="ctrl-title">Galaxy Config</div>
            <div className="ctrl-row">
              <span className="ctrl-lbl">Branches</span>
              <input type="range" className="cslider" min={2} max={8} step={1}
                value={branches} onChange={e => setBranches(+e.target.value)} />
              <span className="cval">{branches}</span>
            </div>
            <div className="ctrl-row">
              <span className="ctrl-lbl">Spin</span>
              <input type="range" className="cslider" min={0.5} max={6} step={0.1}
                value={spin} onChange={e => setSpin(+e.target.value)} />
              <span className="cval">{spin.toFixed(1)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
