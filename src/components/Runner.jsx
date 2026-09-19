import { useEffect } from 'react';
import { mmss } from '../lib/format';

function Progress({ done, total }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="progress" aria-label={`${done} of ${total} reps done`}>
      <div className="progress-bar" style={{ width: `${pct}%` }} />
      <span className="progress-text">{done} / {total} reps</span>
    </div>
  );
}

function RepDots({ reps, current }) {
  return (
    <div className="dots">
      {Array.from({ length: reps }, (_, i) => (
        <span
          key={i}
          className={`dot${i + 1 < current ? ' dot-done' : ''}${i + 1 === current ? ' dot-now' : ''}`}
          title={`Rep ${i + 1}`}
        >
          {i + 1}
        </span>
      ))}
    </div>
  );
}

export default function Runner({ session, current, actions }) {
  const { completeRep, completeSet, undoRep, skipRest, addRestTime, togglePauseRest, skipSet, skipExercise, stop } = actions;
  const resting = session.phase === 'restSet' || session.phase === 'restExercise';
  const done = session.phase === 'done';

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (done) return;
        if (resting) skipRest();
        else completeSet();
      }
      if (e.key === 'Escape') stop();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [resting, done, completeSet, skipRest, stop]);

  if (!current) return null;
  const { exercise, nextExercise, setNumber, repNumber, weight, restLeft, restTotal, paused } = current;

  return (
    <div className="runner" role="dialog" aria-modal="true">
      <div className="runner-top">
        <div>
          <p className="eyebrow">{session.mode === 'single' ? 'Single exercise' : 'Full workout'}</p>
          <h2>{done ? 'Workout complete' : exercise.name}</h2>
          {!done ? <p className="muscle">{exercise.muscle}</p> : null}
        </div>
        <button type="button" className="btn btn-ghost" onClick={stop}>
          Close
        </button>
      </div>

      <Progress done={current.doneReps} total={current.totalReps} />

      {done ? (
        <div className="stage stage-done">
          <p className="huge">{current.doneReps}</p>
          <p className="label">reps logged</p>
          <p className="sub">
            Total volume <b>{current.volume}{exercise.unit}</b> in{' '}
            {mmss((Date.now() - session.startedAt) / 1000)}
          </p>
          <button type="button" className="btn btn-primary btn-lg" onClick={stop}>
            Done
          </button>
        </div>
      ) : resting ? (
        <div className="stage stage-rest">
          <p className="label">
            {session.phase === 'restSet' ? 'Rest between sets' : 'Rest before next exercise'}
          </p>
          <p className="huge timer">{mmss(restLeft)}</p>
          <div className="rest-bar">
            <div
              className="rest-bar-fill"
              style={{ width: `${restTotal ? Math.max(0, (restLeft / restTotal) * 100) : 0}%` }}
            />
          </div>
          <p className="sub">
            {session.phase === 'restSet'
              ? `Next: set ${Math.min(setNumber + 1, exercise.sets)} of ${exercise.sets} · ${exercise.weights[setNumber] ?? 0}${exercise.unit} × ${exercise.reps}`
              : `Next: ${nextExercise ? `${nextExercise.name} · ${nextExercise.weights[0] ?? 0}${nextExercise.unit} × ${nextExercise.reps}` : 'finish'}`}
          </p>
          <div className="row">
            <button type="button" className="btn" onClick={() => addRestTime(-15)}>−15s</button>
            <button type="button" className="btn" onClick={togglePauseRest}>{paused ? 'Resume' : 'Pause'}</button>
            <button type="button" className="btn" onClick={() => addRestTime(15)}>+15s</button>
          </div>
          <button type="button" className="btn btn-primary btn-lg" onClick={skipRest}>
            Skip rest
          </button>
        </div>
      ) : (
        <div className="stage stage-work">
          <p className="label">
            Set {setNumber} of {exercise.sets} · Rep {repNumber} of {exercise.reps}
          </p>
          <p className="huge">
            {weight}
            <span className="unit">{exercise.unit}</span>
          </p>
          <RepDots reps={exercise.reps} current={repNumber} />
          {exercise.notes ? <p className="sub">{exercise.notes}</p> : null}
          <button type="button" className="btn btn-primary btn-lg" onClick={completeSet}>
            Complete set {setNumber} of {exercise.sets}
          </button>
          <div className="row">
            <button type="button" className="btn" onClick={completeRep}>
              Rep done ({repNumber}/{exercise.reps})
            </button>
            <button type="button" className="btn" onClick={undoRep} disabled={!session.log.length}>Undo rep</button>
            <button type="button" className="btn" onClick={skipSet}>Skip set</button>
            <button type="button" className="btn" onClick={skipExercise}>Skip exercise</button>
          </div>
        </div>
      )}

      <p className="hint">Space = complete set / skip rest · Esc = close</p>
    </div>
  );
}
