import { useEffect, useRef, useState } from 'react';
import ExerciseCard from './components/ExerciseCard';
import Runner from './components/Runner';
import { useWorkout } from './hooks/useWorkout';
import { downloadPlan, loadPlan, normalizePlan, resizeWeights, savePlan, seedPlan } from './lib/storage';
import { planVolume } from './lib/format';

export default function App() {
  const [plan, setPlan] = useState(loadPlan);
  const fileRef = useRef(null);
  const workout = useWorkout(plan);
  const { session, current } = workout;

  useEffect(() => savePlan(plan), [plan]);

  const patchExercise = (id, patch) =>
    setPlan((p) => ({
      ...p,
      exercises: p.exercises.map((ex) => {
        if (ex.id !== id) return ex;
        const merged = { ...ex, ...patch };
        // a sets change has to grow or shrink the per-set weight list
        merged.weights = resizeWeights(patch.weights || merged.weights, merged.sets);
        return merged;
      })
    }));

  const importPlan = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setPlan(normalizePlan(JSON.parse(String(reader.result))));
      } catch {
        window.alert('That file is not a valid exercises.json.');
      }
    };
    reader.readAsText(file);
  };

  const totalSets = plan.exercises.reduce((n, ex) => n + ex.sets, 0);
  const totalReps = plan.exercises.reduce((n, ex) => n + ex.sets * ex.reps, 0);
  const runningId = session && current ? current.exercise.id : null;

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>{plan.title}</h1>
          <p className="sub">
            {plan.exercises.length} exercises · {totalSets} sets · {totalReps} reps ·{' '}
            {planVolume(plan)} total volume
          </p>
        </div>
        <div className="top-actions">
          <button type="button" className="btn btn-primary btn-lg" onClick={workout.startWorkout}>
            Start workout
          </button>
          <button type="button" className="btn" onClick={() => downloadPlan(plan)}>
            Export JSON
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            Import JSON
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              if (window.confirm('Reset every exercise back to the values in exercises.json?')) setPlan(seedPlan());
            }}
          >
            Reset
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importPlan(file);
              e.target.value = '';
            }}
          />
        </div>
      </header>

      <main className="list">
        {plan.exercises.map((ex, i) => (
          <ExerciseCard
            key={ex.id}
            index={i}
            exercise={ex}
            running={runningId === ex.id}
            onPatch={(patch) => patchExercise(ex.id, patch)}
            onStart={() => workout.startExercise(ex.id)}
          />
        ))}
      </main>

      <footer className="foot">
        <p>Edits are kept in this browser. Use “Export JSON” and drop the file over <code>src/data/exercises.json</code> to make them permanent.</p>
      </footer>

      {session ? (
        <div className="scrim">
          <Runner session={session} current={current} actions={workout} />
        </div>
      ) : null}
    </div>
  );
}
