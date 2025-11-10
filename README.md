<div align="center">
  <h1>🚀 NIST Stack</h1>
  <p><strong>NestJS + Vite SSR for React</strong></p>
  <p>Enterprise-grade backend meets lightning-fast frontend • Sub-20ms SSR • Full type safety</p>

  <p>
    <a href="https://www.npmjs.com/package/nist-stack"><img src="https://img.shields.io/npm/v/nist-stack.svg" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/nist-stack"><img src="https://img.shields.io/npm/dm/nist-stack.svg" alt="npm downloads"></a>
    <a href="https://github.com/ohanronnie/nist-stack/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/nist-stack.svg" alt="license"></a>
    <a href="https://github.com/ohanronnie/nist-stack"><img src="https://img.shields.io/github/stars/ohanronnie/nist-stack.svg?style=social" alt="GitHub stars"></a>
  </p>

  <p>
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-core-features">Features</a> •
    <a href="#-documentation">Documentation</a> •
    <a href="#-why-nist">Why NIST</a> •
    <a href="#-community">Community</a>
  </p>
</div>

---

## 🎯 Why NIST?

NIST combines **NestJS's powerful backend architecture** with **Vite's lightning-fast development experience** to deliver server-side rendered React applications with unprecedented performance and developer experience.

### The Power of Integration

```typescript
// 1. Define your page in a NestJS controller
@Controller()
@PageRoot(__dirname)
export class AppController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Page("home")
  async getHome(): Promise<PageResponse> {
    const users = await this.userService.findAll();
    return {
      data: { users },
      metadata: { title: "Home", description: "Welcome!" },
    };
  }
}
```

```tsx
// 2. Render with React - props are fully typed!
export default function Home({ users }) {
  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map((u) => (
          <li key={u.id}>{u.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

**Result:** Sub-20ms SSR, full type safety from DB to UI, instant HMR, and zero configuration.

---

## 📊 Framework Comparison

| Feature                  | NIST             | Next.js              | Remix             |
| ------------------------ | ---------------- | -------------------- | ----------------- |
| **Backend Framework**    | Full NestJS      | Limited API routes   | Express-like      |
| **SSR Performance**      | ~19ms (cached)   | ~150-300ms           | ~200-400ms        |
| **Dependency Injection** | ✅ Built-in      | ❌ Manual            | ❌ Manual         |
| **Type Safety**          | ✅ End-to-end    | ⚠️ Partial           | ⚠️ Partial        |
| **Guards & Auth**        | ✅ NestJS guards | ⚠️ Custom middleware | ⚠️ Custom loaders |
| **Build Tool**           | Vite 7           | Turbopack            | esbuild           |
| **Hot Reload**           | ✅ Instant HMR   | ✅ Fast Refresh      | ✅ Live reload    |
| **Enterprise Ready**     | ✅ Yes           | ⚠️ Partial           | ⚠️ Partial        |

---

## ⚡ Quick Start

### 1. Install NIST

```bash
npm install nist-stack react react-dom vite
```

### 2. Setup Your Server (`main.ts`)

```typescript
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { bootstrapNist } from "nist-stack";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // One line to setup SSR + Vite + all NIST features
  await bootstrapNist(app);

  await app.listen(3000);
}
bootstrap();
```

### 3. Create a Page Controller

```typescript
import { Controller, Get } from "@nestjs/common";
import { Page, PageRoot } from "nist-stack";

@Controller()
@PageRoot(__dirname)
export class AppController {
  @Get()
  @Page("home")
  home() {
    return {
      data: { users: ["Alice", "Bob"] },
      metadata: { title: "Home" },
    };
  }
}
```

### 4. Create Your React Page (e.g., `src/home.page.tsx`)

```tsx
import { Link } from "nist-stack/client";

export default function Home({ users }) {
  return (
    <div>
      <h1>Welcome!</h1>
      <ul>
        {users.map((user) => (
          <li key={user}>{user}</li>
        ))}
      </ul>
      <Link href="/about">About</Link>
    </div>
  );
}
```

> **Note:** Pages are resolved relative to `__dirname` of the controller with `@PageRoot(__dirname)`. If your controller is in `src/app.controller.ts`, place `home.page.tsx` in the same `src/` directory.

### 5. Run Your App

```bash
npm run start:dev
```

Visit `http://localhost:3000` - that's it! 🎉

---

## 🎨 Core Features

### ⚡ Lightning-Fast SSR

- **19ms response times** with intelligent caching
- Vite's instant HMR for immediate feedback
- Parallel data loading and optimized builds

### 🏗️ Enterprise Architecture

- **Full NestJS integration** - DI, modules, guards, interceptors
- **Type-safe end-to-end** - From database to UI
- **Modular design** for scalable applications

### 🔐 Built-in Authentication

- NestJS guard system with server-side redirects
- Session management and flexible authorization
- `RedirectException` for seamless auth flows

### 📄 Dynamic SEO & Metadata

- Controller-based metadata generation
- OpenGraph and Twitter Card support
- Server-rendered meta tags for perfect SEO

### 🎯 Developer Experience

- **Zero configuration** - Sensible defaults out of the box
- **Decorator-based routing** - No config files needed
- **Full TypeScript** with complete type inference
- **Instant HMR** - See changes immediately

### 🚀 Production Ready

- Optimized builds with code splitting
- HTTP/2 support and caching strategies
- Health checks and monitoring integration
- Comprehensive deployment guides

---

## 📦 What's Included

### Server-Side (`nist-stack`)

```typescript
import {
  // Decorators
  Page, // Mark controller method as SSR page
  PageRoot, // Set pages directory root
  Layout, // Assign custom layout

  // Core
  bootstrapNist, // One-line setup for SSR + Vite
  createViteDevServer, // Manual Vite server creation
  NistInterceptor, // SSR rendering interceptor

  // Exceptions & Filters
  RedirectException, // Server-side redirects
  RedirectExceptionFilter,

  // Utilities
  NistError, // Framework error class
} from "nist-stack";
```

### Client-Side (`nist-stack/client`)

```typescript
import {
  // Components
  Link, // Client-side navigation
  Image, // Optimized images
  ErrorBoundary, // Error boundaries
  Router, // Root router

  // Hooks
  useRouter, // Router instance
  useParams, // Route parameters
  useQuery, // Query string
  usePathname, // Current path
  useParam, // Single param
  useQueryParam, // Single query param
  useRouteData, // All route data
  useNistData, // Full hydration data
} from "nist-stack/client";

// Types
import type {
  PageResponse, // Controller return type
  PageMetadata, // Metadata interface
  LayoutProps, // Layout props
  PageProps, // Page component props
} from "nist-stack/client";
```

---

## 💡 Real-World Examples

<details>
<summary><strong>🔐 Authentication with Guards</strong></summary>

```typescript
// auth.guard.ts
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (!request.user) {
      throw new RedirectException("/login");
    }
    return true;
  }
}

// dashboard.controller.ts
@Controller("dashboard")
@PageRoot(__dirname)
export class DashboardController {
  @Get()
  @Page("dashboard")
  @UseGuards(AuthGuard)
  getDashboard(@Req() req) {
    return {
      data: { user: req.user },
      metadata: { title: "Dashboard" },
    };
  }
}
```

</details>

<details>
<summary><strong>📄 Dynamic Metadata & SEO</strong></summary>

```typescript
// blog.controller.ts
@Controller("blog")
@PageRoot(__dirname)
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get(":slug")
  @Page("blog-post")
  async getPost(@Param("slug") slug: string): Promise<PageResponse> {
    const post = await this.blogService.findBySlug(slug);

    return {
      data: { post },
      metadata: {
        title: post.title,
        description: post.excerpt,
        openGraph: {
          title: post.title,
          description: post.excerpt,
          image: post.coverImage,
        },
      },
    };
  }
}
```

</details>

<details>
<summary><strong>🎨 Layouts & Nested Routes</strong></summary>

```typescript
// app.layout.tsx
export const metadata = {
  title: "My App",
};

export default function AppLayout({ children }) {
  return (
    <div>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
      </nav>
      <main>{children}</main>
      <footer>© 2025</footer>
    </div>
  );
}

// Controller using layout
@Get('/about')
@Page('about')
@Layout('app')  // Uses app.layout.tsx
getAbout() {
  return { data: { company: "ACME Inc" } };
}
```

</details>

<details>
<summary><strong>🔄 Data Fetching with Services</strong></summary>

```typescript
@Controller()
@PageRoot(__dirname)
export class HomeController {
  constructor(
    private readonly userService: UserService,
    private readonly postService: PostService
  ) {}

  @Get()
  @Page("home")
  async getHome(): Promise<PageResponse> {
    // Parallel data fetching
    const [users, posts] = await Promise.all([
      this.userService.findAll(),
      this.postService.getLatest(10),
    ]);

    return {
      data: { users, posts },
      metadata: { title: "Home" },
    };
  }
}
```

</details>

---

## 🛠️ Development & Production

### Development Mode

```bash
# Start with hot reload
npm run start:dev

# Or use NestJS CLI
nest start --watch
```

**What you get:**

- ⚡ **Instant HMR** - Frontend changes reflect immediately
- 🔄 **Auto-restart** - Backend changes trigger server restart
- 🎯 **Preserved HMR** - Vite state persists across NestJS restarts

### Production Build

```bash
# Build client and server
npm run build

# Start production server
NODE_ENV=production npm run start:prod
```

**Optimizations:**

- 📦 Code splitting and tree shaking
- 🗜️ Minification and compression
- 🚀 Static asset caching (1 year)
- ⚡ HTTP/2 support

---

## 🎯 Who Should Use NIST?

### ✅ Perfect For

- 🏢 **Enterprise Applications** - Need robust backend architecture with DI
- 🔐 **Auth-Heavy Apps** - Complex permission systems and role management
- 📊 **Data-Intensive Apps** - Significant server-side business logic
- 🚀 **Performance-Critical** - Sub-20ms SSR response times required
- 🧩 **Microservices** - Want consistent frontend across services
- 🔧 **Existing NestJS Apps** - Add SSR to your current backend

---

## 📚 Documentation

📖 **[Read the full documentation on GitHub →](https://github.com/ohanronnie/nist-stack/tree/main/docs)**

### 🚀 Getting Started

- **[Installation Guide](https://github.com/ohanronnie/nist-stack/blob/main/docs/guide/installation.md)** - Setup NIST in minutes
- **[Getting Started](https://github.com/ohanronnie/nist-stack/blob/main/docs/guide/getting-started.md)** - Your first NIST app
- **[Project Structure](https://github.com/ohanronnie/nist-stack/blob/main/docs/guide/project-structure.md)** - Understand the layout
- **[Configuration](https://github.com/ohanronnie/nist-stack/blob/main/docs/guide/configuration.md)** - Customize your setup

### 📖 Core Concepts

- **[Pages](https://github.com/ohanronnie/nist-stack/blob/main/docs/features/pages.md)** - Creating and rendering pages
- **[Layouts](https://github.com/ohanronnie/nist-stack/blob/main/docs/features/layouts.md)** - Shared layouts and nesting
- **[Data Fetching](https://github.com/ohanronnie/nist-stack/blob/main/docs/features/data-fetching.md)** - Server-side data loading
- **[Client-Side Features](https://github.com/ohanronnie/nist-stack/blob/main/docs/features/client-side.md)** - Navigation, hooks, and components
- **[Metadata & SEO](https://github.com/ohanronnie/nist-stack/blob/main/docs/features/metadata.md)** - Dynamic meta tags
- **[Guards & Auth](https://github.com/ohanronnie/nist-stack/blob/main/docs/features/guards.md)** - Authentication patterns
- **[Error Handling](https://github.com/ohanronnie/nist-stack/blob/main/docs/features/error-handling.md)** - Graceful error management
- **[Request Context](https://github.com/ohanronnie/nist-stack/blob/main/docs/features/request-context.md)** - Accessing request data

### 🔧 Advanced Topics

- **[Existing Project Integration](https://github.com/ohanronnie/nist-stack/blob/main/docs/advanced/existing-project.md)** - Add NIST to your NestJS app
- **[Deployment](https://github.com/ohanronnie/nist-stack/blob/main/docs/advanced/deployment.md)** - Production deployment guide
- **[Performance](https://github.com/ohanronnie/nist-stack/blob/main/docs/advanced/performance.md)** - Optimization techniques
- **[Testing](https://github.com/ohanronnie/nist-stack/blob/main/docs/advanced/testing.md)** - Unit and E2E testing
- **[Monitoring](https://github.com/ohanronnie/nist-stack/blob/main/docs/advanced/monitoring.md)** - Health checks and metrics

### 📋 Reference

- **[API - Decorators](https://github.com/ohanronnie/nist-stack/blob/main/docs/api/decorators.md)** - Complete decorator reference
- **[API - Types](https://github.com/ohanronnie/nist-stack/blob/main/docs/api/types.md)** - TypeScript type definitions
- **[FAQ](https://github.com/ohanronnie/nist-stack/blob/main/docs/guide/faq.md)** - Frequently asked questions
- **[Troubleshooting](https://github.com/ohanronnie/nist-stack/blob/main/docs/guide/troubleshooting.md)** - Common issues and solutions

---

## 👥 Community & Support

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/ohanronnie/nist-stack/discussions">
        <br>💬<br>
        <strong>Discussions</strong>
        <br><sub>Ask questions & share ideas</sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/ohanronnie/nist-stack/issues">
        <br>🐛<br>
        <strong>Issue Tracker</strong>
        <br><sub>Report bugs & request features</sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/ohanronnie/nist-stack/blob/main/CONTRIBUTING.md">
        <br>🤝<br>
        <strong>Contributing</strong>
        <br><sub>Help improve NIST</sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/ohanronnie/nist-stack/blob/main/SECURITY.md">
        <br>🛡️<br>
        <strong>Security</strong>
        <br><sub>Report vulnerabilities</sub>
      </a>
    </td>
  </tr>
</table>

---

## 📜 License

MIT © NIST Stack

See [LICENSE](https://github.com/ohanronnie/nist-stack/blob/main/LICENSE) for details.

---

## 🙏 Acknowledgments

NIST is built on the shoulders of giants:

- **[NestJS](https://nestjs.com/)** - Progressive Node.js framework
- **[Vite](https://vitejs.dev/)** - Next generation frontend tooling
- **[React](https://react.dev/)** - Library for building user interfaces

Special thanks to all our [contributors](https://github.com/ohanronnie/nist-stack/graphs/contributors)!

---

<div align="center">
  <p><strong>Made with ❤️ by the NIST community</strong></p>
  <p>
    ⭐ Star us on <a href="https://github.com/ohanronnie/nist-stack">GitHub</a> if you find this useful!
  </p>
  <p>
    <sub>Version 1.0.0 • See <a href="https://github.com/ohanronnie/nist-stack/blob/main/CHANGELOG.md">CHANGELOG</a> for release history</sub>
  </p>
</div>
