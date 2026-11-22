'use client';

import { useEffect, useRef } from 'react';
import type { SimState } from '@/lib/sim-types';
import { fmt } from '@/lib/sim-types';

interface PFDProps {
  simRef: React.MutableRefObject<SimState>;
}

/**
 * 主飞行显示器：左侧空速带 + 中央姿态仪 + 右侧高度带。
 * 直接用 simRef 实时值在 60fps rAF 里绘制，不走 React re-render，保证流畅。
 */
export function PFD({ simRef }: PFDProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const fontFamily = getComputedStyle(document.body).fontFamily;

    const draw = () => {
      const sim = simRef.current;
      const r = canvas.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      const w = r.width;
      const h = r.height;
      if (w <= 0 || h <= 0) { raf = requestAnimationFrame(draw); return; }

      if (canvas.width !== Math.round(w * d) || canvas.height !== Math.round(h * d)) {
        canvas.width = Math.round(w * d);
        canvas.height = Math.round(h * d);
      }
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const tapeW = Math.max(48, w * 0.17);
      const centerW = w - tapeW * 2;
      const cx = tapeW + centerW / 2;
      const cy = h * 0.52;
      const sc = Math.min(centerW / 300, h / 240);

      // ── 两侧刻度带背景 ──
      ctx.fillStyle = 'rgba(5,14,22,.88)';
      ctx.fillRect(0, 0, tapeW - 2, h);
      ctx.fillRect(w - tapeW + 2, 0, tapeW - 2, h);

      // ── 带标题与顶部大字 ──
      ctx.fillStyle = '#9fc3d0';
      ctx.font = 'bold 9px ' + fontFamily;
      ctx.textAlign = 'center';
      ctx.fillText('IAS', tapeW / 2, 18);
      ctx.fillText('ALT', w - tapeW / 2, 18);
      ctx.fillStyle = '#55ddff';
      ctx.font = 'bold 15px ' + fontFamily;
      ctx.fillText(fmt(sim.ias), tapeW / 2, 35);
      ctx.fillText(fmt(sim.alt), w - tapeW / 2, 35);

      // ── 空速带刻度（滚动）──
      ctx.strokeStyle = '#c8e5edaa';
      ctx.lineWidth = 1;
      ctx.font = '9px ' + fontFamily;
      ctx.fillStyle = '#d7e7ed';
      const speedBase = Math.round(sim.ias / 20) * 20;
      const speedPhase = ((speedBase - sim.ias) / 20) * 27;
      for (let i = -3; i <= 3; i++) {
        const y = cy + i * 27 + speedPhase;
        const val = speedBase - i * 20;
        if (y < 46 || y > h - 27 || val < 0) continue;
        ctx.beginPath();
        ctx.moveTo(tapeW - 9, y);
        ctx.lineTo(tapeW - 3, y);
        ctx.stroke();
        if (i !== 0) ctx.fillText(String(val), tapeW * 0.39, y + 3);
      }

      // ── 高度带刻度（滚动）──
      const altBase = Math.round(sim.alt / 500) * 500;
      const altPhase = ((altBase - sim.alt) / 500) * 27;
      for (let i = -3; i <= 3; i++) {
        const y = cy + i * 27 + altPhase;
        const val = altBase - i * 500;
        if (y < 46 || y > h - 27 || val < 0) continue;
        ctx.beginPath();
        ctx.moveTo(w - tapeW + 3, y);
        ctx.lineTo(w - tapeW + 9, y);
        ctx.stroke();
        if (i !== 0) ctx.fillText(String(val), w - tapeW * 0.39, y + 3);
      }

      // ── 中心读数框 ──
      ctx.fillStyle = '#102b39';
      ctx.strokeStyle = '#50d7ff';
      ctx.lineWidth = 1.2;
      ctx.fillRect(3, cy - 12, tapeW - 6, 24);
      ctx.strokeRect(3, cy - 12, tapeW - 6, 24);
      ctx.fillRect(w - tapeW + 3, cy - 12, tapeW - 6, 24);
      ctx.strokeRect(w - tapeW + 3, cy - 12, tapeW - 6, 24);
      ctx.fillStyle = '#e7f7fc';
      ctx.font = 'bold 10px ' + fontFamily;
      ctx.fillText(fmt(sim.ias), tapeW / 2, cy + 4);
      ctx.fillText(fmt(sim.alt), w - tapeW / 2, cy + 4);

      // ── 姿态仪（中央带内裁剪，随 bank 旋转 / pitch 平移）──
      ctx.save();
      ctx.beginPath();
      ctx.rect(tapeW, 0, centerW, h);
      ctx.clip();
      ctx.translate(cx, cy);
      ctx.rotate((-sim.bank * Math.PI) / 180);
      const p = sim.pitch * sc * 5;
      ctx.translate(0, p);
      ctx.fillStyle = '#3b7296';
      ctx.fillRect(-centerW, -h * 2, centerW * 2, h * 2);
      ctx.fillStyle = '#9c8a67';
      ctx.fillRect(-centerW, 0, centerW * 2, h * 2);

      // 俯仰刻度
      ctx.strokeStyle = '#d5e8e0';
      ctx.lineWidth = 1.2;
      ctx.fillStyle = '#cde3ec';
      ctx.font = '9px ' + fontFamily;
      for (let deg = -30; deg <= 30; deg += 5) {
        if (deg === 0) continue;
        const y = deg * sc * 3;
        const len = deg % 10 === 0 ? 27 : 13;
        ctx.beginPath();
        ctx.moveTo(-len, y);
        ctx.lineTo(len, y);
        ctx.stroke();
        if (deg % 10 === 0) {
          ctx.fillText(String(Math.abs(deg)), -len - 15, y + 3);
          ctx.fillText(String(Math.abs(deg)), len + 5, y + 3);
        }
      }
      // 黄色飞机符号（随姿态移动）
      ctx.strokeStyle = '#ffd769';
      ctx.beginPath();
      ctx.moveTo(-centerW, 0);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-12, 7);
      ctx.moveTo(centerW, 0);
      ctx.lineTo(18, 0);
      ctx.lineTo(12, 7);
      ctx.stroke();
      ctx.restore();

      // ── 固定飞机参考符号（不随姿态动）──
      ctx.strokeStyle = '#50d7ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 27, cy);
      ctx.lineTo(cx - 8, cy);
      ctx.lineTo(cx, cy + 7);
      ctx.lineTo(cx + 8, cy);
      ctx.lineTo(cx + 27, cy);
      ctx.stroke();

      // ── 底部读数 ──
      ctx.textAlign = 'left';
      ctx.fillStyle = '#89a8b8';
      ctx.font = '9px ' + fontFamily;
      ctx.fillText('HDG ' + fmt(sim.hdg).padStart(3, '0'), cx - 28, h - 9);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffc469';
      ctx.fillText((sim.vsi >= 0 ? '+' : '') + fmt(sim.vsi) + ' FPM', cx + centerW / 2 - 6, h - 9);
      ctx.textAlign = 'left';

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [simRef]);

  return <canvas id="pfd" ref={canvasRef} aria-label="主飞行显示器，左侧为空速 IAS，中间为姿态仪，右侧为高度 ALT" />;
}
