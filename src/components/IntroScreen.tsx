'use client';

import { useEffect, useRef, useState } from 'react';

// ── 787-10 标准参数 ──────────────────────────────────────
const SPECS: { label: string; value: string; sub: string }[] = [
  { label: '机长', value: '68.3', sub: 'm' },
  { label: '翼展', value: '60.1', sub: 'm' },
  { label: '最大起飞重量', value: '254', sub: 't' },
  { label: '典型座位', value: '330–440', sub: '座' },
  { label: '航程', value: '11,910', sub: 'km' },
  { label: '发动机', value: 'GEnx-1B', sub: '×2' },
];

// ── 起飞教程步骤（含时间区间，p∈[0,1)）──────────────────
const STEPS: { from: number; to: number; title: string; desc: string; keys: string }[] = [
  { from: 0.00, to: 0.16, title: '① 启动双发', desc: '按下 1 和 2，等待 N1 上升', keys: '1 · 2' },
  { from: 0.16, to: 0.32, title: '② 襟翼放到 15°', desc: '按三次 ]，增加起飞升力', keys: '] ] ]' },
  { from: 0.32, to: 0.46, title: '③ 推满油门', desc: '按住 W，飞机开始滑跑加速', keys: 'W' },
  { from: 0.46, to: 0.60, title: '④ 拉杆抬轮', desc: '空速达 150 节后按 ↑ 抬头', keys: '↑' },
  { from: 0.60, to: 0.76, title: '⑤ 收起落架', desc: '点 GEAR 按钮，减小阻力', keys: 'GEAR 按钮' },
  { from: 0.76, to: 1.00, title: '⑥ 接通自动驾驶', desc: '按 P，自动保持速度 / 高度 / 航向', keys: 'P' },
];

const DURATION = 8000; // 一轮动画 8 秒

// ── 应用面板导览（按键教程之后的应用教程）────────────────
const APP_TOUR: { title: string; desc: string }[] = [
  {
    title: '🛩 外部视景 + PFD',
    desc: '中央大窗是外部视野（天空/跑道/云层）；左下悬浮的主飞行显示器：左侧空速带、中间姿态仪、右侧高度带，底部是航向与垂直速度',
  },
  {
    title: '⚙ ENGINE MONITOR',
    desc: '左右双发 N1 表、EGT 温度与燃油流量；下方的「1 · ENGINE 1/2」按钮与键盘 1/2 等效，切换引擎启停',
  },
  {
    title: '🎛 FLIGHT CONTROLS',
    desc: '油门滑块（可拖动）、襟翼 7 档分段按钮、GEAR 起落架、REVERSERS 反推（落地滑跑减速）、AP 自动驾驶总开关',
  },
  {
    title: '📡 AIRCRAFT STATE',
    desc: '实时飞行数据：空速 / 高度 / 垂直速度 / 航向 / 俯仰与坡度，用于随时掌握飞行状态',
  },
  {
    title: '🧭 NAV / SYSTEMS + FMA',
    desc: '自动驾驶状态与捕获目标、襟翼位置、剩余燃油；FMA 通告当前推力/垂直/横向模式（如 ALT HOLD、HDG HOLD）',
  },
  {
    title: '🎛 AUTOPILOT MCP',
    desc: 'AP 接通后此处激活：点旋钮或 ± 步进调节目标航向（5°）、速度（5 kt）、高度（500 ft）',
  },
  {
    title: '🏮 顶栏控制',
    desc: '昼夜主题切换、暂停/继续（Space）、重置全部状态、全屏；右上角时钟为本地时间',
  },
  {
    title: '⌨ 键盘 / 触摸',
    desc: '键盘为完整操作（见上方速查）；滑块、按钮、旋钮均支持鼠标与触摸，方向键控制俯仰与坡度',
  },
];

// 缓动
const easeIn = (t: number) => t * t * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

interface Pose { x: number; y: number; rot: number; opacity: number }

/** 根据进度 p 计算飞机位姿（W=舞台宽，H=舞台高，单位 px） */
export function planePose(p: number, W: number, H: number): Pose {
  if (p < 0.45) {
    // 阶段 A：地面滑跑加速
    const t = easeIn(p / 0.45);
    return { x: lerp(-200, W * 0.24, t), y: 0, rot: 0, opacity: Math.min(1, p / 0.05) };
  }
  if (p < 0.6) {
    // 阶段 B：拉杆抬轮
    const t = easeOut((p - 0.45) / 0.15);
    return { x: lerp(W * 0.24, W * 0.34, t), y: lerp(0, -H * 0.06, t), rot: lerp(0, -13, t), opacity: 1 };
  }
  // 阶段 C：爬升飞出
  const t = easeIn((p - 0.6) / 0.4);
  return {
    x: lerp(W * 0.34, W * 1.06, t),
    y: lerp(-H * 0.06, -H * 1.15, t),
    rot: -13,
    opacity: p > 0.93 ? Math.max(0, 1 - (p - 0.93) / 0.07) : 1,
  };
}

// ── 787 侧视 SVG（机身 / 主翼 / 尾翼 / 发动机 / 起落架）──
function PlaneSVG({ gearRef }: { gearRef: React.RefObject<SVGGElement | null> }) {
  return (
    <svg viewBox="0 0 220 96" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {/* 机身 */}
      <path
        d="M16 54 C12 51 13 47 20 46 L178 38 C196 37 209 42 213 48 C216 53 211 56 200 56 L28 60 C19 60 16 58 16 54 Z"
        fill="#dfe7ee"
      />
      {/* 机身上沿高光 */}
      <path d="M20 46 L178 38 C196 37 209 42 213 48 C196 44 60 50 20 50 Z" fill="#ffffff" opacity="0.55" />
      {/* 驾驶舱舷窗 */}
      <path d="M197 43 C203 44 207 46 208 49 L199 49 C196 47 195 45 197 43 Z" fill="#2a4a66" />
      {/* 舷窗带 */}
      <path d="M40 47 L170 41 L170 43 L40 49 Z" fill="#3a5a78" opacity="0.35" />
      {/* 垂直尾翼 */}
      <path d="M170 39 L198 37 L190 8 C189 4 184 4 182 9 L162 39 Z" fill="#c3cedb" />
      <path d="M182 9 L190 8 L188 20 L180 21 Z" fill="#2a6cb8" />
      {/* 水平尾翼 */}
      <path d="M164 43 L190 41 L186 31 L162 33 Z" fill="#c3cedb" />
      {/* 主翼（下单翼，后掠） */}
      <path d="M94 45 L152 40 L140 66 L94 62 Z" fill="#cdd8e4" />
      <path d="M94 45 L152 40 L150 46 L96 50 Z" fill="#aebdd0" />
      {/* 发动机（翼下双发） */}
      <ellipse cx="112" cy="64" rx="11" ry="5.5" fill="#8fa3b8" />
      <ellipse cx="112" cy="63" rx="11" ry="4.5" fill="#b9c7d6" />
      <ellipse cx="140" cy="62" rx="11" ry="5.5" fill="#8fa3b8" />
      <ellipse cx="140" cy="61" rx="11" ry="4.5" fill="#b9c7d6" />
      {/* 起落架 */}
      <g ref={gearRef} style={{ transition: 'opacity .3s' }}>
        <line x1="58" y1="58" x2="58" y2="68" stroke="#5a6673" strokeWidth="2.5" />
        <circle cx="58" cy="70" r="4" fill="#2f3a45" />
        <line x1="150" y1="60" x2="150" y2="70" stroke="#5a6673" strokeWidth="2.5" />
        <circle cx="150" cy="72" r="4" fill="#2f3a45" />
      </g>
    </svg>
  );
}

export function IntroScreen({ onNext }: { onNext: () => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const gearRef = useRef<SVGGElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);
  const flameRef = useRef<HTMLDivElement>(null);
  const [stepIdx, setStepIdx] = useState(0);

  // 自播放起飞动画：rAF 驱动位姿 + 步骤高亮
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      const p = ((now - t0) % DURATION) / DURATION;
      const stage = stageRef.current;
      const plane = planeRef.current;
      if (stage && plane) {
        const W = stage.clientWidth;
        const H = stage.clientHeight;
        const pose = planePose(p, W, H);
        plane.style.transform = `translate(${pose.x}px, ${pose.y}px) rotate(${pose.rot}deg)`;
        plane.style.opacity = String(pose.opacity);
      }
      if (gearRef.current) gearRef.current.style.opacity = p < 0.58 ? '1' : '0';
      if (linesRef.current) {
        linesRef.current.style.opacity = p < 0.55 ? String(Math.min(1, p * 6)) : '0';
        linesRef.current.style.backgroundPosition = `${-p * 900}px 0`;
      }
      // 物理动画化：引擎尾焰随推力长度变化（滑跑最长，爬升收缩）
      if (flameRef.current) {
        const thrust = p < 0.5 ? Math.min(1, p / 0.3) : p < 0.62 ? 1 : 0.4;
        flameRef.current.style.transform = `scaleX(${thrust.toFixed(3)})`;
        flameRef.current.style.opacity = p < 0.05 ? '0' : '0.85';
      }
      const idx = STEPS.findIndex((s) => p >= s.from && p < s.to);
      setStepIdx((prev) => (prev === idx || idx < 0 ? prev : idx));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="intro-screen">
      <div className="intro-content">
        {/* 头部：机型标识 + 标题 */}
        <header className="intro-header">
          <div className="intro-badge-row">
            <span className="intro-badge">BOEING</span>
            <span className="intro-badge-sub">DREAMLINER</span>
          </div>
          <h1 className="intro-title">787-10</h1>
          <p className="intro-tag">双发宽体远程干线客机 · 787 家族最大型号</p>
        </header>

        {/* 参数卡片 */}
        <section className="intro-specs" aria-label="飞机参数">
          {SPECS.map((s) => (
            <div className="spec-card" key={s.label}>
              <div className="spec-value">
                {s.value}<span className="spec-unit">{s.sub}</span>
              </div>
              <div className="spec-label">{s.label}</div>
            </div>
          ))}
        </section>

        <p className="intro-desc">
          787-10 是 Dreamliner 系列中机身最长的型号，采用大量复合材料与电传操纵系统，
          配备玻璃化驾驶舱，兼顾远程航程与高密度运力。下方演示标准起飞流程。
        </p>

        {/* 起飞教程动画 */}
        <section className="intro-tutorial" aria-label="起飞流程演示">
          <div className="tutorial-title">
            <span className="tutorial-title-dot" />
            TAKEOFF TUTORIAL · 起飞流程演示
          </div>

          <div className="tutorial-stage" ref={stageRef}>
            {/* 天空 */}
            <div className="stage-sky" />
            {/* 地面速度线 */}
            <div className="stage-lines" ref={linesRef} />
            {/* 跑道 */}
            <div className="stage-runway">
              <div className="stage-runway-center" />
            </div>
            {/* 飞机（含引擎尾焰——物理动画化）*/}
            <div className="tutorial-plane" ref={planeRef}>
              <div className="engine-flame" ref={flameRef} />
              <PlaneSVG gearRef={gearRef} />
            </div>
            {/* 远处云 */}
            <div className="stage-cloud stage-cloud-a" />
            <div className="stage-cloud stage-cloud-b" />
          </div>

          {/* 步骤列表 */}
          <ol className="tutorial-steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className={'tutorial-step' + (i === stepIdx ? ' active' : i < stepIdx ? ' done' : '')}>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
                <div className="step-keys">{s.keys}</div>
              </li>
            ))}
          </ol>

          {/* 应用面板导览（应用教程）*/}
          <div className="tour-title">
            <span className="tour-title-dot" />
            APP TOUR · 驾驶舱面板导览
          </div>
          <div className="tour-grid">
            {APP_TOUR.map((t) => (
              <div className="tour-card" key={t.title}>
                <div className="tour-card-title">{t.title}</div>
                <div className="tour-card-desc">{t.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 进入按钮 + 键位提示 */}
        <button className="intro-start" type="button" onClick={onNext}>
          选择航线
          <span className="intro-start-arrow">→</span>
        </button>
        <div className="intro-hint">
          键位速查：<kbd>1</kbd><kbd>2</kbd> 引擎 · <kbd>W</kbd><kbd>S</kbd> 油门 ·
          <kbd>↑↓←→</kbd> 姿态 · <kbd>[ ]</kbd> 襟翼 · <kbd>P</kbd> 自动驾驶 ·
          <kbd>R</kbd> 反推 · <kbd>Space</kbd> 暂停
        </div>
      </div>
    </div>
  );
}
