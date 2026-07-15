import type { SoundTheme } from './types';

const SOUND_KEY  = 'kta-sound-enabled';
const THEME_KEY  = 'kta-sound-theme';

export function isSoundEnabled(): boolean {
  try {
    const val = localStorage.getItem(SOUND_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, String(enabled));
  } catch {}
}

export function getSoundTheme(): SoundTheme {
  try {
    const val = localStorage.getItem(THEME_KEY);
    if (val === 'space' || val === 'piano') return val;
    return 'classic';
  } catch {
    return 'classic';
  }
}

export function setSoundTheme(theme: SoundTheme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (!isSoundEnabled()) return null;
  try {
    if (!ctx || ctx.state === 'closed') ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function envelope(
  gainNode: GainNode,
  ac: AudioContext,
  attackTime: number,
  decayTime: number,
  peakGain: number,
  startTime: number,
) {
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(peakGain, startTime + attackTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + attackTime + decayTime);
}

function osc1(ac: AudioContext, type: OscillatorType, freq: number, endFreq: number, glideTime: number, attack: number, decay: number, peak: number, t: number) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (endFreq !== freq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + glideTime);
  envelope(gain, ac, attack, decay, peak, t);
  osc.start(t);
  osc.stop(t + attack + decay + 0.05);
}

export function playClick() {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  const theme = getSoundTheme();

  if (theme === 'space') {
    osc1(ac, 'square', 1400, 2800, 0.05, 0.002, 0.07, 0.14, t);
  } else if (theme === 'piano') {
    osc1(ac, 'triangle', 523, 523, 0, 0.005, 0.12, 0.20, t);
  } else {
    osc1(ac, 'sine', 880, 440, 0.06, 0.002, 0.08, 0.18, t);
  }
}

export function playPop() {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  const theme = getSoundTheme();

  if (theme === 'space') {
    osc1(ac, 'square', 600, 80, 0.09, 0.003, 0.10, 0.20, t);
    osc1(ac, 'sine',   300, 40, 0.07, 0.003, 0.08, 0.10, t);
  } else if (theme === 'piano') {
    osc1(ac, 'triangle', 784, 784, 0, 0.005, 0.14, 0.22, t);
    osc1(ac, 'triangle', 988, 988, 0, 0.005, 0.10, 0.10, t);
  } else {
    const bufSize = ac.sampleRate * 0.12;
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2);
    }
    const src = ac.createBufferSource();
    src.buffer = buf;
    const bpf = ac.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 900;
    bpf.Q.value = 0.5;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    src.connect(bpf);
    bpf.connect(gain);
    gain.connect(ac.destination);
    src.start(t);
  }
}

export function playHit() {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  const theme = getSoundTheme();

  if (theme === 'space') {
    osc1(ac, 'sawtooth', 1800, 80, 0.09, 0.002, 0.10, 0.18, t);
    osc1(ac, 'square',   900,  50, 0.07, 0.002, 0.08, 0.10, t);
  } else if (theme === 'piano') {
    osc1(ac, 'triangle', 262, 262, 0, 0.005, 0.18, 0.20, t);
  } else {
    const gain = ac.createGain();
    gain.connect(ac.destination);
    const o1 = ac.createOscillator();
    const o2 = ac.createOscillator();
    o1.connect(gain); o2.connect(gain);
    o1.type = 'sawtooth'; o2.type = 'triangle';
    o1.frequency.setValueAtTime(220, t); o1.frequency.exponentialRampToValueAtTime(80,  t + 0.09);
    o2.frequency.setValueAtTime(340, t); o2.frequency.exponentialRampToValueAtTime(120, t + 0.07);
    envelope(gain, ac, 0.002, 0.1, 0.22, t);
    o1.start(t); o2.start(t); o1.stop(t + 0.12); o2.stop(t + 0.12);
  }
}

export function playError() {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  const theme = getSoundTheme();

  if (theme === 'space') {
    osc1(ac, 'sine', 80, 50, 0.10, 0.003, 0.12, 0.10, t);
    osc1(ac, 'sine', 60, 40, 0.08, 0.003, 0.10, 0.06, t);
  } else if (theme === 'piano') {
    osc1(ac, 'triangle', 220, 220, 0, 0.003, 0.15, 0.10, t);
  } else {
    osc1(ac, 'square', 180, 180, 0, 0.003, 0.10, 0.08, t);
  }
}

export function playCombo(level: 1 | 2 | 3) {
  const ac = getCtx();
  if (!ac) return;
  const theme = getSoundTheme();
  if (theme === 'space') {
    const freqs = level === 1 ? [1200, 1800] : level === 2 ? [1000, 1400, 2000] : [880, 1100, 1320, 1760];
    freqs.forEach((f, i) => { osc1(ac, 'square', f, f, 0, 0.004, 0.08, 0.18, ac.currentTime + i * 0.09); });
  } else if (theme === 'piano') {
    const freqs = level === 1 ? [523, 784] : level === 2 ? [523, 659, 784] : [392, 523, 659, 784];
    freqs.forEach((f, i) => { osc1(ac, 'triangle', f, f, 0, 0.006, 0.13, 0.24, ac.currentTime + i * 0.10); });
  } else {
    const freqs = level === 1 ? [880, 1320] : level === 2 ? [880, 1100, 1320] : [523, 659, 784, 1047];
    freqs.forEach((f, i) => { osc1(ac, 'triangle', f, f, 0, 0.006, 0.10, 0.22, ac.currentTime + i * 0.10); });
  }
}

export function playWin() {
  const ac = getCtx();
  if (!ac) return;
  const theme = getSoundTheme();

  if (theme === 'space') {
    const notes = [330, 440, 660, 880, 1100];
    const dur = 0.10;
    const gap = 0.11;
    notes.forEach((freq, i) => {
      const t = ac.currentTime + i * gap;
      osc1(ac, 'square', freq, freq, 0, 0.005, dur, 0.20, t);
    });
  } else if (theme === 'piano') {
    const notes = [262, 330, 392, 524];
    const dur = 0.14;
    const gap = 0.14;
    notes.forEach((freq, i) => {
      const t = ac.currentTime + i * gap;
      osc1(ac, 'triangle', freq, freq, 0, 0.008, dur, 0.26, t);
    });
  } else {
    const notes = [523, 659, 784, 1047];
    const dur = 0.12;
    const gap = 0.13;
    notes.forEach((freq, i) => {
      const t = ac.currentTime + i * gap;
      osc1(ac, 'triangle', freq, freq, 0, 0.01, dur, 0.25, t);
    });
  }
}
