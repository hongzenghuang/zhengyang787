import { useEffect, useRef, useCallback } from 'react';
import { FlightAction } from './types';

export function useKeyboardControls(dispatch: React.Dispatch<FlightAction>) {
  const keysPressed = useRef<Set<string>>(new Set());
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 防止浏览器默认行为
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    
    keysPressed.current.add(e.key);
    
    // 一次性触发的动作
    switch(e.key) {
      case '1':
        dispatch({ type: 'TOGGLE_ENGINE', engine: 1 });
        break;
      case '2':
        dispatch({ type: 'TOGGLE_ENGINE', engine: 2 });
        break;
      case 'p':
      case 'P':
        dispatch({ type: 'TOGGLE_AUTOPILOT' });
        break;
      case '[':
        dispatch({ type: 'FLAPS_UP' });
        break;
      case ']':
        dispatch({ type: 'FLAPS_DOWN' });
        break;
    }
  }, [dispatch]);
  
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysPressed.current.delete(e.key);
  }, []);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // 持续按键处理 - 每 50ms 检查一次
    const interval = setInterval(() => {
      const keys = keysPressed.current;
      
      if (keys.has('ArrowUp')) {
        dispatch({ type: 'PITCH_UP' });
      }
      if (keys.has('ArrowDown')) {
        dispatch({ type: 'PITCH_DOWN' });
      }
      if (keys.has('ArrowLeft')) {
        dispatch({ type: 'ROLL_LEFT' });
      }
      if (keys.has('ArrowRight')) {
        dispatch({ type: 'ROLL_RIGHT' });
      }
      if (keys.has('w') || keys.has('W')) {
        dispatch({ type: 'THROTTLE_UP' });
      }
      if (keys.has('s') || keys.has('S')) {
        dispatch({ type: 'THROTTLE_DOWN' });
      }
    }, 50);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(interval);
    };
  }, [handleKeyDown, handleKeyUp, dispatch]);
}
