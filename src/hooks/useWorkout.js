import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { beep } from '../lib/beep';

const now = () => Date.now();

/**
 * Drives a session exercise-by-exercise, set-by-set and rep-by-rep.
 * A session is either the whole plan ('workout') or one exercise ('single').
 */
export function useWorkout(plan) {
  const [session, setSession] = useState(null);
  const [tick, setTick] = useState(0);
  const finishedRef = useRef(false);

  const byId = useMemo(() => {
    const map = new Map();
    plan.exercises.forEach((ex) => map.set(ex.id, ex));
    return map;
  }, [plan]);

  const start = useCallback((mode, queue) => {
    if (!queue.length) return;
    finishedRef.current = false;
    beep(1, 660);
    setSession({
      mode,
      queue,
      qIndex: 0,
      setIndex: 0,
      repIndex: 0,
      phase: 'work',
      restTotal: 0,
      restEndsAt: null,
      pausedLeft: null,
      startedAt: now(),
      log: []
    });
  }, []);

  const startWorkout = useCallback(
    () => start('workout', plan.exercises.map((ex) => ex.id)),
    [plan, start]
  );
  const startExercise = useCallback((id) => start('single', [id]), [start]);
  const stop = useCallback(() => setSession(null), []);

  const beginRest = useCallback((s, phase, seconds, patch) => {
    if (seconds <= 0) return { ...s, ...patch, phase: 'work', restEndsAt: null, pausedLeft: null };
    return { ...s, phase, restTotal: seconds, restEndsAt: now() + seconds * 1000, pausedLeft: null, next: patch };
  }, []);

  /** Move past a finished rest into whatever was queued behind it. */
  const resolveRest = useCallback((s) => {
    const { next = {}, ...rest } = s;
    return { ...rest, ...next, phase: 'work', restEndsAt: null, pausedLeft: null, restTotal: 0 };
  }, []);

  const advance = useCallback(
    (s, logEntry) => {
      const ex = byId.get(s.queue[s.qIndex]);
      if (!ex) return s;
      const log = logEntry ? [...s.log, logEntry] : s.log;
      const nextRep = s.repIndex + 1;

      if (nextRep < ex.reps) return { ...s, repIndex: nextRep, log };

      // set finished
      if (s.setIndex + 1 < ex.sets) {
        beep(1, 520);
        return beginRest({ ...s, log }, 'restSet', ex.restBetweenSets, { setIndex: s.setIndex + 1, repIndex: 0 });
      }

      // exercise finished
      if (s.qIndex + 1 < s.queue.length) {
        beep(2, 520);
        return beginRest({ ...s, log }, 'restExercise', ex.restBetweenExercises, {
          qIndex: s.qIndex + 1,
          setIndex: 0,
          repIndex: 0
        });
      }

      beep(3, 880);
      return { ...s, log, phase: 'done', restEndsAt: null, pausedLeft: null };
    },
    [beginRest, byId]
  );

  const completeRep = useCallback(() => {
    setSession((s) => {
      if (!s || s.phase !== 'work') return s;
      const ex = byId.get(s.queue[s.qIndex]);
      if (!ex) return s;
      const weight = ex.weights[s.setIndex] ?? 0;
      return advance(s, {
        exerciseId: ex.id,
        name: ex.name,
        set: s.setIndex + 1,
        rep: s.repIndex + 1,
        weight,
        unit: ex.unit,
        at: now()
      });
    });
  }, [advance, byId]);

  /** Log every rep still left in the set at once, then roll into the rest. */
  const completeSet = useCallback(() => {
    setSession((s) => {
      if (!s || s.phase !== 'work') return s;
      const ex = byId.get(s.queue[s.qIndex]);
      if (!ex) return s;
      const weight = ex.weights[s.setIndex] ?? 0;
      const entries = [];
      for (let r = s.repIndex; r < ex.reps; r += 1) {
        entries.push({
          exerciseId: ex.id,
          name: ex.name,
          set: s.setIndex + 1,
          rep: r + 1,
          weight,
          unit: ex.unit,
          at: now()
        });
      }
      if (!entries.length) return s;
      const pending = entries.slice(0, -1);
      return advance({ ...s, repIndex: ex.reps - 1, log: [...s.log, ...pending] }, entries[entries.length - 1]);
    });
  }, [advance, byId]);

  const undoRep = useCallback(() => {
    setSession((s) => {
      if (!s || !s.log.length) return s;
      const log = s.log.slice(0, -1);
      const last = s.log[s.log.length - 1];
      const qIndex = s.queue.indexOf(last.exerciseId);
      if (qIndex < 0) return s;
      return {
        ...s,
        log,
        qIndex,
        setIndex: last.set - 1,
        repIndex: last.rep - 1,
        phase: 'work',
        restEndsAt: null,
        pausedLeft: null,
        next: undefined
      };
    });
  }, []);

  const skipRest = useCallback(() => setSession((s) => (s && s.restEndsAt !== null ? resolveRest(s) : s)), [resolveRest]);

  const addRestTime = useCallback((seconds) => {
    setSession((s) => {
      if (!s) return s;
      if (s.pausedLeft !== null) return { ...s, pausedLeft: Math.max(0, s.pausedLeft + seconds), restTotal: s.restTotal + Math.max(0, seconds) };
      if (s.restEndsAt === null) return s;
      return { ...s, restEndsAt: s.restEndsAt + seconds * 1000, restTotal: Math.max(1, s.restTotal + seconds) };
    });
  }, []);

  const togglePauseRest = useCallback(() => {
    setSession((s) => {
      if (!s) return s;
      if (s.pausedLeft !== null) return { ...s, restEndsAt: now() + s.pausedLeft * 1000, pausedLeft: null };
      if (s.restEndsAt === null) return s;
      return { ...s, pausedLeft: Math.max(0, (s.restEndsAt - now()) / 1000), restEndsAt: null };
    });
  }, []);

  /** Finish the current set (or exercise) without logging the remaining reps. */
  const skipSet = useCallback(() => {
    setSession((s) => {
      if (!s || s.phase === 'done') return s;
      const base = s.restEndsAt !== null || s.pausedLeft !== null ? resolveRest(s) : s;
      const ex = byId.get(base.queue[base.qIndex]);
      if (!ex) return s;
      return advance({ ...base, repIndex: ex.reps - 1 }, null);
    });
  }, [advance, byId, resolveRest]);

  const skipExercise = useCallback(() => {
    setSession((s) => {
      if (!s || s.phase === 'done') return s;
      const base = s.restEndsAt !== null || s.pausedLeft !== null ? resolveRest(s) : s;
      const ex = byId.get(base.queue[base.qIndex]);
      if (!ex) return s;
      return advance({ ...base, setIndex: ex.sets - 1, repIndex: ex.reps - 1 }, null);
    });
  }, [advance, byId, resolveRest]);

  // one ticking clock, only while a rest is actually running
  useEffect(() => {
    if (!session || session.restEndsAt === null) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(id);
  }, [session?.restEndsAt, session?.phase]);

  const restLeft =
    session && session.pausedLeft !== null
      ? session.pausedLeft
      : session && session.restEndsAt !== null
        ? (session.restEndsAt - now()) / 1000
        : 0;

  // rest reaching zero rolls the session forward
  useEffect(() => {
    if (!session || session.restEndsAt === null) return;
    if (session.restEndsAt - now() > 0) {
      finishedRef.current = false;
      return;
    }
    if (finishedRef.current) return;
    finishedRef.current = true;
    beep(2, 880);
    setSession((s) => (s && s.restEndsAt !== null && s.restEndsAt - now() <= 0 ? resolveRest(s) : s));
  }, [tick, session, resolveRest]);

  const current = useMemo(() => {
    if (!session) return null;
    const ex = byId.get(session.queue[session.qIndex]) || null;
    if (!ex) return null;
    const totalReps = session.queue.reduce((sum, id) => {
      const e = byId.get(id);
      return sum + (e ? e.sets * e.reps : 0);
    }, 0);
    return {
      exercise: ex,
      nextExercise: byId.get(session.queue[session.qIndex + 1]) || null,
      setNumber: session.setIndex + 1,
      repNumber: session.repIndex + 1,
      weight: ex.weights[session.setIndex] ?? 0,
      restLeft: Math.max(0, restLeft),
      restTotal: session.restTotal,
      paused: session.pausedLeft !== null,
      totalReps,
      doneReps: session.log.length,
      volume: session.log.reduce((sum, l) => sum + l.weight, 0)
    };
  }, [session, byId, restLeft]);

  return {
    session,
    current,
    startWorkout,
    startExercise,
    stop,
    completeRep,
    completeSet,
    undoRep,
    skipRest,
    addRestTime,
    togglePauseRest,
    skipSet,
    skipExercise
  };
}
