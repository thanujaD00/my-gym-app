export default function NumberField({ label, value, min = 0, max = 999, step = 1, suffix, onChange }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="field-input">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (e.target.value === '') return onChange(min);
            if (!Number.isFinite(n)) return undefined;
            return onChange(Math.min(max, Math.max(min, n)));
          }}
        />
        {suffix ? <span className="suffix">{suffix}</span> : null}
      </span>
    </label>
  );
}
