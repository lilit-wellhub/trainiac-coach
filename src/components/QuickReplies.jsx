// Shows contextual quick-reply pills after a coach message (phase 2+)

const CONTEXTS = {
  confirm_log: {
    detect: m => (m.includes('log') || m.includes('record')) && (m.includes('want me') || m.includes('shall i') || m.includes('should i') || m.includes('want to')),
    replies: ['Yes, log it!', 'Log and reschedule', 'Skip the logging', 'Just this one'],
  },
  confirm_reschedule: {
    detect: m => m.includes('reschedule') && (m.includes('want me') || m.includes('shall i') || m.includes('want to')),
    replies: ['Yes, reschedule it', 'Later this week', 'Skip it this time', 'I\'ll fit it in myself'],
  },
  confirm_generic: {
    detect: m => (m.includes('want me to') || m.includes('shall i') || m.includes('should i') || m.includes('would you like')) && m.endsWith('?'),
    replies: ['Yes, go ahead', 'Sure!', 'Not right now', 'Tell me more'],
  },
  checkin: {
    detect: m => m.includes('how did') || m.includes('how was') || m.includes('how\'s') || m.includes('how has') || m.includes('how are you feeling') || m.includes('how did it feel') || m.includes('how did that'),
    replies: ['It went great!', 'It was tough', 'I skipped a session', 'Feeling a bit sore', 'Ready to push harder'],
  },
  adjustment: {
    detect: m => m.includes('adjust') || m.includes('swap') || m.includes('modify') || m.includes('change') || m.includes('tweak'),
    replies: ['Looks good!', 'Make it harder', 'Make it easier', 'Swap an exercise', 'I have less time today'],
  },
  plan_ready: {
    detect: m => m.includes('next session') || m.includes('today\'s session') || m.includes('here\'s your') || m.includes('ready to'),
    replies: ['Let\'s go!', 'Make it harder', 'Make it easier', 'I need a rest day'],
  },
  general: {
    detect: m => m.includes('let\'s') || m.includes('shall we') || m.includes('check in') || m.includes('what would'),
    replies: ['Show me the plan', 'I need a rest day', 'What should I focus on?', 'How am I progressing?'],
  },
}

function detectContext(coachMessage) {
  if (!coachMessage) return null
  const m = coachMessage.toLowerCase()
  // Check in priority order
  for (const [key, ctx] of Object.entries(CONTEXTS)) {
    if (ctx.detect(m)) return key
  }
  return null
}

export default function QuickReplies({ messages, phase, loading, onSelect }) {
  if (phase < 2 || loading) return null

  const visibleMessages = messages.filter(m => !m.hidden)
  if (!visibleMessages.length) return null
  const lastVisible = visibleMessages[visibleMessages.length - 1]
  if (lastVisible.role !== 'coach') return null

  const lastCoachMsg = [...messages].reverse().find(m => m.role === 'coach' && !m.hidden)
  const context = detectContext(lastCoachMsg?.content)
  if (!context) return null

  return (
    <div className="onboarding-pills quick-replies">
      {CONTEXTS[context].replies.map(reply => (
        <button key={reply} className="pill quick-reply-pill" onClick={() => onSelect(reply)}>
          {reply}
        </button>
      ))}
    </div>
  )
}
