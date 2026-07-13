import { useEffect, useRef } from 'react';
import { useAlgorithmStore } from '@/store/algorithmStore';

/**
 * Owns a single always-on rAF loop that advances the algorithm playback
 * index at `speed` steps/sec while runState === 'playing'. Mount once near
 * the app root so playback keeps going regardless of which panel is focused.
 */
export function usePlayback(): void {
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const accumulatorRef = useRef(0);

  useEffect(() => {
    function loop(time: number) {
      const { runState, speed, tick } = useAlgorithmStore.getState();
      if (runState === 'playing') {
        if (lastTimeRef.current !== null) {
          const dtMs = time - lastTimeRef.current;
          accumulatorRef.current += (dtMs / 1000) * speed;
          const stepsToAdvance = Math.floor(accumulatorRef.current);
          accumulatorRef.current -= stepsToAdvance;
          tick(stepsToAdvance, dtMs);
        }
        lastTimeRef.current = time;
      } else {
        lastTimeRef.current = null;
        accumulatorRef.current = 0;
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);
}
