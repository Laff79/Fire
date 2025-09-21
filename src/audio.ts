// Simple WebAudio beeper with mute toggle persisted in localStorage
let ctx: AudioContext | null = null;
let muted = false;

const KEY = 'gnw_sound_enabled';

export function initAudio(){
  if (ctx) return;
  try { ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch {}
  // restore mute state (default: on = true)
  const saved = localStorage.getItem(KEY);
  if(saved !== null){ muted = (saved === 'false') ? false : (saved === 'true'); }
}

export function setMuted(v: boolean){
  muted = v;
  localStorage.setItem(KEY, String(!muted ? true : false)); // store enabled flag
  // normalize: we store whether sound is enabled
  localStorage.setItem(KEY, String(!muted));
}

export function isMuted(){ return muted; }

export function ensureUserGesture(){
  // Resume context on first user gesture on some browsers
  if(ctx && ctx.state === 'suspended'){ ctx.resume().catch(()=>{}); }
}

export function beep(freq: number, ms: number, vol=0.2){
  if(!ctx || muted) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(freq, ctx.currentTime);
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms/1000);
  o.connect(g); g.connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + ms/1000);
}
