'use client';

import type { SimState } from '@/lib/sim-types';
import { fmt } from '@/lib/sim-types';
import type { FlightSim } from '@/hooks/useFlightSim';

interface Props {
  snap: SimState;
  actions: FlightSim['actions'];
}

export function EngineMonitor({ snap, actions }: Props) {
  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">ENGINE MONITOR</span>
        <span className="panel-kicker">GE NX-1B · SIM</span>
      </div>
      <div className="engine-grid">
        {snap.eng.map((e, i) => (
          <div className="engine" key={i}>
            <div className="eng-title">
              <span>ENG {i + 1}</span><i>{e.on ? 'RUN' : 'OFF'}</i>
            </div>
            <div className="gauge">
              <span
                className="needle"
                style={{ transform: `rotate(${-47 + e.n1 * 1.18}deg)` }}
              />
              <span className="gauge-value">{fmt(e.n1)}%</span>
              <span className="gauge-unit">N1</span>
            </div>
            <div className="eng-readout">
              <span>EGT<b>{fmt(e.egt)}°</b></span>
              <span>FF<b>{fmt(e.n1 * 0.083, 1)}</b></span>
            </div>
          </div>
        ))}
      </div>
      <div className="switch-row" style={{ marginTop: 11 }}>
        {snap.eng.map((e, i) => (
          <button
            key={i} className={'toggle' + (e.on ? ' on' : '')} type="button"
            id={i === 0 ? 'eng1Btn' : 'eng2Btn'}
            onClick={() => actions.toggleEngine(i as 0 | 1)}
          >{i + 1} · ENGINE {i + 1} {e.on ? 'ON' : 'OFF'}</button>
        ))}
      </div>
    </div>
  );
}
