# Guards & Redirects

NIST provides a powerful guard system for authentication, authorization, and redirects.

## RedirectException

The built-in `RedirectException` triggers server-side HTTP redirects.

### Basic Usage

```typescript
import { RedirectException } from "nist-stack";

throw new RedirectException("/login");
```

### With Status Code

```typescript
// 302 Found (default)
throw new RedirectException("/login", 302);

// 301 Moved Permanently
throw new RedirectException("/new-url", 301);

// 303 See Other
throw new RedirectException("/success", 303);

// 307 Temporary Redirect
throw new RedirectException("/temp", 307);
```

## Creating Guards

Guards in NIST work exactly like NestJS guards.

### Basic Auth Guard

```typescript
// src/guards/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { RedirectException } from "nist-stack";

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const userId = req.cookies?.userId;

    if (!userId) {
      throw new RedirectException("/login");
    }

    return true;
  }
}
```

### Guest Guard

Redirect logged-in users away:

```typescript
// src/guards/guest.guard.ts
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { RedirectException } from "nist-stack";

@Injectable()
export class GuestGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const userId = req.cookies?.userId;

    if (userId) {
      // Already logged in, redirect to home
      throw new RedirectException("/");
    }

    return true;
  }
}
```

## Using Guards

### On Controller Methods

```typescript
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "./guards/auth.guard";

@Controller()
@PageRoot(__dirname)
export class AppController {
  @Get("profile")
  @Page("profile")
  @UseGuards(AuthGuard) // ← Protect this route
  getProfile(@Req() req): PageResponse {
    return {
      data: { user: req.user },
    };
  }

  @Get("login")
  @Page("login")
  @UseGuards(GuestGuard) // ← Only for guests
  getLogin(): PageResponse {
    return { data: {} };
  }
}
```

### On Entire Controller

```typescript
@Controller("admin")
@UseGuards(AuthGuard) // ← Protect all routes
@PageRoot(__dirname)
export class AdminController {
  @Get("dashboard")
  @Page("dashboard")
  getDashboard() {}

  @Get("users")
  @Page("users")
  getUsers() {}
}
```

### Multiple Guards

```typescript
@Get('admin/settings')
@Page('settings')
@UseGuards(AuthGuard, AdminGuard)  // ← Both required
getSettings() { }
```

## Advanced Guards

### Role-Based Guard

```typescript
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RedirectException } from "nist-stack";

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      "roles",
      context.getHandler()
    );

    if (!requiredRoles) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      throw new RedirectException("/login");
    }

    const hasRole = requiredRoles.some((role) => user.roles?.includes(role));

    if (!hasRole) {
      throw new RedirectException("/unauthorized");
    }

    return true;
  }
}
```

#### Using with Decorator

```typescript
// roles.decorator.ts
import { SetMetadata } from "@nestjs/common";

export const Roles = (...roles: string[]) => SetMetadata("roles", roles);
```

```typescript
@Get('admin')
@Page('admin')
@UseGuards(RoleGuard)
@Roles('admin', 'moderator')
getAdmin() { }
```

### JWT Auth Guard

```typescript
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RedirectException } from "nist-stack";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = req.cookies?.token;

    if (!token) {
      throw new RedirectException("/login");
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      req.user = payload;
      return true;
    } catch {
      throw new RedirectException("/login");
    }
  }
}
```

### Subscription Guard

```typescript
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private subscriptionService: SubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      throw new RedirectException("/login");
    }

    const hasSubscription = await this.subscriptionService.isActive(user.id);

    if (!hasSubscription) {
      throw new RedirectException("/subscribe");
    }

    return true;
  }
}
```

## Conditional Redirects

### Based on User Data

```typescript
@Injectable()
export class OnboardingGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      throw new RedirectException("/login");
    }

    if (!user.onboarded) {
      throw new RedirectException("/onboarding");
    }

    if (!user.emailVerified) {
      throw new RedirectException("/verify-email");
    }

    return true;
  }
}
```

### Based on Time

```typescript
@Injectable()
export class MaintenanceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const isMaintenanceMode = process.env.MAINTENANCE === "true";

    if (isMaintenanceMode) {
      throw new RedirectException("/maintenance");
    }

    return true;
  }
}
```

## Guard with Services

Inject services for database checks:

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = req.cookies?.token;

    if (!token) {
      throw new RedirectException("/login");
    }

    const session = await this.authService.validateSession(token);

    if (!session) {
      throw new RedirectException("/login");
    }

    const user = await this.userService.findById(session.userId);

    if (!user || user.banned) {
      throw new RedirectException("/banned");
    }

    req.user = user;
    return true;
  }
}
```

## Redirect with Query Params

### Save Return URL

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const userId = req.cookies?.userId;

    if (!userId) {
      // Save current URL to return after login
      const returnUrl = encodeURIComponent(req.url);
      throw new RedirectException(`/login?returnUrl=${returnUrl}`);
    }

    return true;
  }
}
```

### Use in Login Page

```tsx
// login.page.tsx
export default function Login({ returnUrl }) {
  const handleLogin = async () => {
    await login();
    // Redirect back to original page
    window.location.href = returnUrl || "/";
  };

  return <button onClick={handleLogin}>Login</button>;
}
```

## Error Handling in Guards

### Custom Error Pages

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    try {
      const user = this.validateUser(req);
      req.user = user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new RedirectException("/login");
      }
      if (error instanceof ForbiddenException) {
        throw new RedirectException("/forbidden");
      }
      throw new RedirectException("/error");
    }
  }
}
```

## Global Guards

Apply guards to all routes:

```typescript
// main.ts
import { AuthGuard } from "./guards/auth.guard";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global guard
  app.useGlobalGuards(new AuthGuard());

  await app.listen(3000);
}
```

### With Dependency Injection

```typescript
// app.module.ts
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./guards/auth.guard";

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
```

## Public Routes

Make certain routes public when using global guards:

```typescript
// public.decorator.ts
import { SetMetadata } from "@nestjs/common";

export const Public = () => SetMetadata("isPublic", true);
```

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.get<boolean>(
      "isPublic",
      context.getHandler()
    );

    if (isPublic) {
      return true; // Skip auth check
    }

    // ... auth check
  }
}
```

```typescript
@Get()
@Page('home')
@Public()  // ← This route is public
getHome() { }
```

## Testing Guards

```typescript
import { Test } from "@nestjs/testing";
import { AuthGuard } from "./auth.guard";
import { ExecutionContext } from "@nestjs/common";
import { RedirectException } from "nist-stack";

describe("AuthGuard", () => {
  let guard: AuthGuard;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthGuard],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  it("should allow authenticated users", () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ cookies: { userId: "123" } }),
      }),
    } as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it("should redirect unauthenticated users", () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ cookies: {} }),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(RedirectException);
  });
});
```

## Best Practices

### 1. Keep Guards Focused

Each guard should have one responsibility:

```typescript
// ✅ Good
@UseGuards(AuthGuard, SubscriptionGuard, RoleGuard)

// ❌ Bad - one guard doing everything
@UseGuards(MegaGuard)
```

### 2. Use Dependency Injection

```typescript
// ✅ Good
constructor(
  private authService: AuthService,
  private userService: UserService,
) {}

// ❌ Bad
const authService = new AuthService();
```

### 3. Handle Edge Cases

```typescript
if (!user) {
  throw new RedirectException("/login");
}

if (user.banned) {
  throw new RedirectException("/banned");
}

if (!user.emailVerified) {
  throw new RedirectException("/verify-email");
}

return true;
```

### 4. Log Security Events

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private logger: Logger) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    if (!req.cookies?.userId) {
      this.logger.warn(`Unauthorized access attempt to ${req.url}`);
      throw new RedirectException("/login");
    }

    return true;
  }
}
```

## Next Steps

- [Error Handling](/features/error-handling) - Manage exceptions and redirects
- [Client-Side Hooks](/features/client-side) - Handle navigation on the client
- [Configuration Guide](/guide/configuration) - Tune Nest, Vite, and TypeScript
