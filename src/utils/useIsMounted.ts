import { useCallback, useEffect, useRef } from 'react';

/**
 * Returns a stable getter telling whether the component is still mounted.
 * Used to skip state updates after an awaited export finishes on a modal
 * the user already closed.
 */
export function useIsMounted(): () => boolean {
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return useCallback(() => mountedRef.current, []);
}
