import { useState } from 'react'
import { loadProgram } from '../programStorage.js'
import { getHistory } from '../workoutHistory.js'
import { Calendar, Dumbbell, Moon, ChevronDown, ChevronUp, AlertCircle, X, Check, Minus } from 'lucide-react'

function formatDur(secs) {
  if (!secs) return null
  const m = Math.round(secs / 60)
  return m < 1 ? '< 1 min' : `${m} min`
}

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const REST_LABELS = ['Rest', 'Active Recovery']

function isRestDay(focus) {
  return !focus || REST_LABELS.some(r => focus.toLowerCase().includes(r.toLowerCase()))
}

function getWeekNumber(date) {
  const d = new Date(date)
  const jan1 = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)
}

function getDayWorkoutsThisWeek(day) {
  const history = getHistory()
  const dayNames = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 }
  const targetDay = dayNames[day]
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay()) // Sunday
  return history.filter(w => {
    const d = new Date(w.completedAt)
    return d.getDay() === targetDay && d >= weekStart
  })
}

export default function WeekProgram({ visible, onClose, inline, onAskCoach }) {
  const [expandedDay, setExpandedDay] = useState(null)

  if (!inline && !visible) return null

  const program = loadProgram()

  if (!program) return (
    <div className="tab-panel">
      {inline && <div className="tab-panel-title">Your program</div>}
      <div className="tab-empty">
        <Calendar size={32} />
        <p>No program yet. Complete your first coaching session to get a weekly schedule.</p>
      </div>
    </div>
  )

  const allDays = DAY_ORDER.map(d => {
    const found = program.days?.find(p => p.day === d)
    return found || { day: d, focus: 'Rest' }
  })

  const todayDayIndex = new Date().getDay()
  const dayToIndex = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

  // Calculate which week of the program we're on
  const programWeek = program.updatedAt
    ? Math.max(1, Math.ceil((Date.now() - new Date(program.updatedAt).getTime()) / (7 * 86400000)))
    : 1

  const inner = (
    <div className={inline ? 'tab-panel' : 'history-panel'}>
      {!inline && (
        <div className="history-header">
          <div className="history-title">Your program</div>
          <button className="history-close" onClick={onClose}><X size={16} /></button>
        </div>
      )}
      {inline && <div className="tab-panel-title">Your program</div>}

      <div className="program-meta-row">
        <span className="program-week-badge">Week {programWeek}</span>
        {program.goal && <span className="program-goal-label">· {program.goal}</span>}
        <span className="program-updated">Updated {new Date(program.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
      </div>

      <div className="week-program-list">
        {allDays.map(({ day, focus, exercises }) => {
          const rest = isRestDay(focus)
          const isToday = dayToIndex[day] === todayDayIndex
          const doneThisWeek = getDayWorkoutsThisWeek(day)
          const hasDone = doneThisWeek.length > 0
          const open = expandedDay === day

          // Missed: past day this week, not rest, no workout logged,
          // AND the program existed before that day (can't miss a session that wasn't planned yet)
          const dayIdx = dayToIndex[day]
          const isPast = !isToday && dayIdx < todayDayIndex && !(dayIdx === 0 && todayDayIndex !== 0)
          const now2 = new Date()
          const weekMon = new Date(now2)
          const wd = now2.getDay()
          weekMon.setDate(now2.getDate() - (wd === 0 ? 6 : wd - 1))
          weekMon.setHours(0, 0, 0, 0)
          const offsetFromMon = dayIdx === 0 ? 6 : dayIdx - 1
          const dayDate = new Date(weekMon)
          dayDate.setDate(weekMon.getDate() + offsetFromMon)
          const programCreatedBeforeDay = program.updatedAt && new Date(program.updatedAt) < dayDate
          const isMissed = !rest && isPast && !hasDone && programCreatedBeforeDay

          return (
            <div key={day} className={`week-day-row ${isToday ? 'today' : ''} ${rest ? 'rest-day' : ''} ${isMissed ? 'missed-day' : ''}`}>
              <div
                className="week-day-main"
                onClick={() => !rest && setExpandedDay(d => d === day ? null : day)}
                style={{ cursor: rest ? 'default' : 'pointer' }}
              >
                <div className="week-day-left">
                  <div className="week-day-label">
                    {day}
                    {isToday && <span className="week-today-badge">Today</span>}
                  </div>
                  <div className="week-day-focus">
                    {rest
                      ? <><Moon size={13} /> {focus || 'Rest'}</>
                      : <><Dumbbell size={13} /> {focus}</>
                    }
                  </div>
                </div>
                <div className="week-day-right">
                  {hasDone && !rest && <span className="week-done-chip"><Check size={11} /> {doneThisWeek.length > 1 ? `${doneThisWeek.length}× done` : 'Done'}</span>}
                  {isMissed && <span className="week-missed-chip"><AlertCircle size={11} /> Missed</span>}
                  {!rest && (open ? <ChevronUp size={14} style={{ opacity: 0.5 }} /> : <ChevronDown size={14} style={{ opacity: 0.4 }} />)}
                </div>
              </div>

              {open && (
                <div className="week-day-detail">
                  {hasDone ? (
                    <div className="week-done-summary">
                      {doneThisWeek.map((w, idx) => {
                        const done = w.doneCount ?? w.exercises?.filter(e => e.status === 'done').length ?? 0
                        const total = w.exercises?.length ?? 0
                        const dur = formatDur(w.durationSeconds)
                        const completedAt = new Date(w.completedAt)
                        const isActivity = w.type === 'activity'
                        return (
                          <div key={w.id || idx} className="week-done-meta">
                            <span><Check size={11} style={{display:'inline',verticalAlign:'middle',marginRight:3}} />
                              {isActivity ? w.activityName : `${done}/${total} exercises`}
                            </span>
                            {dur && <span>· {dur}</span>}
                            <span>· {completedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )
                      })}
                      {(() => {
                        const lastW = doneThisWeek[0]
                        const completedNames = new Set(lastW?.exercises?.map(e => e.name) || [])
                        const hasNewPlan = exercises?.length > 0 && exercises.some(e => !completedNames.has(e.name))
                        return hasNewPlan ? (
                          <>
                            <div className="week-new-session-label">New session planned</div>
                            <div className="week-exercises-list">
                              {exercises.map((ex, i) => (
                                <div key={i} className="week-exercise-row">
                                  <span className="week-ex-name">{ex.name}</span>
                                  {ex.sets && ex.reps && <span className="week-ex-meta">{ex.sets}×{ex.reps}</span>}
                                </div>
                              ))}
                            </div>
                            {onAskCoach && (
                              <button className="week-ask-coach-btn" onClick={() => onAskCoach("I'm ready to start my next session now.")}>
                                Start this session →
                              </button>
                            )}
                          </>
                        ) : null
                      })()}
                    </div>
                  ) : isMissed ? (
                    <div className="week-day-no-plan">
                      <p>You missed this session.</p>
                      {onAskCoach && (
                        <button
                          className="week-ask-coach-btn"
                          onClick={() => onAskCoach(`I missed my ${day} workout. Can we reschedule it or adjust the plan?`)}
                        >
                          Reschedule with coach →
                        </button>
                      )}
                    </div>
                  ) : exercises?.length > 0 ? (
                    <div className="week-exercises-list">
                      {exercises.map((ex, i) => (
                        <div key={i} className="week-exercise-row">
                          <span className="week-ex-name">{ex.name}</span>
                          {ex.sets && ex.reps && <span className="week-ex-meta">{ex.sets}×{ex.reps}</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="week-day-no-plan">
                      <p>No exercises planned yet for this day.</p>
                      {onAskCoach && (
                        <button
                          className="week-ask-coach-btn"
                          onClick={() => onAskCoach(`Can you plan my ${day} session?`)}
                        >
                          Ask coach to plan this session →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  if (inline) return inner
  return (
    <div className="history-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>{inner}</div>
    </div>
  )
}
