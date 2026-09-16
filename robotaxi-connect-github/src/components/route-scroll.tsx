'use client';
import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';

export function RouteScroll() {
  const path = usePathname();
  useLayoutEffect(() => {
    // Keep explicit article/section anchors; ordinary page changes start at the top.
    if (!window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [path]);
  return null;
}
