import { SetMetadata } from '@nestjs/common';

export const LAYOUT_METADATA_KEY = 'page:layout';

/**
 * Specifies a custom layout for a page.
 * If not specified, will use the default layout for the directory.
 */
export function Layout(name: string) {
  return SetMetadata(LAYOUT_METADATA_KEY, name);
}
