'use client';

import { useEffect, useRef } from 'react';
import type { SimState } from '@/lib/sim-types';
import { clamp } from '@/lib/sim-types';
import { PFD } from './PFD';
import { ROUTES } from '@/lib/routes';
import { hdgError } from '@/lib/sim-types';

interface ViewportProps {
  simRef: React.MutableRefObject<SimState>;
  snap: SimState;
}

/**
 * 外部视景：天空/地景/云/跑道/舷窗/HUD + 内嵌 PFD。
 * 视景变换用 CSS 变量在 rAF 里实时更新（读 simRef），文本状态走 snap（React）。
 */
export function Viewport({ simRef, snap }: ViewportProps) {
  const skyRef = useRef<HTMLDivElement>(null);

  // 视景 CSS 变量：rAF 实时更新，读 simRef，不触发 React re-render
  useEffect(() => {
    let raf = 0;
    const update = () => {
      const el = skyRef.current;
      if (el) {
        const s = simRef.current;
        el.style.setProperty('--pitch', -s.pitch * 3 + 'px');
        el.style.setProperty('--bank', -s.bank * 0.28 + 'deg');
        const climbView = clamp(s.alt / 36000, 0, 1);
        el.style.setProperty('--scene-x', Math.sin(((s.hdg - 360) * Math.PI) / 180) * 80 + 'px');
        el.style.setProperty('--scene-y', climbView * 52 + 'px');
        el.style.setProperty('--scene-scale', String(1 - climbView * 0.25));
        el.style.setProperty('--cloud-opacity', String(clamp((s.alt - 1800) / 7000, 0, 0.92)));
        el.style.setProperty('--runway-opacity', String(1 - clamp(s.alt / 2200, 0, 1)));
        el.classList.toggle('high-altitude', s.alt > 8000);
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [simRef]);

  // 文本状态（来自 snap，20fps 足够）
  const flightMode = snap.alt < 40 ? 'ON GROUND' : snap.ap ? 'AUTOPILOT' : 'MANUAL FLIGHT';
  const viewState = snap.alt < 40 ? 'RUNWAY' : snap.alt < 3000 ? 'CLIMB' : 'CRUISE';
  const mm = String(Math.floor(snap.t / 60)).padStart(2, '0');
  const ss = String(Math.floor(snap.t % 60)).padStart(2, '0');

  // 固定航线航向指示：目标航向 + 偏差（◀左转 / ▶右转 / ✓在航线上）
  const route = ROUTES.find((r) => r.id === snap.routeId) || null;
  let courseChip: string | null = null;
  let courseCls = '';
  if (route && snap.alt > 40) {
    const dev = hdgError(route.courseDeg, snap.hdg); // >0 需右转
    if (Math.abs(dev) < 3) {
      courseChip = `RTE ${route.courseDeg}° ✓ ON COURSE`;
      courseCls = 'on-course';
    } else if (dev > 0) {
      courseChip = `RTE ${route.courseDeg}° ▶ 右转 ${Math.round(dev)}°`;
      courseCls = 'turn-right';
    } else {
      courseChip = `RTE ${route.courseDeg}° ◀ 左转 ${Math.round(-dev)}°`;
      courseCls = 'turn-left';
    }
  }

  return (
    <section className="viewport" aria-label="外部飞行视景和主飞行显示器">
      <div className="sky" id="sky" ref={skyRef}>
        <div className="outside-scene" />
        <div className="cloud-layer" />
        <div className="horizon" />
        <div className="runway" />
      </div>
      <div className="window-glow" />
      <div className="window-frame" />
      <div className="hud">
        <span className="chip">
          <i className="status-dot" />
          <span id="flightMode">{flightMode}</span>
        </span>
        <span className="chip">SIM · 787-10 · <span id="simTime">{mm}:{ss}</span></span>
        {courseChip && <span className={'chip course-chip ' + courseCls}>{courseChip}</span>}
      </div>
      <div className="pfd-wrap">
        <PFD simRef={simRef} />
      </div>
      <div className="crosshair" />
      <div className="view-label">
        VISUAL OUTSIDE VIEW <b id="viewState">{viewState}</b>
      </div>
    </section>
  );
}
