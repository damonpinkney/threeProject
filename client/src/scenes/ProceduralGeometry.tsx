import { useRef, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Wireframe } from '@react-three/drei'
import * as THREE from 'three'

export const meta = {
  title: 'Procedural Geometry & BufferGeometry',
  category: 'Geometry',
  tags: ['BufferGeometry', 'bufferAttribute', 'procedural', 'morph', 'normals', 'index'],
  description: `BufferGeometry is the foundation of all Three.js geometry. Every built-in primitive (BoxGeometry, SphereGeometry) is just BufferGeometry with pre-filled attribute arrays.

Building custom geometry from scratch gives you complete control: generate terrain, organic shapes, parametric surfaces, or procedurally animated meshes. Key attributes are position (vec3 per vertex), normal (vec3 per vertex), uv (vec2 per vertex), and optionally an index buffer for shared vertices.

computeVertexNormals() auto-calculates smooth normals from face geometry — call it after modifying positions.`,
  tips: [
    'Always call geometry.computeVertexNormals() after setting positions if you want lighting to work.',
    'The index buffer is optional but halves vertex data for closed surfaces by sharing vertices across faces.',
    'For animated procedural geo, prefer a shader (vertex shader + time uniform) over CPU array updates.',
    'THREE.LatheGeometry and THREE.ExtrudeGeometry are great starting points for procedural shapes.',
    'BufferGeometryUtils.mergeGeometries([...]) merges multiple geometries into one draw call.',
  ],
  code: `// Procedural terrain plane
const geo = useMemo(() => {
  const geometry = new THREE.PlaneGeometry(10, 10, 64, 64)
  const positions = geometry.attributes.position.array as Float32Array

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i], z = positions[i + 2]
    // Sample multiple sine waves at different frequencies
    positions[i + 1] =
      Math.sin(x * 0.5) * Math.cos(z * 0.5) * 1.5 +
      Math.sin(x * 1.2) * Math.cos(z * 0.8) * 0.5
  }

  geometry.computeVertexNormals()
  return geometry
}, [])

// Animated: update positions in useFrame
useFrame(({ clock }) => {
  const t = clock.elapsedTime
  const pos = geoRef.current.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i)
    pos.setY(i, Math.sin(x * 1.5 + t) * Math.cos(z * 1.5 + t) * 0.6)
  }
  pos.needsUpdate = true
  geoRef.current.computeVertexNormals()
})`,
}

function ProceduralTerrain({ segments, animated, wireframe: showWire }: {
  segments: number
  animated: boolean
  wireframe: boolean
}) {
  const geoRef = useRef<THREE.BufferGeometry>(null!)
  const meshRef = useRef<THREE.Mesh>(null!)

  const baseGeo = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(8, 8, segments, segments)
    geometry.rotateX(-Math.PI / 2)
    const pos = geometry.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i)
      pos.setY(i,
        Math.sin(x * 0.5) * Math.cos(z * 0.5) * 1.5 +
        Math.sin(x * 1.2) * Math.cos(z * 0.8) * 0.5 +
        Math.sin(x * 2.5) * Math.cos(z * 1.8) * 0.2
      )
    }
    geometry.computeVertexNormals()
    return geometry
  }, [segments])

  useFrame(({ clock }) => {
    if (!animated || !geoRef.current) return
    const t = clock.elapsedTime * 0.6
    const pos = geoRef.current.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i)
      pos.setY(i,
        Math.sin(x * 0.5 + t) * Math.cos(z * 0.5 + t * 0.7) * 1.5 +
        Math.sin(x * 1.2 + t * 1.1) * Math.cos(z * 0.8 + t * 0.9) * 0.5
      )
    }
    pos.needsUpdate = true
    geoRef.current.computeVertexNormals()
  })

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <primitive object={baseGeo} ref={geoRef} attach="geometry" />
      {showWire ? (
        <>
          <meshStandardMaterial color="#0a0a18" roughness={0.8} side={THREE.DoubleSide} />
          <Wireframe stroke="#a855f7" thickness={0.004} />
        </>
      ) : (
        <meshStandardMaterial
          color="#2d1b69" roughness={0.4} metalness={0.2}
          side={THREE.DoubleSide}
        />
      )}
    </mesh>
  )
}

function ParametricTorus({ segments }: { segments: number }) {
  const geo = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const R = 1.5, r = 0.5
    const n = segments, m = Math.floor(segments / 2)
    const positions: number[] = []
    const normals: number[] = []
    const uvs: number[] = []
    const indices: number[] = []

    for (let i = 0; i <= n; i++) {
      const u = (i / n) * Math.PI * 2
      for (let j = 0; j <= m; j++) {
        const v = (j / m) * Math.PI * 2
        const x = (R + r * Math.cos(v)) * Math.cos(u)
        const y = (R + r * Math.cos(v)) * Math.sin(u)
        const z = r * Math.sin(v)
        positions.push(x, y, z)
        const nx = Math.cos(v) * Math.cos(u)
        const ny = Math.cos(v) * Math.sin(u)
        const nz = Math.sin(v)
        normals.push(nx, ny, nz)
        uvs.push(i / n, j / m)
      }
    }

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        const a = i * (m + 1) + j
        const b = a + m + 1
        indices.push(a, b, a + 1, b, b + 1, a + 1)
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geometry.setIndex(indices)
    return geometry
  }, [segments])

  return (
    <mesh>
      <primitive object={geo} attach="geometry" />
      <meshStandardMaterial color="#06b6d4" roughness={0.1} metalness={0.8} side={THREE.DoubleSide} />
    </mesh>
  )
}

type Demo = 'terrain' | 'torus'

export default function ProceduralGeometryScene() {
  const [demo, setDemo] = useState<Demo>('terrain')
  const [segments, setSegments] = useState(32)
  const [animated, setAnimated] = useState(true)
  const [wireframe, setWireframe] = useState(false)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [0, 5, 8], fov: 50 }} dpr={[1, 2]}>
        <color attach="background" args={['#050508']} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={2} castShadow />
        <Environment preset="studio" />

        {demo === 'terrain' && <ProceduralTerrain segments={segments} animated={animated} wireframe={wireframe} />}
        {demo === 'torus' && <ParametricTorus segments={segments} />}

        <OrbitControls />
      </Canvas>

      <div className="overlay">
        <div className="ctrl-card">
          <div className="ctrl-title">Demo</div>
          <div className="ctrl-row">
            <button className={`cbtn ${demo === 'terrain' ? 'on' : ''}`} onClick={() => setDemo('terrain')} style={{ width: '100%' }}>
              Animated Terrain
            </button>
          </div>
          <div className="ctrl-row">
            <button className={`cbtn ${demo === 'torus' ? 'on' : ''}`} onClick={() => setDemo('torus')} style={{ width: '100%' }}>
              Parametric Torus
            </button>
          </div>
        </div>
        <div className="ctrl-card">
          <div className="ctrl-title">Geometry</div>
          <div className="ctrl-row">
            <span className="ctrl-lbl">Segments</span>
            <input type="range" className="cslider" min={8} max={96} step={8}
              value={segments} onChange={e => setSegments(+e.target.value)} />
            <span className="cval">{segments}</span>
          </div>
          {demo === 'terrain' && (
            <>
              <div className="ctrl-row">
                <span className="ctrl-lbl">Animate</span>
                <button className={`cbtn ${animated ? 'on' : ''}`} onClick={() => setAnimated(v => !v)}>
                  {animated ? 'On' : 'Off'}
                </button>
              </div>
              <div className="ctrl-row">
                <span className="ctrl-lbl">Wireframe</span>
                <button className={`cbtn ${wireframe ? 'on' : ''}`} onClick={() => setWireframe(v => !v)}>
                  {wireframe ? 'On' : 'Off'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
