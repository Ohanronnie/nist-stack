// router.hooks.ts - React hooks for accessing route data

import { useMemo } from 'react';

// Hydration data structure
interface NistHydrationData {
  props: any;
  route: {
    params: Record<string, string>;
    query: Record<string, any>;
    pathname: string;
    searchParams: Record<string, string>;
  };
  page: string;
  hydrated: boolean;
}

// Extend Window interface to include route data
declare global {
  interface Window {
    __NIST__?: NistHydrationData;
    // Deprecated - for backward compatibility only
    __ROUTE_PARAMS__?: Record<string, string>;
    __QUERY_PARAMS__?: Record<string, any>;
    __PATHNAME__?: string;
    __INITIAL_PROPS__?: any;
    __PAGE_NAME__?: string;
  }
}

/**
 * Get NIST hydration data safely
 */
function getNistData(): NistHydrationData | null {
  if (typeof window === 'undefined') return null;
  return window.__NIST__ || null;
}

/**
 * Hook to access URL route parameters (e.g., /user/:id)
 *
 * @example
 * // For route /user/:id where URL is /user/123
 * const params = useParams();
 * console.log(params.id); // "123"
 */
export function useParams<
  T extends Record<string, string> = Record<string, string>,
>(): T {
  return useMemo(() => {
    const nist = getNistData();
    if (nist?.route.params) {
      return nist.route.params as T;
    }
    // Fallback to deprecated method for backward compatibility
    if (typeof window !== 'undefined' && window.__ROUTE_PARAMS__) {
      return window.__ROUTE_PARAMS__ as T;
    }
    return {} as T;
  }, []);
}

/**
 * Hook to access query string parameters (e.g., ?page=1&sort=asc)
 *
 * @example
 * // For URL /posts?page=2&sort=desc
 * const query = useQuery();
 * console.log(query.page); // "2"
 * console.log(query.sort); // "desc"
 */
export function useQuery<
  T extends Record<string, any> = Record<string, any>,
>(): T {
  return useMemo(() => {
    const nist = getNistData();
    if (nist?.route.query) {
      return nist.route.query as T;
    }
    // Fallback to deprecated method for backward compatibility
    if (typeof window !== 'undefined' && window.__QUERY_PARAMS__) {
      return window.__QUERY_PARAMS__ as T;
    }
    return {} as T;
  }, []);
}

/**
 * Hook to access the current pathname
 *
 * @example
 * const pathname = usePathname();
 * console.log(pathname); // "/user/profile"
 */
export function usePathname(): string {
  return useMemo(() => {
    const nist = getNistData();
    if (nist?.route.pathname) {
      return nist.route.pathname;
    }
    // Fallback to deprecated method for backward compatibility
    if (typeof window !== 'undefined' && window.__PATHNAME__) {
      return window.__PATHNAME__;
    }
    return '/';
  }, []);
}

/**
 * Hook to access a specific route parameter
 *
 * @example
 * // For route /user/:id where URL is /user/123
 * const userId = useParam('id');
 * console.log(userId); // "123"
 */
export function useParam(key: string): string | undefined {
  const params = useParams();
  return params[key];
}

/**
 * Hook to access a specific query parameter
 *
 * @example
 * // For URL /posts?page=2
 * const page = useQueryParam('page');
 * console.log(page); // "2"
 */
export function useQueryParam(key: string): any {
  const query = useQuery();
  return query[key];
}

/**
 * Hook to access all route data at once
 *
 * @example
 * const { params, query, pathname } = useRouteData();
 * console.log(params.id);
 * console.log(query.page);
 * console.log(pathname);
 */
export function useRouteData() {
  const params = useParams();
  const query = useQuery();
  const pathname = usePathname();

  return useMemo(
    () => ({
      params,
      query,
      pathname,
    }),
    [params, query, pathname],
  );
}

/**
 * Hook to access a query parameter with a default value
 *
 * @example
 * const page = useQueryParamWithDefault('page', '1');
 * console.log(page); // "1" if not provided in URL
 */
export function useQueryParamWithDefault<T = any>(
  key: string,
  defaultValue: T,
): T {
  const query = useQuery();
  return query[key] !== undefined ? query[key] : defaultValue;
}

/**
 * Hook to check if a specific route param exists
 *
 * @example
 * const hasUserId = useHasParam('userId');
 */
export function useHasParam(key: string): boolean {
  const params = useParams();
  return key in params && params[key] !== undefined;
}

/**
 * Hook to check if a specific query param exists
 *
 * @example
 * const hasFilter = useHasQueryParam('filter');
 */
export function useHasQueryParam(key: string): boolean {
  const query = useQuery();
  return key in query && query[key] !== undefined;
}

/**
 * Hook to access the full NIST hydration data (advanced use)
 * This gives you access to all hydration data including metadata
 *
 * @example
 * const nist = useNistData();
 * console.log(nist?.page);     // Current page name
 * console.log(nist?.hydrated); // Hydration status
 * console.log(nist?.route);    // Full route data
 * console.log(nist?.props);    // All props
 */
export function useNistData(): NistHydrationData | null {
  return useMemo(() => getNistData(), []);
}
