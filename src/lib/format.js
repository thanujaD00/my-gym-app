export function mmss(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function exerciseVolume(ex) {
  // every rep of a set is lifted at that set's weight
  return ex.weights.reduce((sum, w) => sum + w * ex.reps, 0);
}

export function planVolume(plan) {
  return plan.exercises.reduce((sum, ex) => sum + exerciseVolume(ex), 0);
}
