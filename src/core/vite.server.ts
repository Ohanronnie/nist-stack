// ssr/vite.server.ts
import { createServer as createViteServer, ViteDevServer } from "vite";
import { join } from "path";
import { existsSync, readFileSync } from "fs";

export interface ProductionManifest {
  [key: string]: {
    file: string;
    css?: string[];
    imports?: string[];
  };
}

export interface ViteServer {
  mode: "development" | "production";
  dev?: ViteDevServer;
  manifest?: ProductionManifest;
  ssrManifest?: ProductionManifest;

  ssrLoadModule(path: string): Promise<any>;
  transformIndexHtml(url: string, html: string): Promise<string>;
}

// Singleton cache for Vite dev server (persists across NestJS restarts)
let viteDevServerInstance: ViteServer | null = null;

export async function createViteDevServer(): Promise<ViteServer> {
  const isProduction = process.env.NODE_ENV === "production";

  // In development, reuse existing Vite server across NestJS restarts
  if (!isProduction && viteDevServerInstance) {
    console.log("♻️  Reusing existing Vite dev server (HMR preserved)");
    return viteDevServerInstance;
  }

  if (isProduction) {
    // Production mode - load pre-built bundles
    const root = process.cwd();
    const clientDir = join(root, "dist/client");
    const ssrDir = join(root, "dist/client-ssr");

    let manifest: ProductionManifest = {};
    let ssrManifest: ProductionManifest = {};

    // Load manifests
    const manifestPath = join(clientDir, ".vite/manifest.json");
    const ssrManifestPath = join(clientDir, ".vite/ssr-manifest.json");

    if (existsSync(manifestPath)) {
      manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    }

    if (existsSync(ssrManifestPath)) {
      ssrManifest = JSON.parse(readFileSync(ssrManifestPath, "utf-8"));
    }

    return {
      mode: "production",
      manifest,
      ssrManifest,

      async ssrLoadModule(path: string): Promise<any> {
        // In production, load from built files
        // Convert source path to dist path
     
        let modulePath = path;
        // Handle source paths - convert to dist paths
        if (path.includes("/src/")) {
          modulePath = path.replace("/src/", "/dist/src/");
          modulePath = modulePath.replace(".tsx", ".js");
        } else if (path.includes("/nist/")) {
          modulePath = path.replace("/nist/", "/dist/nist/");
          modulePath = modulePath.replace(".tsx", ".js").replace(".ts", ".js");
        } else if (path.includes("/ui/")) {
          modulePath = path.replace("/ui/", "/dist/ui/");
          modulePath = modulePath.replace(".tsx", ".js");
        } else if (path.includes("/app/")) {
          modulePath = path.replace("/app/", "/dist/app/");
          modulePath = modulePath.replace(".tsx", ".js");
        }

        // Dynamic import from built files
        const absPath = modulePath.startsWith("/")
          ? modulePath
          : join(root, modulePath);

        // Use require for CommonJS modules (NestJS compiles to CommonJS)
        // This handles the exports.default pattern correctly
        
        delete require.cache[absPath]; // Clear cache for fresh imports
        const mod = require(absPath);
        // Return the module as-is (it will have .default property)
        return mod;
      },

      async transformIndexHtml(url: string, html: string): Promise<string> {
        // In production, inject built assets
        const entryFile = manifest["src/entry-client.tsx"]?.file;
        const cssFiles = manifest["src/entry-client.tsx"]?.css || [];

        let transformed = html;

        // Replace dev script with production bundle
        transformed = transformed.replace(
          '<script type="module" src="/src/entry-client.tsx"></script>',
          `${cssFiles
            .map((css) => `<link rel="stylesheet" href="/${css}" />`)
            .join("\n    ")}
    <script type="module" src="/${entryFile}"></script>`
        );

        // Replace dev CSS with production CSS
        transformed = transformed.replace(
          '<link rel="stylesheet" href="/src/globals.css" />',
          '<link rel="stylesheet" href="/assets/globals.css" />'
        );

        return transformed;
      },
    };
  } else {
    // Development mode - use Vite dev server
    console.log("🚀 Creating new Vite dev server...");
    console.log(process.cwd());
    const vite = await createViteServer({
      root: process.cwd(),
      server: { middlewareMode: true },
      appType: "custom",
    });

    viteDevServerInstance = {
      mode: "development",
      dev: vite,

      async ssrLoadModule(path: string): Promise<any> {
        return vite.ssrLoadModule(path);
      },

      async transformIndexHtml(url: string, html: string): Promise<string> {
        return vite.transformIndexHtml(url, html);
      },
    };

    console.log("✅ Vite dev server ready with HMR");
    return viteDevServerInstance;
  }
}
