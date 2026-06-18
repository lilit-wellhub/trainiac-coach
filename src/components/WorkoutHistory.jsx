import { useState } from 'react'
import { getHistory } from '../workoutHistory.js'
import { CalendarDays, List, Activity, X, Check, ChevronDown, ChevronUp } from 'lucide-react'

const PAGE_SIZE = 5

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })
}

function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(secs) {
  if (!secs) return null
  const m = Math.round(secs / 60)
  return m < 1 ? '< 1 min' : `${m} min`
}

// ── Shared item (used by both list and calendar) ─────────────────────
function HistoryItem({ w, expandedId, setExpandedId }) {
  const isActivity   = w.type === 'activity'
  const done         = w.doneCount ?? w.exercises?.filter(e => e.status === 'done').length ?? 0
  const total        = w.exercises?.length ?? 0
  const dur          = formatDuration(w.durationSeconds)
  const isOpen       = expandedId === w.id
  const canExpand    = !isActivity && w.exercises?.length > 0
  const doneEx       = w.exercises?.filter(e => e.status === 'done') || []
  const skippedEx    = w.exercises?.filter(e => e.status === 'skipped') || []

  return (
    <div
      className={`history-item ${isActivity ? 'history-item-activity' : ''} ${canExpand ? 'history-item-expandable' : ''}`}
      onClick={() => canExpand && setExpandedId(isOpen ? null : w.id)}
    >
      <div className="history-item-header">
        <span className="history-item-date">
          {isActivity
            ? <><Activity size={13} style={{display:'inline',verticalAlign:'middle',marginRight:4}} />{w.activityName}</>
            : formatDate(w.completedAt)}
        </span>
        <div className="history-item-header-right">
          <span className="history-item-time">{formatTime(w.completedAt)}</span>
          {canExpand && (isOpen
            ? <ChevronUp size={13} style={{opacity:0.4}} />
            : <ChevronDown size={13} style={{opacity:0.35}} />)}
        </div>
      </div>

      <div className="history-item-meta">
        {isActivity ? (
          <>
            <span className="history-item-summary">{formatDate(w.completedAt)}</span>
            {dur && <span className="history-item-dur">· {dur}</span>}
          </>
        ) : (
          <>
            <span className="history-item-summary">{done}/{total} exercises done</span>
            {dur && <span className="history-item-dur">· {dur}</span>}
          </>
        )}
      </div>

      {isOpen && (
        <div className="history-item-detail">
          {doneEx.map((ex, i) => (
            <div key={i} className="history-ex-row">
              <div className="history-ex-name">
                <Check size={11} className="history-ex-check" />
                {ex.name}
              </div>
              <div className="history-ex-meta">
                {ex.sets && ex.reps && <span className="history-ex-tag">{ex.sets}×{ex.reps}</span>}
                {ex.restSeconds && <span className="history-ex-tag history-ex-rest">{ex.restSeconds}s rest</span>}
              </div>
            </div>
          ))}
          {skippedEx.map((ex, i) => (
            <div key={i} className="history-ex-row history-ex-skipped">
              <div className="history-ex-name">
                <span className="history-ex-skip-dash">—</span>
                {ex.name}
              </div>
              <span className="history-ex-tag history-ex-skip-label">skipped</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── List view ────────────────────────────────────────────────────────
function ListView({ history }) {
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState(null)
  const visible = history.slice(0, page * PAGE_SIZE)
  const hasMore = visible.length < history.length

  if (!history.length) return (
    <div className="history-empty">No completed workouts yet. Finish your first session to see it here.</div>
  )

  return (
    <div className="history-list">
      {visible.map(w => (
        <HistoryItem key={w.id} w={w} expandedId={expandedId} setExpandedId={setExpandedId} />
      ))}
      {hasMore && (
        <button className="history-load-more" onClick={e => { e.stopPropagation(); setPage(p => p + 1) }}>
          Load more ({history.length - visible.length} remaining)
        </button>
      )}
    </div>
  )
}

// ── Calendar view ────────────────────────────────────────────────────
function CalendarView({ history }) {
  const [offset, setOffset] = useState(0) // months back from today
  const [expandedId, setExpandedId] = useState(null)

  const now = new Date()
  const year  = new Date(now.getFullYear(), now.getMonth() - offset, 1).getFullYear()
  const month = new Date(now.getFullYear(), now.getMonth() - offset, 1).getMonth()
  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Map completedAt dates → workout data
  const workoutByDay = {}
  history.forEach(w => {
    const d = new Date(w.completedAt)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate()
      if (!workoutByDay[key]) workoutByDay[key] = []
      workoutByDay[key].push(w)
    }
  })

  const today = now.getDate()
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="cal-view">
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={() => setOffset(o => o + 1)}>‹</button>
        <span className="cal-month-label">{monthLabel}</span>
        <button className="cal-nav-btn" onClick={() => setOffset(o => Math.max(0, o - 1))} disabled={offset === 0}>›</button>
      </div>
      <div className="cal-grid">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="cal-dow">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} className="cal-cell empty" />
          const workouts = workoutByDay[day] || []
          const isToday = isCurrentMonth && day === today
          const tipParts = workouts.map(w =>
            w.type === 'activity'
              ? w.activityName
              : `${w.doneCount ?? w.exercises?.filter(e => e.status === 'done').length ?? 0} exercises`
          )
          return (
            <div key={day} className={`cal-cell ${workouts.length ? 'has-workout' : ''} ${isToday ? 'today' : ''}`}>
              <span className="cal-day-num">{day}</span>
              {workouts.length > 0 && (
                <span className="cal-dot" title={tipParts.join(' · ')} />
              )}
            </div>
          )
        })}
      </div>
      {/* Show entries for days that have them — newest day first */}
      <div className="history-list" style={{marginTop: 16}}>
        {Object.entries(workoutByDay)
          .sort((a, b) => b[0] - a[0])
          .flatMap(([, ws]) => ws)
          .map(w => (
            <HistoryItem key={w.id} w={w} expandedId={expandedId} setExpandedId={setExpandedId} />
          ))
        }
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────
export default function WorkoutHistory({ visible, onClose, inline }) {
  const history = getHistory()
  const [view, setView] = useState('list') // 'list' | 'calendar'

  const inner = (
    <div className={inline ? 'tab-panel' : 'history-panel'}>
      {!inline && (
        <div className="history-header">
          <span className="history-title">Your workouts</span>
          <button className="history-close" onClick={onClose}><X size={16} /></button>
        </div>
      )}
      {inline && (
        <div className="tab-panel-title-row">
          <div className="tab-panel-title">Your workouts</div>
          <div className="history-view-toggle">
            <button className={`view-toggle-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')} title="List view">
              <List size={15} />
            </button>
            <button className={`view-toggle-btn ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')} title="Calendar view">
              <CalendarDays size={15} />
            </button>
          </div>
        </div>
      )}
      {view === 'list' ? <ListView history={history} /> : <CalendarView history={history} />}
    </div>
  )

  if (!inline && !visible) return null
  if (inline) return inner
  return (
    <div className="history-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>{inner}</div>
    </div>
  )
}
