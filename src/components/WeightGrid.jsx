export default function WeightGrid({ exercise, onChangeSet, onFillAll }) {
  return (
    <div className="weight-grid">
      <div className="set-weights">
        {exercise.weights.map((w, setIndex) => (
          <label className="set-cell" key={setIndex}>
            <span>Set {setIndex + 1}</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              value={w}
              onChange={(e) => onChangeSet(setIndex, Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
        ))}
      </div>
      <button type="button" className="link" onClick={() => onFillAll(exercise.weights[0] ?? 0)}>
        use {exercise.weights[0] ?? 0}{exercise.unit} for every set
      </button>
    </div>
  );
}
