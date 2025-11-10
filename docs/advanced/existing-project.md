# Integrating NIST with Existing NestJS Project

This guide shows you how to add NIST to an existing NestJS application without disrupting your current setup.

## Overview

NIST can be integrated into your existing NestJS project alongside:

- ✅ Existing API routes
- ✅ Current services and modules
- ✅ Existing middleware and guards
- ✅ Database connections
- ✅ Authentication systems

## Step-by-Step Integration

### 1. Install Dependencies

```bash
# Install NIST
npm install nist-stack

# Install React (if not already installed)
npm install react react-dom
npm install -D @types/react @types/react-dom vite @vitejs/plugin-react
```

### 2. Create Vite Config

Create `vite.config.ts` in your project root:

```typescript
import { resolve } from "path";
import { createConfig } from "nist-stack";

export default createConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
```

The `createConfig` helper automatically configures React, SSR settings, and middleware mode.

### 3. Update `main.ts`

Modify your existing `main.ts` to add NIST:

```typescript
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import {
  createViteDevServer,
  RedirectExceptionFilter,
  NistInterceptor,
} from "nist-stack";
import { Reflector } from "@nestjs/core";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Your existing middleware (keep these!)
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  // ... other middleware

  // Add Vite server for SSR
  const vite = await createViteDevServer();
  app.use(vite.dev.middlewares);

  // Add NIST filters and interceptors
  const reflector = app.get(Reflector);
  app.useGlobalFilters(new RedirectExceptionFilter());
  app.useGlobalInterceptors(new NistInterceptor(reflector, vite));

  // Your existing setup
  await app.listen(3000);
}
bootstrap();
```

### 4. Create Frontend Structure

Add these files to your existing `src/` directory:

```
src/
├── ... (your existing files)
├── pages/              # New: React pages
│   └── home.page.tsx
├── app.layout.tsx      # New: Root layout
└── entry-client.tsx    # New: Client entry
```

### 5. Create a Page Controller

You can either:

**Option A:** Add pages to existing controller

```typescript
import { Controller, Get, Post } from "@nestjs/common";
import { Page, PageRoot } from "nist-stack";
import type { PageResponse } from "nist-stack";

@Controller()
@PageRoot(__dirname)
export class AppController {
  // Your existing API routes
  @Post("api/users")
  createUser(@Body() dto: CreateUserDto) {
    // ... existing logic
  }

  // New: SSR page route
  @Get()
  @Page("home")
  getHomePage(): PageResponse {
    return {
      data: { message: "Welcome!" },
      metadata: { title: "Home" },
    };
  }
}
```

**Option B:** Create separate page controller

```typescript
// pages.controller.ts
import { Controller, Get } from "@nestjs/common";
import { Page, PageRoot } from "nist-stack";

@Controller("pages")
@PageRoot(__dirname)
export class PagesController {
  @Get()
  @Page("home")
  getHome() {
    return { data: { message: "Hello" } };
  }
}
```

### 6. Register Page Controller

Add to your module:

```typescript
import { Module } from "@nestjs/common";
import { PagesController } from "./pages.controller";

@Module({
  controllers: [
    // Your existing controllers
    UsersController,
    AuthController,
    // New page controller
    PagesController,
  ],
  // ... rest of your module
})
export class AppModule {}
```

### 7. Update TypeScript Config

Add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    // Existing options...
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  }
}
```

## Coexistence Strategies

### Strategy 1: Separate Routes

Keep API and pages on different routes:

```typescript
// API routes: /api/*
@Controller("api")
export class ApiController {
  @Get("users")
  getUsers() {}
}

// Page routes: /*
@Controller()
@PageRoot(__dirname)
export class PagesController {
  @Get("dashboard")
  @Page("dashboard")
  getDashboard() {}
}
```

### Strategy 2: Same Controller

Mix API and pages in one controller:

```typescript
@Controller()
@PageRoot(__dirname)
export class AppController {
  // API endpoint (JSON response)
  @Get("api/data")
  getData() {
    return { data: [] };
  }

  // Page endpoint (SSR response)
  @Get("dashboard")
  @Page("dashboard")
  getDashboard(): PageResponse {
    return { data: {} };
  }
}
```

### Strategy 3: Gradual Migration

Migrate existing routes one at a time:

```typescript
@Controller()
@PageRoot(__dirname)
export class AppController {
  // Old route (still works)
  @Get("old-page")
  @Render("old-template")
  getOldPage() {
    return { data: {} };
  }

  // New NIST route
  @Get("new-page")
  @Page("new-page")
  getNewPage(): PageResponse {
    return { data: {} };
  }
}
```

## Using Existing Services

Your existing services work seamlessly with NIST:

```typescript
@Controller()
@PageRoot(__dirname)
export class DashboardController {
  constructor(
    // Inject your existing services!
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly dbService: DatabaseService
  ) {}

  @Get("dashboard")
  @Page("dashboard")
  @UseGuards(JwtAuthGuard) // Your existing guards work!
  async getDashboard(@Req() req): Promise<PageResponse> {
    // Use your services
    const user = await this.userService.findById(req.user.id);
    const stats = await this.dbService.getStats();

    return {
      data: { user, stats },
      metadata: { title: `${user.name}'s Dashboard` },
    };
  }
}
```

## Sharing Authentication

### Option 1: Use Existing Guards

```typescript
import { JwtAuthGuard } from "./auth/jwt-auth.guard"; // Your existing guard

@Controller()
@PageRoot(__dirname)
export class ProfileController {
  @Get("profile")
  @Page("profile")
  @UseGuards(JwtAuthGuard) // Use your existing guard!
  getProfile(@Req() req): PageResponse {
    return {
      data: { user: req.user },
      metadata: { title: "Profile" },
    };
  }
}
```

### Option 2: Create NIST Guard Wrapper

```typescript
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { RedirectException } from "nist-stack";

@Injectable()
export class AuthPageGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.token;

    if (!token) {
      throw new RedirectException("/login");
    }

    try {
      request.user = await this.jwtService.verify(token);
      return true;
    } catch {
      throw new RedirectException("/login");
    }
  }
}
```

## Database Integration

Your existing database setup works without changes:

```typescript
@Controller()
@PageRoot(__dirname)
export class BlogController {
  constructor(
    @InjectRepository(Post)
    private postRepo: Repository<Post>, // TypeORM
    // or
    private prisma: PrismaService // Prisma
  ) {}

  @Get("blog")
  @Page("blog")
  async getBlog(): Promise<PageResponse> {
    const posts = await this.postRepo.find();

    return {
      data: { posts },
      metadata: { title: "Blog" },
    };
  }
}
```

## Environment Configuration

Keep your existing config:

```typescript
// config.service.ts (existing)
@Injectable()
export class ConfigService {
  get database() {
    /* ... */
  }
  get jwt() {
    /* ... */
  }
}

// Use in NIST controllers
@Controller()
@PageRoot(__dirname)
export class AppController {
  constructor(private config: ConfigService) {}

  @Get()
  @Page("home")
  getHome(): PageResponse {
    return {
      data: {
        apiUrl: this.config.get("API_URL"),
      },
    };
  }
}
```

## Production Build

Update your build script:

```json
{
  "scripts": {
    "build": "nest build && vite build",
    "start:prod": "node dist/main"
  }
}
```

## Testing

Your existing tests continue to work:

```typescript
describe("AppController", () => {
  // Your existing tests
  it("should return users", () => {
    // ... existing test
  });

  // Add NIST tests
  it("should return page data", () => {
    const result = controller.getHomePage();
    expect(result.data).toBeDefined();
    expect(result.metadata.title).toBe("Home");
  });
});
```

## Common Issues

### 1. Route Conflicts

If routes conflict, NIST routes are processed by the interceptor. Use specific prefixes:

```typescript
// API routes with prefix
@Controller("api")
export class ApiController {}

// Page routes without prefix
@Controller()
export class PageController {}
```

### 2. Middleware Order

Ensure Vite middleware comes after your authentication middleware:

```typescript
app.use(session()); // Your middleware first
app.use(passport.initialize());
app.use(vite.dev.middlewares); // Vite last
```

### 3. Static Files

If you have existing static file serving:

```typescript
app.useStaticAssets("public"); // Your static files
app.use(vite.dev.middlewares); // Then Vite
```

## Migration Checklist

- [ ] Install NIST and dependencies
- [ ] Create Vite config
- [ ] Update `main.ts` with Vite middleware
- [ ] Create page directory structure
- [ ] Add page controller
- [ ] Update module imports
- [ ] Test existing API routes (should still work!)
- [ ] Test new SSR pages
- [ ] Update build scripts
- [ ] Update deployment config

## Next Steps

- [Guards & Authentication](/features/guards)
- [Dynamic Metadata](/features/metadata)
- [Performance Optimization](/advanced/performance)

::: tip Gradual Adoption
You don't need to migrate everything at once! Start with one page and gradually add more as needed.
:::
