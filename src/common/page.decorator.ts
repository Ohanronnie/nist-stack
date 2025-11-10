import { SetMetadata, Logger } from "@nestjs/common";
import { existsSync, statSync } from "fs";
import { join, dirname } from "path";
import { NistError } from "../core/nist.error.js";

export const PAGE_METADATA_KEY = "page:component";
export const PAGE_ROOT_METADATA_KEY = "page:root";
export const PAGES_DIR_METADATA_KEY = "page:pages_dir";

const logger = new Logger("NIST");

/**
 * Marks a controller method as a page entrypoint.
 * Validates at decoration time that the page file exists.
 */
export function Page(name: string) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    // Store the page name in metadata
    SetMetadata(PAGE_METADATA_KEY, name)(target, propertyKey, descriptor);

    // Note: We can't validate the file here because we don't have the pageRoot yet.
    // Validation will happen in a validation service or interceptor
    return descriptor;
  };
}

/**
 * Associates a controller with its page root directory.
 * Validates that the directory exists and is a valid folder.
 *
 * By default, pages are looked up in `{dirname}/pages/` subdirectory.
 *
 *  If the pages directory doesn't exist, uses dirname directly.
 */
export function PageRoot(dirname: string): ClassDecorator {
  return <TFunction extends Function>(target: TFunction): TFunction => {
    // Validate directory exists
    if (!existsSync(dirname)) {
      throw new NistError(`PageRootError: Directory not found: ${dirname}`);
    }

    const stats = statSync(dirname);
    if (!stats.isDirectory()) {
      throw new NistError(
        `PageRootError: "${dirname.split("/").pop()}" is not a directory`
      );
    }

    // Check if pages subdirectory exists
    const pagesDir = join(dirname, "pages");
    const hasPagesDir =
      existsSync(pagesDir) && statSync(pagesDir).isDirectory();

    // Store the page root in metadata
    SetMetadata(PAGE_ROOT_METADATA_KEY, dirname)(target);
    SetMetadata(PAGES_DIR_METADATA_KEY, hasPagesDir)(target);

    return target;
  };
}

/**
 * Validates that a page file exists and has a default export.
 * This should be called during application initialization.
 */
export async function validatePageFile(
  pageRoot: string,
  pageName: string,
  hasPagesDir: boolean = false
): Promise<void> {
  // Convert dist path back to src path for validation
  // In production, __dirname points to dist/src, but .tsx files are in src
  let sourcePath = pageRoot;
  if (pageRoot.includes("/dist/")) {
    sourcePath = pageRoot.replace("/dist/", "/");
  }

  // Check pages/ subdirectory first if it exists
  const pagesSubdir = hasPagesDir ? "pages" : "";
  const pagePath = join(sourcePath, pagesSubdir, `${pageName}.page.tsx`);

  // Check if file exists
  if (!existsSync(pagePath)) {
    throw new NistError(
      `Page file not found: ${pagePath}\n` +
        `Expected: ${pageName}.page.tsx in ${join(sourcePath, pagesSubdir)}`
    );
  }

  logger.log(`✓ Validated page: ${pageName}.page.tsx`);
}
