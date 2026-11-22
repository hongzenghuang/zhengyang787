// 自动驾驶逻辑（AP 接通条件 / 目标捕获 / 控制律）
import { SimState, AP_LIMITS, clamp, hdgError, stallLimit } from './sim-types';

/** AP 接通前置条件 */
export function canEngageAP(s: SimState): boolean {
  return s.eng.every((e) => e.on) && s.ias > 150 && s.alt > 1000;
}

export const AP_INHIBIT_MSG =
  'AP INHIBIT · Engines ON, IAS > 150 kt, altitude > 1000 ft required';

/** 接通瞬间捕获当前状态为目标 */
export function captureTargets(s: SimState): void {
  s.apTarget = {
    ias: clamp(Math.round(s.ias / 5) * 5, AP_LIMITS.iasMin, AP_LIMITS.iasMax),
    alt: clamp(Math.round(s.alt / 500) * 500, AP_LIMITS.altMin, AP_LIMITS.altMax),
    hdg: Math.round(s.hdg) % 360,
  };
}

/** 调节 MCP 目标（AP 接通时才有效） */
export function adjustAPTarget(s: SimState, key: keyof SimState['apTarget'], dir: 1 | -1): void {
  if (!s.ap) return;
  if (key === 'hdg') {
    s.apTarget.hdg = (s.apTarget.hdg + dir * AP_LIMITS.hdgStep + 360) % 360;
  } else if (key === 'ias') {
    s.apTarget.ias = clamp(s.apTarget.ias + dir * AP_LIMITS.iasStep, AP_LIMITS.iasMin, AP_LIMITS.iasMax);
  } else if (key === 'alt') {
    s.apTarget.alt = clamp(s.apTarget.alt + dir * AP_LIMITS.altStep, AP_LIMITS.altMin, AP_LIMITS.altMax);
  }
}

/** AP 速度控制：估算阻力 → 由速度误差算请求加速度 → 反解目标功率 (0-1) */
export function apComputeThrottle(s: SimState): number {
  const speedError = s.apTarget.ias - s.ias;
  const dragEstimate =
    s.ias * 0.018 +
    s.ias * s.ias * 0.00032 +
    s.flap * 0.65 +
    (s.gear ? s.ias * 0.012 : 0);
  const requestedAccel = clamp(speedError * 0.16, -12, 12);
  return clamp((dragEstimate + requestedAccel / 0.12) / 240, 0, 1);
}

/** AP 俯仰与坡度目标（含失速 / 超速保护覆盖） */
export function apComputePitchBank(
  s: SimState,
  stall: boolean
): { pitchTarget: number; bankTarget: number } {
  let pitchTarget = clamp(
    (s.apTarget.alt - s.alt) * 0.0015 - s.vsi * 0.00035,
    -3,
    8
  );
  if (stall) pitchTarget = Math.min(pitchTarget, -2);      // 失速：推头
  if (s.ias > 340) pitchTarget = Math.max(pitchTarget, 3); // 超速：拉杆

  const bankTarget = clamp(hdgError(s.apTarget.hdg, s.hdg) * 0.8, -25, 25);
  return { pitchTarget, bankTarget };
}

/** 反推接通条件 */
export function canEngageReverse(s: SimState): boolean {
  return s.alt < 40 && s.gear && s.eng.every((e) => e.on) && !s.ap;
}

export const REV_INHIBIT_MSG =
  'REV INHIBIT · Ground, gear down, both engines running, AP off required';

/** 当前是否处于失速 */
export function isStall(s: SimState): boolean {
  return s.ias < stallLimit(s.flap);
}
