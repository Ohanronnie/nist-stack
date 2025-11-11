# Error Handling

NIST provides comprehensive error handling mechanisms for building robust server-side rendered applications. This guide covers error boundaries, custom exceptions, and best practices for handling errors at different layers of your application.

## Overview

Error handling in NIST occurs at multiple levels:

1. **Controller-level exceptions** - NestJS exception filters
2. **Server-side rendering errors** - Caught by the interceptor
3. **Client-side errors** - React error boundaries
4. **Custom exceptions** - Application-specific error types

## Custom Exceptions

### RedirectException

The `RedirectException` is a specialized exception for performing server-side HTTP redirects. This is commonly used in guards and middleware to redirect unauthenticated users or handle authorization logic.

```typescript
import { RedirectException } from "nist-stack";

throw new RedirectException("/login", 302);
```

**Parameters:**

- `url` (string): The target redirect URL
- `statusCode` (number, optional): HTTP status code (default: 302)
  - `301` - Permanent redirect
  - `302` - Temporary redirect (default)
  - `303` - See Other
  - `307` - Temporary redirect (preserves method)
  - `308` - Permanent redirect (preserves method)

**Example: Authentication Guard**

```typescript
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { RedirectException } from "nist-stack";

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.session?.user;

    if (!user) {
      throw new RedirectException("/login", 302);
    }

    return true;
  }
}
```

### RedirectExceptionFilter

To enable redirect exceptions, register the global filter in your application:

```typescript
import { NestFactory } from "@nestjs/core";
import { RedirectExceptionFilter } from "nist-stack";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Register redirect exception filter globally
  app.useGlobalFilters(new RedirectExceptionFilter());

  await app.listen(3000);
}
bootstrap();
```

## NestJS Exception Filters

NIST leverages NestJS's powerful exception filter system. You can create custom exception filters to handle specific error scenarios.

### Creating a Custom Exception Filter

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      message:
        typeof exceptionResponse === "string"
          ? exceptionResponse
          : (exceptionResponse as any).message,
    };

    response.status(status).json(errorResponse);
  }
}
```

### Registering Exception Filters

**Global registration:**

```typescript
app.useGlobalFilters(new HttpExceptionFilter());
```

**Controller-level registration:**

```typescript
@Controller()
@UseFilters(HttpExceptionFilter)
export class AppController {
  // ...
}
```

**Route-level registration:**

```typescript
@Get()
@UseFilters(HttpExceptionFilter)
getHome() {
  // ...
}
```

## Built-in HTTP Exceptions

NestJS provides built-in HTTP exceptions for common scenarios:

```typescript
import {
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from "@nestjs/common";

// 400 Bad Request
throw new BadRequestException("Invalid input data");

// 401 Unauthorized
throw new UnauthorizedException("Authentication required");

// 403 Forbidden
throw new ForbiddenException("Access denied");

// 404 Not Found
throw new NotFoundException("Resource not found");

// 500 Internal Server Error
throw new InternalServerErrorException("Server error");
```

## Error Handling in Page Components

### Server-Side Error Handling

Errors thrown during server-side rendering are caught by the NIST interceptor:

```typescript
@Get('post/:id')
@Page('post')
async getPost(@Param('id') id: string): PageResponse {
  const post = await this.postService.findById(id);

  if (!post) {
    throw new NotFoundException(`Post ${id} not found`);
  }

  return {
    data: { post },
    metadata: {
      title: post.title,
      description: post.excerpt,
    },
  };
}
```

### Client-Side Error Boundaries

Implement React error boundaries to handle runtime errors gracefully:

```tsx
import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-boundary">
            <h1>Something went wrong</h1>
            <p>{this.state.error?.message}</p>
            <button onClick={() => window.location.reload()}>
              Reload page
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

**Usage in layout:**

```tsx
import { ErrorBoundary } from "./ErrorBoundary";

export default function AppLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
```

## Custom Error Pages

Create custom error pages for different HTTP status codes:

### 404 Not Found Page

```typescript
// 404.controller.ts
import { Controller, Get } from "@nestjs/common";
import { Page, PageRoot } from "nist-stack";
import type { PageResponse } from "nist-stack";

@PageRoot(__dirname)
@Controller()
export class NotFoundController {
  @Get("*")
  @Page("404")
  notFound(): PageResponse {
    return {
      data: {},
      metadata: {
        title: "404 - Page Not Found",
      },
    };
  }
}
```

```tsx
// 404.page.tsx
export default function NotFound() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/">Go back home</a>
    </div>
  );
}
```

## Error Logging

### Integration with Logging Services

```typescript
import { Injectable, Logger } from "@nestjs/common";
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from "@nestjs/common";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    const message =
      exception instanceof HttpException
        ? exception.message
        : "Internal server error";

    // Log the error
    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : exception
    );

    // Send error response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

## Best Practices

### 1. Use Appropriate HTTP Status Codes

```typescript
// Bad
throw new Error("User not found");

// Good
throw new NotFoundException("User not found");
```

### 2. Provide Meaningful Error Messages

```typescript
// Bad
throw new BadRequestException("Invalid");

// Good
throw new BadRequestException(
  "Email format is invalid. Expected: user@example.com"
);
```

### 3. Don't Expose Sensitive Information

```typescript
// Bad
throw new InternalServerErrorException(`Database error: ${dbError.message}`);

// Good
this.logger.error("Database error:", dbError);
throw new InternalServerErrorException(
  "An error occurred processing your request"
);
```

### 4. Handle Async Errors Properly

```typescript
// Good
@Get()
async getData(): Promise<PageResponse> {
  try {
    const data = await this.service.fetchData();
    return { data, metadata: {} };
  } catch (error) {
    this.logger.error('Failed to fetch data', error);
    throw new InternalServerErrorException('Failed to load data');
  }
}
```

### 5. Use Guard Redirects for Authentication

```typescript
// Good - Use RedirectException for auth redirects
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    if (!request.session?.user) {
      throw new RedirectException("/login", 302);
    }

    return true;
  }
}
```

## See Also

- [Guards & Redirects](/features/guards) - Authentication and authorization
- [RedirectException API](/api/types#redirectexception) - Detailed redirect usage
- [NestJS Exception Filters](https://docs.nestjs.com/exception-filters) - Official NestJS documentation
