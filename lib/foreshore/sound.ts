/*
  Foreshore sound — synthesised in the browser via Web Audio. No audio
  files shipped. All sounds are very short, deliberately low-volume,
  and toggleable. Off by default; the console MUST be perfectly
  usable in silence.

  Sounds produced:
    - hum           constant low-pass filtered oscillator, ambient
    - click         per-character teletype tick (short impulse)
    - clack         brass-on-brass switch press (mid pitch percussive)
    - acquire       short upward sweep when a signal lands
    - static        white-noise burst on retune
    - anomaly       slow rising pure tone when an anomaly appears
    - bell          single soft chime when a letter arrives

  This module is intentionally a singleton — there is only one console
  per page, so one AudioContext is enough. The context is created
  lazily on first interaction (browser auto-play policy requires it).
*/

if (typeof window === "undefined") {
  // No-op on the server; the module just exports stubs.
}

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let humOsc: OscillatorNode | null = null;
let humGain: GainNode | null = null;
let humOn = false;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.18; // overall ceiling — gentle by design
    masterGain.connect(ctx.destination);
    return ctx;
  } catch {
    return null;
  }
}

/**
 * Resume the audio context. Must be called inside a user gesture
 * (click, keydown) the first time, or no sound will play.
 */
export async function unlockAudio(): Promise<void> {
  const c = ensureCtx();
  if (!c) return;
  if (c.state === "suspended") {
    try {
      await c.resume();
    } catch {
      // ignore
    }
  }
}

export function startHum(): void {
  const c = ensureCtx();
  if (!c || !masterGain) return;
  if (humOn) return;
  humOsc = c.createOscillator();
  humGain = c.createGain();
  humGain.gain.value = 0.0;
  humOsc.type = "sine";
  humOsc.frequency.value = 62; // low warm hum
  // Low-pass to take any edge off the oscillator
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 220;
  humOsc.connect(lp);
  lp.connect(humGain);
  humGain.connect(masterGain);
  humOsc.start();
  // Fade in to avoid clicks
  humGain.gain.linearRampToValueAtTime(0.18, c.currentTime + 0.6);
  humOn = true;
}

export function stopHum(): void {
  const c = ensureCtx();
  if (!c || !humGain || !humOsc) return;
  humGain.gain.linearRampToValueAtTime(0, c.currentTime + 0.4);
  // Schedule actual stop slightly later
  humOsc.stop(c.currentTime + 0.5);
  humOsc.disconnect();
  humGain.disconnect();
  humOsc = null;
  humGain = null;
  humOn = false;
}

export function isHumOn(): boolean {
  return humOn;
}

/**
 * Tiny percussive impulse — used as the teletype click per character.
 * Cheap because it's a single envelope and a noise burst.
 */
export function click(): void {
  const c = ensureCtx();
  if (!c || !masterGain) return;
  const dur = 0.012;
  const gain = c.createGain();
  const noise = makeNoiseBuffer(c, dur);
  const src = c.createBufferSource();
  src.buffer = noise;
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1800;
  src.connect(hp);
  hp.connect(gain);
  gain.connect(masterGain);
  const now = c.currentTime;
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  src.start(now);
  src.stop(now + dur + 0.005);
}

/** Brass-on-brass switch clack — used for button presses. */
export function clack(): void {
  const c = ensureCtx();
  if (!c || !masterGain) return;
  const dur = 0.08;
  const gain = c.createGain();
  const osc = c.createOscillator();
  osc.type = "triangle";
  osc.frequency.value = 380;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 600;
  bp.Q.value = 1.6;
  osc.connect(bp);
  bp.connect(gain);
  gain.connect(masterGain);
  const now = c.currentTime;
  gain.gain.setValueAtTime(0.22, now);
  gain.gain.exponentialRampToValueAtTime(0.0008, now + dur);
  osc.frequency.exponentialRampToValueAtTime(120, now + dur);
  osc.start(now);
  osc.stop(now + dur + 0.005);
}

/** Upward chirp — signal acquisition. */
export function acquire(): void {
  const c = ensureCtx();
  if (!c || !masterGain) return;
  const dur = 0.22;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  const now = c.currentTime;
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(620, now + dur);
  gain.gain.setValueAtTime(0.0, now);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
  gain.gain.linearRampToValueAtTime(0.0, now + dur);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

/** Short white-noise wash — used between channels on retune. */
export function staticWash(): void {
  const c = ensureCtx();
  if (!c || !masterGain) return;
  const dur = 0.12;
  const gain = c.createGain();
  const noise = makeNoiseBuffer(c, dur);
  const src = c.createBufferSource();
  src.buffer = noise;
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1200;
  src.connect(hp);
  hp.connect(gain);
  gain.connect(masterGain);
  const now = c.currentTime;
  gain.gain.setValueAtTime(0.0, now);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
  gain.gain.linearRampToValueAtTime(0.0, now + dur);
  src.start(now);
  src.stop(now + dur + 0.01);
}

/** Slow rising pure tone — anomaly detected. */
export function anomalyTone(): void {
  const c = ensureCtx();
  if (!c || !masterGain) return;
  const dur = 1.4;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  const now = c.currentTime;
  osc.frequency.setValueAtTime(420, now);
  osc.frequency.linearRampToValueAtTime(560, now + dur);
  gain.gain.setValueAtTime(0.0, now);
  gain.gain.linearRampToValueAtTime(0.14, now + 0.4);
  gain.gain.linearRampToValueAtTime(0.0, now + dur);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

/** Single soft brass-bell chime — the letter slot. */
export function bell(): void {
  const c = ensureCtx();
  if (!c || !masterGain) return;
  const dur = 1.1;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "triangle";
  const now = c.currentTime;
  osc.frequency.setValueAtTime(720, now);
  osc.frequency.exponentialRampToValueAtTime(640, now + dur);
  gain.gain.setValueAtTime(0.0, now);
  gain.gain.linearRampToValueAtTime(0.2, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0006, now + dur);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

/* ─── helpers ──────────────────────────────────────────────────────── */

function makeNoiseBuffer(c: AudioContext, durationSec: number): AudioBuffer {
  const sampleRate = c.sampleRate;
  const length = Math.max(1, Math.floor(sampleRate * durationSec));
  const buf = c.createBuffer(1, length, sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buf;
}
