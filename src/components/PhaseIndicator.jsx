import { Check } from 'lucide-react'

const PHASES = [
  { num: 1, label: 'Onboarding' },
  { num: 2, label: 'Check-in' },
  { num: 3, label: 'Session Plan' },
]

export default function PhaseIndicator({ phase }) {
  return (
    <div className="phase-indicator">
      {PHASES.map((p, i) => {
        const done = phase > p.num
        const active = phase === p.num
        return (
          <span key={p.num} style={{ display: 'contents' }}>
            <span className={`phase-pill ${active ? 'active' : done ? 'done' : 'inactive'}`}>
              <span className="phase-num">{done ? <Check size={11} /> : p.num}</span>
              {p.label}
            </span>
            {i < PHASES.length - 1 && (
              <div className={`phase-divider ${done ? 'done' : ''}`} />
            )}
          </span>
        )
      })}
    </div>
  )
}
