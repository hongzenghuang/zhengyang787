'use client';

import { ROUTES, Route } from '@/lib/routes';

interface RouteSelectProps {
  onSelect: (routeId: string | null) => void;
}

/**
 * 航线选择页（教程之后）：选择一条航线进入驾驶舱，
 * 巡航时可在 NAV 面板切换「降落模式」；也可选自由飞行。
 */
export function RouteSelect({ onSelect }: RouteSelectProps) {
  return (
    <div className="route-screen">
      <div className="route-content">
        <header className="route-header">
          <div className="route-eyebrow">FLIGHT PLAN · 飞行计划</div>
          <h1 className="route-title">选择航线</h1>
          <p className="route-sub">巡航阶段可随时在 NAV 面板开启「降落模式」，AP 将自动执行进近剖面</p>
        </header>

        <div className="route-grid">
          {ROUTES.map((r: Route) => (
            <button className="route-card" type="button" key={r.id} onClick={() => onSelect(r.id)}>
              {/* 航司行：LOGO（白底面板承载）+ 航司名 + 航班号 */}
              <div className="route-airline-row">
                <span className="airline-logo" aria-hidden>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.airline.logo} alt={r.airline.name} />
                </span>
                <span className="airline-name">{r.airline.name}</span>
                <span className="flight-no">{r.airline.flightNo}</span>
              </div>

              <div className="route-card-name">{r.name}</div>
              <div className="route-card-path">
                <span className="route-city">{r.from}</span>
                <span className="route-dash">— {r.distanceKm.toLocaleString()} km —</span>
                <span className="route-city">{r.to}</span>
              </div>
              <div className="route-card-meta">
                <span>巡航 FL{Math.round(r.cruiseAlt / 100)}</span>
                <span>{r.cruiseIas} kt</span>
                <span>{r.duration}</span>
              </div>
              <div className="route-card-desc">{r.desc}</div>
              <div className="route-card-go">起飞 →</div>
            </button>
          ))}

          {/* 自由飞行 */}
          <button className="route-card route-free" type="button" onClick={() => onSelect(null)}>
            <div className="route-card-name">自由飞行</div>
            <div className="route-card-desc">不预设航线，自由体验驾驶舱全部系统</div>
            <div className="route-card-go">开始 →</div>
          </button>
        </div>
      </div>
    </div>
  );
}
