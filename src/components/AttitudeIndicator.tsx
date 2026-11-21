interface AttitudeIndicatorProps {
  pitch: number;
  roll: number;
}

export function AttitudeIndicator({ pitch, roll }: AttitudeIndicatorProps) {
  return (
    <div className="attitude-frame" aria-label={`Pitch ${pitch.toFixed(1)} degrees, bank ${roll.toFixed(1)} degrees`}>
      <div className="attitude-window">
        <div className="attitude-horizon" style={{ transform: `translateY(${pitch * 4}px) rotate(${-roll}deg)` }}>
          <div className="attitude-sky" />
          <div className="attitude-earth" />
          <div className="horizon-line" />
          {[-20, -10, 10, 20].map((angle) => (
            <div className={`pitch-mark ${angle < 0 ? 'pitch-mark-up' : 'pitch-mark-down'}`} key={angle} style={{ top: `calc(50% + ${angle * 3}px)` }}>
              <span />{Math.abs(angle)}<span />
            </div>
          ))}
        </div>
        <div className="bank-scale"><i /><i /><b /><i /><i /></div>
        <div className="aircraft-symbol"><span /><b /><span /></div>
      </div>
      <div className="attitude-readout"><span>PITCH <b>{pitch >= 0 ? '+' : ''}{pitch.toFixed(1)}°</b></span><span>BANK <b>{roll >= 0 ? '+' : ''}{roll.toFixed(1)}°</b></span></div>
    </div>
  );
}
