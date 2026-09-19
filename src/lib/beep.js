let ctx = null;

/** Short tone so the user does not have to watch the rest timer. */
export function beep(times = 1, freq = 880) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    ctx = ctx || new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    for (let i = 0; i < times; i += 1) {
      const at = ctx.currentTime + i * 0.22;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.25, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.2);
    }
  } catch {
    /* audio is a nicety, never a failure */
  }
}
