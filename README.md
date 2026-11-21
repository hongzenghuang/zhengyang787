# 787-10 Flight Deck Simulator

A browser-based, simplified 787-10 flight-deck simulator. It runs in the Next.js app and as a self-contained static page.

## Run it

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5001`. The standalone version is `public/boeing787-simulator.html`; its scenery asset is `public/outside-scene.svg`.

## Simulator controls

| Key | Action |
| --- | --- |
| `1` / `2` | Start or stop engine 1 / 2 |
| `W` / `S` | Increase or reduce throttle |
| Arrow keys | Pitch and bank |
| `[` / `]` | Retract or extend flaps |
| `P` | Engage or disengage autopilot |
| `R` | Toggle simulated reverse thrust when the ground interlocks allow it |
| `Space` | Pause or resume |

When the autopilot is engaged, its heading, airspeed, and altitude target knobs become active. The simulator also includes a primary flight display, engine readings, alerts, landing gear, exterior scenery, day/night theme, reset, and fullscreen controls.

This is an educational browser simulation. It does not reproduce certified aircraft systems or flight-control behavior.
