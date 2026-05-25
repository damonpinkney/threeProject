import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  OrbitControls, RenderTexture, PerspectiveCamera,
  MeshPortalMaterial, Text, Environment, Float,
} from '@react-three/drei'
import * as THREE from 'three'

export const meta = {
  title: 'Render Textures & Portals',
  category: 'Render Pipeline',
  tags: ['RenderTexture', 'MeshPortalMaterial', 'FBO', 'offscreen', 'portal'],
  description: `Render Textures are a superpower: render an entire scene into a texture, then apply that texture to any surface. The result is a live TV screen, a mirror, a portal, or a minimap.

In Drei, <RenderTexture> wraps a framebuffer object (FBO) and lets you write JSX inside it. It creates a completely isolated sub-scene. The texture is automatically sized and updated every frame.

<MeshPortalMaterial> takes this further — it portal-renders the inner scene through the geometry's shape, with correct perspective projection so the interior feels like an actual window into another world.`,
  tips: [
    'RenderTexture children have their own camera — always provide a <PerspectiveCamera> inside it.',
    'Set anisotropy={16} on the RenderTexture for sharp sampling at oblique angles.',
    'MeshPortalMaterial blend={0} to 1 controls the blend between the portal and the base material.',
    'For multiple portals, each RenderTexture creates its own FBO — expensive at high resolution. Share textures where possible.',
    'Use frames={1} on RenderTexture for a static "snapshot" instead of live rendering to save GPU.',
  ],
  code: `// A mesh that shows a live sub-scene as its texture
<mesh>
  <boxGeometry />
  <meshStandardMaterial>
    <RenderTexture attach="map" anisotropy={16}>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight />
      <color attach="background" args={['#001030']} />
      <mesh rotation-y={clock.elapsedTime}>
        <torusKnotGeometry />
        <meshNormalMaterial />
      </mesh>
    </RenderTexture>
  </meshStandardMaterial>
</mesh>

// Portal — renders through the geometry's shape
<mesh>
  <circleGeometry args={[1.5, 64]} />
  <MeshPortalMaterial>
    <ambientLight intensity={2} />
    <Environment preset="forest" />
    <mesh>
      <sphereGeometry />
      <meshStandardMaterial color="orange" />
    </mesh>
  </MeshPortalMaterial>
</mesh>`,
}

function ScreenContent() {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.elapsedTime * 0.8
    ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.5) * 0.3
  })
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 3.5]} />
      <color attach="background" args={['#020220']} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[2, 4, 2]} intensity={2} />
      <mesh ref={ref}>
        <torusKnotGeometry args={[0.6, 0.2, 200, 32]} />
        <meshStandardMaterial color="#7c3aed" roughness={0.05} metalness={0.9} />
      </mesh>
      {/* floating particles inside screen */}
      {Array.from({ length: 20 }, (_, i) => (
        <mesh key={i} position={[
          Math.cos(i / 20 * Math.PI * 2) * 1.5,
          Math.sin(i * 0.8) * 0.8,
          Math.sin(i / 20 * Math.PI * 2) * 1.5,
        ]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color={`hsl(${i * 18},80%,70%)`} />
        </mesh>
      ))}
    </>
  )
}

function LiveScreen() {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame(({ clock }) => {
    ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.3) * 0.3
  })

  return (
    <group>
      {/* Monitor body */}
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[3.2, 2.2, 0.08]} />
        <meshStandardMaterial color="#111118" roughness={0.8} metalness={0.5} />
      </mesh>
      {/* Screen bezel */}
      <mesh position={[0, 0.05, -0.02]}>
        <boxGeometry args={[2.9, 1.9, 0.04]} />
        <meshStandardMaterial color="#0a0a14" />
      </mesh>
      {/* Screen with live RenderTexture */}
      <mesh ref={ref} position={[0, 0.05, 0]}>
        <planeGeometry args={[2.7, 1.7]} />
        <meshStandardMaterial roughness={0} metalness={0.1} envMapIntensity={0.5}>
          <RenderTexture attach="map" anisotropy={16}>
            <ScreenContent />
          </RenderTexture>
        </meshStandardMaterial>
      </mesh>
      {/* Stand */}
      <mesh position={[0, -1.2, -0.3]}>
        <boxGeometry args={[0.15, 0.5, 0.5]} />
        <meshStandardMaterial color="#111118" roughness={0.8} metalness={0.5} />
      </mesh>
      <mesh position={[0, -1.4, -0.45]}>
        <boxGeometry args={[0.8, 0.06, 0.3]} />
        <meshStandardMaterial color="#111118" roughness={0.8} metalness={0.5} />
      </mesh>
    </group>
  )
}

function PortalScene() {
  const portalRef = useRef<any>(null)

  return (
    <group>
      {/* Portal frame */}
      <mesh position={[-1.8, 0, 0]}>
        <torusGeometry args={[1.4, 0.06, 24, 64]} />
        <meshStandardMaterial color="#a855f7" roughness={0.2} metalness={0.9}
          emissive="#a855f7" emissiveIntensity={0.3} />
      </mesh>

      {/* The portal itself */}
      <mesh position={[-1.8, 0, 0]}>
        <circleGeometry args={[1.35, 64]} />
        <MeshPortalMaterial ref={portalRef}>
          <ambientLight intensity={1.5} />
          <Environment preset="forest" />
          <Float speed={1}>
            <mesh>
              <sphereGeometry args={[0.6, 32, 32]} />
              <meshStandardMaterial color="#f59e0b" roughness={0.1} metalness={0.9}
                emissive="#f59e0b" emissiveIntensity={0.2} />
            </mesh>
          </Float>
          {Array.from({ length: 8 }, (_, i) => (
            <mesh key={i} position={[
              Math.cos(i / 8 * Math.PI * 2) * 1.5,
              Math.sin(i / 8 * Math.PI * 2) * 1.5,
              -1,
            ]}>
              <octahedronGeometry args={[0.15]} />
              <meshStandardMaterial color={`hsl(${i * 45},80%,60%)`} />
            </mesh>
          ))}
        </MeshPortalMaterial>
      </mesh>

      {/* Second portal */}
      <mesh position={[1.8, 0, 0]}>
        <torusGeometry args={[1.4, 0.06, 24, 64]} />
        <meshStandardMaterial color="#06b6d4" roughness={0.2} metalness={0.9}
          emissive="#06b6d4" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[1.8, 0, 0]}>
        <circleGeometry args={[1.35, 64]} />
        <MeshPortalMaterial>
          <ambientLight intensity={1} />
          <Environment preset="night" />
          <color attach="background" args={['#000022']} />
          <Float speed={0.8}>
            <mesh>
              <torusKnotGeometry args={[0.5, 0.18, 200, 32]} />
              <meshStandardMaterial color="#06b6d4" roughness={0.05} metalness={0.9}
                emissive="#06b6d4" emissiveIntensity={0.2} />
            </mesh>
          </Float>
        </MeshPortalMaterial>
      </mesh>

      <Text fontSize={0.2} color="#94a3b8" position={[-1.8, -1.7, 0]}>Forest Portal</Text>
      <Text fontSize={0.2} color="#94a3b8" position={[1.8, -1.7, 0]}>Night Portal</Text>
    </group>
  )
}

type Demo = 'screen' | 'portal'

export default function RenderTexturesScene() {
  const [demo, setDemo] = useState<Demo>('portal')

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [0, 0, 7], fov: 50 }} dpr={[1, 2]}>
        <color attach="background" args={['#050508']} />
        <ambientLight intensity={0.3} />
        <Environment preset="studio" />

        {demo === 'screen' && <LiveScreen />}
        {demo === 'portal' && <PortalScene />}

        <OrbitControls enablePan={false} />
      </Canvas>

      <div className="overlay">
        <div className="ctrl-card">
          <div className="ctrl-title">Demo</div>
          <div className="ctrl-row">
            <button className={`cbtn ${demo === 'portal' ? 'on' : ''}`} onClick={() => setDemo('portal')} style={{ width: '100%' }}>
              Portal (MeshPortal)
            </button>
          </div>
          <div className="ctrl-row">
            <button className={`cbtn ${demo === 'screen' ? 'on' : ''}`} onClick={() => setDemo('screen')} style={{ width: '100%' }}>
              Live Screen (FBO)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
