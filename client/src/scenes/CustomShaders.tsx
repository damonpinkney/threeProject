import { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

export const meta = {
  title: 'Custom GLSL Shaders',
  category: 'Shaders',
  tags: ['ShaderMaterial', 'GLSL', 'uniforms', 'vertexShader', 'fragmentShader'],
  description: `Custom shaders unlock effects impossible with standard materials. In R3F, lowercase JSX elements map directly to Three.js objects — so <shaderMaterial> creates a THREE.ShaderMaterial with full GLSL power.

Uniforms are the bridge between CPU (React/JS) state and GPU (GLSL) code. You update them in useFrame and the GPU reacts every frame. varyings pass interpolated data from the vertex stage to the fragment stage.

The wave plane demo shows vertex displacement (moving geometry on the GPU) while the sphere demo shows fragment-only effects (color computation per pixel).`,
  tips: [
    'Mutate uniforms.uTime.value directly in useFrame — never recreate the uniforms object, that triggers a full re-upload.',
    'Use useMemo for uniforms and geometry so they\'re created once and not every render.',
    'GLSL precision: use mediump for mobile, highp for desktop. Always declare precision in fragment shaders.',
    'THREE.ShaderChunk contains built-in chunks (fog_pars_vertex, etc.) you can #include in your shaders.',
    'The "glsl-noise" pattern: many devs inline Ashima\'s simplex noise into their shaders — no extra package needed.',
  ],
  code: `// Uniforms created once with useMemo
const uniforms = useMemo(() => ({
  uTime:    { value: 0 },
  uColorA:  { value: new THREE.Color('#7c3aed') },
  uColorB:  { value: new THREE.Color('#06b6d4') },
  uAmplitude: { value: 0.3 },
}), [])

// Update each frame — mutate, don't replace
useFrame(({ clock }) => {
  materialRef.current.uniforms.uTime.value = clock.elapsedTime
})

// Vertex shader — displace geometry
const vert = \`
  uniform float uTime;
  uniform float uAmplitude;
  varying vec2 vUv;
  varying float vElevation;
  void main() {
    vUv = uv;
    vec3 pos = position;
    pos.z += sin(pos.x * 3.0 + uTime) * uAmplitude
            + sin(pos.y * 2.0 + uTime * 1.3) * uAmplitude;
    vElevation = pos.z;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }\`

// Fragment shader — color per elevation
const frag = \`
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec2 vUv;
  varying float vElevation;
  void main() {
    float t = (vElevation + 0.3) / 0.6;
    gl_FragColor = vec4(mix(uColorA, uColorB, t), 1.0);
  }\`

<shaderMaterial
  ref={materialRef}
  uniforms={uniforms}
  vertexShader={vert}
  fragmentShader={frag}
/>`,
}

const waveVert = `
  uniform float uTime;
  uniform float uAmplitude;
  varying vec2 vUv;
  varying float vElevation;
  void main() {
    vUv = uv;
    vec3 pos = position;
    float elev = sin(pos.x * 3.0 + uTime) * uAmplitude
               + sin(pos.y * 2.0 + uTime * 1.3) * uAmplitude;
    pos.z += elev;
    vElevation = elev;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const waveFrag = `
  precision highp float;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uTime;
  varying vec2 vUv;
  varying float vElevation;
  void main() {
    float t = clamp((vElevation + 0.35) / 0.7, 0.0, 1.0);
    vec3 color = mix(uColorA, uColorB, t);
    gl_FragColor = vec4(color, 1.0);
  }
`

const sphereVert = `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normal;
    vPosition = position;
    vec3 pos = position;
    float noise = sin(pos.x * 5.0 + uTime) * sin(pos.y * 5.0 + uTime * 0.7) * 0.08;
    pos += normal * noise;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const sphereFrag = `
  precision highp float;
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 light = normalize(vec3(1.0, 2.0, 3.0));
    float diff = max(dot(vNormal, light), 0.0) * 0.7 + 0.3;
    float t = sin(vPosition.y * 4.0 + uTime) * 0.5 + 0.5;
    vec3 color = mix(uColorA, uColorB, t) * diff;
    gl_FragColor = vec4(color, 1.0);
  }
`

function WavePlane({ amplitude }: { amplitude: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null!)
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uAmplitude: { value: amplitude },
    uColorA: { value: new THREE.Color('#7c3aed') },
    uColorB: { value: new THREE.Color('#06b6d4') },
  }), [])

  useFrame(({ clock }) => {
    matRef.current.uniforms.uTime.value = clock.elapsedTime
    matRef.current.uniforms.uAmplitude.value = amplitude
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[6, 6, 64, 64]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={waveVert}
        fragmentShader={waveFrag}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function ShaderSphere({ speed }: { speed: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null!)
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color('#a855f7') },
    uColorB: { value: new THREE.Color('#f59e0b') },
  }), [])

  useFrame(({ clock }) => {
    matRef.current.uniforms.uTime.value = clock.elapsedTime * speed
  })

  return (
    <mesh>
      <sphereGeometry args={[1.5, 128, 128]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={sphereVert}
        fragmentShader={sphereFrag}
      />
    </mesh>
  )
}

type Demo = 'wave' | 'sphere'

export default function CustomShadersScene() {
  const [demo, setDemo] = useState<Demo>('wave')
  const [amplitude, setAmplitude] = useState(0.3)
  const [speed, setSpeed] = useState(1.0)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [0, 3, 5], fov: 55 }} dpr={[1, 2]}>
        <color attach="background" args={['#050508']} />
        {demo === 'wave' ? <WavePlane amplitude={amplitude} /> : <ShaderSphere speed={speed} />}
        <OrbitControls />
      </Canvas>

      <div className="overlay">
        <div className="ctrl-card">
          <div className="ctrl-title">Demo</div>
          <div className="ctrl-row">
            <button className={`cbtn ${demo === 'wave' ? 'on' : ''}`} onClick={() => setDemo('wave')}>Wave Plane</button>
          </div>
          <div className="ctrl-row">
            <button className={`cbtn ${demo === 'sphere' ? 'on' : ''}`} onClick={() => setDemo('sphere')}>Shader Sphere</button>
          </div>
        </div>
        <div className="ctrl-card">
          <div className="ctrl-title">Uniforms</div>
          {demo === 'wave' ? (
            <div className="ctrl-row">
              <span className="ctrl-lbl">Amplitude</span>
              <input type="range" className="cslider" min={0} max={0.6} step={0.01}
                value={amplitude} onChange={e => setAmplitude(+e.target.value)} />
              <span className="cval">{amplitude.toFixed(2)}</span>
            </div>
          ) : (
            <div className="ctrl-row">
              <span className="ctrl-lbl">Speed</span>
              <input type="range" className="cslider" min={0.1} max={4} step={0.1}
                value={speed} onChange={e => setSpeed(+e.target.value)} />
              <span className="cval">{speed.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
