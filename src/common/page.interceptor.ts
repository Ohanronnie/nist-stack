import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import { Reflector } from "@nestjs/core";
import { join } from "path";
import { existsSync, readdirSync } from "fs";
import { Observable } from "rxjs";
import { switchMap } from "rxjs/operators";
import type { ViteServer } from "../core/vite.server.js";
import { NistError } from "../core/nist.error.js";
import React from "react";
import {
  PAGE_METADATA_KEY,
  PAGE_ROOT_METADATA_KEY,
  PAGES_DIR_METADATA_KEY,
} from "./page.decorator.js";
import { LAYOUT_METADATA_KEY } from "./layout.decorator.js";
import { randomBytes } from "crypto";
import { renderToString } from "react-dom/server";

// ============================================================================
// PERFORMANCE OPTIMIZATIONS
// ============================================================================

// 1. Cache compiled regex patterns
const SAFE_PAGE_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
const HTML_ESCAPE_REGEX = /[&<>"'/]/g;
const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

// 2. Cache module imports (critical for performance)
interface CachedModule {
  component: React.ComponentType<any>;
  metadata: any;
  config: any;
  timestamp: number;
}

interface CachedLayout {
  component: React.ComponentType<any>;
  metadata: any;
  timestamp: number;
}

const MODULE_CACHE = new Map<string, CachedModule>();
const LAYOUT_CACHE = new Map<string, CachedLayout>();
const LAYOUT_DISCOVERY_CACHE = new Map<string, string | null>();
const ROOT_LAYOUT_CACHE = new Map<string, CachedLayout>();

// Cache invalidation time (10 seconds in dev, disabled in prod)
const CACHE_TTL = process.env.NODE_ENV === "production" ? Infinity : 10000;

// 3. Pre-build security headers (static, no need to recreate)
const SECURITY_HEADERS = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' ws: wss:",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
  ].join("; "),
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};

// 4. Object pool for route data (reduce allocations)
class RouteDataPool {
  private pool: any[] = [];

  acquire(req: any): any {
    const obj = this.pool.pop() || {};
    obj.params = req.params || {};
    obj.query = req.query || {};
    obj.pathname = req.path || req.url?.split("?")[0] || "/";
    const url = new URL(
      req.url || "/",
      `http://${req.headers.host || "localhost"}`
    );
    obj.searchParams = Object.fromEntries(url.searchParams.entries());
    return obj;
  }

  release(obj: any): void {
    // Clear references
    obj.params = null;
    obj.query = null;
    obj.pathname = null;
    obj.searchParams = null;
    this.pool.push(obj);
  }
}

const routePool = new RouteDataPool();

@Injectable()
export class NistInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly vite: ViteServer
  ) {}
  private readonly logger = new Logger("Nist");
  // Pre-allocate CSRF token buffer for better performance
  private csrfTokenBuffer = Buffer.allocUnsafe(32);

  private generateCSRFToken(): string {
    randomBytes(32).copy(this.csrfTokenBuffer);
    return this.csrfTokenBuffer.toString("hex");
  }

  private escapeHtml(text: string): string {
    return text.replace(HTML_ESCAPE_REGEX, (char) => HTML_ESCAPE_MAP[char]);
  }

  private validatePageName(pageName: string): boolean {
    // Fast path: check for dangerous characters first (cheaper than regex)
    if (
      pageName.includes("..") ||
      pageName.includes("/") ||
      pageName.includes("\\")
    ) {
      return false;
    }
    return SAFE_PAGE_NAME_PATTERN.test(pageName);
  }

  private extractRouteParams(req: any): any {
    return routePool.acquire(req);
  }

  private sanitizeInitialProps(data: any, depth = 0): any {
    // Add depth limit to prevent stack overflow
    if (depth > 10 || !data || typeof data !== "object") {
      return data;
    }

    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    for (const key in sanitized) {
      if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
        const value = sanitized[key];

        if (key === "password" || key === "passwordHash") {
          delete sanitized[key];
          continue;
        }

        if (value && typeof value === "object") {
          sanitized[key] = this.sanitizeInitialProps(value, depth + 1);
        }
      }
    }

    return sanitized;
  }

  private serializeJavaScript(data: any): string {
    // Use single pass with callback for better performance
    const jsonString = JSON.stringify(data);
    return jsonString.replace(/[<>\/\u2028\u2029]/g, (char) => {
      switch (char) {
        case "<":
          return "\\u003c";
        case ">":
          return "\\u003e";
        case "/":
          return "\\u002f";
        case "\u2028":
          return "\\u2028";
        case "\u2029":
          return "\\u2029";
        default:
          return char;
      }
    });
  }

  private setSecurityHeaders(res: Response): void {
    // Batch set headers (faster than individual calls)
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      res.setHeader(key, value);
    }
  }

  // Cache-aware module loading
  private async loadPageModule(pagePath: string): Promise<CachedModule> {
    const cached = MODULE_CACHE.get(pagePath);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached;
    }

    const pageModule = await this.vite.ssrLoadModule(pagePath);

    // Extract metadata from companion file
    let metadata = {};

    // Try companion file first (preferred - no Fast Refresh issues)
    const metadataPath = pagePath.replace(".page.tsx", ".metadata.ts");
    if (existsSync(metadataPath)) {
      try {
        const metadataModule = await this.vite.ssrLoadModule(metadataPath);
        metadata = metadataModule.metadata || metadataModule.default || {};
      } catch (metaError: any) {
        this.logger.warn(
          `Failed to load page metadata: ${metaError?.message || metaError}`
        );
      }
    } else if (typeof pageModule.getMetadata === "function") {
      // Fallback: export function getMetadata() { return {...} }
      metadata = pageModule.getMetadata();
    } else if (pageModule.metadata) {
      // Fallback: export const metadata = {...}
      metadata = pageModule.metadata;
    }

    const cachedModule: CachedModule = {
      component: pageModule.default,
      metadata,
      config: pageModule.config || {},
      timestamp: Date.now(),
    };

    MODULE_CACHE.set(pagePath, cachedModule);
    return cachedModule;
  }

  // Load not-found page (custom or default)
  private async loadNotFoundPage(sourcePath: string): Promise<CachedModule> {
    const cacheKey = `${sourcePath}:not-found`;
    const cached = MODULE_CACHE.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached;
    }

    let component;
    let metadata = {
      title: "404 - Page Not Found",
      description: "The page you are looking for does not exist.",
      robots: "noindex, nofollow",
    };

    // Try to load custom not-found.page.tsx
    const customNotFoundPath = join(sourcePath, "not-found.page.tsx");
    try {
      const customModule = await this.vite.ssrLoadModule(customNotFoundPath);
      component = customModule.default;

      // Try to load metadata for custom not-found page
      const metadataPath = join(sourcePath, "not-found.metadata.ts");
      if (existsSync(metadataPath)) {
        try {
          const metadataModule = await this.vite.ssrLoadModule(metadataPath);
          metadata = {
            ...metadata,
            ...(metadataModule.metadata || metadataModule.default || {}),
          };
        } catch (error) {
          // Use default metadata
        }
      }
    } catch (error) {
      // Use default not-found component
      const defaultModule = await import("./default-not-found.js");
      component = defaultModule.default;
    }

    const cachedModule: CachedModule = {
      component,
      metadata,
      config: {},
      timestamp: Date.now(),
    };

    MODULE_CACHE.set(cacheKey, cachedModule);
    return cachedModule;
  }

  // Load root layout (app.layout.tsx)
  private async loadRootLayout(
    sourcePath: string
  ): Promise<CachedLayout | null> {
    const cached = ROOT_LAYOUT_CACHE.get(sourcePath);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached;
    }

    const rootLayoutPath = join(sourcePath, "app.layout.tsx");

    if (!existsSync(rootLayoutPath)) {
      return null;
    }

    try {
      const layoutModule = await this.vite.ssrLoadModule(rootLayoutPath);

      // Extract metadata from layout module OR companion file
      let metadata = {};

      // Try companion file first (preferred - no Fast Refresh issues)
      const metadataPath = join(sourcePath, "app.metadata.ts");
      if (existsSync(metadataPath)) {
        try {
          const metadataModule = await this.vite.ssrLoadModule(metadataPath);
          metadata = metadataModule.metadata || metadataModule.default || {};
        } catch (metaError: any) {
          this.logger.warn(
            `Failed to load root layout metadata: ${
              metaError?.message || metaError
            }`
          );
        }
      } else if (typeof layoutModule.getMetadata === "function") {
        // Fallback: export function getMetadata() { return {...} }
        metadata = layoutModule.getMetadata();
      } else if (layoutModule.metadata) {
        // Fallback: export const metadata = {...}
        metadata = layoutModule.metadata;
      }

      const cachedLayout: CachedLayout = {
        component: layoutModule.default,
        metadata,
        timestamp: Date.now(),
      };

      ROOT_LAYOUT_CACHE.set(sourcePath, cachedLayout);
      return cachedLayout;
    } catch (error) {
      this.logger.warn(`Failed to load root layout: ${error}`);
      return null;
    }
  }

  // Cache-aware layout loading
  private async loadLayout(
    sourcePath: string,
    customLayout?: string
  ): Promise<CachedLayout | null> {
    const cacheKey = `${sourcePath}:${customLayout || "auto"}`;
    const cached = LAYOUT_CACHE.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached;
    }

    let layoutPath: string | null = null;

    if (customLayout) {
      layoutPath = join(sourcePath, `${customLayout}.layout.tsx`);
    } else {
      // Check layout discovery cache
      const discoveredPath = LAYOUT_DISCOVERY_CACHE.get(sourcePath);
      if (discoveredPath !== undefined) {
        layoutPath = discoveredPath;
      } else {
        try {
          const files = readdirSync(sourcePath);
          // Exclude the root app layout from being discovered as a page-level layout
          const layoutFile = files.find(
            (f) => f.endsWith(".layout.tsx") && f !== "app.layout.tsx"
          );
          layoutPath = layoutFile ? join(sourcePath, layoutFile) : null;
          LAYOUT_DISCOVERY_CACHE.set(sourcePath, layoutPath);
        } catch {
          LAYOUT_DISCOVERY_CACHE.set(sourcePath, null);
        }
      }
    }

    if (!layoutPath || !existsSync(layoutPath)) {
      return null;
    }

    const layoutModule = await this.vite.ssrLoadModule(layoutPath);

    // Extract metadata from layout module OR companion file
    let metadata = {};

    // Try companion file first (preferred - no Fast Refresh issues)
    const metadataPath = layoutPath.replace(".layout.tsx", ".metadata.ts");
    if (existsSync(metadataPath)) {
      try {
        const metadataModule = await this.vite.ssrLoadModule(metadataPath);
        metadata = metadataModule.metadata || metadataModule.default || {};
      } catch (metaError: any) {
        this.logger.warn(
          `Failed to load layout metadata: ${metaError?.message || metaError}`
        );
      }
    } else if (typeof layoutModule.getMetadata === "function") {
      // Fallback: export function getMetadata() { return {...} }
      metadata = layoutModule.getMetadata();
    } else if (layoutModule.metadata) {
      // Fallback: export const metadata = {...}
      metadata = layoutModule.metadata;
    }

    const cachedLayout: CachedLayout = {
      component: layoutModule.default,
      metadata,
      timestamp: Date.now(),
    };

    LAYOUT_CACHE.set(cacheKey, cachedLayout);
    return cachedLayout;
  }

  // Build meta tags component for injection
  private buildMetaTagsComponent(
    mergedMetadata: any,
    csrfToken: string
  ): React.ReactElement {
    const {
      description,
      keywords,
      author,
      robots,
      canonical,
      openGraph,
      twitter,
    } = mergedMetadata;

    const metaElements: React.ReactElement[] = [];

    if (description)
      metaElements.push(
        React.createElement("meta", {
          key: "description",
          name: "description",
          content: description,
        })
      );
    if (keywords)
      metaElements.push(
        React.createElement("meta", {
          key: "keywords",
          name: "keywords",
          content: keywords,
        })
      );
    if (author)
      metaElements.push(
        React.createElement("meta", {
          key: "author",
          name: "author",
          content: author,
        })
      );
    if (robots)
      metaElements.push(
        React.createElement("meta", {
          key: "robots",
          name: "robots",
          content: robots,
        })
      );
    if (canonical)
      metaElements.push(
        React.createElement("link", {
          key: "canonical",
          rel: "canonical",
          href: canonical,
        })
      );

    if (openGraph) {
      const { title, description, image, url, type } = openGraph || {};
      if (title)
        metaElements.push(
          React.createElement("meta", {
            key: "og:title",
            property: "og:title",
            content: title,
          })
        );
      if (description)
        metaElements.push(
          React.createElement("meta", {
            key: "og:description",
            property: "og:description",
            content: description,
          })
        );
      if (image)
        metaElements.push(
          React.createElement("meta", {
            key: "og:image",
            property: "og:image",
            content: image,
          })
        );
      if (url)
        metaElements.push(
          React.createElement("meta", {
            key: "og:url",
            property: "og:url",
            content: url,
          })
        );
      if (type)
        metaElements.push(
          React.createElement("meta", {
            key: "og:type",
            property: "og:type",
            content: type,
          })
        );
    }

    if (twitter) {
      const { card, site, creator, title, description, image } = twitter;
      if (card)
        metaElements.push(
          React.createElement("meta", {
            key: "twitter:card",
            name: "twitter:card",
            content: card,
          })
        );
      if (site)
        metaElements.push(
          React.createElement("meta", {
            key: "twitter:site",
            name: "twitter:site",
            content: site,
          })
        );
      if (creator)
        metaElements.push(
          React.createElement("meta", {
            key: "twitter:creator",
            name: "twitter:creator",
            content: creator,
          })
        );
      if (title)
        metaElements.push(
          React.createElement("meta", {
            key: "twitter:title",
            name: "twitter:title",
            content: title,
          })
        );
      if (description)
        metaElements.push(
          React.createElement("meta", {
            key: "twitter:description",
            name: "twitter:description",
            content: description,
          })
        );
      if (image)
        metaElements.push(
          React.createElement("meta", {
            key: "twitter:image",
            name: "twitter:image",
            content: image,
          })
        );
    }

    metaElements.push(
      React.createElement("meta", {
        key: "csrf-token",
        name: "csrf-token",
        content: csrfToken,
      })
    );
    return React.createElement(React.Fragment, null, ...metaElements);
  }

  // Build meta tags string for fallback template
  private buildMetaTags(mergedMetadata: any, csrfToken: string): string {
    const tags: string[] = [];
    const {
      description,
      keywords,
      author,
      robots,
      canonical,
      openGraph,
      twitter,
    } = mergedMetadata;

    if (description)
      tags.push(
        `<meta name="description" content="${this.escapeHtml(description)}" />`
      );
    if (keywords)
      tags.push(
        `<meta name="keywords" content="${this.escapeHtml(keywords)}" />`
      );
    if (author)
      tags.push(`<meta name="author" content="${this.escapeHtml(author)}" />`);
    if (robots)
      tags.push(`<meta name="robots" content="${this.escapeHtml(robots)}" />`);
    if (canonical)
      tags.push(
        `<link rel="canonical" href="${this.escapeHtml(canonical)}" />`
      );

    if (openGraph) {
      const { title, description, image, url, type } = openGraph;
      if (title)
        tags.push(
          `<meta property="og:title" content="${this.escapeHtml(title)}" />`
        );
      if (description)
        tags.push(
          `<meta property="og:description" content="${this.escapeHtml(
            description
          )}" />`
        );
      if (image)
        tags.push(
          `<meta property="og:image" content="${this.escapeHtml(image)}" />`
        );
      if (url)
        tags.push(
          `<meta property="og:url" content="${this.escapeHtml(url)}" />`
        );
      if (type)
        tags.push(
          `<meta property="og:type" content="${this.escapeHtml(type)}" />`
        );
    }

    if (twitter) {
      const { card, site, creator, title, description, image } = twitter;
      if (card)
        tags.push(
          `<meta name="twitter:card" content="${this.escapeHtml(card)}" />`
        );
      if (site)
        tags.push(
          `<meta name="twitter:site" content="${this.escapeHtml(site)}" />`
        );
      if (creator)
        tags.push(
          `<meta name="twitter:creator" content="${this.escapeHtml(
            creator
          )}" />`
        );
      if (title)
        tags.push(
          `<meta name="twitter:title" content="${this.escapeHtml(title)}" />`
        );
      if (description)
        tags.push(
          `<meta name="twitter:description" content="${this.escapeHtml(
            description
          )}" />`
        );
      if (image)
        tags.push(
          `<meta name="twitter:image" content="${this.escapeHtml(image)}" />`
        );
    }

    tags.push(`<meta name="csrf-token" content="${csrfToken}" />`);
    return tags.join("\n    ");
  }

  // Create hydration scripts component
  private createHydrationScripts(hydrationData: any): React.ReactElement {
    return React.createElement(
      React.Fragment,
      null,
      React.createElement("script", {
        id: "__NIST_DATA__",
        type: "application/json",
        dangerouslySetInnerHTML: {
          __html: this.serializeJavaScript(hydrationData),
        },
      }),
      React.createElement("script", {
        dangerouslySetInnerHTML: {
          __html: `(function(){try{var e=document.getElementById("__NIST_DATA__"),_=JSON.parse(e.textContent || "{}");window.__NIST__=Object.freeze({props:_.props,route:Object.freeze(_.route),page:_.page,hydrated:!1}),window.__INITIAL_PROPS__=_.props,window.__PAGE_NAME__=_.page,window.__ROUTE_PARAMS__=_.route.params,window.__QUERY_PARAMS__=_.route.query,window.__PATHNAME__=_.route.pathname}catch(o){console.error("Failed to parse hydration data:",o)}})();`,
        },
      }),
      React.createElement("script", {
        type: "module",
        src: "/src/entry-client.tsx",
      })
    );
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = performance.now();
    const ctx = context.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    // Read metadata once
    const pageRoot = this.reflector.get<string>(
      PAGE_ROOT_METADATA_KEY,
      context.getClass()
    );
    const pageName = this.reflector.get<string>(
      PAGE_METADATA_KEY,
      context.getHandler()
    );
    const hasPagesDir = this.reflector.get<boolean>(
      PAGES_DIR_METADATA_KEY,
      context.getClass()
    );
    const customLayout = this.reflector.get<string>(
      LAYOUT_METADATA_KEY,
      context.getHandler()
    );

    if (!pageRoot || !pageName) return next.handle();

    if (!this.validatePageName(pageName)) {
      throw new NistError(
        `Invalid page name: ${pageName}. Only alphanumeric characters, hyphens, and underscores are allowed.`
      );
    }

    return next.handle().pipe(
      switchMap(async (result) => {
        try {
          const t1 = performance.now();

          // 1. Extract route data (using pooled objects)
          const routeData = this.extractRouteParams(req);

          // 2. Extract data and metadata from controller response
          const controllerData =
            result?.data !== undefined ? result.data : result;
          const controllerMetadata = result?.metadata || {};

          const enrichedResult = {
            ...controllerData,
            params: routeData.params,
            query: routeData.query,
            pathname: routeData.pathname,
            searchParams: routeData.searchParams,
          };

          // 3. Resolve paths (optimized)
          let sourcePath = pageRoot.includes("/dist/")
            ? pageRoot.replace("/dist/src", "/src/")
            : pageRoot;

          if (!existsSync(sourcePath)) {
            sourcePath = pageRoot.replace("/dist/", "/");
          }

          const pagesSubdir = hasPagesDir ? "pages" : "";
          const pagePath = join(
            sourcePath,
            pagesSubdir,
            `${pageName}.page.tsx`
          );

          const t2 = performance.now();

          // 4. Load all modules in parallel (cached)
          let pageModule: CachedModule;
          let isNotFound = false;

          try {
            pageModule = await this.loadPageModule(pagePath);
          } catch (error) {
            // Page not found, load 404 page
            isNotFound = true;
            res.status(404);
            pageModule = await this.loadNotFoundPage(sourcePath);
          }

          const [cachedLayout, rootLayout] = await Promise.all([
            hasPagesDir
              ? this.loadLayout(sourcePath, customLayout)
              : Promise.resolve(null),
            this.loadRootLayout(sourcePath),
          ]);

          const t3 = performance.now();

          if (!pageModule.component) {
            throw new NistError(
              isNotFound
                ? `No default export found in not-found.page.tsx`
                : `No default export found in ${pageName}.page.tsx`
            );
          }

          // Set cache headers if needed
          if (pageModule.config.revalidate) {
            res.setHeader(
              "Cache-Control",
              `s-maxage=${pageModule.config.revalidate}, stale-while-revalidate`
            );
          }

          // 5. Build layout wrapper
          let WrappedComponent = pageModule.component;
          let layoutMetadata = {};

          if (cachedLayout) {
            layoutMetadata = cachedLayout.metadata || {};
            const Layout = cachedLayout.component;
            if (Layout) {
              WrappedComponent = (props) =>
                React.createElement(
                  Layout,
                  props,
                  React.createElement(pageModule.component, props)
                );
            }
          }

          // 6. Build metadata (root layout → nested layout → page → controller)
          const mergedMetadata = {
            ...(rootLayout?.metadata || {}),
            ...layoutMetadata,
            ...pageModule.metadata,
            ...controllerMetadata,
          };
          const csrfToken = this.generateCSRFToken();

          // 7. Prepare hydration data
          const sanitizedProps = this.sanitizeInitialProps(enrichedResult);
          const hydrationData = {
            props: sanitizedProps,
            route: {
              params: routeData.params,
              query: routeData.query,
              pathname: routeData.pathname,
              searchParams: routeData.searchParams,
            },
            page: pageName,
            timestamp: Date.now(),
          };

          const t4 = performance.now();

          // 8. Create page content with hydration scripts
          const pageContent = React.createElement(
            WrappedComponent,
            enrichedResult
          );
          const hydrationScripts = this.createHydrationScripts(hydrationData);

          const t5 = performance.now();

          let html: string;

          if (rootLayout) {
            // Use root layout to generate complete HTML structure
            const metaTags = this.buildMetaTagsComponent(
              mergedMetadata || {},
              csrfToken
            );
            const rootLayoutProps = {
              ...enrichedResult,
              children: pageContent,
              metaTags,
              hydrationScripts,
              metadata: mergedMetadata || rootLayout?.metadata || {},
              csrfToken,
            };
            const AppLayout = rootLayout.component;

            const completeApp = React.createElement(AppLayout, rootLayoutProps);

            try {
              html = `<!DOCTYPE html>\n${renderToString(completeApp)}`;
            } catch (renderError) {
              this.logger.error(
                `Error during rendering with root layout: ${renderError}`
              );
              throw renderError;
            }
          } else {
            // Fallback to default HTML template
            const metaTagsString = this.buildMetaTags(
              mergedMetadata || {},
              csrfToken
            );
            const appHtml = renderToString(pageContent);
            const charset =
              (mergedMetadata && mergedMetadata.charset) || "UTF-8";
            const viewport =
              (mergedMetadata && mergedMetadata.viewport) ||
              "width=device-width, initial-scale=1.0";
            const title = this.escapeHtml(
              (mergedMetadata && mergedMetadata?.title) || pageName
            );

            html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="${charset}" />
    <meta name="viewport" content="${viewport}" />
    <title>${title}</title>
    ${metaTagsString}
    <link rel="stylesheet" href="/src/globals.css" />
  </head>
  <body>
    <div id="root">${appHtml}</div>
    <script id="__NIST_DATA__" type="application/json">${this.serializeJavaScript(
      hydrationData
    )}</script>
    <script>
     (function(){try{var e=document.getElementById("__NIST_DATA__"),_=JSON.parse(e.textContent || "{}");window.__NIST__=Object.freeze({props:_.props,route:Object.freeze(_.route),page:_.page,hydrated:!1}),window.__INITIAL_PROPS__=_.props,window.__PAGE_NAME__=_.page,window.__ROUTE_PARAMS__=_.route.params,window.__QUERY_PARAMS__=_.route.query,window.__PATHNAME__=_.route.pathname}catch(o){console.error("Failed to parse hydration data:",o)}})();

    </script>
    <script type="module" src="/src/entry-client.tsx"></script>
  </body>
</html>`;
          }

          const t6 = performance.now();

          // 9. Transform HTML
          const transformed = await this.vite.transformIndexHtml(req.url, html);

          const t7 = performance.now();

          // 10. Set headers and send
          this.setSecurityHeaders(res);
          res.setHeader("Content-Type", "text/html");
          res.status(200).end(transformed);
          const endTime = performance.now();

          const timings = {
            setup: (t2 - t1).toFixed(1),
            moduleLoad: (t3 - t2).toFixed(1),
            metadata: (t4 - t3).toFixed(1),
            createElement: (t5 - t4).toFixed(1),
            renderToString: (t6 - t5).toFixed(1),
            viteTransform: (t7 - t6).toFixed(1),
            total: (endTime - startTime).toFixed(1),
          };

          this.logger.debug(
            `Page "${pageName}" | Total: ${timings.total}ms | Load: ${timings.moduleLoad}ms | Render: ${timings.renderToString}ms | Vite: ${timings.viteTransform}ms`
          );
          // Release pooled objects
          routePool.release(routeData);

          return undefined;
        } catch (err: any) {
          throw new NistError(
            err instanceof Error ? err.message : "SSR rendering failed"
          );
        }
      })
    );
  }
}
