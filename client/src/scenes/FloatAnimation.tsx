import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Float, Trail, MeshDistortMaterial, Environment } from '@react-three/drei'
import * as THREE from 'three'

export const meta = {
  title: 'Advanced Animation Techniques',
  category: 'Animation',
  tags: ['useFrame', 'Float', 'Trail', 'spring', 'lerp', 'easing', 'delta'],
  description: `Animation in R3F lives in useFrame — a callback run every render tick that receives the clock and delta. Mastering it unlocks everything from simple rotations to complex procedural choreography.

Always use delta (time since last frame) for movement, not raw clock values, so animations remain frame-rate independent. The lerp pattern (value += (target - value) * speed * delta) is the simplest spring approximation.

Drei's Float component handles the rhythmic floating motion pattern for you. Trail creates motion blur streaks behind moving objects.`,
  tips: [
    'Multiply movement by delta for framerate-independent animation: pos += speed * delta.',
    'Math.sin/cos are your best friends — combine them at different frequencies for organic motion.',
    'The lerp smoothing pattern: ref.current.value = THREE.MathUtils.lerp(ref.current.value, target, 0.05) is a cheap spring.',
    'useFrame receives state.camera — animate the camera directly for cinematic sequences.',
    'Return early in useFrame if a ref is null (before mount). Use null! assertion for eager access.',
  ],
  code: `// Frame-rate independent rotation with delta
useFrame((state, delta) => {
  ref.current.rotation.y += delta * 0.5

  // Lerp toward target — cheap spring approximation
  ref.current.position.y = THREE.MathUtils.lerp(
    ref.current.position.y, targetY, delta * 3
  )

  // Organic multi-frequency oscillation
  const t = state.clock.elapsedTime
  ref.current.position.x = Math.sin(t * 1.1) * Math.cos(t * 0.7) * 2
  ref.current.position.z = Math.cos(t * 0.9) * Math.sin(t * 1.3) * 2
})

// Drei Float — rhythmic floating with spring config
<Float
  speed={2}               // oscillation frequency
  rotationIntensity={1}   // how much it rotates
  floatIntensity={1}      // how high it bobs
  floatingRange={[-0.2, 0.2]}
>
  <mesh>...</mesh>
</Float>

// Trail — motion blur streak
<Trail
  width={1} length={6} color="hotpink"
  attenuation={t => t * t}
>
  <mesh>...</mesh>
</Trail>`,
}

function OrbitingOrb({ index, total, color }: { index: number; total: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null!)
  const trailRef = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const baseAngle = (index / total) * Math.PI * 2
    const speed = 0.4 + index * 0.08
    const radius = 2.2 + Math.sin(t * 0.3 + index) * 0.4

    const x = Math.cos(baseAngle + t * speed) * radius
    const z = Math.sin(baseAngle + t * speed) * radius
    const y = Math.sin(t * 0.8 + index * 1.1) * 0.8

    ref.current.position.set(x, y, z)
    ref.current.rotation.y = t * 2
    ref.current.rotation.z = t * 1.3
    trailRef.current.position.set(x, y, z)
  })

  return (
    <>
      <Trail width={0.8} length={8} color={color} attenuation={t => t * t}>
        <mesh ref={trailRef}>
          <sphereGeometry args={[0.001]} />
          <meshBasicMaterial />
        </mesh>
      </Trail>
      <mesh ref={ref}>
        <octahedronGeometry args={[0.18]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} roughness={0.1} metalness={0.8} />
      </mesh>
    </>
  )
}

function LerpTarget({ show }: { show: boolean }) {
  const ref = useRef<THREE.Mesh>(null!)
  const targetY = show ? 2 : 0

  useFrame((_, delta) => {
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, targetY, delta * 3)
    ref.current.rotation.x += delta * 0.5
    ref.current.rotation.z += delta * 0.3
  })

  return (
    <mesh ref={ref}>
      <torusKnotGeometry args={[0.5, 0.18, 200, 32]} />
      <MeshDistortMaterial color="#06b6d4" distort={0.2} speed={2} roughness={0.1} metalness={0.6} />
    </mesh>
  )
}

function CinematicCamera() {
  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime * 0.2
    camera.position.x = Math.sin(t) * 7
    camera.position.z = Math.cos(t) * 7
    camera.position.y = 2 + Math.sin(t * 0.5) * 1.5
    camera.lookAt(0, 0, 0)
  })
  return null
}

type Demo = 'orbits' | 'lerp' | 'float' | 'cinematic'

export default function FloatAnimationScene() {
  const [demo, setDemo] = useState<Demo>('orbits')
  const [floatUp, setFloatUp] = useState(false)

  const orbColors = ['#a855f7', '#06b6d4', '#f59e0b', '#ef4444', '#22c55e']

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [0, 3, 8], fov: 55 }} dpr={[1, 2]}>
        <color attach="background" args={['#050508']} />
        <ambientLight intensity={0.2} />
        <Environment preset="studio" />

        {demo === 'orbits' && (
          <>
            <mesh>
              <sphereGeometry args={[0.6, 64, 64]} />
              <meshStandardMaterial color="#ffffff" roughness={0} metalness={1} />
            </mesh>
            {orbColors.map((c, i) => (
              <OrbitingOrb key={i} index={i} total={orbColors.length} color={c} />
            ))}
            <OrbitControls />
          </>
        )}

        {demo === 'lerp' && (
          <>
            <LerpTarget show={floatUp} />
            <OrbitControls />
          </>
        )}

        {demo === 'float' && (
          <>
            {[[-2, 0], [0, 0.3], [2, -0.2]].map(([x], i) => (
              <Float key={i} speed={1 + i * 0.5} floatIntensity={0.6 + i * 0.2}
                rotationIntensity={0.3 + i * 0.1}>
                <mesh position={[x, 0, 0]}>
                  {i === 0 ? <boxGeometry args={[0.8, 0.8, 0.8]} /> :
                    i === 1 ? <dodecahedronGeometry args={[0.5]} /> :
                      <torusGeometry args={[0.4, 0.15, 32, 64]} />}
                  <meshStandardMaterial
                    color={orbColors[i]} roughness={0.1} metalness={0.8}
                    emissive={orbColors[i]} emissiveIntensity={0.1}
                  />
                </mesh>
              </Float>
            ))}
            <OrbitControls />
          </>
        )}

        {demo === 'cinematic' && (
          <>
            <CinematicCamera />
            {[0, 1, 2, 3, 4, 5, 6].map(i => (
              <Float key={i} speed={0.5 + i * 0.2} floatIntensity={0.4}>
                <mesh position={[
                  Math.cos(i / 7 * Math.PI * 2) * 3,
                  (i % 3 - 1) * 1.2,
                  Math.sin(i / 7 * Math.PI * 2) * 3,
                ]}>
                  <octahedronGeometry args={[0.3 + (i % 3) * 0.1]} />
                  <meshStandardMaterial color={orbColors[i % 5]} roughness={0.1} metalness={0.9}
                    emissive={orbColors[i % 5]} emissiveIntensity={0.2} />
                </mesh>
              </Float>
            ))}
          </>
        )}
      </Canvas>

      <div className="overlay">
        <div className="ctrl-card">
          <div className="ctrl-title">Animation Demo</div>
          {([
            ['orbits', 'Trail Orbits'],
            ['lerp', 'Lerp Spring'],
            ['float', 'Drei Float'],
            ['cinematic', 'Camera Path'],
          ] as [Demo, string][]).map(([id, label]) => (
            <div className="ctrl-row" key={id}>
              <button className={`cbtn ${demo === id ? 'on' : ''}`}
                onClick={() => setDemo(id)} style={{ width: '100%' }}>
                {label}
              </button>
            </div>
          ))}
        </div>
        {demo === 'lerp' && (
          <div className="ctrl-card">
            <div className="ctrl-title">Lerp Target</div>
            <div className="ctrl-row">
              <button className={`cbtn ${floatUp ? 'on' : ''}`} onClick={() => setFloatUp(v => !v)}
                style={{ width: '100%' }}>
                {floatUp ? 'Float Up → Down' : 'Float Down → Up'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
