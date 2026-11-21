'use client';

import { useFlightSimulation } from '@/hooks/useFlightSimulation';
import { useKeyboardControls } from '@/lib/keyboard-handler';
import { AttitudeIndicator } from '@/components/AttitudeIndicator';

export default function Pagecockpitmain() {
  const { state, dispatch } = useFlightSimulation();
  useKeyboardControls(dispatch);

  const { altitude, pitch, roll, heading, airspeed, verticalSpeed, throttle, flaps, engine1, engine2, autopilot, alerts, gearDown } = state;

  // 格式化数值显示
  const formatNumber = (num: number, decimals: number = 0) => {
    return num.toFixed(decimals);
  };

  const formatAltitude = (alt: number) => {
    return Math.round(alt).toLocaleString();
  };

  // 计算 N1 弧形进度 (0-100% 映射到 0-270 度)
  const getN1ArcStyle = (n1: number) => {
    const rotation = -45 + (n1 / 100) * 270;
    return { transform: `rotate(${rotation}deg)` };
  };

  // 计算 EGT 条形进度
  const getEgtBarWidth = (egt: number) => {
    return `${Math.min(100, (egt / 900) * 100)}%`;
  };

  // 计算油门杆高度
  const getThrottleHeight = (thr: number) => {
    return `${thr}%`;
  };

  // 襟翼步骤激活状态
  const getFlapStepActive = (step: number) => {
    const flapSteps = [0, 5, 10, 15, 20, 25, 30];
    return flaps >= flapSteps[step];
  };

  // 获取当前警报
  const activeAlerts = alerts.filter(a => a.active);
  const hasWarning = activeAlerts.some(a => a.severity === 'WARNING');
  const hasCaution = activeAlerts.some(a => a.severity === 'CAUTION');

  return (
    <div className="bk-root">
  <style dangerouslySetInnerHTML={{__html:`
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .bk-root { display: flex; flex-direction: column; width: 100%; height: 100vh; font-family: 'Courier New', 'Consolas', monospace; background: var(--color-surface-variant); color: var(--color-on-surface); overflow: hidden; position: relative; }

    /* 背景外部视野 */
    .bk-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; background: linear-gradient(180deg, #87ceeb 0%, #b0e0e6 40%, #f0e68c 60%, #8b7355 100%); }
    .bk-bg img { width: 100%; height: 100%; object-fit: cover; opacity: 0.6; }
    .bk-bg::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(180deg, rgba(13,13,13,0.3) 0%, rgba(13,13,13,0.1) 40%, rgba(13,13,13,0.4) 100%); }

    /* 主布局 */
    .bk-layout { position: relative; z-index: 1; display: flex; flex-direction: column; width: 100%; height: 100%; }

    /* 顶部警报条 */
    .bk-alert-bar { display: flex; align-items: center; justify-content: space-between; height: 36px; padding: 0 20px; background: color-mix(in srgb, var(--color-surface) 90%, transparent); border-bottom: 1px solid var(--color-secondary); }
    .bk-alert-left { display: flex; align-items: center; gap: 12px; }
    .bk-alert-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-success); box-shadow: 0 0 6px var(--color-success); }
    .bk-alert-dot-warn { background: var(--color-primary); box-shadow: 0 0 6px var(--color-primary); }
    .bk-alert-text { font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: var(--color-on-surface-2); }
    .bk-alert-text-active { color: var(--color-success); }
    .bk-alert-right { display: flex; align-items: center; gap: 16px; font-size: 11px; color: var(--color-on-surface-2); letter-spacing: 0.5px; }
    .bk-alert-time { color: var(--color-primary); }

    /* 主体区域 */
    .bk-main { flex: 1; display: flex; gap: 8px; padding: 8px; min-height: 0; }

    /* PFD 主飞行显示器 */
    .bk-pfd { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .bk-pfd-main { flex: 1; display: flex; gap: 6px; min-height: 0; }

    /* 空速带 */
    .bk-airspeed { width: 80px; background: color-mix(in srgb, var(--color-surface) 92%, transparent); border: 1px solid var(--color-secondary); border-radius: var(--rounded-sm); display: flex; flex-direction: column; align-items: center; padding: 8px 0; position: relative; overflow: hidden; }
    .bk-airspeed-label { font-size: 9px; color: var(--color-on-surface-2); letter-spacing: 1px; margin-bottom: 4px; text-transform: uppercase; }
    .bk-airspeed-tape { flex: 1; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
    .bk-airspeed-value { font-size: 28px; font-weight: bold; color: var(--color-success); text-shadow: 0 0 10px color-mix(in srgb, var(--color-success) 50%, transparent); line-height: 1; }
    .bk-airspeed-unit { font-size: 9px; color: var(--color-on-surface-2); margin-top: 2px; }
    .bk-speed-ticks { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 10px 0; }
    .bk-speed-tick { display: flex; align-items: center; width: 100%; padding: 0 6px; }
    .bk-speed-tick-line { width: 12px; height: 1px; background: var(--color-on-surface-2); }
    .bk-speed-tick-num { font-size: 9px; color: var(--color-on-surface-2); margin-left: 4px; }

    /* 姿态指示器 */
    .bk-attitude { flex: 1; background: #0a0a0a; border: 2px solid var(--color-secondary); border-radius: var(--rounded-md); display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden; min-width: 280px; min-height: 280px; padding: 10px; box-shadow: inset 0 0 20px rgba(0,0,0,0.8), 0 0 10px rgba(255,165,0,0.1); }
    .bk-att-title { position: absolute; top: 8px; left: 10px; font-size: 10px; color: var(--color-on-surface); letter-spacing: 1.5px; text-transform: uppercase; z-index: 2; font-weight: bold; text-shadow: 0 0 4px rgba(255,165,0,0.5); }
    .bk-attitude canvas { display: block; width: 100% !important; height: auto !important; max-width: 260px; max-height: 260px; }
    .bk-horizon { width: 85%; height: 70%; border-radius: 50%; border: 2px solid var(--color-secondary); overflow: hidden; position: relative; background: linear-gradient(180deg, #3a7bd5 0%, #3a7bd5 48%, #8B6914 50%, #6B4F12 100%); }
    .bk-horizon-line { position: absolute; top: 50%; left: 0; width: 100%; height: 2px; background: var(--color-primary); box-shadow: 0 0 4px var(--color-primary); }
    .bk-pitch-marks { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 18px; }
    .bk-pitch-mark { display: flex; align-items: center; gap: 4px; }
    .bk-pitch-line { width: 30px; height: 1px; background: var(--color-on-surface); }
    .bk-pitch-line-short { width: 16px; height: 1px; background: var(--color-on-surface); }
    .bk-pitch-num { font-size: 8px; color: var(--color-on-surface); }
    .bk-aircraft-symbol { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 3; }
    .bk-bank-indicator { position: absolute; top: 8%; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 10px solid var(--color-primary); z-index: 3; filter: drop-shadow(0 0 3px var(--color-primary)); }
    .bk-bank-scale { position: absolute; top: 4%; left: 50%; transform: translateX(-50%); display: flex; gap: 14px; z-index: 2; }
    .bk-bank-dot { width: 3px; height: 8px; background: var(--color-on-surface-2); border-radius: 1px; }
    .bk-bank-dot-major { width: 3px; height: 12px; background: var(--color-on-surface); border-radius: 1px; }
    .bk-slip-skid { position: absolute; bottom: 12%; left: 50%; transform: translateX(-50%); width: 40px; height: 6px; border: 1px solid var(--color-on-surface-2); border-radius: 3px; z-index: 2; }
    .bk-slip-ball { width: 10px; height: 4px; background: var(--color-on-surface); border-radius: 2px; margin: 0 auto; }

    /* 高度带 */
    .bk-altitude { width: 80px; background: color-mix(in srgb, var(--color-surface) 92%, transparent); border: 1px solid var(--color-secondary); border-radius: var(--rounded-sm); display: flex; flex-direction: column; align-items: center; padding: 8px 0; position: relative; overflow: hidden; }
    .bk-alt-label { font-size: 9px; color: var(--color-on-surface-2); letter-spacing: 1px; margin-bottom: 4px; text-transform: uppercase; }
    .bk-alt-tape { flex: 1; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
    .bk-alt-value { font-size: 24px; font-weight: bold; color: var(--color-success); text-shadow: 0 0 10px color-mix(in srgb, var(--color-success) 50%, transparent); line-height: 1; }
    .bk-alt-unit { font-size: 9px; color: var(--color-on-surface-2); margin-top: 2px; }
    .bk-alt-ticks { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 10px 0; }
    .bk-alt-tick { display: flex; align-items: center; justify-content: flex-end; width: 100%; padding: 0 6px; }
    .bk-alt-tick-num { font-size: 9px; color: var(--color-on-surface-2); margin-right: 4px; }
    .bk-alt-tick-line { width: 12px; height: 1px; background: var(--color-on-surface-2); }

    /* 垂直速度 */
    .bk-vs { width: 52px; background: color-mix(in srgb, var(--color-surface) 92%, transparent); border: 1px solid var(--color-secondary); border-radius: var(--rounded-sm); display: flex; flex-direction: column; align-items: center; padding: 6px 0; }
    .bk-vs-label { font-size: 8px; color: var(--color-on-surface-2); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 2px; }
    .bk-vs-scale { flex: 1; width: 100%; display: flex; flex-direction: column; justify-content: space-between; align-items: center; padding: 4px 0; }
    .bk-vs-tick { font-size: 8px; color: var(--color-on-surface-2); }
    .bk-vs-value { font-size: 16px; font-weight: bold; color: var(--color-primary); text-shadow: 0 0 8px color-mix(in srgb, var(--color-primary) 50%, transparent); margin-top: 4px; }
    .bk-vs-unit { font-size: 7px; color: var(--color-on-surface-2); }

    /* 航向指示 */
    .bk-heading { height: 56px; background: color-mix(in srgb, var(--color-surface) 92%, transparent); border: 1px solid var(--color-secondary); border-radius: var(--rounded-sm); display: flex; flex-direction: column; align-items: center; padding: 4px 0; position: relative; }
    .bk-hdg-label { font-size: 9px; color: var(--color-on-surface-2); letter-spacing: 1px; text-transform: uppercase; }
    .bk-hdg-tape { flex: 1; width: 100%; display: flex; align-items: center; justify-content: center; gap: 24px; overflow: hidden; }
    .bk-hdg-mark { display: flex; flex-direction: column; align-items: center; }
    .bk-hdg-num { font-size: 11px; color: var(--color-on-surface); font-weight: bold; }
    .bk-hdg-line { width: 1px; height: 6px; background: var(--color-on-surface-2); }
    .bk-hdg-line-major { width: 2px; height: 10px; background: var(--color-on-surface); }
    .bk-hdg-pointer { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 8px solid var(--color-primary); filter: drop-shadow(0 0 3px var(--color-primary)); }
    .bk-hdg-value { font-size: 14px; font-weight: bold; color: var(--color-primary); text-shadow: 0 0 6px color-mix(in srgb, var(--color-primary) 50%, transparent); }

    /* 引擎参数面板 */
    .bk-engine { width: 220px; display: flex; flex-direction: column; gap: 6px; }
    .bk-eng-panel { background: color-mix(in srgb, var(--color-surface) 92%, transparent); border: 1px solid var(--color-secondary); border-radius: var(--rounded-sm); padding: 10px; display: flex; flex-direction: column; }
    .bk-eng-title { font-size: 9px; color: var(--color-on-surface-2); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px; text-align: center; border-bottom: 1px solid color-mix(in srgb, var(--color-secondary) 50%, transparent); padding-bottom: 4px; }

    /* N1 转速表 */
    .bk-n1-row { display: flex; gap: 10px; justify-content: center; }
    .bk-n1-gauge { display: flex; flex-direction: column; align-items: center; }
    .bk-n1-circle { width: 80px; height: 80px; border-radius: 50%; border: 2px solid var(--color-secondary); position: relative; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, color-mix(in srgb, var(--color-surface) 80%, transparent) 0%, var(--color-surface) 100%); }
    .bk-n1-arc { position: absolute; top: 4px; left: 4px; right: 4px; bottom: 4px; border-radius: 50%; border: 3px solid transparent; border-top-color: var(--color-success); border-right-color: var(--color-success); transform: rotate(-45deg); }
    .bk-n1-val { font-size: 18px; font-weight: bold; color: var(--color-success); text-shadow: 0 0 8px color-mix(in srgb, var(--color-success) 50%, transparent); z-index: 1; }
    .bk-n1-pct { font-size: 8px; color: var(--color-on-surface-2); position: absolute; bottom: 10px; }
    .bk-n1-label { font-size: 9px; color: var(--color-on-surface-2); margin-top: 4px; }
    .bk-n1-eng-label { font-size: 8px; color: var(--color-primary); letter-spacing: 1px; }

    /* EGT 温度 */
    .bk-egt-row { display: flex; gap: 16px; justify-content: center; margin-top: 4px; }
    .bk-egt-item { display: flex; flex-direction: column; align-items: center; }
    .bk-egt-val { font-size: 20px; font-weight: bold; color: var(--color-primary); text-shadow: 0 0 8px color-mix(in srgb, var(--color-primary) 50%, transparent); }
    .bk-egt-unit { font-size: 8px; color: var(--color-on-surface-2); }
    .bk-egt-label { font-size: 8px; color: var(--color-on-surface-2); margin-top: 2px; }
    .bk-egt-bar-bg { width: 60px; height: 4px; background: var(--color-secondary); border-radius: 2px; margin-top: 4px; }
    .bk-egt-bar { height: 100%; border-radius: 2px; background: var(--color-primary); box-shadow: 0 0 4px var(--color-primary); }

    /* 燃油流量 */
    .bk-ff-row { display: flex; gap: 16px; justify-content: center; margin-top: 4px; }
    .bk-ff-item { display: flex; flex-direction: column; align-items: center; }
    .bk-ff-val { font-size: 16px; font-weight: bold; color: var(--color-on-surface); }
    .bk-ff-unit { font-size: 8px; color: var(--color-on-surface-2); }
    .bk-ff-label { font-size: 8px; color: var(--color-on-surface-2); margin-top: 2px; }

    /* 自动驾驶状态 */
    .bk-ap-panel { background: color-mix(in srgb, var(--color-surface) 92%, transparent); border: 1px solid var(--color-secondary); border-radius: var(--rounded-sm); padding: 8px 10px; }
    .bk-ap-title { font-size: 9px; color: var(--color-on-surface-2); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px; text-align: center; }
    .bk-ap-status { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .bk-ap-btn { padding: 4px 14px; border-radius: var(--rounded-sm); font-size: 11px; font-weight: bold; letter-spacing: 1px; cursor: pointer; border: 1px solid; }
    .bk-ap-on { background: color-mix(in srgb, var(--color-success) 15%, transparent); border-color: var(--color-success); color: var(--color-success); text-shadow: 0 0 6px color-mix(in srgb, var(--color-success) 50%, transparent); }
    .bk-ap-modes { display: flex; gap: 6px; margin-top: 6px; justify-content: center; }
    .bk-ap-mode { font-size: 8px; padding: 2px 6px; border-radius: 2px; background: color-mix(in srgb, var(--color-success) 12%, transparent); color: var(--color-success); border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent); letter-spacing: 0.5px; }

    /* 底部控制面板 */
    .bk-bottom { display: flex; gap: 8px; padding: 8px; height: 110px; }
    .bk-ctrl-panel { flex: 1; background: color-mix(in srgb, var(--color-surface) 92%, transparent); border: 1px solid var(--color-secondary); border-radius: var(--rounded-sm); padding: 8px 12px; display: flex; flex-direction: column; }
    .bk-ctrl-title { font-size: 9px; color: var(--color-on-surface-2); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px; text-align: center; }

    /* 襟翼 */
    .bk-flap-display { display: flex; align-items: center; justify-content: center; gap: 12px; flex: 1; }
    .bk-flap-angle { font-size: 28px; font-weight: bold; color: var(--color-primary); text-shadow: 0 0 10px color-mix(in srgb, var(--color-primary) 50%, transparent); }
    .bk-flap-deg { font-size: 12px; color: var(--color-on-surface-2); }
    .bk-flap-steps { display: flex; gap: 3px; align-items: flex-end; }
    .bk-flap-step { width: 6px; background: var(--color-secondary); border-radius: 1px; }
    .bk-flap-step-active { background: var(--color-primary); box-shadow: 0 0 4px var(--color-primary); }

    /* 油门 */
    .bk-throttle-display { display: flex; align-items: center; justify-content: center; gap: 16px; flex: 1; }
    .bk-throttle-lever { width: 20px; height: 60px; background: var(--color-secondary); border-radius: 3px; position: relative; overflow: hidden; }
    .bk-throttle-fill { position: absolute; bottom: 0; left: 0; width: 100%; background: linear-gradient(0deg, var(--color-success), color-mix(in srgb, var(--color-success) 60%, var(--color-primary))); border-radius: 3px; box-shadow: 0 0 6px color-mix(in srgb, var(--color-success) 40%, transparent); }
    .bk-throttle-val { font-size: 22px; font-weight: bold; color: var(--color-success); text-shadow: 0 0 8px color-mix(in srgb, var(--color-success) 50%, transparent); }
    .bk-throttle-pct { font-size: 10px; color: var(--color-on-surface-2); }
    .bk-throttle-label { font-size: 8px; color: var(--color-on-surface-2); text-align: center; }

    /* 起落架 */
    .bk-gear-display { display: flex; align-items: center; justify-content: center; gap: 20px; flex: 1; }
    .bk-gear-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .bk-gear-icon { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--color-success); display: flex; align-items: center; justify-content: center; }
    .bk-gear-icon svg { color: var(--color-success); filter: drop-shadow(0 0 3px var(--color-success)); }
    .bk-gear-label { font-size: 8px; color: var(--color-on-surface-2); letter-spacing: 0.5px; }
    .bk-gear-status { font-size: 10px; color: var(--color-success); font-weight: bold; letter-spacing: 1px; }

    /* 引擎状态指示 */
    .bk-eng-status { display: flex; gap: 12px; justify-content: center; margin-top: 4px; }
    .bk-eng-ind { display: flex; align-items: center; gap: 4px; }
    .bk-eng-ind-dot { width: 6px; height: 6px; border-radius: 50%; }
    .bk-eng-ind-on { background: var(--color-success); box-shadow: 0 0 4px var(--color-success); }
    .bk-eng-ind-label { font-size: 8px; color: var(--color-on-surface-2); }
  `}} />

  
  <div className="bk-bg">
    <img src="/images/img_20261023_140214_842035.jpg" alt="External View" />
  </div>

  <div className="bk-layout">
    
    <div className="bk-alert-bar">
      <div className="bk-alert-left">
        <div className={`bk-alert-dot ${hasWarning ? 'bk-alert-dot-warn' : ''}`}></div>
        <span className={`bk-alert-text ${activeAlerts.length === 0 ? 'bk-alert-text-active' : ''}`}>
          {activeAlerts.length > 0 ? activeAlerts[0].message : 'ALL SYSTEMS NOMINAL'}
        </span>
        {autopilot.active && (
          <>
            <div className="bk-alert-dot bk-alert-dot-warn"></div>
            <span className="bk-alert-text" style={{color:'var(--color-primary)'}}>AUTOPILOT ENGAGED</span>
          </>
        )}
      </div>
      <div className="bk-alert-right">
        <span>BOEING 787-10</span>
        <span>|</span>
        <span>FL{Math.round(altitude / 100)}</span>
        <span>|</span>
        <span className="bk-alert-time">{new Date().toLocaleTimeString('en-US', { hour12: false })} UTC</span>
      </div>
    </div>

    
    <div className="bk-main">
      
      <div className="bk-pfd">
        <div className="bk-pfd-main">
          
          <div className="bk-airspeed">
            <span className="bk-airspeed-label">AIRSPEED</span>
            <div className="bk-airspeed-tape">
              <div className="bk-speed-ticks">
                <div className="bk-speed-tick"><div className="bk-speed-tick-line"></div><span className="bk-speed-tick-num">{Math.round(airspeed + 55)}</span></div>
                <div className="bk-speed-tick"><div className="bk-speed-tick-line"></div><span className="bk-speed-tick-num">{Math.round(airspeed + 35)}</span></div>
                <div className="bk-speed-tick"><div className="bk-speed-tick-line"></div><span className="bk-speed-tick-num">{Math.round(airspeed + 15)}</span></div>
                <div className="bk-speed-tick"><div className="bk-speed-tick-line"></div><span className="bk-speed-tick-num">{Math.round(airspeed - 5)}</span></div>
                <div className="bk-speed-tick"><div className="bk-speed-tick-line"></div><span className="bk-speed-tick-num">{Math.round(airspeed - 25)}</span></div>
              </div>
              <div className="bk-airspeed-value">{Math.round(airspeed)}</div>
              <div className="bk-airspeed-unit">KIAS</div>
            </div>
          </div>

          
          <div className="bk-attitude">
            <span className="bk-att-title">ATTITUDE</span>
            <AttitudeIndicator pitch={pitch} roll={roll} />
          </div>

          
          <div className="bk-altitude">
            <span className="bk-alt-label">ALTITUDE</span>
            <div className="bk-alt-tape">
              <div className="bk-alt-ticks">
                <div className="bk-alt-tick"><span className="bk-alt-tick-num">{Math.round(altitude + 1000)}</span><div className="bk-alt-tick-line"></div></div>
                <div className="bk-alt-tick"><span className="bk-alt-tick-num">{Math.round(altitude + 500)}</span><div className="bk-alt-tick-line"></div></div>
                <div className="bk-alt-tick"><span className="bk-alt-tick-num">{Math.round(altitude)}</span><div className="bk-alt-tick-line"></div></div>
                <div className="bk-alt-tick"><span className="bk-alt-tick-num">{Math.round(altitude - 500)}</span><div className="bk-alt-tick-line"></div></div>
                <div className="bk-alt-tick"><span className="bk-alt-tick-num">{Math.round(altitude - 1000)}</span><div className="bk-alt-tick-line"></div></div>
              </div>
              <div className="bk-alt-value">{formatAltitude(altitude)}</div>
              <div className="bk-alt-unit">FT</div>
            </div>
          </div>

          
          <div className="bk-vs">
            <span className="bk-vs-label">V/S</span>
            <div className="bk-vs-scale">
              <span className="bk-vs-tick">+2</span>
              <span className="bk-vs-tick">+1</span>
              <span className="bk-vs-tick" style={{color:'var(--color-on-surface)',fontWeight:'bold'}}>0</span>
              <span className="bk-vs-tick">-1</span>
              <span className="bk-vs-tick">-2</span>
            </div>
            <div className="bk-vs-value">{verticalSpeed > 0 ? '+' : ''}{Math.round(verticalSpeed)}</div>
            <div className="bk-vs-unit">FPM</div>
          </div>
        </div>

        
        <div className="bk-heading">
          <span className="bk-hdg-label">HEADING</span>
          <div className="bk-hdg-tape">
            <div className="bk-hdg-mark"><span className="bk-hdg-num">{Math.round((heading - 20 + 360) % 360)}</span><div className="bk-hdg-line"></div></div>
            <div className="bk-hdg-mark"><span className="bk-hdg-num">{Math.round((heading - 10 + 360) % 360)}</span><div className="bk-hdg-line-major"></div></div>
            <div className="bk-hdg-mark"><span className="bk-hdg-value">{Math.round(heading)}</span><div className="bk-hdg-line-major" style={{background:'var(--color-primary)'}}></div></div>
            <div className="bk-hdg-mark"><span className="bk-hdg-num">{Math.round((heading + 10) % 360)}</span><div className="bk-hdg-line-major"></div></div>
            <div className="bk-hdg-mark"><span className="bk-hdg-num">{Math.round((heading + 20) % 360)}</span><div className="bk-hdg-line"></div></div>
            <div className="bk-hdg-mark"><span className="bk-hdg-num">{Math.round((heading + 30) % 360) === 270 ? 'W' : Math.round((heading + 30) % 360)}</span><div className="bk-hdg-line-major" style={{background:'var(--color-on-surface)'}}></div></div>
          </div>
          <div className="bk-hdg-pointer"></div>
        </div>
      </div>

      
      <div className="bk-engine">
        
        <div className="bk-eng-panel">
          <div className="bk-eng-title">N1 RPM</div>
          <div className="bk-n1-row">
            <div className="bk-n1-gauge">
              <span className="bk-n1-eng-label">ENG 1</span>
              <div className="bk-n1-circle">
                <div className="bk-n1-arc" style={getN1ArcStyle(engine1.n1)}></div>
                <span className="bk-n1-val">{formatNumber(engine1.n1, 1)}</span>
                <span className="bk-n1-pct">%</span>
              </div>
              <span className="bk-n1-label">LEFT</span>
            </div>
            <div className="bk-n1-gauge">
              <span className="bk-n1-eng-label">ENG 2</span>
              <div className="bk-n1-circle">
                <div className="bk-n1-arc" style={getN1ArcStyle(engine2.n1)}></div>
                <span className="bk-n1-val">{formatNumber(engine2.n1, 1)}</span>
                <span className="bk-n1-pct">%</span>
              </div>
              <span className="bk-n1-label">RIGHT</span>
            </div>
          </div>
          <div className="bk-eng-status">
            <div className="bk-eng-ind">
              <div className={`bk-eng-ind-dot ${engine1.running ? 'bk-eng-ind-on' : ''}`}></div>
              <span className="bk-eng-ind-label">ENG 1 {engine1.running ? 'RUN' : 'OFF'}</span>
            </div>
            <div className="bk-eng-ind">
              <div className={`bk-eng-ind-dot ${engine2.running ? 'bk-eng-ind-on' : ''}`}></div>
              <span className="bk-eng-ind-label">ENG 2 {engine2.running ? 'RUN' : 'OFF'}</span>
            </div>
          </div>
        </div>

        
        <div className="bk-eng-panel">
          <div className="bk-eng-title">EGT TEMP</div>
          <div className="bk-egt-row">
            <div className="bk-egt-item">
              <span className="bk-egt-val">{Math.round(engine1.egt)}</span>
              <span className="bk-egt-unit">°C</span>
              <span className="bk-egt-label">ENG 1</span>
              <div className="bk-egt-bar-bg"><div className="bk-egt-bar" style={{width: getEgtBarWidth(engine1.egt)}}></div></div>
            </div>
            <div className="bk-egt-item">
              <span className="bk-egt-val">{Math.round(engine2.egt)}</span>
              <span className="bk-egt-unit">°C</span>
              <span className="bk-egt-label">ENG 2</span>
              <div className="bk-egt-bar-bg"><div className="bk-egt-bar" style={{width: getEgtBarWidth(engine2.egt)}}></div></div>
            </div>
          </div>
        </div>

        
        <div className="bk-eng-panel">
          <div className="bk-eng-title">FUEL FLOW</div>
          <div className="bk-ff-row">
            <div className="bk-ff-item">
              <span className="bk-ff-val">{Math.round(engine1.fuelFlow).toLocaleString()}</span>
              <span className="bk-ff-unit">KG/HR</span>
              <span className="bk-ff-label">ENG 1</span>
            </div>
            <div className="bk-ff-item">
              <span className="bk-ff-val">{Math.round(engine2.fuelFlow).toLocaleString()}</span>
              <span className="bk-ff-unit">KG/HR</span>
              <span className="bk-ff-label">ENG 2</span>
            </div>
          </div>
        </div>

        
        <div className="bk-ap-panel">
          <div className="bk-ap-title">AUTOPILOT</div>
          <div className="bk-ap-status">
            <div className={`bk-ap-btn ${autopilot.active ? 'bk-ap-on' : ''}`}>
              A/P {autopilot.active ? 'ON' : 'OFF'}
            </div>
          </div>
          {autopilot.active && (
            <div className="bk-ap-modes">
              <span className="bk-ap-mode">SPD {Math.round(autopilot.targetAirspeed)}</span>
              <span className="bk-ap-mode">HDG {Math.round(autopilot.targetHeading)}</span>
              <span className="bk-ap-mode">ALT {Math.round(autopilot.targetAltitude)}</span>
              <span className="bk-ap-mode">VNAV</span>
            </div>
          )}
        </div>
      </div>
    </div>

    
    <div className="bk-bottom">
      
      <div className="bk-ctrl-panel">
        <div className="bk-ctrl-title">FLAPS</div>
        <div className="bk-flap-display">
          <div className="bk-flap-steps">
            <div className={`bk-flap-step ${getFlapStepActive(0) ? 'bk-flap-step-active' : ''}`} style={{height:'8px'}}></div>
            <div className={`bk-flap-step ${getFlapStepActive(1) ? 'bk-flap-step-active' : ''}`} style={{height:'14px'}}></div>
            <div className={`bk-flap-step ${getFlapStepActive(2) ? 'bk-flap-step-active' : ''}`} style={{height:'20px'}}></div>
            <div className={`bk-flap-step ${getFlapStepActive(3) ? 'bk-flap-step-active' : ''}`} style={{height:'26px'}}></div>
            <div className={`bk-flap-step ${getFlapStepActive(4) ? 'bk-flap-step-active' : ''}`} style={{height:'32px'}}></div>
            <div className={`bk-flap-step ${getFlapStepActive(5) ? 'bk-flap-step-active' : ''}`} style={{height:'38px'}}></div>
            <div className={`bk-flap-step ${getFlapStepActive(6) ? 'bk-flap-step-active' : ''}`} style={{height:'44px'}}></div>
          </div>
          <div>
            <span className="bk-flap-angle">{flaps}</span>
            <span className="bk-flap-deg">°</span>
          </div>
        </div>
      </div>

      
      <div className="bk-ctrl-panel">
        <div className="bk-ctrl-title">THROTTLE</div>
        <div className="bk-throttle-display">
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'}}>
            <div className="bk-throttle-lever">
              <div className="bk-throttle-fill" style={{height: getThrottleHeight(throttle)}}></div>
            </div>
            <span className="bk-throttle-label">THR 1</span>
          </div>
          <div>
            <span className="bk-throttle-val">{Math.round(throttle)}</span>
            <span className="bk-throttle-pct">%</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'}}>
            <div className="bk-throttle-lever">
              <div className="bk-throttle-fill" style={{height: getThrottleHeight(throttle)}}></div>
            </div>
            <span className="bk-throttle-label">THR 2</span>
          </div>
        </div>
      </div>

      
      <div className="bk-ctrl-panel">
        <div className="bk-ctrl-title">LANDING GEAR</div>
        <div className="bk-gear-display">
          <div className="bk-gear-item">
            <div className="bk-gear-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            </div>
            <span className="bk-gear-label">NOSE</span>
            <span className="bk-gear-status">{gearDown ? 'DOWN' : 'UP'}</span>
          </div>
          <div className="bk-gear-item">
            <div className="bk-gear-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            </div>
            <span className="bk-gear-label">LEFT</span>
            <span className="bk-gear-status">{gearDown ? 'DOWN' : 'UP'}</span>
          </div>
          <div className="bk-gear-item">
            <div className="bk-gear-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            </div>
            <span className="bk-gear-label">RIGHT</span>
            <span className="bk-gear-status">{gearDown ? 'DOWN' : 'UP'}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  );
}
