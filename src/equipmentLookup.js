// Maps exercise names → equipment needed (array of strings).
// Matching is case-insensitive and partial — longest key wins.

const EQUIPMENT_MAP = {
  // ── Barbell ──────────────────────────────────────────────────────────
  'barbell squat':          ['Barbell', 'Squat rack'],
  'back squat':             ['Barbell', 'Squat rack'],
  'front squat':            ['Barbell', 'Squat rack'],
  'box squat':              ['Barbell', 'Squat rack', 'Box'],
  'conventional deadlift':  ['Barbell'],
  'sumo deadlift':          ['Barbell'],
  'romanian deadlift':      ['Barbell'],
  'rdl':                    ['Barbell'],
  'good morning':           ['Barbell'],
  'barbell hip thrust':     ['Barbell', 'Bench'],
  'barbell bench press':    ['Barbell', 'Bench', 'Squat rack'],
  'incline bench press':    ['Barbell', 'Incline bench', 'Squat rack'],
  'overhead press':         ['Barbell'],
  'push press':             ['Barbell'],
  'bent over row':          ['Barbell'],
  'barbell row':            ['Barbell'],
  'barbell curl':           ['Barbell'],
  'close grip bench':       ['Barbell', 'Bench'],
  'skull crusher':          ['Barbell or EZ bar', 'Bench'],
  'ez bar curl':            ['EZ bar'],
  'preacher curl':          ['EZ bar or dumbbell', 'Preacher bench'],

  // ── Dumbbell ─────────────────────────────────────────────────────────
  'dumbbell bench press':   ['Dumbbells', 'Bench (flat)'],
  'incline dumbbell press': ['Dumbbells', 'Incline bench'],
  'dumbbell shoulder press':['Dumbbells'],
  'arnold press':           ['Dumbbells'],
  'dumbbell row':           ['Dumbbell', 'Bench'],
  'single arm row':         ['Dumbbell', 'Bench'],
  'dumbbell fly':           ['Dumbbells', 'Bench'],
  'dumbbell curl':          ['Dumbbells'],
  'bicep curl':             ['Dumbbells or barbell'],
  'hammer curl':            ['Dumbbells'],
  'goblet squat':           ['Dumbbell or kettlebell'],
  'bulgarian split squat':  ['Dumbbells', 'Bench'],
  'split squat':            ['Dumbbells'],
  'walking lunge':          ['Dumbbells (optional)'],
  'reverse lunge':          ['Dumbbells (optional)'],
  'lateral lunge':          ['Dumbbell (optional)'],
  'lunge':                  ['Dumbbells (optional)'],
  'step up':                ['Dumbbells (optional)', 'Box or bench'],
  'dumbbell row':           ['Dumbbell', 'Bench'],
  'lateral raise':          ['Dumbbells'],
  'front raise':            ['Dumbbells'],
  'rear delt fly':          ['Dumbbells'],
  'reverse fly':            ['Dumbbells'],
  'tricep extension':       ['Dumbbell'],
  'overhead tricep':        ['Dumbbell'],
  'glute bridge':           ['Bodyweight (or dumbbell)'],
  'hip thrust':             ['Bench', 'Barbell or dumbbell'],

  // ── Cable machine ────────────────────────────────────────────────────
  'cable row':              ['Cable machine'],
  'seated row':             ['Cable machine'],
  'lat pulldown':           ['Cable machine'],
  'cable fly':              ['Cable machine'],
  'cable crunch':           ['Cable machine'],
  'cable pushdown':         ['Cable machine'],
  'tricep pushdown':        ['Cable machine'],
  'face pull':              ['Cable machine'],
  'pallof press':           ['Cable machine or band'],

  // ── Machine ──────────────────────────────────────────────────────────
  'leg press':              ['Leg press machine'],
  'leg curl':               ['Leg curl machine'],
  'leg extension':          ['Leg extension machine'],
  'chest press machine':    ['Chest press machine'],
  'pec deck':               ['Pec deck machine'],
  'seated calf raise':      ['Seated calf raise machine'],
  'standing calf raise':    ['Calf raise machine or barbell'],
  'calf raise':             ['Calf raise machine or step'],
  'smith machine squat':    ['Smith machine'],

  // ── Bodyweight / minimal ─────────────────────────────────────────────
  'pull-up':                ['Pull-up bar'],
  'pull up':                ['Pull-up bar'],
  'chin-up':                ['Pull-up bar'],
  'chin up':                ['Pull-up bar'],
  'hanging leg raise':      ['Pull-up bar'],
  'tricep dip':             ['Dip bars or bench'],
  'dips':                   ['Dip bars'],
  'dip':                    ['Dip bars'],
  'inverted row':           ['Barbell in rack or rings'],
  'push-up':                ['Bodyweight'],
  'push up':                ['Bodyweight'],
  'pushup':                 ['Bodyweight'],
  'plank':                  ['Bodyweight'],
  'side plank':             ['Bodyweight'],
  'dead bug':               ['Bodyweight'],
  'bird dog':               ['Bodyweight'],
  'mountain climber':       ['Bodyweight'],
  'burpee':                 ['Bodyweight'],
  'jumping jack':           ['Bodyweight'],
  'squat':                  ['Bodyweight (or barbell)'],
  'leg raise':              ['Bodyweight'],
  'russian twist':          ['Bodyweight (or weight plate)'],
  'bicycle crunch':         ['Bodyweight'],
  'crunch':                 ['Bodyweight'],
  'sit-up':                 ['Bodyweight'],
  'sit up':                 ['Bodyweight'],
  'hollow hold':            ['Bodyweight'],

  // ── Kettlebell ───────────────────────────────────────────────────────
  'kettlebell swing':       ['Kettlebell'],
  'kettlebell goblet squat':['Kettlebell'],
  'turkish get-up':         ['Kettlebell'],

  // ── Other ────────────────────────────────────────────────────────────
  'box jump':               ['Box'],
  'ab wheel':               ['Ab wheel'],
  'rollout':                ['Ab wheel'],
  'resistance band':        ['Resistance band'],
  'band walk':              ['Resistance band'],
  'clamshell':              ['Resistance band (optional)'],
}

export function getEquipment(exerciseName) {
  if (!exerciseName) return []
  const lower = exerciseName.toLowerCase()
  const keys = Object.keys(EQUIPMENT_MAP).sort((a, b) => b.length - a.length)
  const key = keys.find(k => lower.includes(k) || k.includes(lower))
  return key ? EQUIPMENT_MAP[key] : []
}
