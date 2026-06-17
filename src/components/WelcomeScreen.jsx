import { useState } from 'react'

// Wellhub-style wellness illustration — person in a runner's stretch pose
function WellnessIllustration() {
  return (
    <svg viewBox="0 0 320 260" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Background blobs */}
      <ellipse cx="160" cy="200" rx="130" ry="50" fill="#F2496B" fillOpacity="0.10" />
      <ellipse cx="240" cy="80" rx="60" ry="60" fill="#A880FF" fillOpacity="0.15" />
      <ellipse cx="60" cy="100" rx="45" ry="45" fill="#F2496B" fillOpacity="0.12" />

      {/* Floor / mat */}
      <rect x="40" y="210" width="240" height="8" rx="4" fill="#F2496B" fillOpacity="0.18" />

      {/* Body — torso */}
      <rect x="138" y="110" width="40" height="56" rx="20" fill="#1B1340" />

      {/* Head */}
      <circle cx="158" cy="88" r="24" fill="#F2496B" />
      {/* Hair */}
      <ellipse cx="158" cy="70" rx="18" ry="12" fill="#1B1340" />
      {/* Face – smile */}
      <path d="M150 92 Q158 100 166 92" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Eyes */}
      <circle cx="152" cy="87" r="2.5" fill="white" />
      <circle cx="164" cy="87" r="2.5" fill="white" />

      {/* Left arm — raised */}
      <path d="M138 128 Q110 100 96 80" stroke="#1B1340" strokeWidth="12" strokeLinecap="round" fill="none" />
      {/* Dumbbell */}
      <rect x="82" y="73" width="28" height="8" rx="4" fill="#F2496B" />
      <rect x="78" y="68" width="8" height="18" rx="4" fill="#1B1340" />
      <rect x="106" y="68" width="8" height="18" rx="4" fill="#1B1340" />

      {/* Right arm — down/side */}
      <path d="M178 128 Q200 148 205 165" stroke="#1B1340" strokeWidth="12" strokeLinecap="round" fill="none" />

      {/* Left leg — lunging forward */}
      <path d="M148 166 Q130 185 110 210" stroke="#1B1340" strokeWidth="13" strokeLinecap="round" fill="none" />
      {/* Left shoe */}
      <ellipse cx="106" cy="212" rx="18" ry="8" fill="#F2496B" />

      {/* Right leg — back/extended */}
      <path d="M168 166 Q185 185 210 210" stroke="#1B1340" strokeWidth="13" strokeLinecap="round" fill="none" />
      {/* Right shoe */}
      <ellipse cx="212" cy="212" rx="18" ry="8" fill="#1B1340" />

      {/* Sparkle accents */}
      <path d="M260 50 L263 44 L266 50 L272 53 L266 56 L263 62 L260 56 L254 53 Z" fill="#F2496B" fillOpacity="0.7" />
      <path d="M50 160 L52 156 L54 160 L58 162 L54 164 L52 168 L50 164 L46 162 Z" fill="#A880FF" fillOpacity="0.6" />
      <circle cx="285" cy="140" r="5" fill="#F2496B" fillOpacity="0.4" />
      <circle cx="35" cy="55" r="4" fill="#A880FF" fillOpacity="0.5" />
    </svg>
  )
}

const FEATURES = [
  { icon: '🎯', label: 'Personalised plan', desc: 'Built around your goals, schedule & equipment' },
  { icon: '🔄', label: 'Adaptive coaching', desc: 'Your coach adjusts based on how you feel each day' },
  { icon: '📈', label: 'Progress tracking', desc: 'Session history, streaks & weekly programs' },
]

export default function WelcomeScreen({ onGetStarted }) {
  const [step, setStep] = useState(0) // 0 = hero, 1 = features

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #1B1340 0%, #2D1F6E 50%, #1B1340 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', top: -80, right: -80,
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, #F2496B22 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -60, left: -60,
        width: 240, height: 240, borderRadius: '50%',
        background: 'radial-gradient(circle, #A880FF22 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 380, width: '100%', position: 'relative', zIndex: 1 }}>

        {step === 0 && (
          <>
            {/* Logo + wordmark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: '#F2496B', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {/* Wellhub pinwheel-style mark */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3 L12 10 L17 6 Z" fill="white" opacity="0.9" />
                  <path d="M12 3 L12 10 L7 6 Z" fill="white" opacity="0.7" />
                  <path d="M12 21 L12 14 L17 18 Z" fill="white" opacity="0.9" />
                  <path d="M12 21 L12 14 L7 18 Z" fill="white" opacity="0.7" />
                  <path d="M3 12 L10 12 L6 7 Z" fill="white" opacity="0.9" />
                  <path d="M3 12 L10 12 L6 17 Z" fill="white" opacity="0.7" />
                  <path d="M21 12 L14 12 L18 7 Z" fill="white" opacity="0.9" />
                  <path d="M21 12 L14 12 L18 17 Z" fill="white" opacity="0.7" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#A880FF', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>Powered by Wellhub</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>Trainiac</div>
              </div>
            </div>

            {/* Illustration */}
            <div style={{ margin: '0 auto 28px', width: 280, maxWidth: '100%' }}>
              <WellnessIllustration />
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: 32, fontWeight: 900, lineHeight: 1.1,
              margin: '0 0 12px', color: '#fff',
              letterSpacing: '-0.5px',
            }}>
              Your AI Coach.<br />
              <span style={{ color: '#F2496B' }}>Built for you.</span>
            </h1>

            <p style={{
              fontSize: 16, color: 'rgba(255,255,255,0.7)',
              margin: '0 0 36px', lineHeight: 1.6,
            }}>
              Trainiac learns your goals, schedule and limits — then builds and adapts your training week by week.
            </p>

            {/* CTA */}
            <button
              onClick={() => setStep(1)}
              style={{
                width: '100%', padding: '16px', borderRadius: 14,
                background: '#F2496B', color: '#fff',
                fontWeight: 800, fontSize: 17, border: 'none',
                cursor: 'pointer', letterSpacing: 0.2,
                boxShadow: '0 8px 24px rgba(242,73,107,0.4)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(242,73,107,0.5)' }}
              onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(242,73,107,0.4)' }}
            >
              Get started →
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 8px', color: '#fff' }}>
              Here's what you'll get
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '0 0 28px' }}>
              A 2-minute setup, then your first session is ready.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36 }}>
              {FEATURES.map((f, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.07)',
                  borderRadius: 14, padding: '16px 18px',
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  <div style={{
                    fontSize: 22, width: 44, height: 44, borderRadius: 12,
                    background: 'rgba(242,73,107,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>{f.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 3 }}>{f.label}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onGetStarted}
              style={{
                width: '100%', padding: '16px', borderRadius: 14,
                background: '#F2496B', color: '#fff',
                fontWeight: 800, fontSize: 17, border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(242,73,107,0.4)',
              }}
            >
              Meet your coach →
            </button>

            <button
              onClick={() => setStep(0)}
              style={{
                width: '100%', padding: '12px', marginTop: 12,
                background: 'transparent', color: 'rgba(255,255,255,0.5)',
                fontWeight: 500, fontSize: 14, border: 'none', cursor: 'pointer',
              }}
            >
              ← Back
            </button>
          </>
        )}

      </div>
    </div>
  )
}
