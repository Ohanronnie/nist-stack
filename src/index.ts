// Main framework exports (use explicit file paths to avoid directory imports at runtime)
export * from "./common/index.js";
export * from "./core/index.js";
export * from "./client/index.js";

// Re-export commonly used items
export { NistInterceptor } from "./common/page.interceptor.js";
export { Page, PageRoot, Layout } from "./common/index.js";
export type {
  PageResponse,
  PageMetadata,
} from "./common/page-response.types.js";
export { createViteDevServer } from "./core/vite.server.js";
export { NistError } from "./core/nist.error.js";
export { bootstrapNist } from "./core/bootstrap.js";

// Guards and filters
export { RedirectException } from "./common/redirect.exception.js";
export { RedirectExceptionFilter } from "./common/redirect.filter.js";
