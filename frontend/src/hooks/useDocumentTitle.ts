import { useEffect } from 'react';

const SITE = 'Shikho English';

/** Names the browser tab and history entry after the page ("Question History · Shikho English"). */
export const useDocumentTitle = (title?: string) => {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : SITE;
    return () => {
      document.title = SITE;
    };
  }, [title]);
};
