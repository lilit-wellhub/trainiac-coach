const PILL_OPTIONS = {
  goal: [
    'Build strength',
    'Lose weight / tone',
    'Run further & faster',
    'Stay active & healthy',
    'Improve flexibility',
    'Recover from injury',
  ],
  schedule_days: ['1–2× a week', '3× a week', '4–5× a week', 'Every day'],
  schedule_duration: ['20–30 min', '45 min', '60+ min'],
  location: ['Gym (full equipment)', 'Home with dumbbells', 'Bodyweight only', 'Outdoors'],
  injuries: ['No injuries', 'Lower back', 'Knee', 'Shoulder', 'Hip / glute', 'Wrist'],
}

function detectQuestion(coachMessage) {
  const m = coachMessage?.toLowerCase() || ''
  if (m.includes('what should i call you')) return null
  if (m.includes('trying to achieve') || m.includes("what's on your mind") || m.includes('what are you trying')) return 'goal'
  // Duration question comes before days in the message text but after in the flow — check duration first (more specific)
  if (m.includes('how long per session') || m.includes('20–30 min') || m.includes('45 min') || m.includes('hour plus') || m.includes('long per session')) return 'schedule_duration'
  if (m.includes('how many days') || m.includes('days a week')) return 'schedule_days'
  if (m.includes('where do you') || m.includes('equipment')) return 'location'
  if (m.includes('anything physical') || m.includes('injuries') || m.includes('flares up') || m.includes('old injuries')) return 'injuries'
  return null
}

export default function OnboardingPills({ messages, onSelect, phase }) {
  if (phase !== 1) return null

  const lastCoachMsg = [...messages].reverse().find(m => m.role === 'coach')
  const questionType = detectQuestion(lastCoachMsg?.content)

  if (!questionType) return null

  return (
    <div className="onboarding-pills">
      {PILL_OPTIONS[questionType].map(pill => (
        <button key={pill} className="pill" onClick={() => onSelect(pill)}>
          {pill}
        </button>
      ))}
    </div>
  )
}
