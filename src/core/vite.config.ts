import { defineConfig, UserConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

/**
 * Deeply merges two objects.
 * - Arrays: concatenated + deduped
 * - Objects: recursively merged
 * - Primitives: override
 */
function deepMerge<T extends Record<string, any>>(base: T, extend: T): T {
  const output: Record<string, any> = Array.isArray(base)
    ? [...base]
    : { ...base };

  for (const key of Object.keys(extend)) {
    const baseVal = output[key];
    const extendVal = extend[key];

    if (Array.isArray(baseVal) && Array.isArray(extendVal)) {
      output[key] = Array.from(new Set([...baseVal, ...extendVal]));
    } else if (
      baseVal &&
      typeof baseVal === "object" &&
      !Array.isArray(baseVal) &&
      extendVal &&
      typeof extendVal === "object" &&
      !Array.isArray(extendVal)
    ) {
      output[key] = deepMerge(baseVal, extendVal);
    } else {
      output[key] = extendVal;
    }
  }

  return output as T;
}

/**
 * Creates a base Vite configuration.
 * Allows passing overrides.
 */
export function createConfig(overrides: UserConfig = {}) {
  return defineConfig(({ command, mode }) => {
    const isProduction = mode === "production";
    const isSsrBuild = process.env.VITE_SSR_BUILD === "true";

    const base: UserConfig = {
      plugins: [react({ jsxRuntime: "automatic" })],
      root: process.cwd(),
      appType: "custom",

      server: {
        middlewareMode: true,
        hmr: {
          protocol: "ws",
          host: "localhost",
          timeout: 30000,
          overlay: true,
          clientPort: 24678,
        },
      },

      resolve: {
        alias: {},
      },

      publicDir: !isSsrBuild ? "public" : false,

      css: {
        modules: {
          localsConvention: "camelCaseOnly",
          generateScopedName: isProduction
            ? "[hash:base64:8]"
            : "[name]__[local]___[hash:base64:5]",
        },
        postcss: "./postcss.config.js",
      },

      optimizeDeps: {
        include: [
          "react",
          "react-dom",
          "react-dom/client",
          "nist-stack/client",
        ],
        esbuildOptions: { target: "esnext" },
      },

      build: {
        outDir: isSsrBuild ? "dist/client-ssr" : "dist/client",
        emptyOutDir: true,
        manifest: !isSsrBuild,
        ssrManifest: !isSsrBuild,
        sourcemap: !isProduction,
        minify: isProduction && !isSsrBuild,
        ssr: isSsrBuild,
        rollupOptions: {
          input: resolve(process.cwd(), "src/entry-client.tsx"),
          output: {
            format: "esm",
            entryFileNames: "[name].mjs",
            chunkFileNames: "[name]-[hash].mjs",
            assetFileNames: "[name]-[hash][extname]",
          },
        },
      },

      ssr: {
        target: "node",
        external: ["nist-stack"],
      },
    };

    return deepMerge(base, overrides);
  });
}
