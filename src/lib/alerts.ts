// 警报判定 + 自动恢复程序（AI 恢复建议）
import { SimState, AlertItem, stallLimit } from './sim-types';

/** 扩展警报项：附 AI 自动恢复程序（建议动作 + 可一键执行的 action key） */
export interface AlertItemPro extends AlertItem {
  /** AI 恢复程序：给飞行员的一句话建议 */
  recovery: string;
  /** 自动恢复是否可由「AUTO RECOVER」按钮执行 */
  autoFix: null | 'pushNose' | 'pullUp' | 'levelOff' | 'addPower' | 'idlePower' | 'restartEng' | 'gearUp' | 'flap10';
}

/** 计算当前应显示的告警列表（按优先级追加），附 AI 自动恢复程序 */
export function computeAlerts(s: SimState): AlertItemPro[] {
  const any = s.eng.some((e) => e.on);
  const out: AlertItemPro[] = [];

  if (!any && s.ias > 20) {
    out.push({
      text: 'ALL ENGINES OFF', danger: true,
      recovery: 'AI：双发熄火 —— 按下 1 和 2 重新点火，恢复推力后维持当前姿态',
      autoFix: 'restartEng',
    });
  } else if (s.eng.some((e) => !e.on) && s.ias > 100) {
    out.push({
      text: 'ENG FAILURE', danger: false,
      recovery: 'AI：单发失效 —— 保持机翼水平，油门不超过 80%，尽快落地',
      autoFix: null,
    });
  }

  if (s.ias < stallLimit(s.flap) && s.alt > 100) {
    out.push({
      text: 'STALL', danger: true,
      recovery: 'AI：失速保护 —— 自动推杆低头并加满油门换取速度，速度恢复后再爬升',
      autoFix: 'pushNose',
    });
  }
  if (s.ias > 340) {
    out.push({
      text: 'OVERSPEED', danger: false,
      recovery: 'AI：超速 —— 自动收油门并轻微拉杆减速至 330 节以下',
      autoFix: 'idlePower',
    });
  }
  if (s.alt > 100 && s.alt < 900 && s.vsi < -600) {
    out.push({
      text: 'GPWS · SINK RATE', danger: true,
      recovery: 'AI：近地下降率过大 —— 自动拉杆改出，建立正上升率',
      autoFix: 'pullUp',
    });
  }
  if (s.ap && Math.abs(s.alt - s.apTarget.alt) > 50) {
    out.push({
      text: 'ALTITUDE DEVIATION', danger: false,
      recovery: 'AI：高度偏离目标 —— 自动接管俯仰回切目标高度',
      autoFix: 'levelOff',
    });
  }
  return out;
}

/** 无告警时的正常提示 */
export function normalMessage(s: SimState): string {
  if (s.reverse) return 'REVERSERS ACTIVE · Advance THRUST to increase simulated braking';
  if (s.alt < 40) return 'SYSTEMS NOMINAL · Advance throttles to begin takeoff';
  if (s.ap) return 'AUTOPILOT ENGAGED · Holding captured targets';
  return 'MANUAL FLIGHT · Monitor speed and altitude';
}
