import type { CSSProperties } from 'react';
import type { EngineState } from '@/lib/types';

interface EnginePanelProps {
  engine1: EngineState;
  engine2: EngineState;
  onToggleEngine: (engine: 1 | 2) => void;
  fuel: number;
}

function EngineGauge({ engine, number, onToggle }: { engine: EngineState; number: 1 | 2; onToggle: () => void }) {
  return (
    <div className="engine-card">
      <div className="engine-card-head"><span>ENG {number}</span><span className={engine.running ? 'state-running' : 'state-off'}>{engine.running ? 'RUN' : 'OFF'}</span></div>
      <div className="n1-gauge" style={{ '--n1': `${engine.n1}%` } as CSSProperties}><strong>{Math.round(engine.n1)}</strong><small>N1 %</small></div>
      <div className="engine-readout"><span>EGT <b>{Math.round(engine.egt)}°C</b></span><span>F/F <b>{Math.round(engine.fuelFlow).toLocaleString()} KG/H</b></span></div>
      <button className={`button engine-button ${engine.running ? 'button-active' : ''}`} onClick={onToggle} aria-pressed={engine.running}>{engine.running ? 'STOP ENGINE' : 'START ENGINE'}</button>
    </div>
  );
}

export function EnginePanel({ engine1, engine2, onToggleEngine, fuel }: EnginePanelProps) {
  return (
    <section className="panel engine-panel">
      <div className="panel-heading"><h2>ENGINE</h2><span>DUAL TURBOFAN</span></div>
      <div className="engine-grid">
        <EngineGauge engine={engine1} number={1} onToggle={() => onToggleEngine(1)} />
        <EngineGauge engine={engine2} number={2} onToggle={() => onToggleEngine(2)} />
      </div>
      <div className="fuel-row"><span>FUEL REMAINING</span><strong>{fuel.toFixed(1)} T</strong></div>
    </section>
  );
}
