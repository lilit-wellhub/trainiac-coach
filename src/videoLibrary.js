// src/videoLibrary.js
// Maps exercise names → GymVisual animated GIF URLs (public, no auth required).
// Matching is case-insensitive and partial — longest key wins.

const GIF_LIBRARY = {
  // ── Squat family ────────────────────────────────────────────────────
  'bulgarian split squat':  'https://gymvisual.com/img/p/1/4/7/3/2/14732.gif',
  'barbell squat':          'https://gymvisual.com/img/p/4/7/7/4/4774.gif',
  'back squat':             'https://gymvisual.com/img/p/4/7/7/4/4774.gif',
  'goblet squat':           'https://gymvisual.com/img/p/1/0/2/8/3/10283.gif',
  'front squat':            'https://gymvisual.com/img/p/4/7/7/4/4774.gif',
  'split squat':            'https://gymvisual.com/img/p/1/4/7/3/2/14732.gif',
  'box squat':              'https://gymvisual.com/img/p/4/7/7/4/4774.gif',
  'squat':                  'https://gymvisual.com/img/p/4/7/7/4/4774.gif',

  // ── Hinge / posterior chain ─────────────────────────────────────────
  'conventional deadlift':  'https://gymvisual.com/img/p/2/0/8/3/1/20831.gif',
  'romanian deadlift':      'https://gymvisual.com/img/p/2/8/5/3/2/28532.gif',
  'sumo deadlift':          'https://gymvisual.com/img/p/2/0/8/3/1/20831.gif',
  'deadlift':               'https://gymvisual.com/img/p/2/0/8/3/1/20831.gif',
  'rdl':                    'https://gymvisual.com/img/p/2/8/5/3/2/28532.gif',
  'good morning':           'https://gymvisual.com/img/p/2/0/8/3/1/20831.gif',
  'kettlebell swing':       'https://gymvisual.com/img/p/5/7/6/1/5761.gif',
  'hip hinge':              'https://gymvisual.com/img/p/2/8/5/3/2/28532.gif',

  // ── Hips / glutes ───────────────────────────────────────────────────
  'barbell hip thrust':     'https://gymvisual.com/img/p/5/7/6/1/5761.gif',
  'hip thrust':             'https://gymvisual.com/img/p/5/7/6/1/5761.gif',
  'glute bridge':           'https://gymvisual.com/img/p/5/2/2/5/5225.gif',
  'clamshell':              'https://gymvisual.com/img/p/5/2/2/5/5225.gif',
  'fire hydrant':           'https://gymvisual.com/img/p/5/2/2/5/5225.gif',
  'donkey kick':            'https://gymvisual.com/img/p/5/2/2/5/5225.gif',

  // ── Lunge family ────────────────────────────────────────────────────
  'walking lunge':          'https://gymvisual.com/img/p/6/6/9/5/6695.gif',
  'reverse lunge':          'https://gymvisual.com/img/p/1/2/2/9/9/12299.gif',
  'lateral lunge':          'https://gymvisual.com/img/p/1/2/2/9/9/12299.gif',
  'lunge':                  'https://gymvisual.com/img/p/1/2/2/9/9/12299.gif',
  'step up':                'https://gymvisual.com/img/p/5/5/2/4/5524.gif',

  // ── Push family ─────────────────────────────────────────────────────
  'incline dumbbell press': 'https://gymvisual.com/img/p/1/7/5/5/2/17552.gif',
  'incline bench press':    'https://gymvisual.com/img/p/1/7/5/5/2/17552.gif',
  'dumbbell bench press':   'https://gymvisual.com/img/p/1/7/5/5/2/17552.gif',
  'barbell bench press':    'https://gymvisual.com/img/p/1/7/5/5/2/17552.gif',
  'bench press':            'https://gymvisual.com/img/p/1/7/5/5/2/17552.gif',
  'overhead press':         'https://gymvisual.com/img/p/2/0/2/8/9/20289.gif',
  'shoulder press':         'https://gymvisual.com/img/p/2/0/2/8/9/20289.gif',
  'push press':             'https://gymvisual.com/img/p/2/0/2/8/9/20289.gif',
  'arnold press':           'https://gymvisual.com/img/p/2/0/2/8/9/20289.gif',
  'push-up':                'https://gymvisual.com/img/p/1/2/5/6/1/12561.gif',
  'push up':                'https://gymvisual.com/img/p/1/2/5/6/1/12561.gif',
  'pushup':                 'https://gymvisual.com/img/p/1/2/5/6/1/12561.gif',
  'chest fly':              'https://gymvisual.com/img/p/1/7/5/5/2/17552.gif',
  'dumbbell fly':           'https://gymvisual.com/img/p/1/7/5/5/2/17552.gif',
  'cable fly':              'https://gymvisual.com/img/p/1/7/5/5/2/17552.gif',
  'tricep dip':             'https://gymvisual.com/img/p/4/9/8/4/4984.gif',
  'dips':                   'https://gymvisual.com/img/p/4/9/8/4/4984.gif',
  'dip':                    'https://gymvisual.com/img/p/4/9/8/4/4984.gif',

  // ── Pull family ─────────────────────────────────────────────────────
  'chin-up':                'https://gymvisual.com/img/p/5/3/8/6/5386.gif',
  'chin up':                'https://gymvisual.com/img/p/5/3/8/6/5386.gif',
  'pull-up':                'https://gymvisual.com/img/p/5/3/8/6/5386.gif',
  'pull up':                'https://gymvisual.com/img/p/5/3/8/6/5386.gif',
  'pullup':                 'https://gymvisual.com/img/p/5/3/8/6/5386.gif',
  'lat pulldown':           'https://gymvisual.com/img/p/1/0/1/6/3/10163.gif',
  'cable row':              'https://gymvisual.com/img/p/1/0/6/1/7/10617.gif',
  'seated row':             'https://gymvisual.com/img/p/1/0/6/1/7/10617.gif',
  'bent over row':          'https://gymvisual.com/img/p/1/0/6/1/7/10617.gif',
  'barbell row':            'https://gymvisual.com/img/p/1/0/6/1/7/10617.gif',
  'dumbbell row':           'https://gymvisual.com/img/p/1/0/0/6/9/10069.gif',
  'single arm row':         'https://gymvisual.com/img/p/1/0/0/6/9/10069.gif',
  'inverted row':           'https://gymvisual.com/img/p/1/0/0/6/9/10069.gif',
  'face pull':              'https://gymvisual.com/img/p/2/4/9/7/4/24974.gif',
  'row':                    'https://gymvisual.com/img/p/1/0/6/1/7/10617.gif',

  // ── Shoulder isolation ───────────────────────────────────────────────
  'lateral raise':          'https://gymvisual.com/img/p/1/9/1/5/1/19151.gif',
  'front raise':            'https://gymvisual.com/img/p/1/9/1/5/1/19151.gif',
  'rear delt fly':          'https://gymvisual.com/img/p/2/4/9/7/4/24974.gif',
  'reverse fly':            'https://gymvisual.com/img/p/2/4/9/7/4/24974.gif',

  // ── Arm isolation ────────────────────────────────────────────────────
  'barbell curl':           'https://gymvisual.com/img/p/5/1/8/8/5188.gif',
  'dumbbell curl':          'https://gymvisual.com/img/p/5/1/8/8/5188.gif',
  'bicep curl':             'https://gymvisual.com/img/p/5/1/8/8/5188.gif',
  'biceps curl':            'https://gymvisual.com/img/p/5/1/8/8/5188.gif',
  'hammer curl':            'https://gymvisual.com/img/p/5/0/3/1/5031.gif',
  'preacher curl':          'https://gymvisual.com/img/p/5/1/8/8/5188.gif',
  'curl':                   'https://gymvisual.com/img/p/5/1/8/8/5188.gif',
  'tricep pushdown':        'https://gymvisual.com/img/p/7/5/2/7/7527.gif',
  'cable pushdown':         'https://gymvisual.com/img/p/7/5/2/7/7527.gif',
  'tricep extension':       'https://gymvisual.com/img/p/8/8/0/6/8806.gif',
  'skull crusher':          'https://gymvisual.com/img/p/8/8/0/6/8806.gif',
  'overhead tricep':        'https://gymvisual.com/img/p/8/8/0/6/8806.gif',
  'close grip bench':       'https://gymvisual.com/img/p/1/7/5/5/2/17552.gif',

  // ── Core ────────────────────────────────────────────────────────────
  'hanging leg raise':      'https://gymvisual.com/img/p/5/2/1/1/5211.gif',
  'leg raise':              'https://gymvisual.com/img/p/5/2/1/1/5211.gif',
  'dead bug':               'https://gymvisual.com/img/p/2/0/8/3/5/20835.gif',
  'bird dog':               'https://gymvisual.com/img/p/2/1/8/1/6/21816.gif',
  'mountain climber':       'https://gymvisual.com/img/p/2/0/3/7/4/20374.gif',
  'plank':                  'https://gymvisual.com/img/p/6/7/1/3/6713.gif',
  'side plank':             'https://gymvisual.com/img/p/6/7/1/3/6713.gif',
  'ab wheel':               'https://gymvisual.com/img/p/5/2/1/1/5211.gif',
  'rollout':                'https://gymvisual.com/img/p/5/2/1/1/5211.gif',
  'russian twist':          'https://gymvisual.com/img/p/5/2/1/1/5211.gif',
  'bicycle crunch':         'https://gymvisual.com/img/p/5/2/1/1/5211.gif',
  'crunch':                 'https://gymvisual.com/img/p/5/2/1/1/5211.gif',
  'sit-up':                 'https://gymvisual.com/img/p/5/2/1/1/5211.gif',
  'sit up':                 'https://gymvisual.com/img/p/5/2/1/1/5211.gif',
  'pallof press':           'https://gymvisual.com/img/p/6/7/1/3/6713.gif',
  'hollow hold':            'https://gymvisual.com/img/p/6/7/1/3/6713.gif',

  // ── Calf ────────────────────────────────────────────────────────────
  'standing calf raise':    'https://gymvisual.com/img/p/1/1/7/5/8/11758.gif',
  'seated calf raise':      'https://gymvisual.com/img/p/1/1/7/5/8/11758.gif',
  'calf raise':             'https://gymvisual.com/img/p/1/1/7/5/8/11758.gif',

  // ── Cardio / plyometrics ─────────────────────────────────────────────
  'box jump':               'https://gymvisual.com/img/p/4/0/3/4/5/40345.gif',
  'jumping jack':           'https://gymvisual.com/img/p/2/0/3/7/4/20374.gif',
  'burpee':                 'https://gymvisual.com/img/p/8/9/6/6/8966.gif',
  'sled push':              'https://gymvisual.com/img/p/2/0/8/3/1/20831.gif',

  // ── Local GIFs (converted from original video assets — highest priority) ──
  'mini band walk':         '/videos/mini_band_forward_back_walk_b.gif',
  'band walk':              '/videos/mini_band_forward_back_walk_b.gif',
  'lateral band walk':      '/videos/mini_band_forward_back_walk_b.gif',
  'modified seal jack':     '/videos/modified_seal_jack_a.gif',
  'seal jack':              '/videos/modified_seal_jack_a.gif',
  'walking quad stretch':   '/videos/walking_quad_stretch_a.gif',
  'quad stretch':           '/videos/walking_quad_stretch_a.gif',
  'wall tibialis raise':    '/videos/wall_anterior_tibialis_raise_b.gif',
  'tibialis raise':         '/videos/wall_anterior_tibialis_raise_b.gif',
  'anterior tibialis':      '/videos/wall_anterior_tibialis_raise_b.gif',
  'windmill':               '/videos/windmills_a.gif',
  'windmills':              '/videos/windmills_a.gif',
  'bicep curl':             '/videos/m_bicep_curl_a.gif',
}

export function getVideoUrl(exerciseName) {
  if (!exerciseName) return null
  const lower = exerciseName.toLowerCase()
  // Longest matching key wins (more specific = higher priority)
  const keys = Object.keys(GIF_LIBRARY).sort((a, b) => b.length - a.length)
  const key = keys.find(k => lower.includes(k) || k.includes(lower))
  return key ? GIF_LIBRARY[key] : null
}
