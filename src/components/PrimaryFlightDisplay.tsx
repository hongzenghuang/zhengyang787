import { AttitudeIndicator } from '@/components/AttitudeIndicator';

interface PrimaryFlightDisplayProps {
  airspeed: number;
  altitude: number;
  verticalSpeed: number;
  pitch: number;
  roll: number;
  heading: number;
}

export function PrimaryFlightDisplay(props: PrimaryFlightDisplayProps) {
  return (
    <section className="pfd" aria-label="Primary flight display">
      <div className="pfd-label">PRIMARY FLIGHT DISPLAY <span>·</span> PFD</div>
      <div className="pfd-instruments">
        <div className="pfd-tape"><span className="tape-label">IAS</span><strong>{Math.round(props.airspeed)}</strong><small>KTS</small><div className="tape-current">{Math.round(props.airspeed)}</div><i /><i /><i /></div>
        <AttitudeIndicator pitch={props.pitch} roll={props.roll} />
        <div className="pfd-tape pfd-tape-alt"><span className="tape-label">ALT</span><strong>{Math.round(props.altitude).toLocaleString()}</strong><small>FT</small><div className="tape-current">{Math.round(props.altitude).toLocaleString()}</div><i /><i /><i /></div>
      </div>
      <div className="pfd-footer"><span>HDG <b>{Math.round(props.heading).toString().padStart(3, '0')}°</b></span><span>V/S <b>{props.verticalSpeed >= 0 ? '+' : ''}{Math.round(props.verticalSpeed)} FPM</b></span></div>
    </section>
  );
}
