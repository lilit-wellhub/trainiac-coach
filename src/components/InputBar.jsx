import { SendHorizonal } from 'lucide-react'

export default function InputBar({ value, onChange, onSend, disabled }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!disabled && value.trim()) onSend()
    }
  }

  return (
    <div className="input-bar">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message your coach..."
        disabled={disabled}
        autoFocus
      />
      <button
        className="btn-send"
        onClick={onSend}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
      >
        <SendHorizonal size={18} />
      </button>
    </div>
  )
}
