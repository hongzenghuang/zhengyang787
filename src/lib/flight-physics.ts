import type { EngineState, FlightState } from './types';

const GRAVITY = 9.81;
const SEA_LEVEL_DENSITY = 1.225;
const WING_AREA = 325;
const MASS = 254_000;
const MAX_THRUST = 620_000;
const KNOTS_TO_METERS_PER_SECOND = 0.514444;
const METERS_TO_FEET = 3.28084;
const MAX_ALTITUDE = 45_000;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const approach = (value: number, target: number, amount: number) =>
  value < target ? Math.min(value + amount, target) : Math.max(value - amount, target);

export function updateFlightPhysics(state: FlightState, deltaTime: number): FlightState {
  const dt = clamp(deltaTime / 1000, 0, 0.05);
  const altitudeMeters = state.altitude * 0.3048;
  const density = SEA_LEVEL_DENSITY * Math.exp(-altitudeMeters / 8500);
  const speedMs = state.airspeed * KNOTS_TO_METERS_PER_SECOND;
  const flapLift = (state.flaps / 30) * 0.42;
  const liftCoefficient = clamp(0.50 + flapLift + state.pitch * 0.018, 0.15, 1.55);
  const dragCoefficient = 0.024 + state.flaps * 0.00075 + Math.abs(state.roll) * 0.00035;
  const dynamicPressure = 0.5 * density * speedMs * speedMs;
  const lift = dynamicPressure * WING_AREA * liftCoefficient;
  const drag = dynamicPressure * WING_AREA * dragCoefficient;
  const runningEngines = Number(state.engine1.running) + Number(state.engine2.running);
  const engineFactor = runningEngines / 2;
  const thrustSign = state.reverse ? -0.42 : 1;
  const thrust = (state.throttle / 100) * MAX_THRUST * engineFactor * thrustSign;
  const pitchRadians = (state.pitch * Math.PI) / 180;
  const verticalForce = lift * Math.cos((state.roll * Math.PI) / 180) - MASS * GRAVITY + thrust * Math.sin(pitchRadians);
  const ground = state.altitude <= 0 && state.verticalSpeed <= 0;
  const rollingResistance = ground ? MASS * GRAVITY * 0.018 : 0;
  const horizontalAcceleration = (thrust * Math.cos(pitchRadians) - drag - rollingResistance) / MASS;
  const verticalAcceleration = verticalForce / MASS;

  let airspeed = clamp(state.airspeed + (horizontalAcceleration / KNOTS_TO_METERS_PER_SECOND) * dt, 0, 390);
  let verticalSpeed = state.verticalSpeed;
  let altitude = state.altitude;

  if (ground && verticalForce <= 0) {
    altitude = 0;
    verticalSpeed = 0;
  } else {
    verticalSpeed = clamp(verticalSpeed + verticalAcceleration * dt * METERS_TO_FEET * 60, -3500, 3500);
    altitude = clamp(altitude + (verticalSpeed / 60) * dt, 0, MAX_ALTITUDE);
    if (altitude === 0 && verticalSpeed < 0) verticalSpeed = 0;
  }

  const headingRate = state.roll * 0.18;
  const heading = (state.heading + headingRate * dt + 360) % 360;
  const pitch = approach(state.pitch, state.autopilot.active ? state.pitch : 0, 1.4 * dt);
  const roll = approach(state.roll, state.autopilot.active ? state.roll : 0, 2.5 * dt);
  const engine1 = updateEngine(state.engine1, state.throttle, dt);
  const engine2 = updateEngine(state.engine2, state.throttle, dt);
  const fuelUse = runningEngines * (0.000035 + state.throttle * 0.0000012) * dt;

  return {
    ...state,
    airspeed,
    altitude,
    verticalSpeed,
    heading,
    pitch,
    roll,
    engine1,
    engine2,
    fuel: Math.max(0, state.fuel - fuelUse),
    simTime: state.simTime + dt,
    reverse: state.reverse && (altitude >= 40 || !state.gearDown || state.autopilot.active || runningEngines !== 2)
      ? false
      : state.reverse,
  };
}

function updateEngine(engine: EngineState, throttle: number, dt: number): EngineState {
  const targetN1 = engine.running ? 24 + throttle * 0.74 : 0;
  const n1 = approach(engine.n1, targetN1, (engine.running ? 25 : 34) * dt);
  const targetEgt = engine.running ? 210 + throttle * 4.2 : 20;
  const egt = approach(engine.egt, targetEgt, (engine.running ? 130 : 90) * dt);
  const targetFuelFlow = engine.running ? 350 + throttle * 55 : 0;
  const fuelFlow = approach(engine.fuelFlow, targetFuelFlow, 900 * dt);
  return { ...engine, n1, egt, fuelFlow };
}
