const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

export async function geminiChat(systemPrompt, messages) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`

  const contents = messages.map(m => ({
    role: m.role === 'coach' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sorry, something went wrong.'
}
