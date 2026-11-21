export interface EngineState {
  running: boolean;
  n1: number;
  egt: number;
  fuelFlow: number;
}

export type AutopilotTarget = 'targetAirspeed' | 'targetAltitude' | 'targetHeading';

export interface AutopilotState {
  active: boolean;
  targetAirspeed: number;
  targetAltitude: number;
  targetHeading: number;
}

export interface Alert {
  type: 'STALL' | 'OVERSPEED' | 'ALTITUDE' | 'ENGINE' | 'GPWS' | 'SYSTEM';
  severity: 'WARNING' | 'CAUTION' | 'ADVISORY';
  message: string;
}

export interface FlightState {
  altitude: number;
  pitch: number;
  roll: number;
  heading: number;
  airspeed: number;
  verticalSpeed: number;
  throttle: number;
  flaps: number;
  engine1: EngineState;
  engine2: EngineState;
  autopilot: AutopilotState;
  alerts: Alert[];
  gearDown: boolean;
  reverse: boolean;
  paused: boolean;
  simTime: number;
  fuel: number;
}

export type FlightAction =
  | { type: 'TOGGLE_ENGINE'; engine: 1 | 2 }
  | { type: 'TOGGLE_AUTOPILOT' }
  | { type: 'ADJUST_TARGET'; target: AutopilotTarget; delta: number }
  | { type: 'SET_THROTTLE'; value: number }
  | { type: 'ADJUST_THROTTLE'; delta: number }
  | { type: 'SET_FLAPS'; value: number }
  | { type: 'ADJUST_FLAPS'; delta: number }
  | { type: 'ADJUST_PITCH'; delta: number }
  | { type: 'ADJUST_ROLL'; delta: number }
  | { type: 'TOGGLE_GEAR' }
  | { type: 'TOGGLE_REVERSE' }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'RESET' }
  | { type: 'UPDATE_PHYSICS'; deltaTime: number };
