import { useEffect } from 'react';

const useDocumentTitle = (title) => {
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${title} | SecOps Platform`;
    
    return () => {
      document.title = originalTitle;
    };
  }, [title]);
};

export default useDocumentTitle;
