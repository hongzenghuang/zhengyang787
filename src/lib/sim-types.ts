// 模拟器类型定义与常量（经验公式模型）

export interface EngineState {
  on: boolean;
  n1: number;   // %
  egt: number;  // °C
}

export interface ApTarget {
  ias: number;  // kt
  alt: number;  // ft
  hdg: number;  // deg 0-359
}

export type FlightPhase = 'ground' | 'takeoff' | 'climb' | 'cruise' | 'descent' | 'landing';

export interface SimState {
  running: boolean;      // 是否推进（暂停=false）
  t: number;             // 模拟时长（秒）
  ias: number;           // 空速 kt
  alt: number;           // 高度 ft
  vsi: number;           // 垂直速度 fpm
  hdg: number;           // 航向 deg 0-359
  pitch: number;         // 俯仰角 deg（-12 ~ +15）
  bank: number;          // 坡度 deg（-35 ~ 35）
  throttle: number;      // 油门 0-100 %
  flap: number;          // 襟翼 0/5/10/15/20/25/30
  gear: boolean;         // 起落架放下=true
  ap: boolean;           // 自动驾驶
  reverse: boolean;      // 反推
  apTarget: ApTarget;    // AP 捕获目标
  eng: [EngineState, EngineState];
  fuel: number;          // 燃油吨
  lastAlert: string;     // 上次警报 key（音效去重）
  /** 选定航线（教程后选择；null=自由飞行） */
  routeId: string | null;
  /** 降落模式（巡航时可切换；开启后 AP 目标自动转为进近剖面） */
  landingMode: boolean;
  /** 降落过程：进入进近后曾在空中（接地检测用） */
  inAir: boolean;
  /** 起落架接地时刻（s.t；0=尚未接地） */
  touchdownAt: number;
  /** 已成功停稳（接地后减速至停住） */
  stopped: boolean;
}

export interface AlertItem {
  text: string;
  danger: boolean;
}

// ── 常量 ────────────────────────────────────────────────
export const FLAP_STOPS = [0, 5, 10, 15, 20, 25, 30] as const;

export const LIMITS = {
  iasMax: 390,        // kt
  altMax: 45000,      // ft
  pitchMin: -12,
  pitchMax: 15,
  bankMin: -35,
  bankMax: 35,
  dtMax: 0.05,        // 单帧最大步长（防切后台跳变）
} as const;

export const AP_LIMITS = {
  iasMin: 150, iasMax: 330, iasStep: 5,
  altMin: 1000, altMax: 45000, altStep: 500,
  hdgStep: 5,
} as const;

export const INITIAL_STATE: SimState = {
  running: true,
  t: 0,
  ias: 0,
  alt: 0,
  vsi: 0,
  hdg: 360,
  pitch: 0,
  bank: 0,
  throttle: 0,
  flap: 0,
  gear: true,
  ap: false,
  reverse: false,
  apTarget: { ias: 0, alt: 0, hdg: 360 },
  eng: [
    { on: false, n1: 0, egt: 20 },
    { on: false, n1: 0, egt: 20 },
  ],
  fuel: 94.8,
  lastAlert: '',
  routeId: null,
  landingMode: false,
  inAir: false,
  touchdownAt: 0,
  stopped: false,
};

// ── 工具 ────────────────────────────────────────────────
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 帧率无关的一阶惯性系数 */
export const inertial = (dt: number, k: number) => 1 - Math.exp(-dt * k);
export const fmt = (n: number, d = 0) => Number(n).toFixed(d);
/** 航向三位数（0-359，循环） */
export const pad3 = (n: number) => String(Math.round(((n % 360) + 360) % 360)).padStart(3, '0');
export const stallLimit = (flap: number) => 125 + flap * 0.6;
/** 航向误差归一化到 ±180 */
export const hdgError = (target: number, current: number) =>
  ((target - current + 540) % 360) - 180;
