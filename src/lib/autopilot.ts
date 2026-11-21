import type { Alert, FlightState } from './types';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const shortestHeadingError = (target: number, current: number) => ((target - current + 540) % 360) - 180;

export function applyAutopilot(state: FlightState, deltaTime: number): FlightState {
  if (!state.autopilot.active) return state;
  const dt = Math.min(deltaTime / 1000, 0.05);
  const speedError = state.autopilot.targetAirspeed - state.airspeed;
  const targetThrottle = clamp(state.throttle + speedError * 0.045, 0, 100);
  const throttle = state.throttle + clamp(targetThrottle - state.throttle, -14 * dt, 14 * dt);

  const altitudeError = state.autopilot.targetAltitude - state.altitude;
  const commandedPitch = clamp(altitudeError * 0.0012 - state.verticalSpeed * 0.00055, -4, 8);
  const pitch = state.pitch + clamp(commandedPitch - state.pitch, -4 * dt, 4 * dt);

  const headingError = shortestHeadingError(state.autopilot.targetHeading, state.heading);
  const commandedRoll = clamp(headingError * 0.65, -25, 25);
  const roll = state.roll + clamp(commandedRoll - state.roll, -16 * dt, 16 * dt);

  return { ...state, throttle, pitch, roll };
}

export function checkAlerts(state: FlightState): Alert[] {
  const alerts: Alert[] = [];
  const airborne = state.altitude > 80;
  if (airborne && state.airspeed < 125) alerts.push({ type: 'STALL', severity: 'WARNING', message: 'STALL · INCREASE AIRSPEED' });
  if (state.airspeed > 340) alerts.push({ type: 'OVERSPEED', severity: 'WARNING', message: 'OVERSPEED · REDUCE THRUST' });
  if (state.autopilot.active && Math.abs(state.altitude - state.autopilot.targetAltitude) > 250) {
    alerts.push({ type: 'ALTITUDE', severity: 'CAUTION', message: `ALTITUDE DEVIATION ${Math.round(state.altitude - state.autopilot.targetAltitude)} FT` });
  }
  if (airborne && state.altitude < 900 && state.verticalSpeed < -600) {
    alerts.push({ type: 'GPWS', severity: 'WARNING', message: 'SINK RATE · PULL UP' });
  }
  if (state.throttle > 40 && (!state.engine1.running || !state.engine2.running)) {
    alerts.push({ type: 'ENGINE', severity: 'CAUTION', message: 'ENGINE THRUST ASYMMETRY' });
  }
  if (alerts.length === 0) {
    alerts.push({ type: 'SYSTEM', severity: 'ADVISORY', message: state.altitude < 40 ? 'SYSTEMS NOMINAL · READY FOR TAKEOFF' : 'SYSTEMS NOMINAL · MONITOR FLIGHT' });
  }
  return alerts;
}
