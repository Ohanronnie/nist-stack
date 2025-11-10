import { INestApplication } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { join } from "path";
import express from "express";
import { createViteDevServer } from "./vite.server";
import { NistInterceptor } from "../common/page.interceptor";
import { RedirectExceptionFilter } from "../common/redirect.filter";

/**
 * Bootstrap NIST-specific setup for server-side rendering
 *
 * This function configures:
 * - Vite dev server / production asset serving
 * - SSR interceptor for rendering React components
 * - Redirect exception filter for authentication flows
 * - HMR support in development
 *
 * @param app - NestJS application instance
 *
 * @example
 * ```typescript
 * import { NestFactory } from '@nestjs/core';
 * import { bootstrapNist } from 'nist-stack';
 * import { AppModule } from './app.module';
 *
 * async function bootstrap() {
 *   const app = await NestFactory.create(AppModule);
 *
 *   // Setup NIST SSR
 *   await bootstrapNist(app);
 *
 *   // Start server
 *   await app.listen(3000);
 * }
 * bootstrap();
 * ```
 */
export async function bootstrapNist(app: INestApplication): Promise<void> {
  const isProduction = process.env.NODE_ENV === "production";
  const rootDir = process.cwd();

  // 1. Create Vite server (dev or production mode)
  const vite = await createViteDevServer();

  // 2. Remove CSP header in development (allows Vite HMR)
  if (!isProduction) {
    app.use((req: any, res: any, next: any) => {
      res.removeHeader("Content-Security-Policy");
      next();
    });
  }

  // 3. Setup Vite asset serving
  if (isProduction) {
    // Production: serve built assets with long-term caching
    app.use(
      "/assets",
      express.static(join(rootDir, "dist/client/assets"), {
        maxAge: "1y",
        immutable: true,
      })
    );
  } else {
    // Development: use Vite middleware for HMR
    if (vite.dev) {
      app.use(vite.dev.middlewares);
    }
  }

  // 4. Get reflector for decorator metadata
  const reflector = app.get(Reflector);

  // 5. Register NIST-specific global filters
  app.useGlobalFilters(new RedirectExceptionFilter());

  // 6. Register NIST SSR interceptor
  app.useGlobalInterceptors(new NistInterceptor(reflector, vite));
}
