import { useCallback, useEffect } from 'react';
import type { FlightAction } from './types';

export function useKeyboardControls(dispatch: React.Dispatch<FlightAction>) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName;
    if (target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag ?? '')) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (tag === 'BUTTON' && (event.code === 'Space' || event.key === 'Enter')) return;

    const key = event.key.toLowerCase();
    const discrete = ['1', '2', 'p', 'r', 'g', ' ', '[', ']'].includes(key) || event.code === 'Space';
    if (discrete && event.repeat) return;

    switch (key) {
      case '1': dispatch({ type: 'TOGGLE_ENGINE', engine: 1 }); break;
      case '2': dispatch({ type: 'TOGGLE_ENGINE', engine: 2 }); break;
      case 'p': dispatch({ type: 'TOGGLE_AUTOPILOT' }); break;
      case 'r': dispatch({ type: 'TOGGLE_REVERSE' }); break;
      case 'g': dispatch({ type: 'TOGGLE_GEAR' }); break;
      case '[': dispatch({ type: 'ADJUST_FLAPS', delta: -5 }); break;
      case ']': dispatch({ type: 'ADJUST_FLAPS', delta: 5 }); break;
      case 'w': dispatch({ type: 'ADJUST_THROTTLE', delta: 2 }); break;
      case 's': dispatch({ type: 'ADJUST_THROTTLE', delta: -2 }); break;
      case 'arrowup': event.preventDefault(); dispatch({ type: 'ADJUST_PITCH', delta: 0.7 }); break;
      case 'arrowdown': event.preventDefault(); dispatch({ type: 'ADJUST_PITCH', delta: -0.7 }); break;
      case 'arrowleft': event.preventDefault(); dispatch({ type: 'ADJUST_ROLL', delta: -2 }); break;
      case 'arrowright': event.preventDefault(); dispatch({ type: 'ADJUST_ROLL', delta: 2 }); break;
      default:
        if (event.code === 'Space') {
          event.preventDefault();
          dispatch({ type: 'TOGGLE_PAUSE' });
        }
    }
  }, [dispatch]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
