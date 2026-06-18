import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble.jsx'

function parseWorkoutSummary(content) {
  // __workout_complete__|done=5|skipped=0|mins=32
  const done    = content.match(/done=(\d+)/)?.[1]
  const skipped = content.match(/skipped=(\d+)/)?.[1]
  const mins    = content.match(/mins=(\d+)/)?.[1]
  return { done: done ? parseInt(done) : 0, skipped: skipped ? parseInt(skipped) : 0, mins: mins ? parseInt(mins) : null }
}

function WorkoutSummaryEvent({ content, timestamp }) {
  const { done, skipped, mins } = parseWorkoutSummary(content)
  const d = new Date(timestamp)
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return (
    <div className="system-event">
      <div className="system-event-card">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <span>
          Workout done · <strong>{done} exercise{done !== 1 ? 's' : ''}</strong>
          {skipped > 0 && ` · ${skipped} skipped`}
          {mins > 0 && ` · ${mins} min`}
        </span>
      </div>
      <span className="system-event-time">{time}</span>
    </div>
  )
}

export default function ChatWindow({ messages, loading, pillsSlot }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, loading])

  return (
    <div className="chat-window">
      {messages.filter(m => !m.hidden).map((msg, i) => (
        msg.type === 'workout_summary'
          ? <WorkoutSummaryEvent key={i} content={msg.content} timestamp={msg.timestamp} />
          : <MessageBubble key={i} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
      ))}
      {pillsSlot}
      {loading && (
        <div className="typing-indicator message-row coach">
          <div className="coach-avatar-fallback">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L4.09 12.96a.5.5 0 0 0 .41.79H11l-1 9 8.91-10.96a.5.5 0 0 0-.41-.79H13l1-9z" fill="white" stroke="white" strokeWidth="1" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="typing-dots">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
