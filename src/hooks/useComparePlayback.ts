import { useEffect, useRef } from 'react';
import { useCompareStore } from '@/store/compareStore';

/** Same rAF-driven playback pattern as usePlayback, but drives the shared tick counter in compareStore. */
export function useComparePlayback(): void {
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const accumulatorRef = useRef(0);

  useEffect(() => {
    function loop(time: number) {
      const { runState, speed, tick } = useCompareStore.getState();
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
