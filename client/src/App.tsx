import { useState, Suspense } from 'react'
import './index.css'

import CanvasCameraScene, { meta as m1 } from './scenes/CanvasCamera'
import PBRLightingScene, { meta as m2 } from './scenes/PBRLighting'
import AdvancedMaterialsScene, { meta as m3 } from './scenes/AdvancedMaterials'
import CustomShadersScene, { meta as m4 } from './scenes/CustomShaders'
import InstancingScene, { meta as m5 } from './scenes/Instancing'
import ParticlesScene, { meta as m6 } from './scenes/Particles'
import FloatAnimationScene, { meta as m7 } from './scenes/FloatAnimation'
import TextHTMLScene, { meta as m8 } from './scenes/TextHTML'
import RenderTexturesScene, { meta as m9 } from './scenes/RenderTextures'
import PresentationSceneDemo, { meta as m10 } from './scenes/PresentationScene'
import ProceduralGeometryScene, { meta as m11 } from './scenes/ProceduralGeometry'

const LESSONS = [
  { id: 1, meta: m1, Scene: CanvasCameraScene },
  { id: 2, meta: m2, Scene: PBRLightingScene },
  { id: 3, meta: m3, Scene: AdvancedMaterialsScene },
  { id: 4, meta: m4, Scene: CustomShadersScene },
  { id: 5, meta: m5, Scene: InstancingScene },
  { id: 6, meta: m6, Scene: ParticlesScene },
  { id: 7, meta: m7, Scene: FloatAnimationScene },
  { id: 8, meta: m8, Scene: TextHTMLScene },
  { id: 9, meta: m9, Scene: RenderTexturesScene },
  { id: 10, meta: m10, Scene: PresentationSceneDemo },
  { id: 11, meta: m11, Scene: ProceduralGeometryScene },
]

const CATEGORIES = [...new Set(LESSONS.map(l => l.meta.category))]

type Tab = 'overview' | 'code' | 'tips'

function CodeBlock({ code }: { code: string }) {
  const lines = code.split('\n')
  return (
    <div className="code-wrap">
      <pre>
        {lines.map((line, i) => (
          <div key={i}>{highlightLine(line)}</div>
        ))}
      </pre>
    </div>
  )
}

// Minimal syntax highlighting via regex
function highlightLine(line: string): React.ReactNode {
  if (line.trim().startsWith('//')) {
    return <span className="cc">{line}</span>
  }

  const parts: React.ReactNode[] = []
  let remaining = line
  let key = 0

  const push = (text: string, cls?: string) => {
    if (!text) return
    parts.push(cls ? <span key={key++} className={cls}>{text}</span> : <span key={key++}>{text}</span>)
  }

  // Simple tokenizer: handle strings, then keywords, then rest
  const tokens = remaining.split(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b(?:const|let|var|import|export|from|return|function|async|await|new|true|false|undefined|null|typeof|if|for|default|extends|type|interface|class)\b|\b[A-Z][A-Za-z0-9]*\b)/g)

  tokens.forEach(t => {
    if (!t) return
    if ((t.startsWith('"') || t.startsWith("'") || t.startsWith('`'))) {
      push(t, 'cs')
    } else if (/^\b(const|let|var|import|export|from|return|function|async|await|new|true|false|undefined|null|typeof|if|for|default|extends|type|interface|class)\b$/.test(t)) {
      push(t, 'ck')
    } else if (/^[A-Z][A-Za-z0-9]*$/.test(t)) {
      push(t, 'cf')
    } else {
      push(t)
    }
  })

  return <>{parts}</>
}

function CanvasLoader() {
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#050508', color: '#475569', fontSize: 13,
      fontFamily: 'monospace', gap: 10,
    }}>
      <div style={{
        width: 20, height: 20, border: '2px solid #1a1a2e',
        borderTopColor: '#7c3aed', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      Loading scene…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function App() {
  const [active, setActive] = useState(0)
  const [tab, setTab] = useState<Tab>('overview')
  const lesson = LESSONS[active]

  return (
    <div className="guide">
      {/* Header */}
      <header className="guide-header">
        <div className="logo-icon">⬡</div>
        <h1>R3F Advanced Guide</h1>
        <span className="sub">React Three Fiber + Drei</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {lesson.meta.tags.slice(0, 3).map(tag => (
            <span key={tag} className="badge">{tag}</span>
          ))}
        </div>
      </header>

      <div className="guide-body">
        {/* Sidebar */}
        <nav className="sidebar">
          {CATEGORIES.map(cat => (
            <div className="sidebar-group" key={cat}>
              <div className="sidebar-group-label">{cat}</div>
              {LESSONS.filter(l => l.meta.category === cat).map(l => {
                const idx = LESSONS.indexOf(l)
                return (
                  <button
                    key={l.id}
                    className={`lesson-btn ${active === idx ? 'active' : ''}`}
                    onClick={() => { setActive(idx); setTab('overview') }}
                  >
                    <span className="num">{l.id}</span>
                    <span className="lname">{l.meta.title}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Main */}
        <main className="main">
          {/* Canvas */}
          <div className="canvas-wrap">
            <Suspense fallback={<CanvasLoader />}>
              <lesson.Scene key={active} />
            </Suspense>
          </div>

          {/* Info Panel */}
          <div className="info-panel">
            <div className="info-tabs">
              {(['overview', 'code', 'tips'] as Tab[]).map(t => (
                <div key={t} className={`itab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                  {t === 'overview' ? 'Overview' : t === 'code' ? 'Code' : 'Pro Tips'}
                </div>
              ))}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 18, paddingBottom: 2 }}
                  onClick={() => setActive(a => (a - 1 + LESSONS.length) % LESSONS.length)}
                  title="Previous lesson"
                >‹</button>
                <span style={{ fontSize: 11, color: '#475569', fontVariantNumeric: 'tabular-nums' }}>
                  {active + 1} / {LESSONS.length}
                </span>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 18, paddingBottom: 2 }}
                  onClick={() => setActive(a => (a + 1) % LESSONS.length)}
                  title="Next lesson"
                >›</button>
              </div>
            </div>

            <div className="info-body">
              {tab === 'overview' && (
                <>
                  <div className="lesson-title">{lesson.meta.title}</div>
                  <div className="tag-row">
                    {lesson.meta.tags.map(tag => <span key={tag} className="badge">{tag}</span>)}
                  </div>
                  <div className="lesson-desc" style={{ marginTop: 10 }}>
                    {lesson.meta.description.split('\n\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </>
              )}

              {tab === 'code' && (
                <>
                  <div className="lesson-title" style={{ marginBottom: 10 }}>Code Example</div>
                  <CodeBlock code={lesson.meta.code} />
                </>
              )}

              {tab === 'tips' && (
                <>
                  <div className="lesson-title" style={{ marginBottom: 10 }}>Pro Tips</div>
                  {lesson.meta.tips.map((tip, i) => (
                    <div className="tip-card" key={i} style={{ marginTop: i > 0 ? 8 : 0 }}>
                      <div className="tip-label">Tip {i + 1}</div>
                      <p>{tip}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
