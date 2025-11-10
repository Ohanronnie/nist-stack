# Request Context

Access request data, headers, cookies, sessions, and user information in your NIST controllers. This guide covers all aspects of working with HTTP requests in server-side rendered applications.

## Overview

NIST provides full access to the underlying Express request and response objects through NestJS decorators. This enables you to:

- Read request headers and cookies
- Access query parameters and route params
- Manage sessions and authentication
- Set custom response headers
- Handle file uploads

## Accessing Request Data

### Request Object

Access the full Express request object:

```typescript
import { Controller, Get, Req } from "@nestjs/common";
import { Request } from "express";
import { Page, PageRoot } from "nist-stack";
import type { PageResponse } from "nist-stack";

@PageRoot(__dirname)
@Controller()
export class AppController {
  @Get("profile")
  @Page("profile")
  getProfile(@Req() req: Request): PageResponse {
    const userAgent = req.headers["user-agent"];
    const ip = req.ip;
    const protocol = req.protocol;

    return {
      data: { userAgent, ip, protocol },
      metadata: { title: "Profile" },
    };
  }
}
```

### Response Object

Access the response object to set headers:

```typescript
import { Res } from '@nestjs/common';
import { Response } from 'express';

@Get('download')
@Page('download')
getDownload(@Res() res: Response): PageResponse {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="file.pdf"');

  return {
    data: { downloadUrl: '/api/files/document.pdf' },
    metadata: { title: 'Download' },
  };
}
```

## Request Decorators

### @Param - Route Parameters

Extract route parameters:

```typescript
import { Param } from '@nestjs/common';

@Get('user/:id')
@Page('user')
getUser(@Param('id') id: string): PageResponse {
  return {
    data: { userId: id },
    metadata: { title: `User ${id}` },
  };
}

// Multiple parameters
@Get('blog/:category/:slug')
@Page('post')
getPost(
  @Param('category') category: string,
  @Param('slug') slug: string,
): PageResponse {
  return {
    data: { category, slug },
    metadata: { title: slug },
  };
}

// All parameters as object
@Get('post/:year/:month/:day/:slug')
@Page('post')
getPost(@Param() params: any): PageResponse {
  const { year, month, day, slug } = params;
  return {
    data: { date: `${year}-${month}-${day}`, slug },
    metadata: {},
  };
}
```

### @Query - Query Parameters

Extract query string parameters:

```typescript
import { Query } from '@nestjs/common';

@Get('search')
@Page('search')
search(
  @Query('q') query: string,
  @Query('page') page: string = '1',
): PageResponse {
  return {
    data: { query, page: parseInt(page) },
    metadata: { title: `Search: ${query}` },
  };
}

// All query params as object
@Get('filter')
@Page('filter')
filter(@Query() query: Record<string, string>): PageResponse {
  return {
    data: { filters: query },
    metadata: {},
  };
}
```

### @Headers - Request Headers

Read specific headers:

```typescript
import { Headers } from '@nestjs/common';

@Get('info')
@Page('info')
getInfo(
  @Headers('user-agent') userAgent: string,
  @Headers('accept-language') language: string,
): PageResponse {
  return {
    data: { userAgent, language },
    metadata: {},
  };
}
```

### @Ip - Client IP Address

Get the client's IP address:

```typescript
import { Ip } from '@nestjs/common';

@Get('location')
@Page('location')
getLocation(@Ip() ip: string): PageResponse {
  return {
    data: { ip },
    metadata: {},
  };
}
```

### @HostParam - Host Parameters

Extract parameters from subdomain routing:

```typescript
import { HostParam } from "@nestjs/common";

@Controller({ host: ":account.example.com" })
export class AccountController {
  @Get()
  @Page("dashboard")
  getDashboard(@HostParam("account") account: string): PageResponse {
    return {
      data: { account },
      metadata: { title: `${account} Dashboard` },
    };
  }
}
```

## Cookies

### Reading Cookies

Install the cookie parser:

```bash
bun add cookie-parser
bun add -d @types/cookie-parser
```

Configure in `main.ts`:

```typescript
import { NestFactory } from "@nestjs/core";
import * as cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  await app.listen(3000);
}
bootstrap();
```

Access cookies in controllers:

```typescript
import { Req } from '@nestjs/common';
import { Request } from 'express';

@Get('preferences')
@Page('preferences')
getPreferences(@Req() req: Request): PageResponse {
  const theme = req.cookies['theme'] || 'light';
  const language = req.cookies['language'] || 'en';

  return {
    data: { theme, language },
    metadata: {},
  };
}
```

### Setting Cookies

```typescript
import { Res } from '@nestjs/common';
import { Response } from 'express';

@Get('set-theme')
setTheme(
  @Query('theme') theme: string,
  @Res({ passthrough: true }) res: Response,
): PageResponse {
  res.cookie('theme', theme, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    sameSite: 'lax',
  });

  return {
    data: { theme },
    metadata: {},
  };
}
```

## Sessions

### Setting Up Sessions

Install session dependencies:

```bash
bun add express-session
bun add -d @types/express-session
```

Configure in `main.ts`:

```typescript
import { NestFactory } from "@nestjs/core";
import * as session from "express-session";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
    })
  );

  await app.listen(3000);
}
bootstrap();
```

### Using Sessions

Create a session type:

```typescript
// types/express-session.d.ts
import "express-session";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      username: string;
      email: string;
    };
    views?: number;
  }
}
```

Access session in controllers:

```typescript
import { Session } from '@nestjs/common';
import { Session as ExpressSession } from 'express-session';

@Get('dashboard')
@Page('dashboard')
getDashboard(@Session() session: ExpressSession): PageResponse {
  const user = session.user;
  const views = (session.views || 0) + 1;
  session.views = views;

  return {
    data: { user, views },
    metadata: {
      title: user ? `${user.username}'s Dashboard` : 'Dashboard',
    },
  };
}
```

### Login Example

```typescript
@Post('login')
async login(
  @Body() credentials: LoginDto,
  @Session() session: ExpressSession,
): Promise<{ success: boolean }> {
  const user = await this.authService.validateUser(credentials);

  if (user) {
    session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
    };
    return { success: true };
  }

  throw new UnauthorizedException('Invalid credentials');
}

@Post('logout')
logout(@Session() session: ExpressSession): { success: boolean } {
  session.destroy((err) => {
    if (err) {
      this.logger.error('Failed to destroy session', err);
    }
  });
  return { success: true };
}
```

## Custom Decorators

### Creating Custom Parameter Decorators

Extract common request data patterns:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Get current user from session
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.session?.user;
  },
);

// Usage
@Get('profile')
@Page('profile')
getProfile(@CurrentUser() user: User): PageResponse {
  return {
    data: { user },
    metadata: { title: `${user.username}'s Profile` },
  };
}
```

### User Agent Decorator

```typescript
export const UserAgent = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['user-agent'];
  },
);

@Get('info')
@Page('info')
getInfo(@UserAgent() userAgent: string): PageResponse {
  return {
    data: { userAgent },
    metadata: {},
  };
}
```

### Request Timing Decorator

```typescript
export const RequestTime = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.startTime || Date.now();
  }
);
```

## Validation with DTOs

### Creating DTOs

```typescript
import { IsString, IsInt, Min, Max, IsOptional } from "class-validator";

export class SearchDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(100)
  limit?: number = 20;
}
```

### Using DTOs

```typescript
import { ValidationPipe } from '@nestjs/common';

@Get('search')
@Page('search')
search(
  @Query(new ValidationPipe({ transform: true })) dto: SearchDto,
): PageResponse {
  return {
    data: { query: dto.query, page: dto.page },
    metadata: {},
  };
}
```

### Global Validation

Configure global validation in `main.ts`:

```typescript
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  await app.listen(3000);
}
```

## File Uploads

### Single File Upload

```typescript
import { Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

@Post('upload')
@UseInterceptors(FileInterceptor('file'))
uploadFile(@UploadedFile() file: Express.Multer.File) {
  return {
    filename: file.filename,
    size: file.size,
    mimetype: file.mimetype,
  };
}
```

### Multiple Files

```typescript
import { FilesInterceptor } from '@nestjs/platform-express';

@Post('upload-multiple')
@UseInterceptors(FilesInterceptor('files'))
uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
  return {
    count: files.length,
    files: files.map(f => ({ name: f.filename, size: f.size })),
  };
}
```

## Request Metadata

### Adding Custom Request Properties

Use middleware to attach custom data:

```typescript
import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class RequestTimingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    req["startTime"] = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - req["startTime"];
      console.log(`${req.method} ${req.url} - ${duration}ms`);
    });

    next();
  }
}
```

Register in module:

```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestTimingMiddleware).forRoutes("*");
  }
}
```

## Best Practices

### 1. Use Specific Decorators

```typescript
// Bad - Access everything from request
@Get()
getHome(@Req() req: Request) {
  const id = req.params.id;
  const page = req.query.page;
}

// Good - Use specific decorators
@Get(':id')
getHome(@Param('id') id: string, @Query('page') page: string) {
  // ...
}
```

### 2. Validate Input

Always validate user input using DTOs and validation pipes.

### 3. Secure Sessions

Use secure session configuration in production:

```typescript
cookie: {
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'strict',
}
```

### 4. Don't Expose Sensitive Data

```typescript
// Bad
return { data: { user: req.session.user }, metadata: {} };

// Good - Return only necessary data
const { id, username } = req.session.user;
return { data: { user: { id, username } }, metadata: {} };
```

### 5. Use Custom Decorators for Reusability

Create decorators for common patterns to keep controllers clean.

## See Also

- [Guards](/features/guards) - Authentication and authorization
- [Data Fetching](/features/data-fetching) - Loading data in controllers
- [Error Handling](/features/error-handling) - Handling request errors
- [NestJS Request](https://docs.nestjs.com/controllers#request-object) - Official documentation
