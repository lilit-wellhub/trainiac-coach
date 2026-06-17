const KEY = 'trainiac_program'

export function saveProgram(program) {
  localStorage.setItem(KEY, JSON.stringify(program))
}

export function loadProgram() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null')
  } catch {
    return null
  }
}

export function clearProgram() {
  localStorage.removeItem(KEY)
}
