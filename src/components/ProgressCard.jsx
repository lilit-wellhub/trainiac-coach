import { Flame, CalendarCheck, Target } from 'lucide-react'

export default function ProgressCard({ sessionData, visible }) {
  if (!visible) return null

  const { streakWeeks, sessionsCompleted, goal } = sessionData
  const isNewUser = streakWeeks === 0 && sessionsCompleted === 0

  return (
    <div className="progress-card">
      <div className="progress-card-inner">
        <div className="stat-chip">
          <Flame className="stat-icon-svg" size={15} />
          {isNewUser
            ? <span>Week 1 — <span className="stat-label">just getting started</span></span>
            : <span>Streak: <span className="stat-label">{streakWeeks} week{streakWeeks !== 1 ? 's' : ''}</span></span>
          }
        </div>
        <div className="stat-chip">
          <CalendarCheck className="stat-icon-svg" size={15} />
          {isNewUser
            ? <span className="stat-label">First session today</span>
            : <span><span className="stat-label">{sessionsCompleted} session{sessionsCompleted !== 1 ? 's' : ''}</span> done</span>
          }
        </div>
        {goal && (
          <div className="stat-chip">
            <Target className="stat-icon-svg" size={15} />
            <span>Goal: <span className="stat-label">{goal}</span></span>
          </div>
        )}
      </div>
    </div>
  )
}
