import { useReducer, useEffect, useRef } from 'react';
import { FlightState, FlightAction } from '@/lib/types';
import { updateFlightPhysics } from '@/lib/flight-physics';
import { updateAutopilot, checkAlerts } from '@/lib/autopilot';

const initialState: FlightState = {
  altitude: 0,           // 地面
  pitch: 0,
  roll: 0,
  heading: 270,          // 朝西
  airspeed: 0,           // 静止
  verticalSpeed: 0,
  throttle: 0,           // 油门关闭
  flaps: 0,              // 襟翼收起
  engine1: {
    running: false,      // 引擎关闭
    n1: 0,
    egt: 20,             // 环境温度
    fuelFlow: 0,
  },
  engine2: {
    running: false,      // 引擎关闭
    n1: 0,
    egt: 20,
    fuelFlow: 0,
  },
  autopilot: {
    active: false,       // 自动驾驶关闭
    targetAirspeed: 0,
    targetAltitude: 0,
    targetHeading: 270,
  },
  alerts: [],
  gearDown: true,        // 起落架放下（地面状态）
};

function flightReducer(state: FlightState, action: FlightAction): FlightState {
  switch (action.type) {
    case 'TOGGLE_ENGINE':
      if (action.engine === 1) {
        return {
          ...state,
          engine1: { ...state.engine1, running: !state.engine1.running },
        };
      } else {
        return {
          ...state,
          engine2: { ...state.engine2, running: !state.engine2.running },
        };
      }
    
    case 'TOGGLE_AUTOPILOT':
      const newActive = !state.autopilot.active;
      return {
        ...state,
        autopilot: {
          ...state.autopilot,
          active: newActive,
          targetAirspeed: newActive ? state.airspeed : state.autopilot.targetAirspeed,
          targetAltitude: newActive ? state.altitude : state.autopilot.targetAltitude,
          targetHeading: newActive ? state.heading : state.autopilot.targetHeading,
        },
      };
    
    case 'FLAPS_UP':
      return {
        ...state,
        flaps: Math.max(0, state.flaps - 5),
      };
    
    case 'FLAPS_DOWN':
      return {
        ...state,
        flaps: Math.min(30, state.flaps + 5),
      };
    
    case 'PITCH_UP':
      return {
        ...state,
        pitch: Math.min(30, state.pitch + 2),
      };
    
    case 'PITCH_DOWN':
      return {
        ...state,
        pitch: Math.max(-30, state.pitch - 2),
      };
    
    case 'ROLL_LEFT':
      return {
        ...state,
        roll: Math.max(-45, state.roll - 5),
      };
    
    case 'ROLL_RIGHT':
      return {
        ...state,
        roll: Math.min(45, state.roll + 5),
      };
    
    case 'THROTTLE_UP':
      return {
        ...state,
        throttle: Math.min(100, state.throttle + 5),
      };
    
    case 'THROTTLE_DOWN':
      return {
        ...state,
        throttle: Math.max(0, state.throttle - 5),
      };
    
    case 'UPDATE_PHYSICS':
      // 更新飞动物理
      let newState = updateFlightPhysics(state, action.deltaTime);
      
      // 更新自动驾驶
      const autopilotUpdates = updateAutopilot(newState, action.deltaTime);
      newState = { ...newState, ...autopilotUpdates };
      
      // 检查警报
      const alerts = checkAlerts(newState);
      newState = { ...newState, alerts };
      
      return newState;
    
    default:
      return state;
  }
}

export function useFlightSimulation() {
  const [state, dispatch] = useReducer(flightReducer, initialState);
  const lastTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number>(0);
  
  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const deltaTime = now - lastTimeRef.current;
      lastTimeRef.current = now;
      
      dispatch({ type: 'UPDATE_PHYSICS', deltaTime });
      
      animationFrameRef.current = requestAnimationFrame(update);
    };
    
    animationFrameRef.current = requestAnimationFrame(update);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  return { state, dispatch };
}
