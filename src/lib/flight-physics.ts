import { FlightState } from './types';

// 飞动物理常量
const GRAVITY = 9.81; // m/s²
const AIR_DENSITY = 1.225; // kg/m³ (海平面)
const WING_AREA = 325; // m² (787-10 翼面积)
const MASS = 254000; // kg (787-10 最大起飞重量)
const MAX_THRUST = 320000; // N (双引擎总推力)

// 气动系数
const CL_BASE = 0.5; // 基础升力系数
const CD_BASE = 0.02; // 基础阻力系数
const FLAP_CL_BONUS = 0.15; // 襟翼每 10° 增加的升力系数

// 转换系数
const KNOTS_TO_MS = 0.514444; // 节转米/秒
const FT_TO_M = 0.3048; // 英尺转米
const DEG_TO_RAD = Math.PI / 180;

export function updateFlightPhysics(state: FlightState, deltaTime: number): FlightState {
  const dt = deltaTime / 1000; // 转为秒
  
  // 计算空气密度 (随高度变化)
  const altitudeM = state.altitude * FT_TO_M;
  const airDensity = AIR_DENSITY * Math.exp(-altitudeM / 8500);
  
  // 计算空速 (米/秒)
  const airspeedMS = state.airspeed * KNOTS_TO_MS;
  
  // 计算升力系数 (考虑襟翼)
  const flapBonus = (state.flaps / 10) * FLAP_CL_BONUS;
  const cl = CL_BASE + flapBonus + (state.pitch * 0.01);
  
  // 计算升力
  const lift = 0.5 * airDensity * airspeedMS * airspeedMS * WING_AREA * cl;
  
  // 计算阻力
  const cd = CD_BASE + (state.flaps * 0.005) + (Math.abs(state.roll) * 0.001);
  const drag = 0.5 * airDensity * airspeedMS * airspeedMS * WING_AREA * cd;
  
  // 计算推力
  const engineFactor = (state.engine1.running ? 0.5 : 0) + (state.engine2.running ? 0.5 : 0);
  const thrust = (state.throttle / 100) * MAX_THRUST * engineFactor;
  
  // 计算重力
  const weight = MASS * GRAVITY;
  
  // 计算合力 (简化模型)
  const pitchRad = state.pitch * DEG_TO_RAD;
  const netForceVertical = lift * Math.cos(state.roll * DEG_TO_RAD) - weight + thrust * Math.sin(pitchRad);
  const netForceHorizontal = thrust * Math.cos(pitchRad) - drag;
  
  // 计算加速度
  const accelVertical = netForceVertical / MASS;
  const accelHorizontal = netForceHorizontal / MASS;
  
  // 更新垂直速度 (英尺/分钟)
  const verticalSpeedMS = accelVertical * dt;
  const newVerticalSpeed = state.verticalSpeed + (verticalSpeedMS / FT_TO_M) * 60;
  
  // 更新空速
  const speedChange = (accelHorizontal / KNOTS_TO_MS) * dt;
  let newAirspeed = Math.max(0, state.airspeed + speedChange);
  
  // 更新高度
  const altitudeChange = (newVerticalSpeed / 60) * dt;
  let newAltitude = Math.max(0, state.altitude + altitudeChange);
  
  // 更新姿态 (基于控制输入的自然衰减 - 减慢衰减速度)
  let newPitch = state.pitch * 0.995; // 更慢的自然回中
  let newRoll = state.roll * 0.99; // 更慢的自然回中
  let newHeading = state.heading;
  
  // 滚转影响航向
  if (Math.abs(state.roll) > 5) {
    newHeading = (state.heading + state.roll * 0.1 * dt) % 360;
    if (newHeading < 0) newHeading += 360;
  }
  
  // 更新引擎参数
  const throttleFactor = state.throttle / 100;
  const newEngine1 = updateEngine(state.engine1, throttleFactor, state.engine1.running);
  const newEngine2 = updateEngine(state.engine2, throttleFactor, state.engine2.running);
  
  return {
    ...state,
    altitude: newAltitude,
    pitch: newPitch,
    roll: newRoll,
    heading: newHeading,
    airspeed: newAirspeed,
    verticalSpeed: newVerticalSpeed,
    engine1: newEngine1,
    engine2: newEngine2,
  };
}

function updateEngine(engine: { running: boolean; n1: number; egt: number; fuelFlow: number }, throttle: number, running: boolean) {
  if (!running) {
    return {
      ...engine,
      n1: Math.max(0, engine.n1 - 2),
      egt: Math.max(20, engine.egt - 5),
      fuelFlow: 0,
    };
  }
  
  const targetN1 = 20 + throttle * 0.8; // 怠速 20%，满油门 100%
  const n1Change = (targetN1 - engine.n1) * 0.1;
  const newN1 = Math.max(0, Math.min(100, engine.n1 + n1Change));
  
  const targetEgt = 200 + throttle * 5; // 200-700°C
  const egtChange = (targetEgt - engine.egt) * 0.05;
  const newEgt = Math.max(20, Math.min(900, engine.egt + egtChange));
  
  const targetFuelFlow = throttle * 60; // 0-6000 kg/h
  const fuelFlowChange = (targetFuelFlow - engine.fuelFlow) * 0.1;
  const newFuelFlow = Math.max(0, engine.fuelFlow + fuelFlowChange);
  
  return {
    ...engine,
    n1: newN1,
    egt: newEgt,
    fuelFlow: newFuelFlow,
  };
}
