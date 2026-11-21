interface FlightControlsProps {
  throttle: number;
  flaps: number;
  gearDown: boolean;
  reverse: boolean;
  canReverse: boolean;
  onThrottle: (value: number) => void;
  onFlaps: (value: number) => void;
  onToggleGear: () => void;
  onToggleReverse: () => void;
}

export function FlightControls(props: FlightControlsProps) {
  return (
    <section className="panel flight-controls">
      <div className="panel-heading"><h2>FLIGHT CONTROLS</h2><span>MANUAL INPUT</span></div>
      <div className="throttle-control">
        <div className="control-title"><label htmlFor="throttle">THROTTLE</label><strong>{Math.round(props.throttle)}%</strong></div>
        <input id="throttle" type="range" min="0" max="100" value={props.throttle} onChange={(event) => props.onThrottle(Number(event.target.value))} aria-label="Throttle" />
        <div className="range-labels"><span>IDLE</span><span>TAKEOFF</span><span>MAX</span></div>
      </div>
      <div className="flap-control">
        <div className="control-title"><span>FLAPS</span><strong>{props.flaps}°</strong></div>
        <div className="flap-steps">{[0, 5, 10, 15, 20, 25, 30].map((value) => <button key={value} className={props.flaps === value ? 'flap-active' : ''} onClick={() => props.onFlaps(value)} aria-pressed={props.flaps === value}>{value}</button>)}</div>
      </div>
      <div className="systems-buttons">
        <button className={`button ${props.gearDown ? 'button-active' : ''}`} onClick={props.onToggleGear} aria-pressed={props.gearDown}>{props.gearDown ? 'GEAR DOWN' : 'GEAR UP'}</button>
        <button className={`button reverse-button ${props.reverse ? 'button-reverse' : ''}`} onClick={props.onToggleReverse} disabled={!props.canReverse && !props.reverse} aria-pressed={props.reverse}>{props.reverse ? 'REVERSERS ACTIVE' : 'REVERSERS OFF'}</button>
      </div>
      {!props.canReverse && !props.reverse && <p className="control-hint">Reverse thrust: both engines on, gear down, on ground, A/P off.</p>}
    </section>
  );
}
