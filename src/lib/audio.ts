// 分级警报音效（Web Audio API，无外部音频文件）
// 三级音色：WARNING（急促双音连续）/ CAUTION（琥珀双音）/ INFO（柔和单音）

let audioCtx: AudioContext | null = null;

/** 首次用户手势时调用，规避浏览器自动播放策略 */
export function unlockAudio(): void {
  if (audioCtx) return;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  audioCtx = new AC();
  if (audioCtx.state === 'suspended') void audioCtx.resume();
}

function ctx(): AudioContext | null {
  return audioCtx && audioCtx.state === 'running' ? audioCtx : null;
}

/** 单音：freq (Hz)，t0（起始秒），dur（时长秒），peak（音量） */
function tone(freq: number, t0: number, dur: number, peak = 0.06, type: OscillatorType = 'square'): void {
  const ac = ctx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + t0);
  gain.gain.setValueAtTime(0.0001, ac.currentTime + t0);
  gain.gain.exponentialRampToValueAtTime(peak, ac.currentTime + t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(ac.currentTime + t0);
  osc.stop(ac.currentTime + t0 + dur + 0.02);
}

/** WARNING（危险，红色）：急促高低双音 ×2，如同真实告警系统 */
export function playWarning(): void {
  const t = [0, 0.14, 0.28, 0.42];
  t.forEach((off, i) => tone(i % 2 === 0 ? 880 : 620, off, 0.11, 0.07));
}

/** CAUTION（注意，琥珀）：温和双音，一次 */
export function playCaution(): void {
  tone(740, 0, 0.1, 0.055, 'triangle');
  tone(560, 0.12, 0.12, 0.05, 'triangle');
}

/** INFO（提示）：柔和单音 */
export function playInfo(): void {
  tone(660, 0, 0.09, 0.04, 'sine');
  tone(880, 0.1, 0.12, 0.04, 'sine');
}

/** 兼容旧接口：按警报内容选择分级音 */
export function playAlert(dangerCount = 1, total = 1): void {
  if (dangerCount > 0) playWarning();
  else if (total > 0) playCaution();
}
