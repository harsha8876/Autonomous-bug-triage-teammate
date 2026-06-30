import { useState, useEffect } from 'react';

export function useBreakpoint(maxWidth = 767) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= maxWidth);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [maxWidth]);
  return isMobile;
}
