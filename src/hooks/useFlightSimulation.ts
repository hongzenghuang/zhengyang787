import { useEffect, useReducer, useRef } from 'react';
import { applyAutopilot, checkAlerts } from '@/lib/autopilot';
import { updateFlightPhysics } from '@/lib/flight-physics';
import type { AutopilotTarget, FlightAction, FlightState } from '@/lib/types';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function createInitialFlightState(): FlightState {
  return {
    altitude: 0,
    pitch: 0,
    roll: 0,
    heading: 270,
    airspeed: 0,
    verticalSpeed: 0,
    throttle: 0,
    flaps: 0,
    engine1: { running: false, n1: 0, egt: 20, fuelFlow: 0 },
    engine2: { running: false, n1: 0, egt: 20, fuelFlow: 0 },
    autopilot: { active: false, targetAirspeed: 180, targetAltitude: 3000, targetHeading: 270 },
    alerts: [{ type: 'SYSTEM', severity: 'ADVISORY', message: 'SYSTEMS NOMINAL · READY FOR TAKEOFF' }],
    gearDown: true,
    reverse: false,
    paused: false,
    simTime: 0,
    fuel: 101,
  };
}

function updateTarget(state: FlightState, target: AutopilotTarget, delta: number): FlightState {
  const autopilot = { ...state.autopilot };
  if (target === 'targetHeading') {
    autopilot.targetHeading = (autopilot.targetHeading + delta + 360) % 360;
  } else if (target === 'targetAirspeed') {
    autopilot.targetAirspeed = clamp(autopilot.targetAirspeed + delta, 130, 330);
  } else {
    autopilot.targetAltitude = clamp(autopilot.targetAltitude + delta, 1000, 43_000);
  }
  return { ...state, autopilot };
}

function reducer(state: FlightState, action: FlightAction): FlightState {
  switch (action.type) {
    case 'TOGGLE_ENGINE': {
      const key = action.engine === 1 ? 'engine1' : 'engine2';
      return { ...state, [key]: { ...state[key], running: !state[key].running } };
    }
    case 'TOGGLE_AUTOPILOT': {
      if (!state.autopilot.active && (state.airspeed < 100 || !state.engine1.running || !state.engine2.running)) return state;
      const active = !state.autopilot.active;
      return {
        ...state,
        autopilot: {
          active,
          targetAirspeed: active ? clamp(Math.round(state.airspeed), 130, 330) : state.autopilot.targetAirspeed,
          targetAltitude: active ? clamp(Math.round(state.altitude / 100) * 100, 1000, 43_000) : state.autopilot.targetAltitude,
          targetHeading: active ? Math.round(state.heading) % 360 : state.autopilot.targetHeading,
        },
        reverse: active ? false : state.reverse,
      };
    }
    case 'ADJUST_TARGET':
      return state.autopilot.active ? updateTarget(state, action.target, action.delta) : state;
    case 'SET_THROTTLE':
      return { ...state, throttle: clamp(action.value, 0, 100) };
    case 'ADJUST_THROTTLE':
      return { ...state, throttle: clamp(state.throttle + action.delta, 0, 100) };
    case 'SET_FLAPS':
      return { ...state, flaps: clamp(Math.round(action.value / 5) * 5, 0, 30) };
    case 'ADJUST_FLAPS':
      return { ...state, flaps: clamp(state.flaps + Math.sign(action.delta) * 5, 0, 30) };
    case 'ADJUST_PITCH':
      return { ...state, pitch: clamp(state.pitch + action.delta, -12, 15) };
    case 'ADJUST_ROLL':
      return { ...state, roll: clamp(state.roll + action.delta, -35, 35) };
    case 'TOGGLE_GEAR':
      return { ...state, gearDown: !state.gearDown, reverse: state.gearDown ? false : state.reverse };
    case 'TOGGLE_REVERSE': {
      const canUseReverse = state.altitude < 40 && state.gearDown && state.engine1.running && state.engine2.running && !state.autopilot.active;
      return canUseReverse || state.reverse ? { ...state, reverse: !state.reverse } : state;
    }
    case 'TOGGLE_PAUSE':
      return { ...state, paused: !state.paused };
    case 'RESET':
      return createInitialFlightState();
    case 'UPDATE_PHYSICS': {
      if (state.paused) return state;
      const controlled = applyAutopilot(state, action.deltaTime);
      const next = updateFlightPhysics(controlled, action.deltaTime);
      return { ...next, alerts: checkAlerts(next) };
    }
    default:
      return state;
  }
}

export function useFlightSimulation() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialFlightState);
  const lastFrame = useRef<number | null>(null);
  const lastStep = useRef<number>(0);

  useEffect(() => {
    let frame = 0;
    const tick = (now: number) => {
      if (lastFrame.current === null) lastFrame.current = now;
      const elapsed = Math.min(now - lastFrame.current, 50);
      lastFrame.current = now;
      if (now - lastStep.current >= 33) {
        lastStep.current = now;
        dispatch({ type: 'UPDATE_PHYSICS', deltaTime: elapsed });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return { state, dispatch };
}
