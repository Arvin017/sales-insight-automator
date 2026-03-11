import { useState, useRef, useCallback } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconUpload = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
)
const IconMail = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)
const IconCheck = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)
const IconX = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)
const IconFile = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)
const IconSpark = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
)
const IconArrow = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
)

// ─── File Drop Zone ────────────────────────────────────────────────────────────
function FileDropZone({ file, onFileChange }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) onFileChange(f)
  }, [onFileChange])

  const handleChange = (e) => {
    if (e.target.files[0]) onFileChange(e.target.files[0])
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${file ? 'var(--success)' : dragging ? 'var(--accent)' : 'var(--border2)'}`,
        borderRadius: 'var(--radius)',
        padding: '36px 24px',
        textAlign: 'center',
        cursor: 'pointer',
        background: dragging ? 'rgba(233,69,96,0.04)' : file ? 'rgba(34,197,94,0.04)' : 'var(--bg3)',
        transition: 'all var(--transition)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleChange}
        style={{ display: 'none' }}
        aria-label="Upload sales data file"
      />

      {/* Background grid decoration */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
        backgroundSize: '20px 20px', pointerEvents: 'none',
      }} />

      {file ? (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', color: 'var(--success)',
          }}>
            <IconFile />
          </div>
          <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{file.name}</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{formatSize(file.size)}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <IconCheck /> File ready — click to replace
          </p>
        </div>
      ) : (
        <div>
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--radius)',
            background: 'rgba(233,69,96,0.1)', border: '1px solid rgba(233,69,96,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', color: 'var(--accent)',
            animation: 'float 3s ease-in-out infinite',
          }}>
            <IconUpload />
          </div>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>
            {dragging ? 'Drop it here' : 'Drop your sales file here'}
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
            or <span style={{ color: 'var(--accent)', textDecoration: 'underline' }}>browse files</span>
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted2)', marginTop: 12 }}>
            Supports .csv and .xlsx — max 10 MB
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({ current }) {
  const steps = ['Upload Data', 'AI Analysis', 'Email Delivered']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40 }}>
      {steps.map((label, i) => {
        const done = current > i
        const active = current === i
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: done ? 'var(--success)' : active ? 'var(--accent)' : 'var(--surface)',
                border: `2px solid ${done ? 'var(--success)' : active ? 'var(--accent)' : 'var(--border2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700,
                color: done || active ? 'white' : 'var(--muted)',
                transition: 'all 0.4s ease',
                boxShadow: active ? '0 0 16px rgba(233,69,96,0.4)' : 'none',
              }}>
                {done ? <IconCheck /> : i + 1}
              </div>
              <span style={{
                fontSize: '0.75rem', fontWeight: active ? 600 : 400,
                color: done ? 'var(--success)' : active ? 'var(--text)' : 'var(--muted)',
                display: window.innerWidth < 480 ? 'none' : 'block',
              }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 1, marginInline: 8,
                background: done ? 'var(--success)' : 'var(--border)',
                transition: 'background 0.4s ease',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ stage }) {
  const stages = {
    uploading:   { pct: 30, label: 'Uploading file...' },
    parsing:     { pct: 55, label: 'Parsing sales data...' },
    generating:  { pct: 75, label: 'Generating AI summary...' },
    sending:     { pct: 90, label: 'Sending email...' },
    done:        { pct: 100, label: 'Complete!' },
  }
  const { pct, label } = stages[stage] || stages.uploading

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
            background: 'var(--accent)', animation: 'pulse-glow 1.5s infinite',
          }} />
          {label}
        </span>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent)' }}>{pct}%</span>
      </div>
      <div style={{ height: 4, background: 'var(--surface)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
          borderRadius: 2,
          transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
          backgroundSize: '200% auto',
          animation: 'shimmer 2s linear infinite',
        }} />
      </div>
    </div>
  )
}

// ─── Success Card ──────────────────────────────────────────────────────────────
function SuccessCard({ message, preview, onReset }) {
  return (
    <div style={{
      animation: 'fadeUp 0.5s ease',
      background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.03) 100%)',
      border: '1px solid rgba(34,197,94,0.2)',
      borderRadius: 'var(--radius-lg)',
      padding: '32px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(34,197,94,0.15)',
          border: '2px solid rgba(34,197,94,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', color: 'var(--success)', fontSize: 28,
        }}>
          <IconCheck />
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', marginBottom: 8, color: 'var(--success)' }}>
          Report Delivered!
        </h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{message}</p>
      </div>

      {preview && (
        <div style={{
          background: 'var(--bg3)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '20px',
          marginBottom: 20,
        }}>
          <p style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--accent)', fontWeight: 700, marginBottom: 10 }}>
            Summary Preview
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
            {preview}
          </p>
        </div>
      )}

      <button
        onClick={onReset}
        style={{
          width: '100%', padding: '12px', borderRadius: 'var(--radius)',
          border: '1px solid var(--border2)', background: 'transparent',
          color: 'var(--text)', fontSize: '0.875rem', fontWeight: 500,
          cursor: 'pointer', transition: 'all var(--transition)', fontFamily: 'var(--font-body)',
        }}
        onMouseEnter={e => e.target.style.background = 'var(--surface)'}
        onMouseLeave={e => e.target.style.background = 'transparent'}
      >
        Analyze another file
      </button>
    </div>
  )
}

// ─── Error Banner ──────────────────────────────────────────────────────────────
function ErrorBanner({ error, onDismiss }) {
  if (!error) return null
  return (
    <div style={{
      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
      borderRadius: 'var(--radius)', padding: '14px 16px',
      display: 'flex', alignItems: 'flex-start', gap: 12,
      animation: 'fadeIn 0.3s ease', marginBottom: 20,
    }}>
      <span style={{ color: 'var(--error)', flexShrink: 0, marginTop: 1 }}>⚠</span>
      <p style={{ fontSize: '0.875rem', color: '#fca5a5', flex: 1 }}>{error}</p>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
        <IconX />
      </button>
    </div>
  )
}

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [file, setFile] = useState(null)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')  // idle | loading | success | error
  const [loadingStage, setLoadingStage] = useState('uploading')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [step, setStep] = useState(0)

  const isLoading = status === 'loading'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) { setError('Please select a file to upload.'); return }
    if (!email) { setError('Please enter a recipient email address.'); return }

    setStatus('loading')
    setError('')
    setStep(1)

    const stages = ['uploading', 'parsing', 'generating', 'sending', 'done']
    let si = 0

    const tick = setInterval(() => {
      si = Math.min(si + 1, stages.length - 2)
      setLoadingStage(stages[si])
    }, 1800)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('recipient_email', email)

      const { data } = await axios.post(`${API_URL}/api/v1/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      clearInterval(tick)
      setLoadingStage('done')
      setTimeout(() => {
        setResult(data)
        setStatus('success')
        setStep(2)
      }, 600)
    } catch (err) {
      clearInterval(tick)
      const msg = err.response?.data?.detail || err.message || 'Something went wrong. Please try again.'
      setError(msg)
      setStatus('error')
      setStep(0)
    }
  }

  const reset = () => {
    setFile(null); setEmail(''); setStatus('idle')
    setLoadingStage('uploading'); setResult(null); setError(''); setStep(0)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* Background decoration */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(233,69,96,0.12) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'fixed', bottom: '-20%', right: '-10%', width: 600, height: 600,
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle, rgba(79,142,247,0.06) 0%, transparent 70%)',
      }} />

      {/* Nav */}
      <nav style={{
        position: 'relative', zIndex: 10,
        borderBottom: '1px solid var(--border)',
        padding: '0 clamp(20px, 5vw, 48px)',
        height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(8,12,20,0.8)', backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 800, color: 'white',
          }}>R</div>
          <span style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>Rabbitt</span>
          <span style={{ color: 'var(--muted2)', fontSize: '0.875rem', marginLeft: 4 }}>/ Sales Insight</span>
        </div>
        <a href={`${API_URL}/docs`} target="_blank" rel="noreferrer" style={{
          fontSize: '0.8125rem', color: 'var(--muted)', textDecoration: 'none',
          padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)',
          transition: 'all var(--transition)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border2)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          API Docs <IconArrow />
        </a>
      </nav>

      {/* Main */}
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: 'clamp(40px, 6vw, 80px) clamp(16px, 5vw, 24px)',
        position: 'relative', zIndex: 1,
      }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', maxWidth: 560, marginBottom: 52, animation: 'fadeUp 0.6s ease' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(233,69,96,0.1)', border: '1px solid rgba(233,69,96,0.2)',
            borderRadius: 20, padding: '5px 14px', marginBottom: 20,
            fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)',
            letterSpacing: '0.5px',
          }}>
            <IconSpark /> AI-Powered Sales Intelligence
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3rem)',
            lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 16,
          }}>
            From Raw Data to<br />
            <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Executive Insights</em>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 420, margin: '0 auto' }}>
            Upload your sales CSV or Excel file and receive a boardroom-ready
            AI summary delivered straight to your inbox.
          </p>
        </div>

        {/* Card */}
        <div style={{
          width: '100%', maxWidth: 520,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'clamp(24px, 4vw, 40px)',
          boxShadow: 'var(--shadow-lg)',
          animation: 'fadeUp 0.6s 0.1s ease both',
        }}>
          <StepIndicator current={step} />

          {status === 'success' ? (
            <SuccessCard
              message={result?.message}
              preview={result?.summary_preview}
              onReset={reset}
            />
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <ErrorBanner error={error} onDismiss={() => setError('')} />

              {/* File Upload */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 8, color: 'var(--text)', letterSpacing: '0.02em' }}>
                  Sales Data File
                </label>
                <FileDropZone file={file} onFileChange={setFile} />
              </div>

              {/* Email Input */}
              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 8, color: 'var(--text)', letterSpacing: '0.02em' }}>
                  Recipient Email
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--muted)', pointerEvents: 'none',
                  }}>
                    <IconMail />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="executive@company.com"
                    disabled={isLoading}
                    required
                    style={{
                      width: '100%', padding: '12px 14px 12px 42px',
                      background: 'var(--bg3)', border: '1px solid var(--border2)',
                      borderRadius: 'var(--radius)', color: 'var(--text)',
                      fontSize: '0.9375rem', fontFamily: 'var(--font-body)',
                      outline: 'none', transition: 'border-color var(--transition)',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                  />
                </div>
              </div>

              {/* Loading progress */}
              {isLoading && <ProgressBar stage={loadingStage} />}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  marginTop: isLoading ? 20 : 0,
                  width: '100%', padding: '14px',
                  background: isLoading
                    ? 'var(--surface)'
                    : 'linear-gradient(135deg, var(--accent) 0%, #c73652 100%)',
                  border: isLoading ? '1px solid var(--border)' : 'none',
                  borderRadius: 'var(--radius)',
                  color: 'white', fontSize: '0.9375rem', fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-body)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  transition: 'all var(--transition)',
                  boxShadow: isLoading ? 'none' : '0 4px 20px rgba(233,69,96,0.35)',
                  transform: 'translateY(0)',
                }}
                onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(233,69,96,0.45)' }}}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isLoading ? 'none' : '0 4px 20px rgba(233,69,96,0.35)' }}
              >
                {isLoading ? (
                  <>
                    <span style={{
                      width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white', borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite', display: 'inline-block',
                    }} />
                    Processing...
                  </>
                ) : (
                  <>
                    <IconSpark />
                    Generate & Send Report
                    <IconArrow />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Feature badges */}
        <div style={{
          display: 'flex', gap: 16, marginTop: 36, flexWrap: 'wrap', justifyContent: 'center',
          animation: 'fadeUp 0.6s 0.25s ease both',
        }}>
          {[
            { icon: '🔒', label: 'Rate limited & secured' },
            { icon: '🤖', label: 'Google Gemini powered' },
            { icon: '📧', label: 'Instant email delivery' },
          ].map(({ icon, label }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 20,
              background: 'var(--surface)', border: '1px solid var(--border)',
              fontSize: '0.8125rem', color: 'var(--muted)',
            }}>
              <span>{icon}</span> {label}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center', padding: '20px',
        borderTop: '1px solid var(--border)',
        fontSize: '0.75rem', color: 'var(--muted2)',
        position: 'relative', zIndex: 1,
      }}>
        © {new Date().getFullYear()} Rabbitt AI · Sales Insight Automator
      </footer>
    </div>
  )
}
