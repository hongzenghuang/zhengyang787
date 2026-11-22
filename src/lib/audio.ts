// 警报音效（Web Audio API，无外部音频文件）

let audioCtx: AudioContext | null = null;

/** 首次用户手势时调用，规避浏览器自动播放策略 */
export function unlockAudio(): void {
  if (audioCtx) return;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  audioCtx = new AC();
  if (audioCtx.state === 'suspended') void audioCtx.resume();
}

/** 播放短促告警音（740Hz → 560Hz，0.25s 指数包络） */
export function playAlert(): void {
  if (!audioCtx || audioCtx.state !== 'running') return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(740, now);
  osc.frequency.setValueAtTime(560, now + 0.11);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.07, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.25);
}
