import seed from '../data/exercises.json';

const KEY = 'my-gym-app:plan:v1';

const clampInt = (v, min, max, fallback) => {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

/** One weight per set — grow/shrink the list, reusing what is already there. */
export function resizeWeights(weights, sets) {
  // older files stored a weight per rep, so a row collapses to its first value
  const list = Array.isArray(weights) ? weights.map((w) => (Array.isArray(w) ? num(w[0], 0) : num(w, 0))) : [];
  const out = [];
  for (let s = 0; s < sets; s += 1) {
    out.push(num(list[s], out[s - 1] ?? 0));
  }
  return out;
}

function normalizeExercise(ex, i) {
  const sets = clampInt(ex.sets, 1, 20, 3);
  const reps = clampInt(ex.reps, 1, 50, 10);
  return {
    id: String(ex.id || `exercise-${i}`),
    name: String(ex.name || `Exercise ${i + 1}`),
    muscle: String(ex.muscle || ''),
    sets,
    reps,
    restBetweenSets: clampInt(ex.restBetweenSets, 0, 900, 60),
    restBetweenExercises: clampInt(ex.restBetweenExercises, 0, 900, 90),
    unit: ex.unit === 'lb' ? 'lb' : 'kg',
    notes: typeof ex.notes === 'string' ? ex.notes : '',
    weights: resizeWeights(ex.weights, sets)
  };
}

export function normalizePlan(raw) {
  const base = raw && typeof raw === 'object' ? raw : {};
  const list = Array.isArray(base.exercises) ? base.exercises : [];
  return {
    version: 1,
    title: String(base.title || 'My Workout Plan'),
    defaultRestBetweenSets: clampInt(base.defaultRestBetweenSets, 0, 900, 60),
    defaultRestBetweenExercises: clampInt(base.defaultRestBetweenExercises, 0, 900, 90),
    exercises: (list.length ? list : seed.exercises).map(normalizeExercise)
  };
}

export const seedPlan = () => normalizePlan(seed);

export function loadPlan() {
  try {
    const stored = localStorage.getItem(KEY);
    if (!stored) return seedPlan();
    return normalizePlan(JSON.parse(stored));
  } catch {
    return seedPlan();
  }
}

export function savePlan(plan) {
  try {
    localStorage.setItem(KEY, JSON.stringify(plan));
  } catch {
    /* storage may be unavailable (private mode) — edits still live in memory */
  }
}

export function downloadPlan(plan) {
  const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'exercises.json';
  a.click();
  URL.revokeObjectURL(url);
}
