import { useEffect, useState } from 'react';

/**
 * This hook is used to make sure you are on the client only
 * to prevent hydration errors with SSR.
 * @returns boolean
 */
export const useIsHydrated = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  return isHydrated;
};
