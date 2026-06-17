function formatTime(ts) {
  const d = new Date(ts)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

// Lightweight markdown → HTML: bold, bullet lists, numbered lists
function renderMarkdown(text) {
  const lines = text.split('\n')
  const out = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Bullet list item (- or * prefix)
    if (/^[\*\-]\s+/.test(line)) {
      const items = []
      while (i < lines.length && /^[\*\-]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[\*\-]\s+/, ''))
        i++
      }
      out.push(
        <ul key={i} className="md-list">
          {items.map((item, j) => (
            <li key={j} dangerouslySetInnerHTML={{ __html: inlineMd(item) }} />
          ))}
        </ul>
      )
      continue
    }

    // Blank line → spacer
    if (line.trim() === '') {
      out.push(<div key={i} className="md-spacer" />)
      i++
      continue
    }

    // Regular paragraph line
    out.push(
      <p key={i} dangerouslySetInnerHTML={{ __html: inlineMd(line) }} />
    )
    i++
  }

  return out
}

// Inline: **bold**, *italic*
function inlineMd(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+?)\*/g, '<em>$1</em>')
}

// Coach avatar: clean barbell/lightning icon in magenta
function CoachAvatar() {
  return (
    <div className="coach-avatar-fallback" aria-label="Trainiac Coach">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 2L4.09 12.96a.5.5 0 0 0 .41.79H11l-1 9 8.91-10.96a.5.5 0 0 0-.41-.79H13l1-9z"
          fill="white" stroke="white" strokeWidth="1" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

export default function MessageBubble({ role, content, timestamp }) {
  return (
    <div className={`message-row ${role}`}>
      {role === 'coach' && <CoachAvatar />}
      <div className="bubble-wrap">
        <div className={`bubble ${role}`}>
          {role === 'coach'
            ? <div className="md-body">{renderMarkdown(content)}</div>
            : content
          }
        </div>
        <span className="bubble-time">{formatTime(timestamp)}</span>
      </div>
    </div>
  )
}
