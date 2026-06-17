import { useState, useRef } from 'react'
import { X, Check } from 'lucide-react'
import { saveProfile } from '../memberProfile.js'

const GOAL_OPTIONS = ['Build strength', 'Lose weight / tone', 'Run further & faster', 'Stay active & healthy', 'Improve flexibility', 'Recover from injury']
const DAYS_OPTIONS = ['1–2× a week', '3× a week', '4–5× a week', 'Every day']
const DURATION_OPTIONS = ['20–30 min', '45 min', '60+ min']
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const LOCATION_OPTIONS = ['Gym (full equipment)', 'Home / garage', 'Outdoors', 'Hotel / travel']

const EQUIPMENT_GROUPS = [
  {
    label: 'Barbells & racks',
    items: ['Barbell', 'Squat rack / power cage', 'Bench (flat)', 'Bench (incline/decline)', 'Smith machine'],
  },
  {
    label: 'Free weights',
    items: ['Dumbbells', 'Kettlebells', 'EZ bar'],
  },
  {
    label: 'Machines & cables',
    items: ['Cable machine', 'Lat pulldown / seated row', 'Leg press', 'Leg curl / extension', 'Chest press machine', 'Pull-up bar'],
  },
  {
    label: 'Cardio',
    items: ['Treadmill', 'Rowing machine', 'Stationary bike', 'Jump rope'],
  },
  {
    label: 'Accessories',
    items: ['Resistance bands', 'Ab wheel', 'Dip bars', 'Foam roller', 'No equipment (bodyweight only)'],
  },
]

const ALL_EQUIPMENT_ITEMS = EQUIPMENT_GROUPS.flatMap(g => g.items)
const DEFAULT_INJURY_OPTIONS = ['No injuries', 'Lower back', 'Knee', 'Shoulder', 'Hip / glute', 'Wrist', 'Migraines']

// Load any user-added custom injuries from localStorage and merge with defaults
const CUSTOM_INJURIES_KEY = 'trainiac_custom_injuries'
function getInjuryOptions() {
  try {
    const custom = JSON.parse(localStorage.getItem(CUSTOM_INJURIES_KEY) || '[]')
    return [...DEFAULT_INJURY_OPTIONS, ...custom.filter(c => !DEFAULT_INJURY_OPTIONS.includes(c))]
  } catch { return DEFAULT_INJURY_OPTIONS }
}
function saveCustomInjury(label) {
  try {
    const existing = JSON.parse(localStorage.getItem(CUSTOM_INJURIES_KEY) || '[]')
    if (!existing.includes(label)) {
      localStorage.setItem(CUSTOM_INJURIES_KEY, JSON.stringify([...existing, label]))
    }
  } catch {}
}

// Parse a combined schedule string like "3× a week, 45 min" back into its parts
function parseSchedule(schedule) {
  if (!schedule) return { days: '', duration: '' }
  const parts = schedule.split(',').map(s => s.trim())
  const days = parts.find(p => DAYS_OPTIONS.includes(p)) || parts[0] || ''
  const duration = parts.find(p => DURATION_OPTIONS.includes(p)) || parts[1] || ''
  return { days, duration }
}

function ChipField({ label, value, onChange, options }) {
  return (
    <div className="profile-field">
      <div className="profile-field-label">{label}</div>
      <div className="profile-chips">
        {options.map(opt => (
          <button
            key={opt}
            className={`profile-chip ${value === opt ? 'selected' : ''}`}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <div className="profile-field">
      <div className="profile-field-label">{label}</div>
      <input
        className="profile-text-input"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

export default function ProfileEditor({ visible, profile, onClose, onSave, inline }) {
  const { days: parsedDays, duration: parsedDuration } = parseSchedule(profile?.schedule)

  const parseList = (raw) => {
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    return raw.split(',').map(s => s.trim()).filter(Boolean)
  }

  // Separate equipment into location (single-select) vs specific gear (multi-select)
  const parseEquipmentItems = (raw) => {
    const list = parseList(raw)
    return list.filter(e => ALL_EQUIPMENT_ITEMS.includes(e))
  }
  const parseLocation = (raw) => {
    const list = parseList(raw)
    const loc = list.find(e => LOCATION_OPTIONS.includes(e))
    return loc || (profile?.equipment && LOCATION_OPTIONS.includes(profile.equipment) ? profile.equipment : '')
  }

  const [form, setForm] = useState({
    memberName: profile?.memberName || '',
    goal: profile?.goal || '',
    scheduleDays: profile?.scheduleDays || parsedDays,
    scheduleDuration: profile?.scheduleDuration || parsedDuration,
    trainingDays: parseList(profile?.trainingDays),
    location: parseLocation(profile?.equipment),
    equipmentItems: parseEquipmentItems(profile?.equipment),
    injuries: parseList(profile?.injuries),
  })
  const [injuryInput, setInjuryInput] = useState('')
  const [injuryOptions, setInjuryOptions] = useState(getInjuryOptions)
  const [saved, setSaved] = useState(false)
  const inputRef = useRef(null)

  if (!inline && !visible) return null

  const set = (key) => (val) => setForm(prev => ({ ...prev, [key]: val }))

  // Toggle equipment item on/off
  const toggleEquipment = (item) => {
    setForm(prev => {
      const has = prev.equipmentItems.includes(item)
      const next = has
        ? prev.equipmentItems.filter(e => e !== item)
        : [...prev.equipmentItems, item]
      return { ...prev, equipmentItems: next }
    })
  }

  // Toggle an injury chip on/off and auto-save so navigation doesn't lose changes
  const toggleInjury = (label) => {
    setForm(prev => {
      const has = prev.injuries.includes(label)
      const next = label === 'No injuries'
        ? (has ? [] : ['No injuries'])
        : (has ? prev.injuries.filter(i => i !== label) : [...prev.injuries.filter(i => i !== 'No injuries'), label])
      saveProfile({ ...profile, ...prev, injuries: next.join(', ') })
      return { ...prev, injuries: next }
    })
  }

  // Enter key in injury input → add as pill, select it, and auto-save so it survives tab switches
  const handleInjuryKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = injuryInput.trim()
      if (!val) return
      const label = val.charAt(0).toUpperCase() + val.slice(1)
      if (!injuryOptions.includes(label)) {
        setInjuryOptions(prev => [...prev, label])
        saveCustomInjury(label)
      }
      setForm(prev => {
        const newInjuries = prev.injuries.includes(label)
          ? prev.injuries
          : [...prev.injuries.filter(i => i !== 'No injuries'), label]
        // Auto-save immediately so navigating away doesn't lose the selection
        saveProfile({ ...profile, ...prev, injuries: newInjuries.join(', ') })
        return { ...prev, injuries: newInjuries }
      })
      setInjuryInput('')
    }
  }

  const toggleTrainingDay = (day) => {
    setForm(prev => {
      const next = prev.trainingDays.includes(day)
        ? prev.trainingDays.filter(d => d !== day)
        : [...prev.trainingDays, day]
      return { ...prev, trainingDays: next }
    })
  }

  const handleSave = () => {
    const equipmentParts = [form.location, ...form.equipmentItems].filter(Boolean)
    const updated = {
      ...profile,
      memberName: form.memberName,
      goal: form.goal,
      scheduleDays: form.scheduleDays,
      scheduleDuration: form.scheduleDuration,
      schedule: [form.scheduleDays, form.scheduleDuration].filter(Boolean).join(', '),
      trainingDays: form.trainingDays.join(', '),
      equipment: equipmentParts.join(', '),
      injuries: form.injuries.join(', '),
    }
    saveProfile(updated)
    onSave(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    // Do NOT navigate away — stay on profile tab
  }

  const content = (
    <div className={inline ? 'tab-panel profile-panel' : 'history-panel profile-panel'}>
      {!inline && <div className="history-header">
        <div className="history-title">Your profile</div>
        <button className="history-close" onClick={onClose}><X size={16} /></button>
      </div>}
      {inline && <div className="tab-panel-title">Your profile</div>}

      <p className="profile-intro">Your coach uses this to personalise every session. Edit anything anytime.</p>

      <TextField label="Your name" value={form.memberName} onChange={set('memberName')} placeholder="What should we call you?" />
      <ChipField label="Goal" value={form.goal} onChange={set('goal')} options={GOAL_OPTIONS} />
      <ChipField label="Days per week" value={form.scheduleDays} onChange={set('scheduleDays')} options={DAYS_OPTIONS} />
      <ChipField label="Session duration" value={form.scheduleDuration} onChange={set('scheduleDuration')} options={DURATION_OPTIONS} />
      {/* Training days — specific days of week */}
      <div className="profile-field">
        <div className="profile-field-label">Training days</div>
        <p className="profile-field-hint">Pick the days you plan to train each week. Your coach will schedule sessions on these days.</p>
        <div className="training-days-row">
          {WEEK_DAYS.map(day => (
            <button
              key={day}
              className={`training-day-btn ${form.trainingDays.includes(day) ? 'selected' : ''}`}
              onClick={() => toggleTrainingDay(day)}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Location — single select */}
      <ChipField label="Where you train" value={form.location} onChange={set('location')} options={LOCATION_OPTIONS} />

      {/* Equipment — grouped multi-select */}
      <div className="profile-field">
        <div className="profile-field-label">Equipment available</div>
        <p className="profile-field-hint">Select everything you have access to. Your coach will only program what you can actually use.</p>
        {EQUIPMENT_GROUPS.map(group => (
          <div key={group.label} className="equipment-group">
            <div className="equipment-group-label">{group.label}</div>
            <div className="profile-chips">
              {group.items.map(item => (
                <button
                  key={item}
                  className={`profile-chip ${form.equipmentItems.includes(item) ? 'selected' : ''}`}
                  onClick={() => toggleEquipment(item)}
                >
                  {item}
                  {form.equipmentItems.includes(item) && <X size={11} style={{ marginLeft: 4, verticalAlign: 'middle' }} />}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Injuries — multi-select tag input */}
      <div className="profile-field">
        <div className="profile-field-label">Injuries / constraints</div>
        <div className="profile-chips">
          {injuryOptions.map(opt => (
            <button
              key={opt}
              className={`profile-chip ${form.injuries.includes(opt) ? 'selected' : ''}`}
              onClick={() => toggleInjury(opt)}
            >
              {opt}
              {form.injuries.includes(opt) && opt !== 'No injuries' && (
                <X size={11} style={{ marginLeft: 4, verticalAlign: 'middle' }} />
              )}
            </button>
          ))}
        </div>
        <input
          ref={inputRef}
          className="profile-text-input"
          style={{ marginTop: 8 }}
          value={injuryInput}
          onChange={e => setInjuryInput(e.target.value)}
          onKeyDown={handleInjuryKeyDown}
          placeholder="Type anything and press Enter to add (e.g. bad posture, migraines…)"
        />
      </div>

      <div className="profile-actions">
        <button className={`btn-save-profile${saved ? ' saved' : ''}`} onClick={handleSave} disabled={saved}>
          {saved ? <><Check size={14} style={{display:'inline',verticalAlign:'middle',marginRight:4}} />Saved!</> : 'Save changes'}
        </button>
      </div>
    </div>
  )

  if (inline) return content
  return (
    <div className="history-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>{content}</div>
    </div>
  )
}
