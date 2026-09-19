# My Gym App

A small React (Vite) web app for running a gym workout rep-by-rep. No backend — the
exercise plan lives in a JSON file.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static build in dist/
```

## Where the data lives

`src/data/exercises.json` is the plan that ships with the app:

```jsonc
{
  "id": "squat",
  "name": "Squat",
  "muscle": "Legs",
  "sets": 4,
  "reps": 10,
  "restBetweenSets": 90,        // seconds of rest between sets
  "restBetweenExercises": 120,  // seconds of rest after this exercise
  "unit": "kg",
  "notes": "",
  "weights": [40, 42.5, 45, 45]  // one weight per set, in set order
}
```

Edits made in the UI are saved to `localStorage`, so they survive a reload. To make them
permanent, press **Export JSON** and replace `src/data/exercises.json` with the downloaded
file. **Import JSON** loads a file back, **Reset** returns to the file that ships with the app.

## Using it

- **Start workout** runs all 11 exercises in order, with the between-exercise rest in between.
- **Start** on any card runs just that exercise, ignoring the rest of the plan.
- Each set has its own weight, used for every rep in that set. The runner shows that weight while you work.
- **Complete set** is the main button: it logs the whole set (every rep still left, at that set's weight)
  and starts the rest timer. **Rep done** is there if you want to tick reps off one at a time instead.
- When a set ends the between-sets timer runs; when an exercise ends the between-exercises timer runs.
  Both can be paused, nudged ±15s, or skipped.
- **Undo rep** steps back one rep, **Skip set** / **Skip exercise** jump ahead.
- Keyboard: `Space` = complete set / skip rest, `Esc` = close the runner.
