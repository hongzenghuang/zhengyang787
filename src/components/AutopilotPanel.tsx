import type { AutopilotState, AutopilotTarget } from '@/lib/types';

interface AutopilotPanelProps {
  autopilot: AutopilotState;
  ready: boolean;
  onToggle: () => void;
  onAdjust: (target: AutopilotTarget, delta: number) => void;
}

function TargetControl({ label, value, unit, target, step, disabled, onAdjust }: {
  label: string; value: string; unit: string; target: AutopilotTarget; step: number; disabled: boolean;
  onAdjust: (target: AutopilotTarget, delta: number) => void;
}) {
  return (
    <div className={`target-control ${disabled ? 'target-disabled' : ''}`}>
      <span className="target-label">{label}</span>
      <div className="target-value"><strong>{value}</strong><small>{unit}</small></div>
      <div className="target-stepper">
        <button onClick={() => onAdjust(target, -step)} disabled={disabled} aria-label={`Decrease ${label}`}>−</button>
        <button onClick={() => onAdjust(target, step)} disabled={disabled} aria-label={`Increase ${label}`}>+</button>
      </div>
    </div>
  );
}

export function AutopilotPanel({ autopilot, ready, onToggle, onAdjust }: AutopilotPanelProps) {
  const disabled = !autopilot.active;
  return (
    <section className="panel autopilot-panel">
      <div className="panel-heading"><h2>AUTOPILOT</h2><span className={autopilot.active ? 'state-running' : 'state-off'}>{autopilot.active ? 'CMD · ACTIVE' : 'DISENGAGED'}</span></div>
      <button className={`button ap-toggle ${autopilot.active ? 'button-active' : ''}`} onClick={onToggle} disabled={!autopilot.active && !ready} aria-pressed={autopilot.active}>
        {autopilot.active ? 'DISENGAGE A/P' : 'ENGAGE A/P'}
      </button>
      {!autopilot.active && !ready && <p className="control-hint">Start both engines and reach 100 kt to engage.</p>}
      <div className="target-grid" aria-label="Autopilot targets">
        <TargetControl label="HEADING" value={Math.round(autopilot.targetHeading).toString().padStart(3, '0')} unit="DEG" target="targetHeading" step={1} disabled={disabled} onAdjust={onAdjust} />
        <TargetControl label="AIRSPEED" value={String(Math.round(autopilot.targetAirspeed))} unit="KTS" target="targetAirspeed" step={1} disabled={disabled} onAdjust={onAdjust} />
        <TargetControl label="ALTITUDE" value={Math.round(autopilot.targetAltitude).toLocaleString()} unit="FT" target="targetAltitude" step={100} disabled={disabled} onAdjust={onAdjust} />
      </div>
      <div className="mode-strip"><span>{autopilot.active ? 'SPD HOLD' : 'SPD ARM'}</span><span>{autopilot.active ? 'HDG HOLD' : 'HDG ARM'}</span><span>{autopilot.active ? 'ALT HOLD' : 'ALT ARM'}</span></div>
    </section>
  );
}
