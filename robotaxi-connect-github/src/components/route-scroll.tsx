'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function RouteScroll() {
  const path = usePathname();
  useEffect(() => {
    // Run after the router's layout/scroll handling, rather than competing with it.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const frame = requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
    return () => cancelAnimationFrame(frame);
  }, [path]);
  useEffect(() => {
    const previous = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    let frame = 0;
    const top = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
    };
    const click = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(link instanceof HTMLAnchorElement) || link.target === '_blank' || link.hasAttribute('download')) return;
      const url = new URL(link.href);
      // Re-selecting the current navigation item must also return to the top.
      // Deliberate section links within the current page still work.
      if (url.origin === location.origin && url.pathname === location.pathname && !url.hash) top();
    };
    window.addEventListener('pageshow', top);
    window.addEventListener('popstate', top);
    document.addEventListener('click', click);
    return () => {
      cancelAnimationFrame(frame);
      history.scrollRestoration = previous;
      window.removeEventListener('pageshow', top);
      window.removeEventListener('popstate', top);
      document.removeEventListener('click', click);
    };
  }, []);
  return null;
}
