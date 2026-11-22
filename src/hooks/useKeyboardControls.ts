'use client';

import { useEffect } from 'react';
import type { FlightSim } from './useFlightSim';
import { unlockAudio } from '@/lib/audio';

const HANDLED_KEYS = [
  '1', '2', 'w', 'W', 's', 'S', '[', ']',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'p', 'P', 'r', 'R', ' ',
] as const;

/**
 * 键盘控制（保留 HTML 版的输入冲突规避）：
 * - 焦点在输入框/可编辑元素时不拦截
 * - Ctrl/Meta/Alt 组合键不拦截（保留浏览器快捷键）
 * - 焦点在 BUTTON 上时 Space/Enter 不拦截（保留按钮原生激活）
 */
export function useKeyboardControls(actions: FlightSim['actions']): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target?.tagName ?? '';
      const editable =
        target?.isContentEditable ||
        ['TEXTAREA', 'SELECT'].includes(tag) ||
        (tag === 'INPUT' && (target as HTMLInputElement).type !== 'range');
      if (editable || e.ctrlKey || e.metaKey || e.altKey) return;
      if (tag === 'BUTTON' && (e.code === 'Space' || e.key === 'Enter')) return;

      const k = e.key;
      if (!HANDLED_KEYS.includes(k as (typeof HANDLED_KEYS)[number])) return;
      e.preventDefault();
      actions.unlockAudio();

      if (k === '1') actions.toggleEngine(0);
      else if (k === '2') actions.toggleEngine(1);
      else if (k === 'w' || k === 'W') actions.throttleBy(2);
      else if (k === 's' || k === 'S') actions.throttleBy(-2);
      else if (k === '[') actions.flapStep(-1);
      else if (k === ']') actions.flapStep(1);
      else if (k === 'ArrowUp') actions.pitchBy(0.7);
      else if (k === 'ArrowDown') actions.pitchBy(-0.7);
      else if (k === 'ArrowLeft') actions.bankBy(-2);
      else if (k === 'ArrowRight') actions.bankBy(2);
      else if (k === 'p' || k === 'P') actions.toggleAP();
      else if (k === 'r' || k === 'R') actions.toggleReverse();
      else if (k === ' ') actions.togglePause();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [actions]);
}

/** 首次 pointerdown 解锁音频（浏览器自动播放策略） */
export function useAudioUnlock(): void {
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);
}
