// Lightweight audio + voice feedback. Pure Web Audio (no files, no network) for
// short calm chimes, plus optional speech-synthesis. A module-level singleton so
// any component can call it without prop threading; App syncs the on/off flags
// from user settings.

let soundOn = true;
let voiceOn = false;
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Play a short tone with a soft attack/decay envelope. */
function tone(freq: number, start: number, dur: number, gain = 0.08, type: OscillatorType = 'sine') {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ac.currentTime + start;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function speak(text: string) {
  if (!voiceOn || typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02;
    u.pitch = 1;
    u.volume = 0.9;
    window.speechSynthesis.speak(u);
  } catch {
    /* speech is best-effort */
  }
}

export const sound = {
  configure(s: { sound: boolean; voice: boolean }) {
    soundOn = s.sound;
    voiceOn = s.voice;
    if (!s.voice && typeof window !== 'undefined') window.speechSynthesis?.cancel();
  },
  get enabled() {
    return soundOn;
  },
  correct() {
    if (soundOn) {
      tone(659.25, 0, 0.14, 0.07); // E5
      tone(987.77, 0.08, 0.18, 0.06); // B5
    }
  },
  wrong() {
    if (soundOn) tone(196, 0, 0.22, 0.06, 'triangle'); // soft low G3, not harsh
  },
  complete() {
    if (soundOn) {
      tone(523.25, 0, 0.16, 0.06); // C5
      tone(659.25, 0.1, 0.16, 0.06); // E5
      tone(783.99, 0.2, 0.26, 0.06); // G5
    }
  },
  tick() {
    if (soundOn) tone(440, 0, 0.05, 0.03);
  },
  /** Combined correctness feedback with optional spoken phrase. */
  feedback(isCorrect: boolean, phrase?: string) {
    if (isCorrect) this.correct();
    else this.wrong();
    if (phrase) speak(phrase);
    else speak(isCorrect ? 'Correct' : 'Not quite');
  },
  say(text: string) {
    speak(text);
  },
};
