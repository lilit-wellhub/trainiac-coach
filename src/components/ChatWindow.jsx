import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble.jsx'

export default function ChatWindow({ messages, loading, pillsSlot }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, loading])

  return (
    <div className="chat-window">
      {messages.filter(m => !m.hidden).map((msg, i) => (
        <MessageBubble key={i} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
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
