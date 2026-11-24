'use client';

import { useCallback, useEffect, useState } from 'react';
import { CoverScreen } from './CoverScreen';
import { IntroScreen } from './IntroScreen';
import { RouteSelect } from './RouteSelect';
import { FlightDeck } from './FlightDeck';
import { ROUTES } from '@/lib/routes';
import { useFlightSim } from '@/hooks/useFlightSim';

type Stage = 'cover' | 'tutorial' | 'route' | 'deck';

/**
 * 应用流程：封面（波音 LOGO/真机背景）→ 启动教程 → 航线选择 → 驾驶舱。
 * 选中航线后自动预置 AP 巡航目标；回车可跳过封面。
 */
export function SimApp() {
  const [stage, setStage] = useState<Stage>('cover');
  const sim = useFlightSim();

  // 回车快捷进入（封面 → 教程）
  useEffect(() => {
    if (stage !== 'cover') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') setStage('tutorial');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stage]);

  const handleRoute = useCallback(
    (routeId: string | null) => {
      const r = ROUTES.find((x) => x.id === routeId);
      if (r) {
        // 预置该航线的巡航目标（起飞后 AP 接通时将捕获/对齐）
        sim.actions.setRoute(r.id, r.cruiseAlt, r.cruiseIas);
      }
      setStage('deck');
    },
    [sim.actions]
  );

  return (
    <>
      {stage === 'cover' && <CoverScreen onEnter={() => setStage('tutorial')} />}
      {stage === 'tutorial' && <IntroScreen onNext={() => setStage('route')} />}
      {stage === 'route' && <RouteSelect onSelect={handleRoute} />}
      {stage === 'deck' && <FlightDeck />}
    </>
  );
}
