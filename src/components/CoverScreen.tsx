'use client';

import { useEffect, useState } from 'react';

/**
 * 主题封面页：波音 LOGO + 真飞机起飞背景图 + 标题渐显动画。
 * 作为应用的第一个页面，点击「进入驾驶舱」后进入启动屏教程。
 */
export function CoverScreen({ onEnter }: { onEnter: () => void }) {
  const [ready, setReady] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 60);
    // 兜底：即使 onLoad 因缓存竞态未触发，2.5s 后强制显示背景
    const fallback = setTimeout(() => setImgLoaded(true), 2500);
    return () => { clearTimeout(t); clearTimeout(fallback); };
  }, []);

  // 图片命中缓存时 load 事件可能早于 onLoad 绑定 → ref 回调里同步检查 complete
  const imgRef = (el: HTMLImageElement | null) => {
    if (el && el.complete && el.naturalWidth > 0) setImgLoaded(true);
  };

  return (
    <div className={'cover-screen' + (ready ? ' ready' : '')}>
      {/* 背景图（真飞机起飞，加载后淡入） */}
      <div className={'cover-bg' + (imgLoaded ? ' loaded' : '')}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src="/images/img_20261122_133322_134193.jpg"
          alt="波音 787-10 黄金时刻起飞"
          onLoad={() => setImgLoaded(true)}
        />
        <div className="cover-bg-shade" />
      </div>

      <div className="cover-content">
        {/* 波音官方 LOGO（透明底 PNG，白底已抠除、水印区已裁切） */}
        <div className="cover-logo-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/boeing-logo.png" alt="Boeing" />
        </div>

        <h1 className="cover-title">787-10<span> FLIGHT DECK</span></h1>
        <p className="cover-tag">— SIMULATED FLIGHT SYSTEMS —</p>

        <div className="cover-feature-row">
          <span>◆ 完整驾驶舱</span><span>◆ 起飞教程</span><span>◆ 航线选择</span><span>◆ AI 自动恢复</span>
        </div>

        <button className="cover-enter" type="button" onClick={onEnter}>
          进入驾驶舱
          <span className="cover-enter-arrow">→</span>
        </button>
        <div className="cover-hint">点击任意处进入 · 回车亦可</div>
      </div>
    </div>
  );
}
