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

  // ── 起飞速度门槛（Vr）：地面滑跑且未达抬轮速度时不允许离地 ──
  // 低速拉杆只能压住前轮（pitch 被限制），爬升量强制为负保持贴地
  const vr = 145 - s.flap * 0.2;
  if (s.alt < 20 && s.ias < vr) {
    s.pitch = Math.min(s.pitch, 0.5);
    climb = Math.min(climb, -20);
  }

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

  // ── 降落模式：起落架接地与成功停稳检测（AUTO-LAND 全流程）──
  if (s.landingMode && !s.stopped) {
    // 进近中在空中（>100ft）→ 标记 inAir
    if (s.alt > 100) s.inAir = true;
    // 曾在空中且触地（alt ≤ 5ft）→ 记录接地时刻，自动断开 AP（解除反推互锁）
    if (s.inAir && s.touchdownAt === 0 && s.alt <= 5) {
      s.touchdownAt = s.t;
      s.inAir = false;
      s.ap = false;
    }
    // 接地滑跑：自动油门怠速 + 自动反推减速（直至停稳）
    if (s.touchdownAt > 0 && s.alt <= 2 && s.ias >= 3) {
      s.throttle = 0;
      s.reverse = true;
    }
    // 减速至 3kt 以下 → 成功停稳
    if (s.touchdownAt > 0 && s.alt <= 2 && s.ias < 3) {
      s.stopped = true;
      s.throttle = 0;
      s.reverse = false;
    }
  }

  // ── 燃油消耗 ──
  s.fuel = Math.max(0, s.fuel - ePower * 0.012 * dt);
}

/** AI 自动恢复：由警报条上的 AUTO RECOVER 按钮触发的一次性修正动作 */
export function autoRecover(
  s: SimState,
  fix: 'pushNose' | 'pullUp' | 'levelOff' | 'addPower' | 'idlePower' | 'restartEng' | 'gearUp' | 'flap10'
): void {
  switch (fix) {
    case 'pushNose':   // 失速：推杆 + 满油门
      s.pitch = -4;
      s.throttle = 100;
      break;
    case 'pullUp':     // 近地：拉杆 + 满油门
      s.pitch = 10;
      s.throttle = 100;
      break;
    case 'levelOff':  // 高度偏离：回到目标高度的平飞俯仰
      s.pitch = clamp((s.apTarget.alt - s.alt) * 0.0015, -3, 8);
      break;
    case 'addPower':
      s.throttle = Math.min(100, s.throttle + 20);
      break;
    case 'idlePower':
      s.throttle = 0;
      break;
    case 'restartEng':
      s.eng[0].on = true;
      s.eng[1].on = true;
      break;
    case 'gearUp':
      s.gear = false;
      break;
    case 'flap10':
      s.flap = 10;
      break;
  }
}
