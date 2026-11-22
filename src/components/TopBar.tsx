'use client';

import { useEffect, useState } from 'react';

interface TopBarProps {
  day: boolean;
  running: boolean;
  onToggleTheme: () => void;
  onTogglePause: () => void;
  onReset: () => void;
}

export function TopBar({ day, running, onToggleTheme, onTogglePause, onReset }: TopBarProps) {
  const [now, setNow] = useState('00:00:00');

  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  };

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">787</div>
        <div>
          <div className="brand-title">NIGHT DECK / 787-10</div>
          <div className="brand-sub">SIMULATED FLIGHT SYSTEMS</div>
        </div>
      </div>
      <div className="top-actions">
        <span className="clock" id="clock">LOCAL {now}</span>
        <button className="btn theme-btn" id="themeBtn" type="button" aria-pressed={day} onClick={onToggleTheme}>
          {day ? '☾ NIGHT' : '☼ DAY'}
        </button>
        <button className="btn" id="pauseBtn" type="button" onClick={onTogglePause}>
          {running ? 'Ⅱ PAUSE' : '▶ RESUME'}
        </button>
        <button className="btn" id="resetBtn" type="button" onClick={onReset}>↻ RESET</button>
        <button className="btn primary" id="fullBtn" type="button" onClick={toggleFullscreen}>⛶ FULLSCREEN</button>
      </div>
    </header>
  );
}
