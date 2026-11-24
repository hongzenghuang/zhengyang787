'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  SimState, INITIAL_STATE, LIMITS, FLAP_STOPS, clamp,
} from '@/lib/sim-types';
import { physicsStep, autoRecover } from '@/lib/physics';
import {
  canEngageAP, captureTargets, adjustAPTarget, canEngageReverse,
  AP_INHIBIT_MSG, REV_INHIBIT_MSG,
} from '@/lib/autopilot';
import { computeAlerts, normalMessage, AlertItemPro } from '@/lib/alerts';
import { unlockAudio, playWarning, playCaution, playInfo } from '@/lib/audio';

export type FlashKind = 'normal' | 'warn' | 'danger';

export interface FlightSim {
  /** 实时模拟状态（每帧更新，供 Canvas 直接读取） */
  simRef: React.MutableRefObject<SimState>;
  /** 节流后的状态快照（驱动 React UI） */
  snap: SimState;
  /** 告警列表（含 AI 恢复程序） */
  alerts: AlertItemPro[];
  /** 无告警时的正常提示 */
  normalMsg: string;
  /** 临时 flash 提示（操作被拒绝等） */
  flash: { kind: FlashKind; text: string } | null;
  /** 顶层按钮状态 */
  running: boolean;
  actions: {
    toggleEngine: (i: 0 | 1) => void;
    setFlap: (v: number) => void;
    flapStep: (dir: 1 | -1) => void;
    setThrottle: (v: number) => void;
    throttleBy: (d: number) => void;
    pitchBy: (d: number) => void;
    bankBy: (d: number) => void;
    toggleGear: () => void;
    toggleReverse: () => void;
    toggleAP: () => void;
    adjustTarget: (key: keyof SimState['apTarget'], dir: 1 | -1) => void;
    togglePause: () => void;
    reset: () => void;
    unlockAudio: () => void;
    flashAlert: (kind: FlashKind, text: string) => void;
    /** 选定航线：预置巡航目标（教程后航线选择页调用） */
    setRoute: (routeId: string | null, cruiseAlt?: number, cruiseIas?: number) => void;
    /** 降落模式：巡航时开启，AP 目标自动转进近剖面（3000ft / 180kt / 放轮放襟翼） */
    toggleLandingMode: () => void;
    /** AI 自动恢复：执行警报条上的恢复程序 */
    autoRecover: (fix: AlertItemPro['autoFix']) => void;
  };
}

function cloneInitial(): SimState {
  return {
    ...INITIAL_STATE,
    apTarget: { ...INITIAL_STATE.apTarget },
    eng: [
      { ...INITIAL_STATE.eng[0] },
      { ...INITIAL_STATE.eng[1] },
    ],
  };
}

const SNAPSHOT_EVERY_N_FRAMES = 3; // ≈50ms（20fps）同步一次 UI 快照

export function useFlightSim(): FlightSim {
  const simRef = useRef<SimState>(cloneInitial());
  const [renderTick, forceRender] = useReducer((x: number) => x + 1, 0);
  const [flash, setFlash] = useState<FlightSim['flash']>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashAlert = useCallback((kind: FlashKind, text: string) => {
    setFlash({ kind, text });
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 2500);
  }, []);

  const sync = useCallback(() => forceRender(), []);

  // ── actions（直接改 simRef，然后立即同步快照）──
  const actions = useMemo<FlightSim['actions']>(() => {
    const s = () => simRef.current;
    return {
      toggleEngine(i) {
        s().eng[i].on = !s().eng[i].on;
        sync();
      },
      setFlap(v) {
        s().flap = clamp(v, 0, 30);
        sync();
      },
      flapStep(dir) {
        const idx = FLAP_STOPS.indexOf(s().flap as (typeof FLAP_STOPS)[number]);
        const next = FLAP_STOPS[clamp(idx + dir, 0, FLAP_STOPS.length - 1)];
        s().flap = next;
        sync();
      },
      setThrottle(v) {
        s().throttle = clamp(v, 0, 100);
        sync();
      },
      throttleBy(d) {
        s().throttle = clamp(s().throttle + d, 0, 100);
        sync();
      },
      pitchBy(d) {
        s().pitch = clamp(s().pitch + d, LIMITS.pitchMin, LIMITS.pitchMax);
        sync();
      },
      bankBy(d) {
        s().bank = clamp(s().bank + d, LIMITS.bankMin, LIMITS.bankMax);
        sync();
      },
      toggleGear() {
        s().gear = !s().gear;
        sync();
      },
      toggleReverse() {
        if (s().reverse) { s().reverse = false; sync(); return; }
        if (canEngageReverse(s())) { s().reverse = true; }
        else { flashAlert('warn', REV_INHIBIT_MSG); }
        sync();
      },
      toggleAP() {
        if (s().ap) { s().ap = false; sync(); return; }
        if (canEngageAP(s())) {
          captureTargets(s());
          s().ap = true;
        } else {
          flashAlert('warn', AP_INHIBIT_MSG);
        }
        sync();
      },
      adjustTarget(key, dir) {
        adjustAPTarget(s(), key, dir);
        sync();
      },
      togglePause() {
        s().running = !s().running;
        sync();
      },
      reset() {
        simRef.current = cloneInitial();
        sync();
      },
      unlockAudio() {
        unlockAudio();
      },
      flashAlert,
      setRoute(routeId, cruiseAlt, cruiseIas) {
        const s = simRef.current;
        s.routeId = routeId;
        s.landingMode = false;
        if (routeId && cruiseAlt && cruiseIas) {
          s.apTarget.alt = cruiseAlt;
          s.apTarget.ias = cruiseIas;
        }
        sync();
      },
      toggleLandingMode() {
        const s = simRef.current;
        if (!s.landingMode) {
          // 开启进近剖面：目标高度 3000ft / 速度 180kt，并按高度逐级放形态
          s.landingMode = true;
          s.apTarget.alt = Math.min(s.apTarget.alt, 3000);
          s.apTarget.ias = 180;
          if (s.alt > 15000) s.flap = 10;
          else if (s.alt > 8000) { s.flap = 15; s.gear = true; }
          else { s.flap = 25; s.gear = true; }
        } else {
          s.landingMode = false;
        }
        sync();
      },
      autoRecover(fix) {
        if (!fix) return;
        autoRecover(simRef.current, fix);
        sync();
      },
    };
  }, [sync, flashAlert]);

  // ── 主循环：物理推进 + 节流快照 + 警报音效 ──
  // 警报显示做「粘滞防抖」：警报消失后保留 1.2s 再移除（消除临界值抖动闪烁），
  // 只有新增警报才响铃；显示列表存 ref 供快照层读取。
  const displayAlertsRef = useRef<AlertItemPro[]>([]);
  const pendingRef = useRef<{ list: AlertItemPro[]; hideAt: number } | null>(null);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let frames = 0;
    let lastAlertKey = '';
    let prevTouchdownAt = 0;
    let prevStopped = false;

    const loop = (now: number) => {
      const dt = Math.min(LIMITS.dtMax, (now - last) / 1000);
      last = now;
      const s = simRef.current;
      physicsStep(s, dt);

      // 降落事件：接地 / 停稳（边沿触发，各响一次）
      if (s.touchdownAt > 0 && prevTouchdownAt === 0) playInfo();
      if (s.stopped && !prevStopped) playInfo();
      prevTouchdownAt = s.touchdownAt;
      prevStopped = s.stopped;

      // 警报计算（粘滞防抖 + 分级音效，仅新增触发）
      const list = computeAlerts(simRef.current);
      const key = list.map((a) => a.text).join('|');
      if (key !== lastAlertKey) {
        const prevSet = new Set(lastAlertKey.split('|').filter(Boolean));
        const added = list.some((a) => !prevSet.has(a.text));
        if (added) {
          // 新增：立即显示并响铃（分级）
          const dangerCount = list.filter((a) => a.danger).length;
          if (dangerCount > 0) playWarning();
          else playCaution();
          displayAlertsRef.current = list;
          pendingRef.current = null;
        } else if (list.length < displayAlertsRef.current.length) {
          // 只有移除：延迟 1.2s 应用，防止临界值反复进出
          pendingRef.current = { list, hideAt: now + 1200 };
        } else {
          displayAlertsRef.current = list;
        }
        lastAlertKey = key;
        simRef.current.lastAlert = key;
      }
      if (pendingRef.current && now >= pendingRef.current.hideAt) {
        displayAlertsRef.current = pendingRef.current.list;
        pendingRef.current = null;
      }

      // 节流同步 UI
      frames++;
      if (frames % SNAPSHOT_EVERY_N_FRAMES === 0) forceRender();

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  void renderTick; // renderTick 仅用于驱动 re-render

  const snap = simRef.current;
  const alerts = displayAlertsRef.current;

  return {
    simRef,
    snap,
    alerts,
    normalMsg: normalMessage(snap),
    flash,
    running: snap.running,
    actions,
  };
}
