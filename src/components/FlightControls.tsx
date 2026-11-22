'use client';

import type { SimState } from '@/lib/sim-types';
import { FLAP_STOPS, fmt } from '@/lib/sim-types';
import type { FlightSim } from '@/hooks/useFlightSim';

interface Props {
  snap: SimState;
  actions: FlightSim['actions'];
}

export function FlightControls({ snap, actions }: Props) {
  const bothOn = snap.eng[0].on && snap.eng[1].on;
  const reverseDisabled = !snap.reverse && !(snap.alt < 40 && snap.gear && bothOn && !snap.ap);

  return (
    <div className="panel control-panel">
      <div className="panel-head">
        <span className="panel-title">FLIGHT CONTROLS</span>
        <span className="panel-kicker">KEYBOARD / TOUCH</span>
      </div>

      <div className="control-row">
        <span className="control-label">THRUST</span>
        <div className="slider-shell">
          <input
            id="throttle" type="range" min={0} max={100} value={Math.round(snap.throttle)}
            aria-label="油门"
            onChange={(e) => actions.setThrottle(Number(e.target.value))}
          />
          <span className="control-value" id="throttleValue">{fmt(snap.throttle)}%</span>
        </div>
      </div>

      <div className="control-row">
        <span className="control-label">FLAPS</span>
        <div className="segmented" id="flaps">
          {FLAP_STOPS.map((f) => (
            <button
              key={f} type="button" data-flap={f}
              className={snap.flap === f ? 'active' : ''}
              onClick={() => actions.setFlap(f)}
            >{f}</button>
          ))}
        </div>
      </div>

      <div className="control-row">
        <span className="control-label">GEAR / REV</span>
        <button
          className={'toggle' + (snap.gear ? ' on' : '')} id="gearBtn" type="button"
          onClick={actions.toggleGear}
        >{snap.gear ? '▾ GEAR DOWN' : '▴ GEAR UP'}</button>
        <button
          className={'toggle' + (snap.reverse ? ' on' : '')} id="reverseBtn" type="button"
          aria-pressed={snap.reverse} disabled={reverseDisabled}
          title="地面反推减速；按 R 切换"
          onClick={actions.toggleReverse}
        >{snap.reverse ? 'REVERSERS ACTIVE' : 'REVERSERS OFF'}</button>
        <button
          className={'toggle' + (snap.ap ? ' on' : '')} id="apBtn" type="button"
          onClick={actions.toggleAP}
        >{snap.ap ? 'AP ON' : 'AP OFF'}</button>
      </div>
    </div>
  );
}
