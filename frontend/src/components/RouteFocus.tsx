import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * After moving to another page, start at the top and put focus on the main content, so keyboard and
 * screen-reader users aren't left on a link that no longer exists. A #section in the address
 * (e.g. /#faq) scrolls to and focuses that section instead, including on a fresh page load. Changing a
 * filter or page number (the query string) keeps the student where they are.
 */
const RouteFocus = () => {
  const { pathname, hash } = useLocation();
  const firstRender = useRef(true);

  useEffect(() => {
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    const isFirst = firstRender.current;
    firstRender.current = false;

    if (target) {
      target.scrollIntoView();
      target.focus({ preventScroll: true });
      return;
    }
    if (isFirst) return;
    window.scrollTo(0, 0);
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [pathname, hash]);

  return null;
};

export default RouteFocus;
