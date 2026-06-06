import { useEffect, useRef, useState } from 'react';

/**
 * Animate a number from 0 to `target` over `duration` ms. When `enabled` is
 * false (reduced motion), it returns the target immediately.
 */
export function useCountUp(target: number, duration = 700, enabled = true): number {
  const [value, setValue] = useState(enabled ? 0 : target);
  const raf = useRef<number>();

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - (1 - t) ** 3;
      setValue(target * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration, enabled]);

  return value;
}
