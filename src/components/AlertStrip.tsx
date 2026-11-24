'use client';

import type { AlertItemPro } from '@/lib/alerts';

interface AlertStripProps {
  alerts: AlertItemPro[];
  normalMsg: string;
  flash: { kind: 'normal' | 'warn' | 'danger'; text: string } | null;
  onAutoRecover: (fix: AlertItemPro['autoFix']) => void;
}

/**
 * 警报条：分级警报显示 + AI 自动恢复程序。
 * - AI 恢复区常驻布局（visibility 显隐），避免警报临界抖动时反复插拔 DOM 引起布局闪动
 * - 背景色带过渡，等级切换不突跳
 */
export function AlertStrip({ alerts, normalMsg, flash, onAutoRecover }: AlertStripProps) {
  let cls = 'alert-strip';
  let text = normalMsg;

  if (flash) {
    cls = 'alert-strip ' + flash.kind;
    text = flash.text;
  } else if (alerts.length > 0) {
    const danger = alerts.some((a) => a.danger);
    cls = 'alert-strip ' + (danger ? 'danger' : 'warn');
    text = alerts.map((a) => a.text).join('  ·  ');
  }

  const top = alerts[0] || null;
  const showRecovery = !flash && !!top;

  return (
    <div className={cls} id="alertStrip">
      <span className="alert-icon">◆</span>
      <span id="alertText">{text}</span>

      {/* AI 自动恢复程序：常驻布局，visibility 控制，消除布局抖动 */}
      <span className={'alert-recovery' + (showRecovery ? ' show' : '')}>
        <span className="recovery-text">{top?.recovery || '\u00A0'}</span>
        <button
          className="recovery-btn"
          type="button"
          style={{ visibility: top?.autoFix ? 'visible' : 'hidden' }}
          onClick={() => top?.autoFix && onAutoRecover(top.autoFix)}
        >⚡ AUTO RECOVER</button>
      </span>
    </div>
  );
}
