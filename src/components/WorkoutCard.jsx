import { useState, useEffect, useRef } from 'react'
import { Play, X, CheckCircle, SkipForward, RotateCcw, Dumbbell, MessageCircle, Timer, ChevronDown, ChevronUp, ArrowUp, ArrowDown, GripVertical } from 'lucide-react'
import { getVideoUrl } from '../videoLibrary.js'
import { getEquipment } from '../equipmentLookup.js'

// ── Timers ──────────────────────────────────────────────────────────
function useWorkoutTimer(running) {
  const [elapsed, setElapsed] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    if (running) ref.current = setInterval(() => setElapsed(s => s + 1), 1000)
    else clearInterval(ref.current)
    return () => clearInterval(ref.current)
  }, [running])
  return elapsed
}

function useRestTimer(onDone) {
  const [remaining, setRemaining] = useState(0)
  const [active, setActive] = useState(false)
  const ref = useRef(null)

  const start = (secs) => { setRemaining(secs); setActive(true) }
  const skip  = () => { clearInterval(ref.current); setActive(false); onDone?.() }

  useEffect(() => {
    if (!active) return
    ref.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(ref.current); setActive(false); onDone?.(); return 0 }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(ref.current)
  }, [active])

  return { remaining, active, start, skip }
}

function fmt(secs) {
  return `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`
}

// ── Group exercises into ordered blocks (supersets stay together) ────
function groupExercises(exercises) {
  const blocks = []
  const seen = new Set()
  for (const ex of exercises) {
    if (seen.has(ex.name)) continue
    seen.add(ex.name)
    if (ex.supersetGroup) {
      const peers = exercises.filter(e => e.supersetGroup === ex.supersetGroup)
      if (!blocks.find(b => b.type === 'superset' && b.groupId === ex.supersetGroup)) {
        blocks.push({ type: 'superset', groupId: ex.supersetGroup, exercises: peers })
      }
    } else {
      blocks.push({ type: 'single', exercises: [ex] })
    }
  }
  return blocks
}

// ── WorkoutCard ──────────────────────────────────────────────────────
export default function WorkoutCard({ visible, memberName, exercises: initialExercises, onComplete }) {
  const [exercises, setExercises] = useState([])
  const [activeGif, setActiveGif] = useState(null)
  const [started, setStarted] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [setsDone, setSetsDone] = useState({})   // { name: [true,false,...] }
  const [skipped, setSkipped]   = useState({})
  const [expanded, setExpanded] = useState({})
  const [restLabel, setRestLabel] = useState('')

  const rest = useRestTimer(() => setRestLabel(''))

  useEffect(() => {
    setExercises(initialExercises || [])
    setStarted(false); setReordering(false)
    setSetsDone({}); setSkipped({})
    setExpanded({}); setActiveGif(null)
  }, [initialExercises])

  // ── Derived state (computed before hooks so the effect below can use them) ──
  const isDone    = (name) => { const s = setsDone[name]; return s ? s.every(Boolean) : false }
  const isSkipped = (name) => !!skipped[name]
  const allSettled = exercises.length > 0 && exercises.every(ex => isSkipped(ex.name) || isDone(ex.name))
  const doneCount  = exercises.filter(ex => isDone(ex.name)).length
  const skipCount  = exercises.filter(ex => isSkipped(ex.name)).length

  // Timer depends on allSettled — must be declared after it
  const workoutElapsed = useWorkoutTimer(started && !allSettled)

  // ── ALL hooks must come before any conditional return ─────────────
  useEffect(() => {
    if (allSettled && started) {
      // Recompute fresh inside effect to avoid stale closure
      const exStatuses = exercises.map(ex => ({
        name: ex.name,
        status: skipped[ex.name] ? 'skipped' : 'done',
      }))
      const freshDone = exStatuses.filter(e => e.status === 'done').length
      const freshSkipped = exStatuses.filter(e => e.status === 'skipped').length
      onComplete?.({
        exercises: exStatuses,
        doneCount: freshDone,
        skippedCount: freshSkipped,
        durationSeconds: workoutElapsed,
      })
    }
  }, [allSettled])

  if (!visible || exercises.length === 0) return null

  // ── Reorder helpers ────────────────────────────────────────────────
  const blocks = groupExercises(exercises)

  const moveBlock = (idx, dir) => {
    const newBlocks = [...blocks]
    const target = idx + dir
    if (target < 0 || target >= newBlocks.length) return
    ;[newBlocks[idx], newBlocks[target]] = [newBlocks[target], newBlocks[idx]]
    setExercises(newBlocks.flatMap(b => b.exercises))
  }

  // ── Set tracking ───────────────────────────────────────────────────
  const getSets = (ex) => setsDone[ex.name] || Array(ex.sets || 3).fill(false)

  const markSet = (ex, setIdx) => {
    const arr = [...getSets(ex)]
    arr[setIdx] = !arr[setIdx]
    const allDone = arr.every(Boolean)

    setSetsDone(prev => ({ ...prev, [ex.name]: arr }))

    if (!arr[setIdx]) return // unchecking — no rest

    if (allDone && ex.supersetGroup) {
      // Last set of this superset exercise — check if all peers also done this round
      const peers = exercises.filter(e => e.supersetGroup === ex.supersetGroup)
      const allPeersDone = peers.every(p => {
        const pSets = p.name === ex.name ? arr : (setsDone[p.name] || [])
        return pSets.every(Boolean)
      })
      if (allPeersDone) {
        setRestLabel(`Rest after superset`)
        rest.start(ex.supersetRestSeconds || 90)
      } else if (ex.supersetIndex < ex.supersetTotal - 1) {
        setRestLabel(`Rest before next exercise`)
        rest.start(ex.restSeconds || 20)
      }
    } else if (!allDone) {
      // Mid-set rest
      const isLastExInSuperset = ex.supersetGroup && ex.supersetIndex === ex.supersetTotal - 1
      const restSecs = isLastExInSuperset ? (ex.supersetRestSeconds || 90) : (ex.restSeconds || 60)
      const label = isLastExInSuperset ? 'Rest after superset' : `Rest · ${fmt(restSecs)}`
      setRestLabel(label)
      rest.start(restSecs)
    }
  }

  const skipEx = (name) => setSkipped(p => ({ ...p, [name]: true }))
  const undoEx = (name) => {
    setSkipped(p => ({ ...p, [name]: false }))
    setSetsDone(p => ({ ...p, [name]: Array(exercises.find(e => e.name === name)?.sets || 3).fill(false) }))
  }
  const toggleExpand = (name) => setExpanded(p => ({ ...p, [name]: !p[name] }))


  const handleStart = () => {
    setStarted(true)
    if (exercises[0]) setExpanded({ [exercises[0].name]: true })
  }

  // ── Render one exercise row ────────────────────────────────────────
  const renderExercise = (ex, { isSuperset, isLast } = {}) => {
    const done    = isDone(ex.name)
    const skipped = isSkipped(ex.name)
    const open    = !!expanded[ex.name]
    const sets    = getSets(ex)
    const videoUrl= getVideoUrl(ex.name)
    const gear    = getEquipment(ex.name)

    return (
      <div key={ex.name} className={`exercise-item-wrapper ${done ? 'exercise-done' : ''} ${skipped ? 'exercise-skipped' : ''}`}>
        <div className="exercise-item" onClick={() => started && toggleExpand(ex.name)} style={{ cursor: started ? 'pointer' : 'default' }}>
          <div className="exercise-left">
            {done    && <CheckCircle className="exercise-status-icon" size={16} />}
            {skipped && <SkipForward className="exercise-status-icon skipped" size={16} />}
            <div>
              <div className="exercise-name">{ex.name}</div>
              {ex.sets && ex.reps && (
                <div className="exercise-meta">
                  {ex.sets} × {ex.reps}
                  {isSuperset && !isLast && ex.restSeconds ? ` · ${ex.restSeconds}s to next` : ''}
                  {isSuperset && isLast && ex.supersetRestSeconds ? ` · ${ex.supersetRestSeconds}s rest/round` : ''}
                  {!isSuperset && ex.restSeconds ? ` · ${ex.restSeconds}s rest` : ''}
                </div>
              )}
              {gear.length > 0 && (
                <div className="exercise-gear">{gear.join(' · ')}</div>
              )}
            </div>
          </div>
          <div className="exercise-actions">
            {videoUrl && (
              <button
                className={`exercise-video-btn ${activeGif === ex.name ? 'active' : ''}`}
                onClick={e => { e.stopPropagation(); setActiveGif(g => g === ex.name ? null : ex.name) }}
                aria-label={`${activeGif === ex.name ? 'Hide' : 'Show'} ${ex.name} demo`}
                title={activeGif === ex.name ? 'Hide demo' : 'Show demo'}>
                {activeGif === ex.name ? <X size={13} /> : <Play size={13} />}
              </button>
            )}
            {started && !done && !skipped && (
              <button className="exercise-btn skip-btn" onClick={e => { e.stopPropagation(); skipEx(ex.name) }}>
                <SkipForward size={12} /> Skip
              </button>
            )}
            {skipped && (
              <button className="exercise-btn undo-btn" onClick={e => { e.stopPropagation(); undoEx(ex.name) }}>
                <RotateCcw size={12} /> Undo
              </button>
            )}
            {started && <span className="exercise-expand-icon">{open ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</span>}
          </div>
        </div>

        {open && started && !skipped && (
          <div className="set-tracker">
            {sets.map((d, si) => (
              <button key={si} className={`set-btn ${d ? 'set-done' : ''}`} onClick={() => markSet(ex, si)}>
                {d && <CheckCircle size={14} />} Set {si + 1}
              </button>
            ))}
          </div>
        )}

        {activeGif === ex.name && videoUrl && (
          <div className="exercise-gif-wrapper">
            <img src={videoUrl} alt={`${ex.name} demonstration`} className="exercise-gif" loading="lazy" />
          </div>
        )}

      </div>
    )
  }

  // ── Render superset block — unified Rounds UX ─────────────────────
  const renderSupersetBlock = (block, bIdx) => {
    const numRounds = block.exercises[0]?.sets || 3
    const restBetween = block.exercises[0]?.restSeconds || 20
    const restAfter = block.exercises[0]?.supersetRestSeconds || 90
    // A round is "done" when ALL exercises in the block have that set index checked
    const roundsDone = Array.from({ length: numRounds }, (_, ri) =>
      block.exercises.every(ex => (setsDone[ex.name] || [])[ri])
    )
    const allRoundsDone = roundsDone.every(Boolean)
    const allSkipped = block.exercises.every(ex => isSkipped(ex.name))

    const markRound = (roundIdx) => {
      const alreadyDone = roundsDone[roundIdx]
      // Toggle all exercises in this round simultaneously
      block.exercises.forEach((ex, ei) => {
        const arr = [...(setsDone[ex.name] || Array(numRounds).fill(false))]
        arr[roundIdx] = !alreadyDone
        setSetsDone(prev => ({ ...prev, [ex.name]: arr }))
      })
      if (!alreadyDone) {
        const isLastRound = roundIndex => roundIndex === numRounds - 1
        if (isLastRound(roundIdx)) {
          setRestLabel('Rest after superset')
          rest.start(restAfter)
        } else {
          setRestLabel(`Rest · round ${roundIdx + 2} coming up`)
          rest.start(restAfter)
        }
      }
    }

    const skipBlock = () => block.exercises.forEach(ex => skipEx(ex.name))
    const undoBlock = () => block.exercises.forEach(ex => undoEx(ex.name))

    return (
      <div key={block.groupId} className={`exercise-block superset-block ${allRoundsDone ? 'exercise-done' : ''} ${allSkipped ? 'exercise-skipped' : ''}`}>
        {reordering && (
          <div className="reorder-controls">
            <button className="reorder-btn" onClick={() => moveBlock(bIdx, -1)} disabled={bIdx === 0}><ArrowUp size={14}/></button>
            <button className="reorder-btn" onClick={() => moveBlock(bIdx, 1)} disabled={bIdx === blocks.length - 1}><ArrowDown size={14}/></button>
          </div>
        )}

        {/* Superset header */}
        <div className="superset-label">
          Superset · {numRounds} rounds · {restAfter}s rest/round
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {started && !allRoundsDone && !allSkipped && (
              <button className="exercise-btn skip-btn" onClick={skipBlock}><SkipForward size={12}/> Skip all</button>
            )}
            {allSkipped && (
              <button className="exercise-btn undo-btn" onClick={undoBlock}><RotateCcw size={12}/> Undo</button>
            )}
          </div>
        </div>

        {/* Exercise list — show each exercise with GIF toggle, gear, no individual sets */}
        {block.exercises.map((ex, ei) => {
          const videoUrl = getVideoUrl(ex.name)
          const gear = getEquipment(ex.name)
          return (
            <div key={ex.name} className="superset-exercise-row">
              <div className="superset-exercise-left">
                <div className="exercise-name">{ex.name}</div>
                <div className="exercise-meta">
                  {ex.reps}
                  {ei < block.exercises.length - 1 && restBetween ? ` · ${restBetween}s rest, then next` : ''}
                </div>
                {gear.length > 0 && <div className="exercise-gear">{gear.join(' · ')}</div>}
              </div>
              {videoUrl && (
                <button
                  className={`exercise-video-btn ${activeGif === ex.name ? 'active' : ''}`}
                  onClick={() => setActiveGif(g => g === ex.name ? null : ex.name)}
                  title={activeGif === ex.name ? 'Hide demo' : 'Show demo'}>
                  {activeGif === ex.name ? <X size={13}/> : <Play size={13}/>}
                </button>
              )}
              {activeGif === ex.name && videoUrl && (
                <div className="exercise-gif-wrapper" style={{ width: '100%' }}>
                  <img src={videoUrl} alt={ex.name} className="exercise-gif" loading="lazy" />
                </div>
              )}
            </div>
          )
        })}

        {/* Round buttons */}
        {started && !allSkipped && (
          <div className="set-tracker superset-rounds">
            {roundsDone.map((done, ri) => (
              <button key={ri} className={`set-btn ${done ? 'set-done' : ''}`} onClick={() => markRound(ri)}>
                {done && <CheckCircle size={14}/>} Round {ri + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Main render ────────────────────────────────────────────────────
  return (
    <div className="workout-card">
      {/* Header */}
      <div className="workout-card-header">
        <div className="workout-card-icon"><Dumbbell size={20} color="#fff" /></div>
        <div style={{ flex: 1 }}>
          <div className="workout-card-title">Today's session{memberName ? `, ${memberName}` : ''}</div>
          <div className="workout-card-sub">
            {allSettled ? `Complete — ${doneCount} done${skipCount ? `, ${skipCount} skipped` : ''}`
              : started  ? `${doneCount} of ${exercises.length} done`
              : `${exercises.length} exercises`}
          </div>
        </div>
        {started && (
          <div className="workout-timer"><Timer size={13} />{fmt(workoutElapsed)}</div>
        )}
        {!started && !allSettled && (
          <button className="btn-reorder" onClick={() => setReordering(r => !r)} title="Reorder exercises">
            <GripVertical size={16} />
          </button>
        )}
      </div>

      {/* You'll need — equipment summary shown before workout starts */}
      {!started && !allSettled && (() => {
        const allGear = [...new Set(exercises.flatMap(ex => getEquipment(ex.name)))]
        if (!allGear.length) return null
        return (
          <div className="equipment-summary">
            <span className="equipment-summary-label">You'll need:</span>
            <span className="equipment-summary-items">{allGear.join(' · ')}</span>
          </div>
        )
      })()}

      {/* Rest timer */}
      {rest.active && (
        <div className="rest-timer-bar">
          <span className="rest-timer-label">{restLabel || 'Rest'}</span>
          <span className="rest-timer-countdown">{fmt(rest.remaining)}</span>
          <button className="rest-skip-btn" onClick={rest.skip}>Skip</button>
        </div>
      )}

      {/* Exercise blocks */}
      <div className="exercise-list">
        {blocks.map((block, bIdx) => {
          if (block.type === 'single') {
            const ex = block.exercises[0]
            return (
              <div key={ex.name} className="exercise-block">
                {reordering && (
                  <div className="reorder-controls">
                    <button className="reorder-btn" onClick={() => moveBlock(bIdx, -1)} disabled={bIdx === 0}><ArrowUp size={14}/></button>
                    <button className="reorder-btn" onClick={() => moveBlock(bIdx, 1)} disabled={bIdx === blocks.length - 1}><ArrowDown size={14}/></button>
                  </div>
                )}
                {renderExercise(ex)}
              </div>
            )
          }
          // Superset block — unified Rounds UX
          return renderSupersetBlock(block, bIdx)
        })}
      </div>

      {/* CTA */}
      {!started && !allSettled && (
        <button className="btn-start-workout" onClick={handleStart}>
          <Play size={16} /> Start workout
        </button>
      )}
      {allSettled && (
        <div className="workout-complete-banner">
          <CheckCircle size={16} /> Workout logged! {doneCount} done in {fmt(workoutElapsed)}.
        </div>
      )}
      {started && !allSettled && (
        <div className="workout-card-footer">
          <span className="workout-card-coach-hint"><MessageCircle size={13} /> Message your coach to adjust</span>
        </div>
      )}
    </div>
  )
}
