import { useCallback, useEffect, useRef, useState } from "react";

export function useSecretTap({ requiredTaps = 5, resetMs = 3000, onUnlock }) {
  const [tapCount, setTapCount] = useState(0);
  const resetTimerRef = useRef(null);

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  const onTap = useCallback(() => {
    setTapCount((prev) => {
      const next = prev + 1;
      if (next >= requiredTaps) {
        clearResetTimer();
        onUnlock?.();
        return 0;
      }
      return next;
    });

    clearResetTimer();
    resetTimerRef.current = setTimeout(() => {
      setTapCount(0);
      resetTimerRef.current = null;
    }, resetMs);
  }, [requiredTaps, resetMs, onUnlock, clearResetTimer]);

  useEffect(() => () => clearResetTimer(), [clearResetTimer]);

  const remaining = Math.max(0, requiredTaps - tapCount);

  return { onTap, tapCount, remaining };
}
