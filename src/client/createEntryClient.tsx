import React, { StrictMode, ComponentType, ReactElement } from "react";
import { hydrateRoot, Root } from "react-dom/client";

/**
 * Metadata optionally attached to a page component.
 */
export interface PageMetadata {
  title?: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * Represents a dynamically imported page module.
 */
export interface PageModule {
  default: ComponentType<any>;
  metadata?: PageMetadata;
}

/**
 * Represents a dynamically imported layout module.
 */
export interface LayoutModule {
  default: ComponentType<any>;
}

/**
 * Defines the structure of global variables injected by the server.
 */
export interface HydrationGlobals {
  __INITIAL_PROPS__?: Record<string, unknown>;
  __PAGE_NAME__?: string;
  __NIST_ROOT__?: Root;
  [key: string]: unknown;
}

/**
 * Configuration for creating a client entry.
 */
export interface CreateClientEntryOptions {
  globals: HydrationGlobals;
  pages: Record<string, () => Promise<PageModule>>;
  layouts: Record<string, () => Promise<LayoutModule>>;
  targetId: string;
}

/**
 * Creates and hydrates a client-side React application from server-injected globals.
 * This version requires all options — nothing is optional or defaulted.
 */
export function createClientEntry(options: CreateClientEntryOptions) {
  console.log("Creating client entry...");
  const { globals, pages, layouts, targetId } = options;

  const { __INITIAL_PROPS__, __PAGE_NAME__ } = globals;
  if (!__PAGE_NAME__) throw new Error("Missing __PAGE_NAME__ — cannot hydrate");

  const rootEl = document.getElementById(targetId);
  if (!rootEl) throw new Error(`Root element not found: #${targetId}`);
  console.log(globals.__NIST_ROOT__, "NIST ROOT");
  let root: Root | undefined = globals.__NIST_ROOT__;

  async function render(): Promise<void> {
    console.log("Rendering page:", __PAGE_NAME__);
    // Find the matching page
    const pagePath = Object.keys(pages).find((p) =>
      p.endsWith(`/${__PAGE_NAME__}.page.tsx`)
    );
    if (!pagePath) throw new Error(`Page not found: ${__PAGE_NAME__}`);
    console.log(`Loading page module: ${pagePath}`);
    const pageModule = await pages[pagePath]();
    const Page = pageModule.default;
    if (!Page) throw new Error(`Page ${__PAGE_NAME__} has no default export`);

    const metadata = pageModule.metadata;

    // Find layout, if any
    let Wrapped: ComponentType<any> = Page;
    const pageDir = pagePath.substring(0, pagePath.lastIndexOf("/pages/"));
    const layoutPath = Object.keys(layouts).find(
      (p) =>
        p.startsWith(pageDir + "/") &&
        p.endsWith(".layout.tsx") &&
        !p.includes("/pages/")
    );

    if (layoutPath) {
      const layoutModule = await layouts[layoutPath]();
      if (layoutModule?.default) {
        const Layout = layoutModule.default;
        Wrapped = (props: any) => (
          <Layout {...props}>
            <Page {...props} />
          </Layout>
        );
      }
    }

    const element: ReactElement = (
      <StrictMode>
        <Wrapped {...__INITIAL_PROPS__} />
      </StrictMode>
    );

    // Hydrate or re-render
    if (!root) {
      // Hydrate into the server-rendered container (e.g. <div id="root">)
      root = hydrateRoot(rootEl!, element);
      globals.__NIST_ROOT__ = root;
    } else {
      root.render(element);
    }

    // Apply metadata if provided
    if (metadata?.title) document.title = metadata.title;
  }

  return { render, rootEl };
}
