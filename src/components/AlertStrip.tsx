'use client';

import type { AlertItem } from '@/lib/sim-types';

interface AlertStripProps {
  alerts: AlertItem[];
  normalMsg: string;
  flash: { kind: 'normal' | 'warn' | 'danger'; text: string } | null;
}

export function AlertStrip({ alerts, normalMsg, flash }: AlertStripProps) {
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

  return (
    <div className={cls} id="alertStrip">
      <span className="alert-icon">◆</span>
      <span id="alertText">{text}</span>
    </div>
  );
}
