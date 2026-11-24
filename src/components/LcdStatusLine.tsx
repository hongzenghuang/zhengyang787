'use client';

import type { SimState } from '@/lib/sim-types';
import { fmt, pad3 } from '@/lib/sim-types';
import { ROUTES } from '@/lib/routes';

/**
 * LCD 电子状态行（AI 自动化元素）：
 * 模拟 787 电子舱单色 LCD 状态行，实时汇报系统自动化状态。
 * 数字等宽（tabular-nums）避免更新时抖动；无闪烁动画。
 */
export function LcdStatusLine({ snap }: { snap: SimState }) {
  const phase = snap.stopped ? 'STOPPED'
    : snap.touchdownAt > 0 ? 'TOUCHDOWN'
    : snap.alt < 40 ? 'GROUND'
    : snap.landingMode ? 'APPROACH'
    : snap.alt < 3000 ? 'CLIMB'
    : snap.alt < 8000 ? 'CLIMB'
    : 'CRUISE';
  const apState = snap.ap ? (snap.landingMode ? 'AP·LAND' : 'AP·CMD') : 'MANUAL';
  const route = ROUTES.find((r) => r.id === snap.routeId) || null;
  const autoMsg = snap.stopped
    ? '✈ FLIGHT COMPLETE · 已成功停稳 · 可 RESET 开始新航班'
    : snap.touchdownAt > 0
      ? 'GEAR ON RWY · 起落架已接地 · 保持反推/刹车减速'
      : snap.landingMode
        ? 'AUTO-LAND SEQUENCE · 降到 3000ft / 180kt · 形态已按高度预置'
        : snap.ap
          ? 'AUTOPILOT ACTIVE · 目标自动保持中'
          : snap.alt < 40
            ? 'PREFLIGHT · 双发检查 · 推油门起飞'
            : 'AI MONITORING · 监控速度与高度';

  return (
    <div className="lcd-line" aria-label="系统 LCD 状态行">
      <span className="lcd-seg lcd-phase">{phase}</span>
      <span className="lcd-seg">IAS {fmt(snap.ias)}</span>
      <span className="lcd-seg">ALT {fmt(snap.alt)}</span>
      <span className="lcd-seg">HDG {pad3(snap.hdg)}°</span>
      {route && snap.alt > 40 && <span className="lcd-seg lcd-rte">RTE {pad3(route.courseDeg)}°</span>}
      <span className="lcd-seg">FUEL {fmt(snap.fuel, 1)}t</span>
      <span className="lcd-seg lcd-ap">{apState}</span>
      <span className="lcd-msg">{autoMsg}</span>
    </div>
  );
}
