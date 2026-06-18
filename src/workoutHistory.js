const STORAGE_KEY = 'trainiac_workout_history'

export function saveWorkout(workout) {
  const history = getHistory()
  history.unshift({ ...workout, id: Date.now(), completedAt: new Date().toISOString() })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)))
}

// Log a non-gym activity (padel, cycling, yoga, etc.)
export function saveActivity({ name, date, durationMin }) {
  const history = getHistory()
  // Parse date as local noon to avoid UTC-offset rolling to wrong day
  const completedAt = date ? new Date(`${date}T12:00:00`).toISOString() : new Date().toISOString()
  history.unshift({
    id: Date.now(),
    type: 'activity',
    activityName: name,
    durationSeconds: durationMin ? durationMin * 60 : null,
    exercises: [{ name, status: 'done' }],
    doneCount: 1,
    completedAt,
  })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50))) // keep last 50
}

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function getWorkoutToday() {
  const history = getHistory()
  const today = new Date().toDateString()
  return history.find(w => new Date(w.completedAt).toDateString() === today) || null
}

export function getTodayWorkouts() {
  const history = getHistory()
  const today = new Date().toDateString()
  return history.filter(w => new Date(w.completedAt).toDateString() === today)
}

export function getSessionStats() {
  const history = getHistory()
  if (history.length === 0) return { totalSessions: 0, streakWeeks: 0 }

  // Only count gym workouts (not logged activities) for session count
  const gymSessions = history.filter(w => w.type !== 'activity')
  const totalSessions = gymSessions.length

  // Get the Monday (start) of the ISO week containing a date
  const weekStart = (dateStr) => {
    const d = new Date(dateStr)
    const day = d.getDay() // 0=Sun
    const diff = (day === 0 ? -6 : 1 - day) // shift to Monday
    const mon = new Date(d)
    mon.setDate(d.getDate() + diff)
    mon.setHours(0, 0, 0, 0)
    return mon.getTime()
  }

  const nowWeekStart = weekStart(new Date().toISOString())

  // Collect unique week-starts that have at least one entry, sorted descending
  const weekStarts = [...new Set(history.map(w => weekStart(w.completedAt)))]
    .sort((a, b) => b - a)

  // Count consecutive weeks from the current week (or last week) backwards
  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000
  let streakWeeks = 0
  let expected = nowWeekStart

  // Allow streak to include last week if nothing logged this week yet
  if (!weekStarts.includes(nowWeekStart) && weekStarts[0] === nowWeekStart - MS_PER_WEEK) {
    expected = nowWeekStart - MS_PER_WEEK
  }

  for (const ws of weekStarts) {
    if (ws === expected) {
      streakWeeks++
      expected -= MS_PER_WEEK
    } else if (ws < expected) {
      break // gap found
    }
  }

  return { totalSessions, streakWeeks }
}
