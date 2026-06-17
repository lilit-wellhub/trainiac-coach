const PROFILE_KEY = 'trainiac_member_profile'

export function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...profile, updatedAt: new Date().toISOString() }))
}

export function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null')
  } catch {
    return null
  }
}

export function clearProfile() {
  localStorage.removeItem(PROFILE_KEY)
}
