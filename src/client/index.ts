// Client-side exports
export { Link } from "./Link";
export { Image } from "./Image";
export { ErrorBoundary } from "./ErrorBoundary";
export { createClientEntry } from "./createEntryClient";
// Hooks
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
} from "./router.hooks";

// Router component
export { Router, useRouter } from "./router";
export {
  type PageMetadata,
  type PageModule,
  type LayoutModule,
  type HydrationGlobals,
  type CreateClientEntryOptions,
} from "./createEntryClient";

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

export interface LayoutProps {
  children: React.ReactNode;
  [key: string]: any;
}

export interface RootLayoutComponent {
  (props: LayoutProps): React.ReactElement;
  metadata?: Metadata;
}

export interface PageConfig {
  revalidate?: number; // ISR: seconds to revalidate
  runtime?: "nodejs" | "edge";
  dynamic?: "auto" | "force-dynamic" | "force-static";
}

export interface RouteData {
  params: Record<string, string>;
  query: Record<string, any>;
  pathname: string;
  searchParams: Record<string, string>;
}

export interface PageProps<
  TParams extends Record<string, string> = Record<string, string>,
  TQuery extends Record<string, any> = Record<string, any>
> extends RouteData {
  params: TParams;
  query: TQuery;
  [key: string]: any;
}
