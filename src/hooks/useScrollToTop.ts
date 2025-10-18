import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    // Immediate scroll to top for instant feedback
    window.scrollTo(0, 0);
  }, [location.pathname]);
};
