interface OutsideSceneProps {
  altitude: number;
  heading: number;
  pitch: number;
  roll: number;
  airspeed: number;
  dayMode: boolean;
}

export function OutsideScene({ altitude, heading, pitch, roll, airspeed, dayMode }: OutsideSceneProps) {
  const climb = Math.max(0, Math.min(1, altitude / 36_000));
  const runwayOpacity = 1 - Math.max(0, Math.min(1, altitude / 2_200));
  return (
    <section className={`outside-view ${dayMode ? 'outside-view-day' : ''}`} aria-label="Cockpit exterior view">
      <div className="outside-sky" style={{ transform: `translateY(${-pitch * 3}px) rotate(${-roll * 0.28}deg)` }} />
      <div className="outside-landscape" style={{ transform: `translate3d(${Math.sin(((heading - 360) * Math.PI) / 180) * 70}px, ${climb * 42}px, 0) scale(${1 - climb * 0.2})` }} />
      <div className="outside-clouds" style={{ opacity: Math.max(0, Math.min(0.92, (altitude - 1_800) / 7_000)) }} />
      <div className="outside-runway" style={{ opacity: runwayOpacity }} />
      <div className="outside-glass-shade" />
      <div className="window-frame" />
      <div className="outside-hud">
        <span className="hud-chip"><i className="live-dot" />{altitude < 40 ? 'GROUND' : airspeed > 250 ? 'CRUISE' : 'CLIMB'}</span>
        <span className="hud-chip">HDG {Math.round(heading).toString().padStart(3, '0')}°</span>
        <span className="hud-chip">FL {Math.floor(altitude / 100).toString().padStart(3, '0')}</span>
      </div>
      <div className="outside-label">787-10 · FLIGHT DECK VIEW</div>
    </section>
  );
}
