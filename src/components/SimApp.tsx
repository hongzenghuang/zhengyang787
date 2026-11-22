'use client';

import { useState } from 'react';
import { IntroScreen } from './IntroScreen';
import { FlightDeck } from './FlightDeck';

/** 应用入口：先显示启动屏（介绍 + 教程），点击「开始飞行」进入驾驶舱 */
export function SimApp() {
  const [started, setStarted] = useState(false);
  return started ? <FlightDeck /> : <IntroScreen onStart={() => setStarted(true)} />;
}
