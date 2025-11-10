/**
 * Metadata that can be returned from a page controller to dynamically
 * set SEO and meta tags for a page.
 */
export interface PageMetadata {
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

/**
 * Response format for page controllers.
 * Controllers can return this format to provide both data and metadata.
 *
 * @example
 * ```typescript
 * @Get()
 * @Page('home')
 * getHome(): PageResponse<{ users: string[] }> {
 *   return {
 *     data: { users: ['Alice', 'Bob'] },
 *     metadata: {
 *       title: 'Home - My App',
 *       description: 'Welcome to my app'
 *     }
 *   };
 * }
 * ```
 *
 * If metadata is omitted, static metadata from the page file will be used.
 * If only data is needed, controllers can return data directly (backward compatible).
 */
export interface PageResponse<T = any> {
  /**
   * Data to pass to the page component as props
   */
  data: T;

  /**
   * Optional metadata to override static metadata
   * This allows for dynamic SEO based on route params, user data, etc.
   */
  metadata?: PageMetadata;
}
