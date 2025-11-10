import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Injectable,
} from "@nestjs/common";
import type { Response } from "express";
import { RedirectException } from "./redirect.exception.js";

/**
 * Exception filter that handles RedirectException by performing HTTP redirects.
 * Register this globally in your main.ts:
 *
 * @example
 * ```typescript
 * app.useGlobalFilters(new RedirectExceptionFilter());
 * ```
 */
@Injectable()
@Catch(RedirectException)
export class RedirectExceptionFilter implements ExceptionFilter {
  catch(exception: RedirectException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Set redirect headers and status manually to ensure it works
    response.status(exception.statusCode);
    response.setHeader("Location", exception.url);
    response.end();
  }
}
