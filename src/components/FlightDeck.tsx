'use client';

import { useState } from 'react';
import { useFlightSim } from '@/hooks/useFlightSim';
import { useKeyboardControls, useAudioUnlock } from '@/hooks/useKeyboardControls';
import { TopBar } from './TopBar';
import { Viewport } from './Viewport';
import { AlertStrip } from './AlertStrip';
import { FlightControls } from './FlightControls';
import { EngineMonitor } from './EngineMonitor';
import { AircraftState, QuickGuide, NavSystems, FMA, AutopilotMCP } from './SidePanels';
import { LcdStatusLine } from './LcdStatusLine';
import { LandingBanner } from './LandingBanner';

/**
 * 787-10 驾驶舱：组装所有子面板。
 * 状态中枢在 useFlightSim；视景与 PFD 通过 simRef 走 60fps rAF，文本面板走 20fps 快照。
 */
export function FlightDeck() {
  const sim = useFlightSim();
  const [day, setDay] = useState(false);

  useKeyboardControls(sim.actions);
  useAudioUnlock();

  return (
    <div className={'app' + (day ? ' day' : '')}>
      <TopBar
        day={day}
        running={sim.running}
        onToggleTheme={() => setDay((d) => !d)}
        onTogglePause={sim.actions.togglePause}
        onReset={sim.actions.reset}
      />

      <main className="main">
        <section className="left">
          <div className="heading">
            <div>
              <div className="eyebrow">Flight deck / visual simulation</div>
              <h1>Take the controls</h1>
            </div>
            <div className="heading-note">SCENARIO 01 · DAYLIGHT DEPARTURE</div>
          </div>

          <Viewport simRef={sim.simRef} snap={sim.snap} />
          <AlertStrip
            alerts={sim.alerts}
            normalMsg={sim.normalMsg}
            flash={sim.flash}
            onAutoRecover={sim.actions.autoRecover}
          />
          <LcdStatusLine snap={sim.snap} />
          <LandingBanner snap={sim.snap} />

          <div className="bottom">
            <FlightControls snap={sim.snap} actions={sim.actions} />
            <AircraftState snap={sim.snap} />
            <QuickGuide />
          </div>
        </section>

        <aside className="side">
          <EngineMonitor snap={sim.snap} actions={sim.actions} />
          <NavSystems
            snap={sim.snap}
            landingMode={sim.snap.landingMode}
            onToggleLanding={sim.actions.toggleLandingMode}
          />
          <FMA snap={sim.snap} />
          <AutopilotMCP snap={sim.snap} actions={sim.actions} />
        </aside>
      </main>
    </div>
  );
}
