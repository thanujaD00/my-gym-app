import { useState } from 'react';
import NumberField from './NumberField';
import WeightGrid from './WeightGrid';
import { exerciseVolume } from '../lib/format';

export default function ExerciseCard({ index, exercise, onPatch, onStart, running }) {
  const [open, setOpen] = useState(false);

  return (
    <article className={`card${running ? ' card-running' : ''}`}>
      <header className="card-head">
        <span className="index">{index + 1}</span>
        <div className="card-title">
          <h3>{exercise.name}</h3>
          <p className="muscle">{exercise.muscle}</p>
        </div>
        <div className="card-actions">
          <button type="button" className="btn btn-primary" onClick={onStart}>
            Start
          </button>
          <button type="button" className="btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            {open ? 'Close' : 'Edit'}
          </button>
        </div>
      </header>

      <ul className="stats">
        <li><b>{exercise.sets}</b> sets</li>
        <li><b>{exercise.reps}</b> reps</li>
        <li><b>{exercise.restBetweenSets}s</b> rest / set</li>
        <li><b>{exercise.restBetweenExercises}s</b> rest after</li>
        <li><b>{exerciseVolume(exercise)}{exercise.unit}</b> volume</li>
      </ul>

      {open ? (
        <div className="editor">
          <div className="fields">
            <NumberField label="Sets" value={exercise.sets} min={1} max={20} onChange={(v) => onPatch({ sets: v })} />
            <NumberField label="Reps" value={exercise.reps} min={1} max={50} onChange={(v) => onPatch({ reps: v })} />
            <NumberField
              label="Rest between sets"
              value={exercise.restBetweenSets}
              min={0}
              max={900}
              step={5}
              suffix="s"
              onChange={(v) => onPatch({ restBetweenSets: v })}
            />
            <NumberField
              label="Rest after exercise"
              value={exercise.restBetweenExercises}
              min={0}
              max={900}
              step={5}
              suffix="s"
              onChange={(v) => onPatch({ restBetweenExercises: v })}
            />
            <label className="field">
              <span className="field-label">Unit</span>
              <span className="field-input">
                <select value={exercise.unit} onChange={(e) => onPatch({ unit: e.target.value })}>
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                </select>
              </span>
            </label>
          </div>

          <h4 className="grid-title">Weight per set</h4>
          <WeightGrid
            exercise={exercise}
            onChangeSet={(setIndex, value) =>
              onPatch({ weights: exercise.weights.map((w, s) => (s === setIndex ? value : w)) })
            }
            onFillAll={(value) => onPatch({ weights: exercise.weights.map(() => value) })}
          />

          <label className="field field-wide">
            <span className="field-label">Notes</span>
            <span className="field-input">
              <input
                type="text"
                value={exercise.notes}
                placeholder="Form cues, bar setup…"
                onChange={(e) => onPatch({ notes: e.target.value })}
              />
            </span>
          </label>
        </div>
      ) : null}
    </article>
  );
}
