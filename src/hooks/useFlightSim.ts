'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  SimState, INITIAL_STATE, LIMITS, FLAP_STOPS, clamp,
} from '@/lib/sim-types';
import { physicsStep } from '@/lib/physics';
import {
  canEngageAP, captureTargets, adjustAPTarget, canEngageReverse,
  AP_INHIBIT_MSG, REV_INHIBIT_MSG,
} from '@/lib/autopilot';
import { computeAlerts, normalMessage } from '@/lib/alerts';
import { unlockAudio, playAlert } from '@/lib/audio';

export type FlashKind = 'normal' | 'warn' | 'danger';

export interface FlightSim {
  /** 实时模拟状态（每帧更新，供 Canvas 直接读取） */
  simRef: React.MutableRefObject<SimState>;
  /** 节流后的状态快照（驱动 React UI） */
  snap: SimState;
  /** 告警列表（含 danger 标志） */
  alerts: { text: string; danger: boolean }[];
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
    };
  }, [sync, flashAlert]);

  // ── 主循环：物理推进 + 节流快照 + 警报音效 ──
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let frames = 0;
    let lastAlertKey = '';

    const loop = (now: number) => {
      const dt = Math.min(LIMITS.dtMax, (now - last) / 1000);
      last = now;
      physicsStep(simRef.current, dt);

      // 警报音效：仅当告警集合变化时触发
      const list = computeAlerts(simRef.current);
      const key = list.map((a) => a.text).join('|');
      if (key !== lastAlertKey) {
        if (key) playAlert();
        lastAlertKey = key;
        simRef.current.lastAlert = key;
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
  const alerts = computeAlerts(snap);

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
