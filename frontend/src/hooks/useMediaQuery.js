import { useState, useEffect } from 'react';

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', listener);
    } else {
      media.addListener(listener); // Support for older browsers
    }

    return () => {
      if (typeof media.removeEventListener === 'function') {
        media.removeEventListener('change', listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [matches, query]);

  return matches;
};

export default useMediaQuery;
