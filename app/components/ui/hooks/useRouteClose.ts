import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

export interface UseRouteCloseOptions {
  enabled?: boolean;
  onRouteChange: () => void;
}

export function useRouteClose({ enabled = true, onRouteChange }: UseRouteCloseOptions): void {
  const { pathname } = useLocation();
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    if (!enabled) return;

    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      onRouteChange();
    }
  }, [pathname, enabled, onRouteChange]);
}
