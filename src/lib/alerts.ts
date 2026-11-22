// 警报判定
import { SimState, AlertItem, stallLimit } from './sim-types';

/** 计算当前应显示的告警列表（按优先级追加） */
export function computeAlerts(s: SimState): AlertItem[] {
  const any = s.eng.some((e) => e.on);
  const out: AlertItem[] = [];

  if (!any && s.ias > 20) out.push({ text: 'ALL ENGINES OFF', danger: true });
  else if (s.eng.some((e) => !e.on) && s.ias > 100) out.push({ text: 'ENG FAILURE', danger: false });

  if (s.ias < stallLimit(s.flap) && s.alt > 100) out.push({ text: 'STALL', danger: true });
  if (s.ias > 340) out.push({ text: 'OVERSPEED', danger: false });
  if (s.alt > 100 && s.alt < 900 && s.vsi < -600) out.push({ text: 'GPWS · SINK RATE', danger: true });
  if (s.ap && Math.abs(s.alt - s.apTarget.alt) > 50) out.push({ text: 'ALTITUDE DEVIATION', danger: false });

  return out;
}

/** 无告警时的正常提示 */
export function normalMessage(s: SimState): string {
  if (s.reverse) return 'REVERSERS ACTIVE · Advance THRUST to increase simulated braking';
  if (s.alt < 40) return 'SYSTEMS NOMINAL · Advance throttles to begin takeoff';
  if (s.ap) return 'AUTOPILOT ENGAGED · Holding captured targets';
  return 'MANUAL FLIGHT · Monitor speed and altitude';
}
