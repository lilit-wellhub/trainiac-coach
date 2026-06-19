import { useState, useCallback, useEffect, useRef } from 'react'
import { geminiChat } from './gemini.js'
import ChatWindow from './components/ChatWindow.jsx'
import InputBar from './components/InputBar.jsx'
import ProgressCard from './components/ProgressCard.jsx'
import PhaseIndicator from './components/PhaseIndicator.jsx'
import WorkoutCard from './components/WorkoutCard.jsx'
import WorkoutHistory from './components/WorkoutHistory.jsx'
import OnboardingPills from './components/OnboardingPills.jsx'
import ProfileEditor from './components/ProfileEditor.jsx'
import WeekProgram from './components/WeekProgram.jsx'
import QuickReplies from './components/QuickReplies.jsx'
import { saveWorkout, saveActivity, getHistory, getSessionStats, getWorkoutToday, getTodayWorkouts } from './workoutHistory.js'
import { saveProfile, loadProfile, clearProfile } from './memberProfile.js'
import { saveProgram, loadProgram } from './programStorage.js'
import { buildSystemPrompt } from './buildSystemPrompt.js'
import WelcomeScreen from './components/WelcomeScreen.jsx'

function makeInitialMessage(existingProfile, todayWorkout, todayWorkoutCount = 0) {
  if (existingProfile) {
    const name = existingProfile.memberName || 'there'
    const goal = existingProfile.goal || 'your training'
    if (todayWorkoutCount > 1) {
      return {
        role: 'coach',
        content: `Hey ${name}! You've already crushed ${todayWorkoutCount} sessions today — impressive. How are you feeling? Want to add more or just recover?`,
        timestamp: Date.now()
      }
    }
    if (todayWorkout) {
      const doneCount = todayWorkout.exercises?.filter(e => e.status === 'done').length || 0
      return {
        role: 'coach',
        content: `Hey ${name}! You already got a session in today — nice work (${doneCount} exercise${doneCount !== 1 ? 's' : ''} done). How did it feel?`,
        timestamp: Date.now()
      }
    }
    return {
      role: 'coach',
      content: `Hey ${name}! Ready to train? Let me put together today's session for ${goal.toLowerCase()}.`,
      timestamp: Date.now()
    }
  }
  return {
    role: 'coach',
    content: "Hey! I'm your Trainiac AI Coach — I'll build a personalised training plan around your goals, schedule and any physical constraints, then adapt it week by week.\n\nThis will take about 2 minutes. Let's start with the basics: what should I call you?",
    timestamp: Date.now()
  }
}

function makeInitialSessionData(existingProfile) {
  if (existingProfile) {
    const stats = getSessionStats()
    return {
      memberName: existingProfile.memberName,
      goal: existingProfile.goal,
      schedule: existingProfile.schedule,
      equipment: existingProfile.equipment,
      injuries: existingProfile.injuries,
      sessionsCompleted: stats.totalSessions,
      streakWeeks: stats.streakWeeks,
      scheduleAdherence: null,
    }
  }
  return {
    memberName: null,
    sessionsCompleted: 0,
    streakWeeks: 0,
    goal: null,
    schedule: null,
    equipment: null,
    injuries: null,
    scheduleAdherence: null,
  }
}

function getPhase(messageCount) {
  if (messageCount <= 12) return 1
  if (messageCount <= 20) return 2
  return 3
}

export default function App() {
  const existingProfile = loadProfile()
  const recentHistory = getHistory()
  const todayWorkout = getWorkoutToday()
  const todayWorkouts = getTodayWorkouts()
  const systemPrompt = buildSystemPrompt(existingProfile, recentHistory, todayWorkouts)

  const [showWelcome, setShowWelcome] = useState(!existingProfile)
  const [messages, setMessages] = useState([makeInitialMessage(existingProfile, todayWorkout, todayWorkouts.length)])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState(todayWorkout ? 2 : existingProfile ? 3 : 1)
  const [showWorkoutCard, setShowWorkoutCard] = useState(false)
  const [exercises, setExercises] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showProgram, setShowProgram] = useState(false)
  const [isReturningMember, setIsReturningMember] = useState(!!existingProfile)
  const [sessionData, setSessionData] = useState(makeInitialSessionData(existingProfile))
  const [activeTab, setActiveTab] = useState('train')
  const [programVersion, setProgramVersion] = useState(0)
  const [historyVersion, setHistoryVersion] = useState(0)
  const [workoutCollapsed, setWorkoutCollapsed] = useState(false)
  const autoTriggered = useRef(false)

  // Auto-trigger plan generation for returning members — no dead wait state
  useEffect(() => {
    if (autoTriggered.current) return
    if (existingProfile && !loading) {
      autoTriggered.current = true
      const trigger = todayWorkout
        ? '__checkin_trigger__'
        : '__plan_trigger__'
      // Send a hidden system trigger the AI interprets via the system prompt
      sendMessageWithText(trigger, [makeInitialMessage(existingProfile, todayWorkout, todayWorkouts.length)])
    }
  }, []) // eslint-disable-line

  // Core send function that takes text as a parameter
  const sendMessageWithText = useCallback(async (text, currentMessages) => {
    if (!text || loading) return

    const isHiddenTrigger = text.startsWith('__') && text.endsWith('__')
    const isWorkoutSummary = text.startsWith('__workout_complete__')
    const userMsg = {
      role: 'user',
      content: text,
      timestamp: Date.now(),
      hidden: isHiddenTrigger,
      type: isWorkoutSummary ? 'workout_summary' : undefined,
    }
    const newMessages = [...currentMessages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      // Rebuild prompt with latest profile/history each send
      const currentProfile = loadProfile()
      const currentHistory = getHistory()
      const currentTodayWorkouts = getTodayWorkouts()
      const currentSystemPrompt = buildSystemPrompt(currentProfile, currentHistory, currentTodayWorkouts)

      let responseText = await geminiChat(currentSystemPrompt, newMessages)

      // Parse WEEK_PLAN marker
      const weekPlanMatch = responseText.match(/\[WEEK_PLAN:([^\]]+)\]/)
      if (weekPlanMatch) {
        const days = weekPlanMatch[1].split('|').map(d => {
          const [day, focus] = d.split('=')
          return { day: day.trim(), focus: focus?.trim() || '' }
        })
        saveProgram({ days, updatedAt: new Date().toISOString() })
        setProgramVersion(v => v + 1)
        responseText = responseText.replace(weekPlanMatch[0], '').trim()
      }

      // Parse ALL LOG_ACTIVITY markers (coach may emit multiple in one message)
      const logActivityRegex = /\[LOG_ACTIVITY:([^\]]+)\]/g
      let logMatch
      while ((logMatch = logActivityRegex.exec(responseText)) !== null) {
        const parts = logMatch[1].split('|')
        saveActivity({ name: parts[0]?.trim(), date: parts[1]?.trim(), durationMin: parts[2] ? parseInt(parts[2]) : null })
        setHistoryVersion(v => v + 1)
      }
      responseText = responseText.replace(/\[LOG_ACTIVITY:[^\]]+\]/g, '').trim()

      // Parse PROFILE_UPDATE marker — emitted after [ONBOARDING_COMPLETE]
      const profileUpdateMatch = responseText.match(/\[PROFILE_UPDATE:([^\]]+)\]/)
      if (profileUpdateMatch) {
        const fields = {}
        profileUpdateMatch[1].split('|').forEach(pair => {
          const eqIdx = pair.indexOf('=')
          if (eqIdx > 0) fields[pair.slice(0, eqIdx).trim()] = pair.slice(eqIdx + 1).trim()
        })
        const existing = loadProfile() || {}
        saveProfile({
          ...existing,
          memberName: fields.name || existing.memberName,
          goal: fields.goal || existing.goal,
          schedule: fields.schedule || existing.schedule,
          sessionDuration: fields.duration || existing.sessionDuration,
          equipment: fields.equipment || existing.equipment,
          injuries: fields.injuries || existing.injuries,
        })
        responseText = responseText.replace(/\[PROFILE_UPDATE:[^\]]+\]\n?/g, '').trim()
      }

      // Parse RESCHEDULE marker — format: [RESCHEDULE:FromDay>ToDay|FocusLabel]
      const rescheduleRegex = /\[RESCHEDULE:([^\]]+)\]/g
      let rescheduleMatch
      while ((rescheduleMatch = rescheduleRegex.exec(responseText)) !== null) {
        const payload = rescheduleMatch[1]
        const [dayPart, focus] = payload.split('|')
        const [fromDay, toDay] = (dayPart || '').split('>')
        if (fromDay && toDay) {
          const existingProgram = loadProgram()
          if (existingProgram) {
            const updatedDays = existingProgram.days.map(d => ({ ...d }))
            const fromEntry = updatedDays.find(d => d.day === fromDay.trim())
            const toEntry = updatedDays.find(d => d.day === toDay.trim())
            if (fromEntry) {
              const movedFocus = focus?.trim() || fromEntry.focus
              const movedExercises = fromEntry.exercises
              fromEntry.focus = 'Rest'
              fromEntry.exercises = []
              if (toEntry) {
                toEntry.focus = movedFocus
                if (movedExercises?.length) toEntry.exercises = movedExercises
              } else {
                updatedDays.push({ day: toDay.trim(), focus: movedFocus, exercises: movedExercises || [] })
              }
              saveProgram({ ...existingProgram, days: updatedDays, updatedAt: new Date().toISOString() })
              setProgramVersion(v => v + 1)
            }
          }
        }
      }
      responseText = responseText.replace(/\[RESCHEDULE:[^\]]+\]/g, '').trim()

      // Parse PLAN_READY — supports standalone and supersets
      let planReady = false
      let parsedExercises = []
      const planMatch = responseText.match(/\[PLAN_READY:([^\]]+)\]/)
      if (planMatch) {
        planReady = true
        let supersetGroupId = 0
        parsedExercises = planMatch[1].split('|').flatMap(raw => {
          const parts = raw.trim().split('::')
          const nameField = parts[0]?.trim() || ''
          const setsReps = parts[1]?.trim() || ''
          const srMatch = setsReps.match(/^(\d+)x(.+)$/)
          const sets = srMatch ? parseInt(srMatch[1]) : 3
          const reps = srMatch ? srMatch[2] : ''

          if (nameField.includes('+')) {
            // Superset: ExA+ExB::sets::intraRest::interRest
            const names = nameField.split('+').map(n => n.trim())
            const intraRest = parseInt(parts[2]) || 20
            const interRest = parseInt(parts[3]) || 90
            const groupId = `ss${++supersetGroupId}`
            return names.map((name, i) => ({
              name, sets, reps,
              restSeconds: intraRest,           // rest between exercises in superset
              supersetGroup: groupId,
              supersetRestSeconds: interRest,    // rest after completing full superset round
              supersetIndex: i,
              supersetTotal: names.length,
            }))
          }
          // Standalone
          return [{ name: nameField, sets, reps, restSeconds: parseInt(parts[2]) || 60, supersetGroup: null }]
        }).filter(e => e.name)
        responseText = responseText.replace(planMatch[0], '').trim()
      }

      // Handle semantic phase markers
      if (responseText.includes('[ONBOARDING_COMPLETE]')) {
        responseText = responseText.replace('[ONBOARDING_COMPLETE]', '').trim()
        setPhase(2)
      }
      if (responseText.includes('[CHECKIN_COMPLETE]')) {
        responseText = responseText.replace('[CHECKIN_COMPLETE]', '').trim()
        setPhase(3)
      }

      const coachMsg = { role: 'coach', content: responseText, timestamp: Date.now() }
      const updatedMessages = [...newMessages, coachMsg]
      setMessages(updatedMessages)

      // Message-count phase fallback (secondary)
      const newPhase = getPhase(updatedMessages.length)
      setPhase(prev => Math.max(prev, newPhase))

      // Extract member name: Q1 is always the name — grab it from the first user message directly
      const userMessages = updatedMessages.filter(m => m.role === 'user')
      if (userMessages.length === 1 && !loadProfile()?.memberName) {
        const extractedName = userMessages[0].content.trim().split(/\s+/)[0]
        if (extractedName && extractedName.length > 1) {
          const capitalized = extractedName.charAt(0).toUpperCase() + extractedName.slice(1).toLowerCase()
          setSessionData(prev => ({ ...prev, memberName: capitalized }))
          const existing = loadProfile() || {}
          saveProfile({ ...existing, memberName: capitalized })
        }
      }

      // Extract profile fields from conversation position
      const allUserMessages = updatedMessages.filter(m => m.role === 'user')
      setSessionData(prev => {
        const next = { ...prev }
        if (allUserMessages.length >= 2 && !next.goal) {
          next.goal = allUserMessages[1]?.content?.slice(0, 80) || null
        }
        if (allUserMessages.length >= 3 && !next.schedule) {
          next.schedule = allUserMessages[2]?.content?.slice(0, 80) || null
        }
        if (allUserMessages.length >= 4 && !next.equipment) {
          next.equipment = allUserMessages[3]?.content?.slice(0, 80) || null
        }
        if (allUserMessages.length >= 5 && !next.injuries) {
          next.injuries = allUserMessages[4]?.content?.slice(0, 80) || null
        }
        return next
      })

      if (planReady) {
        setShowWorkoutCard(true)
        setExercises(parsedExercises)
        setWorkoutCollapsed(false)  // expand card when new plan arrives
        // Store today's exercises in the program so Progress tab can show them
        const todayDayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()]
        const existingProgram = loadProgram()
        if (existingProgram) {
          const updatedDays = existingProgram.days.map(d =>
            d.day === todayDayName ? { ...d, exercises: parsedExercises.map(e => ({ name: e.name, sets: e.sets, reps: e.reps })) } : d
          )
          saveProgram({ ...existingProgram, days: updatedDays })
          setProgramVersion(v => v + 1)
        }
        // Save profile after first full session
        setSessionData(prev => {
          saveProfile({
            memberName: prev.memberName,
            goal: prev.goal,
            schedule: prev.schedule,
            equipment: prev.equipment,
            injuries: prev.injuries,
          })
          const stats = getSessionStats()
          return { ...prev, sessionsCompleted: stats.totalSessions, streakWeeks: stats.streakWeeks }
        })
      }

    } catch (err) {
      const errorMsg = { role: 'coach', content: 'Something went wrong. Please try again.', timestamp: Date.now() }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }, [loading])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    await sendMessageWithText(text, messages)
  }, [input, messages, sendMessageWithText])

  const handlePillSelect = useCallback((answer) => {
    // Map answer to profile field based on current coach question
    const lastCoachMsg = [...messages].reverse().find(m => m.role === 'coach')
    const content = lastCoachMsg?.content?.toLowerCase() || ''

    let profileUpdate = {}
    if (content.includes('trying to achieve') || content.includes("what's on your mind")) {
      profileUpdate = { goal: answer }
    } else if (content.includes('how many days') || content.includes('days a week')) {
      const existing = loadProfile()
      profileUpdate = { schedule: answer + (existing?.scheduleDuration ? `, ${existing.scheduleDuration}` : '') }
    } else if (content.includes('how long per session') || content.includes('20–30 min') || content.includes('hour plus')) {
      const existing = loadProfile()
      const days = existing?.schedule?.replace(/,.*/, '') || ''
      profileUpdate = { schedule: days ? `${days}, ${answer}` : answer }
    } else if (content.includes('where do you') || content.includes('equipment')) {
      profileUpdate = { equipment: answer }
    } else if (content.includes('anything physical') || content.includes('injuries')) {
      profileUpdate = { injuries: answer }
    }

    if (Object.keys(profileUpdate).length > 0) {
      const current = loadProfile() || {}
      saveProfile({ ...current, ...profileUpdate })
      setSessionData(prev => ({ ...prev, ...profileUpdate }))
    }

    sendMessageWithText(answer, messages)
  }, [messages, sendMessageWithText])

  const handleNewSession = () => {
    const profile = loadProfile()
    if (profile) {
      // Returning member: keep profile, reset conversation
      const stats = getSessionStats()
      setMessages([makeInitialMessage(profile)])
      setInput('')
      setLoading(false)
      setPhase(2)
      setShowWorkoutCard(false)
      setExercises([])
      setIsReturningMember(true)
      setSessionData({
        memberName: profile.memberName,
        goal: profile.goal,
        schedule: profile.schedule,
        equipment: profile.equipment,
        injuries: profile.injuries,
        sessionsCompleted: stats.totalSessions,
        streakWeeks: stats.streakWeeks,
        scheduleAdherence: null,
      })
    } else {
      // No profile: start fresh as new member
      setMessages([makeInitialMessage(null)])
      setInput('')
      setLoading(false)
      setPhase(1)
      setShowWorkoutCard(false)
      setExercises([])
      setIsReturningMember(false)
      setSessionData({
        memberName: null,
        sessionsCompleted: 0,
        streakWeeks: 0,
        goal: null,
        schedule: null,
        equipment: null,
        injuries: null,
        scheduleAdherence: null,
      })
    }
  }

  const handleReset = () => {
    clearProfile()
    setMessages([makeInitialMessage(null)])
    setInput('')
    setLoading(false)
    setPhase(1)
    setShowWorkoutCard(false)
    setExercises([])
    setIsReturningMember(false)
    setSessionData({
      memberName: null,
      sessionsCompleted: 0,
      streakWeeks: 0,
      goal: null,
      schedule: null,
      equipment: null,
      injuries: null,
      scheduleAdherence: null,
    })
  }

  const tabs = [
    { id: 'train', label: 'Coach', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    )},
    { id: 'progress', label: 'Train', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="12" x2="18" y2="12"/>
        <line x1="3" y1="9" x2="3" y2="15"/>
        <line x1="21" y1="9" x2="21" y2="15"/>
        <line x1="6" y1="8" x2="6" y2="16"/>
        <line x1="18" y1="8" x2="18" y2="16"/>
      </svg>
    )},
    { id: 'me', label: 'Me', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    )},
  ]

  if (showWelcome) {
    return <WelcomeScreen onGetStarted={() => setShowWelcome(false)} />
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="header-icon">
              <svg width="28" height="28" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <rect width="512" height="512" rx="96" fill="#0e0c1e"/>
                <rect x="144" y="144" width="224" height="56" rx="8" fill="#F5F0EB"/>
                <polygon points="280,200 232,304 265,304 226,372 304,268 269,268 296,200" fill="#F5F0EB"/>
              </svg>
            </div>
            <span className="header-wordmark">Trainiac <span className="header-wordmark-sub">AI Coach</span></span>
          </div>
        </div>
      </header>

      {!isReturningMember && phase < 3 && (
        <div className="phase-bar">
          <PhaseIndicator phase={phase} />
        </div>
      )}

      <main className="main">
        <div className="chat-card">

          {/* Train tab — workout card (collapsible, above chat) + coach chat */}
          {activeTab === 'train' && (
            <>
              <ProgressCard sessionData={sessionData} visible={phase >= 2} />
              <ChatWindow
                messages={messages}
                loading={loading}
                pillsSlot={
                  phase === 1
                    ? <OnboardingPills messages={messages} phase={phase} onSelect={handlePillSelect} />
                    : <QuickReplies messages={messages} phase={phase} loading={loading} onSelect={(r) => {
                        if (r === 'Show me the plan') { setActiveTab('progress'); return }
                        sendMessageWithText(r, messages)
                      }} />
                }
              />
              {showWorkoutCard && (
                <button className="workout-link-chip" onClick={() => setActiveTab('progress')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4.09 12.96a.5.5 0 0 0 .41.79H11l-1 9 8.91-10.96a.5.5 0 0 0-.41-.79H13l1-9z"/></svg>
                  Start today's workout
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              )}
              <InputBar value={input} onChange={setInput} onSend={sendMessage} disabled={loading} />
            </>
          )}

          {/* Progress tab — active workout + weekly program + history */}
          {activeTab === 'progress' && (
            <div className="tab-view">
              <WorkoutCard
                visible={showWorkoutCard}
                memberName={sessionData.memberName}
                exercises={exercises}
                onAskCoach={(msg) => { setActiveTab('train'); setTimeout(() => sendMessageWithText(msg || 'I want to adjust my workout', messages), 100) }}
                onComplete={(summary) => {
                  saveWorkout({
                    memberName: sessionData.memberName,
                    exercises: summary.exercises,
                    durationSeconds: summary.durationSeconds,
                    doneCount: summary.doneCount,
                    skippedCount: summary.skippedCount,
                  })
                  setHistoryVersion(v => v + 1)
                  setShowWorkoutCard(false)
                  const stats = getSessionStats()
                  setSessionData(prev => ({ ...prev, sessionsCompleted: stats.totalSessions, streakWeeks: stats.streakWeeks }))
                  const mins = summary.durationSeconds ? Math.round(summary.durationSeconds / 60) : null
                  const doneCount = summary.doneCount || 0
                  const skipCount = summary.skippedCount || 0
                  const hiddenTrigger = `__workout_complete__|done=${doneCount}|skipped=${skipCount}${mins ? `|mins=${mins}` : ''}`
                  setTimeout(() => {
                    setActiveTab('train')
                    setTimeout(() => sendMessageWithText(hiddenTrigger, messages), 200)
                  }, 800)
                }}
              />
              <WeekProgram key={programVersion} inline onAskCoach={(msg) => { setActiveTab('train'); setTimeout(() => sendMessageWithText(msg, messages), 100) }} />
              <div className="tab-section-divider" />
              <WorkoutHistory key={historyVersion} inline />
            </div>
          )}

          {/* Me tab — profile editor */}
          {activeTab === 'me' && (
            <div className="tab-view">
              <ProfileEditor
                inline
                profile={loadProfile()}
                onSave={(updated) => {
                  const stats = getSessionStats()
                  setSessionData(prev => ({
                    ...prev,
                    memberName: updated.memberName,
                    goal: updated.goal,
                    schedule: updated.schedule,
                    equipment: updated.equipment,
                    injuries: updated.injuries,
                    sessionsCompleted: stats.totalSessions,
                    streakWeeks: stats.streakWeeks,
                  }))
                  // Stay on 'me' tab — ProfileEditor shows inline "Saved!" confirmation
                }}
              />
            </div>
          )}
        </div>
      </main>

      {/* Bottom tab bar */}
      <nav className="bottom-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`bottom-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="bottom-tab-icon-wrap">
              {tab.icon}
              {tab.id === 'progress' && showWorkoutCard && <span className="tab-badge" />}
            </span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
