import { useState, useEffect } from 'react';

export const useHoverQuery = () => {
  const [isHoverable, setIsHoverable] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover)");
    setIsHoverable(mq.matches);
    
    const listener = (e) => setIsHoverable(e.matches);
    
    // Modern browsers support addEventListener
    if (mq.addEventListener) {
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    } else {
      // Fallback for older browsers
      mq.addListener(listener);
      return () => mq.removeListener(listener);
    }
  }, []);

  return isHoverable;
};
