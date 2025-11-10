import React, { createContext, useContext, useEffect, useState } from 'react';

interface RouterContextType {
  pathname: string;
  navigate: (path: string) => void;
}

const RouterContext = createContext<RouterContextType | null>(null);

export function Router({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (path === pathname) return;

    window.history.pushState({}, '', path);
    setPathname(path);

    // Fetch and render the new page
    fetchAndRenderPage(path);
  };

  return (
    <RouterContext.Provider value={{ pathname, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a Router');
  }
  return context;
}

async function fetchAndRenderPage(path: string) {
  try {
    const response = await fetch(path, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });

    if (!response.ok) {
      console.error('Failed to fetch page:', response.statusText);
      return;
    }

    const html = await response.text();

    // Extract the props from the new page
    const propsMatch = html.match(/window\.__INITIAL_PROPS__\s*=\s*({[^}]+});/);
    const pageNameMatch = html.match(/window\.__PAGE_NAME__\s*=\s*"([^"]+)";/);

    if (propsMatch && propsMatch[1] && pageNameMatch && pageNameMatch[1]) {
      const props = JSON.parse(propsMatch[1]);
      const pageName = pageNameMatch[1];

      // Update window properties
      (window as any).__INITIAL_PROPS__ = props;
      (window as any).__PAGE_NAME__ = pageName;

      // Trigger a re-render by dispatching a custom event
      window.dispatchEvent(
        new CustomEvent('nist:navigate', { detail: { props, pageName } }),
      );
    }
  } catch (error) {
    console.error('Navigation error:', error);
  }
}
