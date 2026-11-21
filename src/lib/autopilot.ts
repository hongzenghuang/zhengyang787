import { FlightState, Alert } from './types';

// 自动驾驶 PID 控制器参数
const PID_KP_SPEED = 0.5;
const PID_KI_SPEED = 0.1;
const PID_KD_SPEED = 0.05;

const PID_KP_ALT = 0.3;
const PID_KI_ALT = 0.05;
const PID_KD_ALT = 0.02;

const PID_KP_HDG = 0.4;
const PID_KI_HDG = 0.08;
const PID_KD_HDG = 0.03;

interface PIDState {
  integral: number;
  lastError: number;
}

const pidStates: Record<string, PIDState> = {
  speed: { integral: 0, lastError: 0 },
  altitude: { integral: 0, lastError: 0 },
  heading: { integral: 0, lastError: 0 },
};

function pidController(error: number, dt: number, state: PIDState, kp: number, ki: number, kd: number): number {
  // 比例项
  const p = kp * error;
  
  // 积分项
  state.integral += error * dt;
  state.integral = Math.max(-100, Math.min(100, state.integral)); // 防饱和
  const i = ki * state.integral;
  
  // 微分项
  const derivative = (error - state.lastError) / dt;
  state.lastError = error;
  const d = kd * derivative;
  
  return p + i + d;
}

export function updateAutopilot(state: FlightState, deltaTime: number): Partial<FlightState> {
  if (!state.autopilot.active) {
    return {};
  }
  
  const dt = deltaTime / 1000;
  const updates: Partial<FlightState> = {};
  
  // 速度控制 (调整油门)
  const speedError = state.autopilot.targetAirspeed - state.airspeed;
  const throttleAdjust = pidController(speedError, dt, pidStates.speed, PID_KP_SPEED, PID_KI_SPEED, PID_KD_SPEED);
  updates.throttle = Math.max(0, Math.min(100, state.throttle + throttleAdjust));
  
  // 高度控制 (调整俯仰)
  const altError = state.autopilot.targetAltitude - state.altitude;
  const pitchAdjust = pidController(altError, dt, pidStates.altitude, PID_KP_ALT, PID_KI_ALT, PID_KD_ALT);
  updates.pitch = Math.max(-30, Math.min(30, state.pitch + pitchAdjust));
  
  // 航向控制 (调整滚转)
  let hdgError = state.autopilot.targetHeading - state.heading;
  // 处理航向环绕
  if (hdgError > 180) hdgError -= 360;
  if (hdgError < -180) hdgError += 360;
  const rollAdjust = pidController(hdgError, dt, pidStates.heading, PID_KP_HDG, PID_KI_HDG, PID_KD_HDG);
  updates.roll = Math.max(-45, Math.min(45, state.roll + rollAdjust));
  
  // 警报修正
  const alerts: Alert[] = [];
  
  // 失速修正
  if (state.airspeed < 120) {
    updates.pitch = Math.max(-15, state.pitch - 5); // 推头
    updates.throttle = Math.min(100, state.throttle + 10); // 加油门
    alerts.push({
      type: 'STALL',
      severity: 'WARNING',
      message: 'STALL WARNING - AUTOPILOT CORRECTING',
      active: true,
      timestamp: Date.now(),
    });
  }
  
  // 超速修正
  if (state.airspeed > 350) {
    updates.pitch = Math.min(15, state.pitch + 3); // 拉杆
    updates.throttle = Math.max(0, state.throttle - 10); // 减油门
    alerts.push({
      type: 'OVERSPEED',
      severity: 'WARNING',
      message: 'OVERSPEED WARNING - AUTOPILOT CORRECTING',
      active: true,
      timestamp: Date.now(),
    });
  }
  
  // 高度偏离
  if (Math.abs(altError) > 200) {
    alerts.push({
      type: 'ALTITUDE',
      severity: 'CAUTION',
      message: `ALTITUDE DEVIATION ${altError > 0 ? '+' : ''}${Math.round(altError)} FT`,
      active: true,
      timestamp: Date.now(),
    });
  }
  
  updates.alerts = alerts;
  
  return updates;
}

export function checkAlerts(state: FlightState): Alert[] {
  const alerts: Alert[] = [];
  
  // 失速警报
  if (state.airspeed < 120) {
    alerts.push({
      type: 'STALL',
      severity: 'WARNING',
      message: 'STALL WARNING',
      active: true,
      timestamp: Date.now(),
    });
  }
  
  // 超速警报
  if (state.airspeed > 350) {
    alerts.push({
      type: 'OVERSPEED',
      severity: 'WARNING',
      message: 'OVERSPEED WARNING',
      active: true,
      timestamp: Date.now(),
    });
  }
  
  // 高度偏离警报
  if (state.autopilot.active && Math.abs(state.altitude - state.autopilot.targetAltitude) > 200) {
    alerts.push({
      type: 'ALTITUDE',
      severity: 'CAUTION',
      message: 'ALTITUDE DEVIATION',
      active: true,
      timestamp: Date.now(),
    });
  }
  
  // 引擎故障警报
  if (!state.engine1.running && state.throttle > 50) {
    alerts.push({
      type: 'ENGINE',
      severity: 'WARNING',
      message: 'ENGINE 1 FAILURE',
      active: true,
      timestamp: Date.now(),
    });
  }
  if (!state.engine2.running && state.throttle > 50) {
    alerts.push({
      type: 'ENGINE',
      severity: 'WARNING',
      message: 'ENGINE 2 FAILURE',
      active: true,
      timestamp: Date.now(),
    });
  }
  
  // 近地警报
  if (state.altitude < 500 && state.verticalSpeed < -1000) {
    alerts.push({
      type: 'GPWS',
      severity: 'WARNING',
      message: 'TERRAIN - PULL UP',
      active: true,
      timestamp: Date.now(),
    });
  }
  
  return alerts;
}
