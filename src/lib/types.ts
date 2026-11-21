// 飞行状态类型定义

export interface EngineState {
  running: boolean;
  n1: number;              // N1 转速 (%)
  egt: number;             // 排气温度 (°C)
  fuelFlow: number;        // 燃油流量 (kg/h)
}

export interface AutopilotState {
  active: boolean;
  targetAirspeed: number;
  targetAltitude: number;
  targetHeading: number;
}

export interface Alert {
  type: 'STALL' | 'OVERSPEED' | 'ALTITUDE' | 'ENGINE' | 'GPWS';
  severity: 'WARNING' | 'CAUTION' | 'ADVISORY';
  message: string;
  active: boolean;
  timestamp: number;
}

export interface FlightState {
  // 位置
  altitude: number;        // 高度 (英尺)
  
  // 姿态
  pitch: number;           // 俯仰角 (度)
  roll: number;            // 滚转角 (度)
  heading: number;         // 航向 (度, 0-360)
  
  // 速度
  airspeed: number;        // 空速 (节)
  verticalSpeed: number;   // 垂直速度 (英尺/分钟)
  
  // 控制面
  throttle: number;        // 油门 (0-100%)
  flaps: number;           // 襟翼角度 (0-30°)
  
  // 引擎
  engine1: EngineState;
  engine2: EngineState;
  
  // 系统
  autopilot: AutopilotState;
  alerts: Alert[];
  
  // 起落架
  gearDown: boolean;
}

export type FlightAction =
  | { type: 'TOGGLE_ENGINE'; engine: 1 | 2 }
  | { type: 'TOGGLE_AUTOPILOT' }
  | { type: 'FLAPS_UP' }
  | { type: 'FLAPS_DOWN' }
  | { type: 'PITCH_UP' }
  | { type: 'PITCH_DOWN' }
  | { type: 'ROLL_LEFT' }
  | { type: 'ROLL_RIGHT' }
  | { type: 'THROTTLE_UP' }
  | { type: 'THROTTLE_DOWN' }
  | { type: 'UPDATE_PHYSICS'; deltaTime: number };
