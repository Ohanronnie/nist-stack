import React, { useEffect, useRef } from 'react';
import { useRouter } from './router';

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  prefetch?: boolean | 'hover' | 'viewport';
}

// Cache for prefetched pages
const prefetchCache = new Set<string>();

async function prefetchPage(href: string) {
  if (prefetchCache.has(href)) return;

  try {
    const response = await fetch(href, {
      headers: { 'X-Prefetch': 'true' },
    });

    if (response.ok) {
      prefetchCache.add(href);
      // Store in browser cache
      await response.text();
    }
  } catch (error) {
    console.warn('Prefetch failed:', error);
  }
}

export function Link({
  href,
  children,
  onClick,
  prefetch = 'hover',
  ...props
}: LinkProps) {
  // Check if we're on the client (SSR safe)
  const isClient = typeof window !== 'undefined';

  // Only use router on client-side
  let navigate: ((path: string) => void) | null = null;
  try {
    if (isClient) {
      const router = useRouter();
      navigate = router.navigate;
    }
  } catch (e) {
    // Router not available, will use default anchor behavior
  }

  const linkRef = useRef<HTMLAnchorElement>(null);

  // Intersection Observer for viewport prefetching
  useEffect(() => {
    if (prefetch === 'viewport' && linkRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              prefetchPage(href);
            }
          });
        },
        { rootMargin: '50px' },
      );

      observer.observe(linkRef.current);
      return () => observer.disconnect();
    }
    return undefined;
  }, [href, prefetch]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Allow default behavior for:
    // - Middle click, cmd/ctrl click (open in new tab)
    // - External links
    // - Links with download attribute
    // - No navigate function available (SSR or outside Router)
    if (
      !navigate ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      props.target === '_blank' ||
      props.download ||
      href.startsWith('http') ||
      href.startsWith('//')
    ) {
      return;
    }

    e.preventDefault();

    if (onClick) {
      onClick(e);
    }

    navigate(href);
  };

  const handleMouseEnter = () => {
    // Only prefetch on client-side
    if (isClient && (prefetch === 'hover' || prefetch === true)) {
      prefetchPage(href);
    }
  };

  return (
    <a
      ref={linkRef}
      href={href}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </a>
  );
}
