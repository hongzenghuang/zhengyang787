'use client';

import { useEffect, useRef } from 'react';

interface AttitudeIndicatorProps {
  pitch: number;
  roll: number;
}

export function AttitudeIndicator({ pitch, roll }: AttitudeIndicatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 10;
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 保存状态
    ctx.save();
    
    // 移动到中心并旋转（滚转）
    ctx.translate(centerX, centerY);
    ctx.rotate(-roll * Math.PI / 180);
    
    // 计算俯仰偏移（每度 3 像素）
    const pitchOffset = pitch * 3;
    
    // 绘制天空（上半部分）
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.clip();
    
    // 天空渐变
    const skyGradient = ctx.createLinearGradient(0, -radius, 0, 0);
    skyGradient.addColorStop(0, '#1e3a5f');
    skyGradient.addColorStop(1, '#4a90d9');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(-radius, -radius + pitchOffset, radius * 2, radius);
    
    // 地面渐变
    const groundGradient = ctx.createLinearGradient(0, 0, 0, radius);
    groundGradient.addColorStop(0, '#8b4513');
    groundGradient.addColorStop(1, '#5c2e0a');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(-radius, pitchOffset, radius * 2, radius);
    
    // 地平线
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-radius, pitchOffset);
    ctx.lineTo(radius, pitchOffset);
    ctx.stroke();
    
    // 俯仰刻度线
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let deg = -30; deg <= 30; deg += 5) {
      if (deg === 0) continue;
      
      const y = pitchOffset - deg * 3;
      const lineWidth = deg % 10 === 0 ? 40 : 20;
      const lineHeight = deg % 10 === 0 ? 2 : 1;
      
      ctx.lineWidth = lineHeight;
      ctx.beginPath();
      ctx.moveTo(-lineWidth / 2, y);
      ctx.lineTo(lineWidth / 2, y);
      ctx.stroke();
      
      if (deg % 10 === 0) {
        ctx.fillText(deg.toString(), -lineWidth / 2 - 15, y);
        ctx.fillText(deg.toString(), lineWidth / 2 + 15, y);
      }
    }
    
    ctx.restore();
    
    // 恢复状态
    ctx.restore();
    
    // 绘制滚转刻度（固定，不随滚转）
    ctx.save();
    ctx.translate(centerX, centerY);
    
    // 滚转刻度弧
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    
    const rollMarks = [-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60];
    rollMarks.forEach(deg => {
      const angle = (deg - 90) * Math.PI / 180;
      const innerRadius = radius - 15;
      const outerRadius = radius - (deg % 30 === 0 ? 5 : 10);
      
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
      ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
      ctx.stroke();
    });
    
    // 滚转指针（顶部三角形）
    ctx.fillStyle = '#ffa500';
    ctx.beginPath();
    ctx.moveTo(0, -radius + 5);
    ctx.lineTo(-6, -radius + 15);
    ctx.lineTo(6, -radius + 15);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
    
    // 绘制飞机符号（固定）
    ctx.save();
    ctx.translate(centerX, centerY);
    
    // 机翼
    ctx.strokeStyle = '#ffa500';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    
    // 左翼
    ctx.beginPath();
    ctx.moveTo(-60, 0);
    ctx.lineTo(-20, 0);
    ctx.stroke();
    
    // 右翼
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(60, 0);
    ctx.stroke();
    
    // 中心点
    ctx.fillStyle = '#ffa500';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // 下划线
    ctx.strokeStyle = '#ffa500';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(-20, 10);
    ctx.lineTo(20, 10);
    ctx.lineTo(20, 0);
    ctx.stroke();
    
    ctx.restore();
    
    // 绘制侧滑球
    ctx.save();
    ctx.translate(centerX, centerY + radius - 30);
    
    // 球槽
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // 手动绘制圆角矩形（兼容性更好）
    const rx = -25, ry = -8, rw = 50, rh = 16, rr = 8;
    ctx.moveTo(rx + rr, ry);
    ctx.lineTo(rx + rw - rr, ry);
    ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rr);
    ctx.lineTo(rx + rw, ry + rh - rr);
    ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rr, ry + rh);
    ctx.lineTo(rx + rr, ry + rh);
    ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rr);
    ctx.lineTo(rx, ry + rr);
    ctx.quadraticCurveTo(rx, ry, rx + rr, ry);
    ctx.closePath();
    ctx.stroke();
    
    // 球（根据滚转偏移）
    const ballOffset = Math.sin(roll * Math.PI / 180) * 15;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ballOffset, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    // 绘制边框
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.strokeStyle = '#4a4a4a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // 外圈装饰
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    
  }, [pitch, roll]);
  
  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={300}
      style={{
        display: 'block',
        width: '260px',
        height: '260px',
      }}
    />
  );
}
