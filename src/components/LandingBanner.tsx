'use client';

import type { SimState } from '@/lib/sim-types';
import { ROUTES } from '@/lib/routes';

/**
 * 降落指示横幅：
 * - 接地瞬间：TOUCHDOWN 大字横幅，3 秒后自动淡出（按 t 差值计算，无额外状态）
 * - 成功停稳：常驻成功横幅，显示航班号，提示 RESET
 */
export function LandingBanner({ snap }: { snap: SimState }) {
  const flight = ROUTES.find((r) => r.id === snap.routeId)?.airline.flightNo;
  const sinceTouch = snap.t - snap.touchdownAt;

  // 停稳成功横幅（常驻）
  if (snap.stopped) {
    return (
      <div className="land-banner land-banner-ok">
        <span className="land-icon">✈</span>
        <div className="land-text">
          <div className="land-title">FLIGHT COMPLETE · 已成功停稳</div>
          <div className="land-sub">{flight ? `航班 ${flight} ` : ''}安全落地并停稳 · 点击顶部 ↻ RESET 开始新航班</div>
        </div>
      </div>
    );
  }

  // 接地横幅（3 秒后消失）
  if (snap.touchdownAt > 0 && sinceTouch < 3) {
    return (
      <div className="land-banner land-banner-td">
        <span className="land-icon">🛬</span>
        <div className="land-text">
          <div className="land-title">TOUCHDOWN · 起落架接地</div>
          <div className="land-sub">接地率 {(snap.vsi >= 0 ? '+' : '') + Math.round(snap.vsi)} fpm · 保持反推与刹车减速</div>
        </div>
      </div>
    );
  }

  return null;
}
