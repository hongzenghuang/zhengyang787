'use client';

import type { SimState } from '@/lib/sim-types';
import { fmt, pad3, hdgError } from '@/lib/sim-types';
import { ROUTES } from '@/lib/routes';
import type { FlightSim } from '@/hooks/useFlightSim';

// ── 通用面板头 ──────────────────────────────────────────
function PanelHead({ title, kicker }: { title: string; kicker: string }) {
  return (
    <div className="panel-head">
      <span className="panel-title">{title}</span>
      <span className="panel-kicker">{kicker}</span>
    </div>
  );
}

function MetricRow({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div className="metric-row">
      <span>{label}</span>
      <b className={cls}>{value}</b>
    </div>
  );
}

// ── 飞机状态（底部中列）────────────────────────────────
export function AircraftState({ snap }: { snap: SimState }) {
  return (
    <div className="panel">
      <PanelHead title="AIRCRAFT STATE" kicker="LIVE" />
      <MetricRow label="IAS" value={fmt(snap.ias) + ' kt'} />
      <MetricRow label="ALTITUDE" value={fmt(snap.alt) + ' ft'} />
      <MetricRow label="VERTICAL SPEED" value={(snap.vsi >= 0 ? '+' : '') + fmt(snap.vsi) + ' fpm'} />
      <MetricRow label="HEADING" value={pad3(snap.hdg) + '°'} />
      <MetricRow
        label="ATTITUDE / BANK"
        value={(snap.pitch >= 0 ? '+' : '') + fmt(snap.pitch, 1) + '° / ' + (snap.bank >= 0 ? '+' : '') + fmt(snap.bank, 1) + '°'}
      />
    </div>
  );
}

// ── 快速指南（底部右列）─────────────────────────────────
const GUIDE_KEYS: [string, string][] = [
  ['Engine 1 / 2', '1 / 2'],
  ['Pitch', '↑ ↓'],
  ['Bank', '← →'],
  ['Throttle ±2%', 'W / S'],
  ['Flaps', '[ / ]'],
  ['Autopilot', 'P'],
  ['Pause / resume', 'Space'],
];

export function QuickGuide() {
  return (
    <div className="panel">
      <PanelHead title="QUICK GUIDE" kicker="DEMO ONLY" />
      <div className="kbd-grid">
        {GUIDE_KEYS.map(([label, kbd]) => (
          <div className="key" key={label}>
            <span>{label}</span><kbd>{kbd}</kbd>
          </div>
        ))}
      </div>
      <div className="disclaimer">
        <strong>娱乐演示 · 非训练设备</strong><br />
        这是简化的 Boeing 787-10 飞行体验，不代表真实 787 的认证航电、飞行模型或操作程序。
      </div>
    </div>
  );
}

// ── 导航 / 系统（侧栏）──────────────────────────────────
interface NavProps {
  snap: SimState;
  landingMode: boolean;
  onToggleLanding: () => void;
}

export function NavSystems({ snap, landingMode, onToggleLanding }: NavProps) {
  const captured = snap.ap
    ? `IAS ${fmt(snap.apTarget.ias)} · ALT ${fmt(snap.apTarget.alt)} · HDG ${pad3(snap.apTarget.hdg)}`
    : '—';
  // 固定航线航向指示
  const route = ROUTES.find((r) => r.id === snap.routeId) || null;
  const dev = route ? hdgError(route.courseDeg, snap.hdg) : 0; // >0 需右转
  const devText = !route
    ? '—'
    : Math.abs(dev) < 3
      ? '✓ 在航线上'
      : (dev > 0 ? '▶ 需右转 ' : '◀ 需左转 ') + Math.abs(Math.round(dev)) + '°';
  return (
    <div className="panel">
      <PanelHead title="NAV / SYSTEMS" kicker="PRIMARY" />
      <MetricRow label="AP STATUS" value={snap.ap ? 'CMD / ACTIVE' : 'DISENGAGED'} cls={snap.ap ? 'good' : ''} />
      <MetricRow label="CAPTURED" value={captured} />
      {route && (
        <>
          <MetricRow label="ROUTE COURSE" value={pad3(route.courseDeg) + '° · ' + route.name} />
          <MetricRow
            label="DEVIATION"
            value={devText}
            cls={Math.abs(dev) < 3 ? 'good' : 'hot'}
          />
        </>
      )}
      <MetricRow label="FLAP POSITION" value={fmt(snap.flap) + '°'} />
      <MetricRow label="FUEL ONBOARD" value={fmt(snap.fuel, 1) + ' t'} />
      <MetricRow label="SIM RATE" value="1.0× REALTIME" cls="good" />
      <button
        className={'landing-btn' + (landingMode ? ' on' : '')}
        type="button"
        onClick={onToggleLanding}
      >
        {landingMode ? '🛬 降落模式 · ON（点击关闭）' : '🛬 开启降落模式（巡航时）'}
      </button>
    </div>
  );
}

// ── 飞行模式通告器 FMA（侧栏）───────────────────────────
export function FMA({ snap }: { snap: SimState }) {
  const thrust = snap.reverse
    ? 'REVERSE'
    : snap.throttle < 5 ? 'IDLE' : snap.throttle > 85 ? 'TOGA' : 'THRUST';
  const vert = snap.ap ? (snap.landingMode ? 'LAND SEQ' : 'ALT HOLD') : 'SPEED';
  return (
    <div className="panel">
      <PanelHead title="FLIGHT MODE ANNUNCIATOR" kicker="FMA" />
      <MetricRow label="THRUST" value={thrust} />
      <MetricRow label="VERTICAL" value={vert} />
      <MetricRow label="LATERAL" value={snap.ap ? 'HDG HOLD' : 'HDG'} />
    </div>
  );
}

// ── 自动驾驶 MCP 旋钮面板（侧栏）────────────────────────
interface McpProps {
  snap: SimState;
  actions: FlightSim['actions'];
}

interface KnobSpec {
  key: 'hdg' | 'ias' | 'alt';
  label: string;
  aria: string;
  display: (s: SimState) => string;
  angle: (s: SimState) => number;
}

const KNOBS: KnobSpec[] = [
  {
    key: 'hdg', label: 'HEADING',
    aria: '航向目标旋钮，顺时针增加5度',
    display: (s) => (s.ap ? pad3(s.apTarget.hdg) + '°' : '—'),
    angle: (s) => (s.ap ? s.apTarget.hdg : 0),
  },
  {
    key: 'ias', label: 'IAS',
    aria: '空速目标旋钮，顺时针增加5节',
    display: (s) => (s.ap ? fmt(s.apTarget.ias) + ' kt' : '—'),
    angle: (s) => ((s.ap ? s.apTarget.ias : 150) / 330) * 360,
  },
  {
    key: 'alt', label: 'ALT',
    aria: '高度目标旋钮，顺时针增加500英尺',
    display: (s) => (s.ap ? fmt(s.apTarget.alt) + ' ft' : '—'),
    angle: (s) => ((s.ap ? s.apTarget.alt : 1000) / 45000) * 360,
  },
];

export function AutopilotMCP({ snap, actions }: McpProps) {
  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">AUTOPILOT MCP</span>
        <span className="panel-kicker">{snap.ap ? 'AP ACTIVE' : 'AP OFF'}</span>
      </div>
      <div className="ap-targets" aria-disabled={!snap.ap}>
        {KNOBS.map((k) => (
          <div className="ap-control" key={k.key}>
            <div className="ap-control-label">{k.label}</div>
            <button
              className="knob-face" type="button" aria-label={k.aria}
              disabled={!snap.ap}
              style={{ ['--dial-angle' as string]: k.angle(snap) + 'deg' }}
              onClick={() => actions.adjustTarget(k.key, 1)}
            >
              <span className="knob-pointer" />
              <output>{k.display(snap)}</output>
            </button>
            <div className="stepper">
              <button type="button" disabled={!snap.ap} onClick={() => actions.adjustTarget(k.key, -1)} aria-label={k.label + '减少'}>−</button>
              <button type="button" disabled={!snap.ap} onClick={() => actions.adjustTarget(k.key, 1)} aria-label={k.label + '增加'}>+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="ap-help">AP 接通后调节目标：航向 5° · 空速 5 kt · 高度 500 ft</div>
    </div>
  );
}
