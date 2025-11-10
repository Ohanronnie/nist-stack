/**
 * Exception that triggers a redirect response.
 * Throw this from guards or interceptors to redirect users to another page.
 *
 * @example
 * ```typescript
 * if (!user) {
 *   throw new RedirectException('/login');
 * }
 * ```
 */
export class RedirectException {
  public readonly name = "RedirectException";
  public readonly url: string;
  public readonly statusCode: number;
  public readonly message: string;

  constructor(url: string, statusCode: number = 302) {
    this.url = url;
    this.statusCode = statusCode;
    this.message = `Redirecting to ${url}`;
  }
}
