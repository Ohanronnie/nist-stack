export { Link } from './Link';
export { Router, useRouter } from './router';
export { ErrorBoundary } from './ErrorBoundary';
export { Image } from './Image';
export { createClientEntry } from "./createEntryClient";
export {
  useParams,
  useQuery,
  usePathname,
  useParam,
  useQueryParam,
  useRouteData,
  useQueryParamWithDefault,
  useHasParam,
  useHasQueryParam,
  useNistData,
} from './router.hooks';

// Metadata type for layouts and pages
export interface Metadata {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  viewport?: string;
  charset?: string;
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
  };
  twitter?: {
    card?: string;
    site?: string;
    creator?: string;
    title?: string;
    description?: string;
    image?: string;
  };
  robots?: string;
  canonical?: string;
  [key: string]: any;
}

// Layout component props
export interface LayoutProps {
  children: React.ReactNode;
  [key: string]: any;
}

// For layouts that want to control the full HTML structure
export interface RootLayoutComponent {
  (props: LayoutProps): React.ReactElement;
  metadata?: Metadata;
}

// Page configuration
export interface PageConfig {
  revalidate?: number; // ISR: seconds to revalidate
  runtime?: 'nodejs' | 'edge';
  dynamic?: 'auto' | 'force-dynamic' | 'force-static';
}

// Route data interface
export interface RouteData {
  params: Record<string, string>;
  query: Record<string, any>;
  pathname: string;
  searchParams: Record<string, string>;
}

// Page component props - automatically includes route data
export interface PageProps<
  TParams extends Record<string, string> = Record<string, string>,
  TQuery extends Record<string, any> = Record<string, any>,
> extends RouteData {
  params: TParams;
  query: TQuery;
  [key: string]: any;
}
