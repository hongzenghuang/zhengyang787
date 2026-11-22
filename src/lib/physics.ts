// 物理模型（经验公式，帧率无关）
// 从 HTML 内联 physics(dt) 迁移，行为保持一致
import { SimState, LIMITS, clamp, lerp, inertial, stallLimit } from './sim-types';
import { apComputePitchBank, apComputeThrottle } from './autopilot';

export function physicsStep(s: SimState, dt: number): void {
  if (!s.running) return;
  s.t += dt;

  const stall = s.ias < stallLimit(s.flap);

  // ── AP 速度控制（自动油门）──
  if (s.ap) {
    s.throttle = lerp(s.throttle, apComputeThrottle(s) * 100, inertial(dt, 1.8));
  }

  // ── 引擎响应（一阶惯性）──
  const ePower = s.eng.reduce((a, e) => a + e.n1 / 100, 0) / 2;
  const targetN = s.throttle * (s.eng[0].on || s.eng[1].on ? 1 : 0);
  s.eng.forEach((e) => {
    e.n1 = lerp(e.n1, e.on ? targetN : 0, inertial(dt, e.on ? 2.4 : 3.5));
    e.egt = lerp(e.egt, e.on ? 20 + e.n1 * 5.25 : 20, inertial(dt, 2.2));
  });

  // ── 推力 / 阻力 / 空速 ──
  const thrust = ePower * 240;
  // 反推在空中 / 收轮 / AP 接通时自动解除
  if (s.reverse && (s.alt >= 40 || !s.gear || s.ap)) s.reverse = false;
  const propulsiveThrust = s.reverse ? -thrust * 0.72 : thrust;

  const flapLift = s.flap * 0.7;
  const drag =
    s.ias * 0.018 +
    s.ias * s.ias * 0.00032 +
    s.flap * 0.65 +
    (s.gear ? s.ias * 0.012 : 0);

  const accel = (propulsiveThrust - drag) * 0.12;
  s.ias = clamp(s.ias + accel * dt, 0, LIMITS.iasMax);

  // ── 垂直速度 / 高度 ──
  let climb =
    s.pitch * 95 +
    Math.max(0, propulsiveThrust) * 0.38 +
    flapLift * 2.2 -
    (stall ? 58 : 0) -
    (s.ias > 340 ? 30 : 0);
  if (s.gear && s.alt > 80) climb -= 8;

  // ── AP 俯仰 / 坡度 / 航向控制 ──
  if (s.ap) {
    const { pitchTarget, bankTarget } = apComputePitchBank(s, stall);
    s.pitch = lerp(s.pitch, pitchTarget, inertial(dt, 1.8));
    s.bank = lerp(s.bank, bankTarget, inertial(dt, 1.3));
  }
  s.hdg = (s.hdg + s.bank * 0.11 * dt + 360) % 360;

  s.vsi = lerp(s.vsi, climb * 12, inertial(dt, 1.7));
  s.alt = clamp(s.alt + (s.vsi / 60) * dt, 0, LIMITS.altMax);
  s.pitch = clamp(s.pitch, LIMITS.pitchMin, LIMITS.pitchMax);
  s.bank = clamp(s.bank, LIMITS.bankMin, LIMITS.bankMax);

  // ── 燃油消耗 ──
  s.fuel = Math.max(0, s.fuel - ePower * 0.012 * dt);
}
