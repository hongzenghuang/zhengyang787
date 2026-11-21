'use client';

import { useState } from 'react';
import { AutopilotPanel } from '@/components/AutopilotPanel';
import { EnginePanel } from '@/components/EnginePanel';
import { FlightControls } from '@/components/FlightControls';
import { OutsideScene } from '@/components/OutsideScene';
import { PrimaryFlightDisplay } from '@/components/PrimaryFlightDisplay';
import { useFlightSimulation } from '@/hooks/useFlightSimulation';
import { useKeyboardControls } from '@/lib/keyboard-handler';
import type { AutopilotTarget } from '@/lib/types';

const formatClock = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

export function FlightDeckSimulator() {
  const { state, dispatch } = useFlightSimulation();
  const [dayMode, setDayMode] = useState(false);
  useKeyboardControls(dispatch);

  const bothEnginesOn = state.engine1.running && state.engine2.running;
  const canEngageAutopilot = bothEnginesOn && state.airspeed >= 100;
  const canReverse = state.altitude < 40 && state.gearDown && bothEnginesOn && !state.autopilot.active;
  const activeAlert = state.alerts[0];

  const adjustTarget = (target: AutopilotTarget, delta: number) => dispatch({ type: 'ADJUST_TARGET', target, delta });
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.();
    else void document.exitFullscreen?.();
  };

  return (
    <div className={`flight-deck ${dayMode ? 'flight-deck-day' : ''}`}>
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">787</div>
          <div><div className="brand-title">NIGHT DECK</div><div className="brand-subtitle">787-10 FLIGHT SIMULATOR</div></div>
        </div>
        <div className="top-status"><span><i className="live-dot" />SIMULATION</span><span>TIME {formatClock(state.simTime)}</span><span>FL {Math.floor(state.altitude / 100).toString().padStart(3, '0')}</span></div>
        <div className="top-actions">
          <button className="button compact-button" onClick={() => setDayMode((value) => !value)} aria-pressed={dayMode}>{dayMode ? 'NIGHT' : 'DAY'}</button>
          <button className="button compact-button" onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}>{state.paused ? 'RESUME' : 'PAUSE'}</button>
          <button className="button compact-button" onClick={() => dispatch({ type: 'RESET' })}>RESET</button>
          <button className="button compact-button" onClick={toggleFullscreen}>FULLSCREEN</button>
        </div>
      </header>

      <main className="main-grid">
        <section className="flight-area">
          <div className="section-heading"><div><span className="eyebrow">FLIGHT DECK</span><h1>787-10 Operations</h1></div><span className="section-state">{state.altitude < 40 ? 'ON GROUND' : state.autopilot.active ? 'AUTOPILOT' : 'MANUAL FLIGHT'}</span></div>
          <OutsideScene altitude={state.altitude} heading={state.heading} pitch={state.pitch} roll={state.roll} airspeed={state.airspeed} dayMode={dayMode} />
          <PrimaryFlightDisplay airspeed={state.airspeed} altitude={state.altitude} verticalSpeed={state.verticalSpeed} pitch={state.pitch} roll={state.roll} heading={state.heading} />
          <div className={`alert-strip alert-${activeAlert.severity.toLowerCase()}`} role="status"><span className="alert-symbol">{activeAlert.severity === 'WARNING' ? '!' : activeAlert.severity === 'CAUTION' ? '▲' : '●'}</span><span>{activeAlert.message}</span><span className="alert-source">{activeAlert.type}</span></div>
          <FlightControls
            throttle={state.throttle}
            flaps={state.flaps}
            gearDown={state.gearDown}
            reverse={state.reverse}
            canReverse={canReverse}
            onThrottle={(value) => dispatch({ type: 'SET_THROTTLE', value })}
            onFlaps={(value) => dispatch({ type: 'SET_FLAPS', value })}
            onToggleGear={() => dispatch({ type: 'TOGGLE_GEAR' })}
            onToggleReverse={() => dispatch({ type: 'TOGGLE_REVERSE' })}
          />
        </section>

        <aside className="side-column">
          <EnginePanel engine1={state.engine1} engine2={state.engine2} fuel={state.fuel} onToggleEngine={(engine) => dispatch({ type: 'TOGGLE_ENGINE', engine })} />
          <AutopilotPanel autopilot={state.autopilot} ready={canEngageAutopilot} onToggle={() => dispatch({ type: 'TOGGLE_AUTOPILOT' })} onAdjust={adjustTarget} />
          <section className="panel quick-reference">
            <div className="panel-heading"><h2>KEYBOARD</h2><span>SHORTCUTS</span></div>
            <div className="shortcut-grid"><span><kbd>1</kbd><kbd>2</kbd> Engines</span><span><kbd>W</kbd><kbd>S</kbd> Throttle</span><span><kbd>↑</kbd><kbd>↓</kbd> Pitch</span><span><kbd>←</kbd><kbd>→</kbd> Bank</span><span><kbd>[</kbd><kbd>]</kbd> Flaps</span><span><kbd>G</kbd> Gear</span><span><kbd>P</kbd> A/P</span><span><kbd>R</kbd> Reverse</span><span><kbd>Space</kbd> Pause</span></div>
          </section>
        </aside>
      </main>
      <footer className="page-footer">SIMULATION ONLY · SIMPLIFIED FLIGHT DYNAMICS · NOT FOR REAL-WORLD FLIGHT</footer>
    </div>
  );
}
