# Decorator API Reference

Complete reference for all decorators provided by NIST for building server-side rendered applications.

## Page Routing Decorators

### @Page()

Marks a controller method as a page route and specifies the associated React component.

**Signature:**

```typescript
@Page(pageName: string)
```

**Parameters:**

- `pageName` (string): Name of the page file (without `.page.tsx` extension)

**Example:**

```typescript
@Controller()
@PageRoot(__dirname)
export class AppController {
  @Get()
  @Page("home")
  getHome(): PageResponse {
    return { data: {}, metadata: {} };
  }
}
```

The above will render `home.page.tsx` from the `pages/` directory.

**Important:**

- Must be used with `@PageRoot()` decorator
- Must be combined with a routing decorator (`@Get`, `@Post`, etc.)
- Page file must export a default React component

---

### @PageRoot()

Specifies the root directory for page components relative to the controller file.

**Signature:**

```typescript
@PageRoot(sourcePath: string)
```

**Parameters:**

- `sourcePath` (string): Root directory path (use `__dirname` for controller's directory)

**Example:**

```typescript
@Controller("blog")
@PageRoot(__dirname)
export class BlogController {
  // Pages will be loaded from:
  // - __dirname/pages/*.page.tsx
  // - __dirname/*.page.tsx (if no pages/ directory)
}
```

**Directory Resolution:**

1. First checks `{sourcePath}/pages/*.page.tsx`
2. Falls back to `{sourcePath}/*.page.tsx`

---

### @CustomLayout()

Specifies a custom layout for a specific route, overriding the default layout.

**Signature:**

```typescript
@CustomLayout(layoutName: string)
```

**Parameters:**

- `layoutName` (string): Name of the layout file (without `.layout.tsx` extension)

**Example:**

```typescript
@Controller()
@PageRoot(__dirname)
export class BlogController {
  @Get("post/:slug")
  @Page("post")
  @CustomLayout("blog")
  getPost(): PageResponse {
    return { data: {}, metadata: {} };
  }
}
```

This will use `blog.layout.tsx` instead of the default `app.layout.tsx`.

**Layout Priority:**

1. Route-specific layout (`@CustomLayout`)
2. Default layout (`app.layout.tsx`)

---

## NestJS Built-in Decorators

NIST leverages standard NestJS decorators for routing and request handling.

### Routing Decorators

#### @Controller()

Defines a controller class and optional route prefix.

```typescript
@Controller()
export class HomeController {}

@Controller("blog")
export class BlogController {} // All routes prefixed with /blog
```

#### @Get()

HTTP GET request handler.

```typescript
@Get()
getHome() {} // Matches GET /

@Get('about')
getAbout() {} // Matches GET /about

@Get(':id')
getUser(@Param('id') id: string) {} // Matches GET /123
```

#### @Post()

HTTP POST request handler.

```typescript
@Post('login')
login(@Body() credentials: LoginDto) {}
```

#### @Put()

HTTP PUT request handler.

```typescript
@Put(':id')
update(@Param('id') id: string, @Body() data: UpdateDto) {}
```

#### @Patch()

HTTP PATCH request handler.

```typescript
@Patch(':id')
partialUpdate(@Param('id') id: string, @Body() data: Partial<UpdateDto>) {}
```

#### @Delete()

HTTP DELETE request handler.

```typescript
@Delete(':id')
remove(@Param('id') id: string) {}
```

### Parameter Decorators

#### @Param()

Extract route parameters.

```typescript
@Get('post/:id')
getPost(@Param('id') id: string) {}

// Multiple parameters
@Get('post/:year/:month/:slug')
getPost(@Param() params: { year: string; month: string; slug: string }) {}
```

#### @Query()

Extract query string parameters.

```typescript
@Get('search')
search(@Query('q') query: string) {}

// Multiple query params
@Get('filter')
filter(@Query() query: { category: string; page: string }) {}

// With default value
@Get('posts')
getPosts(@Query('page') page: string = '1') {}
```

#### @Body()

Extract request body (POST, PUT, PATCH).

```typescript
@Post('login')
login(@Body() credentials: LoginDto) {}

// Specific field
@Post('register')
register(@Body('email') email: string) {}
```

#### @Headers()

Extract request headers.

```typescript
@Get()
getHome(@Headers('user-agent') userAgent: string) {}
```

#### @Ip()

Get client IP address.

```typescript
@Get()
getHome(@Ip() ip: string) {}
```

#### @Req()

Access full Express request object.

```typescript
import { Request } from 'express';

@Get()
getHome(@Req() req: Request) {
  const cookies = req.cookies;
  const session = req.session;
  const ip = req.ip;
}
```

#### @Res()

Access Express response object.

```typescript
import { Response } from 'express';

@Get()
getHome(@Res({ passthrough: true }) res: Response) {
  res.cookie('theme', 'dark');
  return { data: {}, metadata: {} };
}
```

**Important:** Use `{ passthrough: true }` to allow NIST to handle the response.

#### @Session()

Access session data.

```typescript
import { Session } from 'express-session';

@Get('dashboard')
getDashboard(@Session() session: Session) {
  const user = session.user;
  return { data: { user }, metadata: {} };
}
```

### Middleware and Guards

#### @UseGuards()

Apply guards to routes or controllers.

```typescript
import { AuthGuard } from './guards/auth.guard';

@UseGuards(AuthGuard)
@Get('dashboard')
getDashboard() {}

// Multiple guards
@UseGuards(AuthGuard, AdminGuard)
@Get('admin')
getAdmin() {}
```

#### @UseInterceptors()

Apply interceptors to routes.

```typescript
import { CacheInterceptor } from '@nestjs/cache-manager';

@UseInterceptors(CacheInterceptor)
@Get('posts')
getPosts() {}
```

#### @UsePipes()

Apply validation pipes.

```typescript
import { ValidationPipe } from '@nestjs/common';

@UsePipes(new ValidationPipe())
@Post('create')
create(@Body() createDto: CreateDto) {}
```

#### @UseFilters()

Apply exception filters.

```typescript
import { HttpExceptionFilter } from './filters/http-exception.filter';

@UseFilters(HttpExceptionFilter)
@Get()
getHome() {}
```

### Validation Decorators

#### @IsString()

Validates string type (from `class-validator`).

```typescript
import { IsString } from "class-validator";

export class CreateUserDto {
  @IsString()
  name: string;
}
```

#### @IsEmail()

Validates email format.

```typescript
@IsEmail()
email: string;
```

#### @IsInt() / @IsNumber()

Validates number types.

```typescript
@IsInt()
age: number;
```

#### @Min() / @Max()

Validates numeric range.

```typescript
@Min(1)
@Max(100)
page: number;
```

#### @IsOptional()

Marks field as optional.

```typescript
@IsOptional()
@IsString()
middleName?: string;
```

#### @Length()

Validates string length.

```typescript
@Length(8, 100)
password: string;
```

## Custom Decorators

### Creating Custom Parameter Decorators

Extract common patterns into reusable decorators:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Current user decorator
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.session?.user;
  },
);

// Usage
@Get('profile')
getProfile(@CurrentUser() user: User) {
  return { data: { user }, metadata: {} };
}
```

### Creating Custom Method Decorators

```typescript
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// Usage
@Roles('admin', 'moderator')
@Get('admin')
getAdmin() {}
```

### Creating Composed Decorators

Combine multiple decorators:

```typescript
import { applyDecorators, UseGuards } from '@nestjs/common';

export function Auth(...roles: string[]) {
  return applyDecorators(
    Roles(...roles),
    UseGuards(AuthGuard, RolesGuard),
  );
}

// Usage
@Auth('admin')
@Get('admin')
getAdmin() {}
```

## Decorator Composition

### Multiple Decorators on Single Route

Order matters for some decorators:

```typescript
@Controller("blog")
@PageRoot(__dirname)
export class BlogController {
  @Get("post/:slug")
  @Page("post")
  @CustomLayout("blog")
  @UseGuards(AuthGuard)
  @UseInterceptors(CacheInterceptor)
  async getPost(@Param("slug") slug: string): Promise<PageResponse> {
    // Execution order:
    // 1. CacheInterceptor (if not cached)
    // 2. AuthGuard
    // 3. Controller method
    // 4. Page rendering
  }
}
```

**Execution Order:**

1. Guards
2. Interceptors (before)
3. Pipes
4. Controller method
5. Interceptors (after)
6. Filters (if exception)

## Metadata Decorators (Proposed)

### @Metadata()

_Note: Not yet implemented, but planned for future versions._

Set controller-wide metadata:

```typescript
@Controller("blog")
@PageRoot(__dirname)
@Metadata({
  author: "Blog Team",
  keywords: "blog, articles",
})
export class BlogController {
  // All routes inherit author and keywords
}
```

## Best Practices

### 1. Type Your Decorators

Always use TypeScript types for parameters:

```typescript
// Bad
@Get(':id')
getUser(@Param('id') id: any) {}

// Good
@Get(':id')
getUser(@Param('id') id: string) {}
```

### 2. Use DTOs for Validation

```typescript
// Bad
@Post()
create(@Body() data: any) {}

// Good
@Post()
create(@Body() createDto: CreateUserDto) {}
```

### 3. Combine Related Decorators

```typescript
// Custom decorator for authenticated routes
export function AuthenticatedPage(pageName: string) {
  return applyDecorators(
    Page(pageName),
    UseGuards(AuthGuard),
  );
}

// Usage
@Get('dashboard')
@AuthenticatedPage('dashboard')
getDashboard() {}
```

### 4. Document Custom Decorators

Always add JSDoc comments to custom decorators:

````typescript
/**
 * Extracts the current authenticated user from the session.
 *
 * @returns User object or undefined if not authenticated
 *
 * @example
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser() user: User) {
 *   return { data: { user }, metadata: {} };
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(/* ... */);
````

## See Also

- [Pages](/features/pages) - Using page decorators
- [Guards](/features/guards) - Authentication guards
- [Request Context](/features/request-context) - Request handling
- [NestJS Decorators](https://docs.nestjs.com/custom-decorators) - Official documentation
