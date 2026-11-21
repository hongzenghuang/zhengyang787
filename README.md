# 787-10 Flight Deck Simulator

A browser-based Boeing 787-10 flight-deck simulation built with Next.js and React.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5001`.

## Project structure

- `src/components/FlightDeckSimulator.tsx` composes the cockpit interface.
- `src/components/` contains the flight scene, PFD, engine panel, autopilot panel, and controls.
- `src/hooks/useFlightSimulation.ts` owns simulation state and the fixed-rate update loop.
- `src/lib/flight-physics.ts` updates flight dynamics and engine readings.
- `src/lib/autopilot.ts` handles target capture, control commands, and alerts.
- `src/lib/keyboard-handler.ts` maps keyboard shortcuts to simulation actions.
- `public/outside-scene.svg` supplies the exterior scenery.

## Controls

Buttons and sliders are available in the cockpit. Keyboard shortcuts are `1` / `2` engines, `W` / `S` throttle, arrow keys pitch and bank, `[` / `]` flaps, `G` landing gear, `P` autopilot, `R` reverse thrust, and `Space` pause.

Autopilot target controls become active when the autopilot is engaged. Reverse thrust is simulated and only available on the ground with both engines running, gear down, and autopilot off.

This is an educational simulation with simplified flight dynamics, not a certified aircraft training system.
