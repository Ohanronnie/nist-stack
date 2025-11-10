<div align="center">
  <h1>NIST Stack</h1>
  <p><strong>NestJS + Vite SSR for React</strong></p>
  <p>A modern full-stack framework combining enterprise-grade backend architecture with lightning-fast frontend tooling</p>

  <p>
    <a href="https://www.npmjs.com/package/nist-stack"><img src="https://img.shields.io/npm/v/nist-stack.svg" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/nist-stack"><img src="https://img.shields.io/npm/dm/nist-stack.svg" alt="npm downloads"></a>
    <a href="https://github.com/ohanronnie/nist-stack/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/nist-stack.svg" alt="license"></a>
    <a href="https://github.com/ohanronnie/nist-stack"><img src="https://img.shields.io/github/stars/ohanronnie/nist-stack.svg?style=social" alt="GitHub stars"></a>
  </p>

  <p>
    <a href="#quick-start">Quick Start</a> •
    <a href="#features">Features</a> •
    <a href="#documentation">Documentation</a> •
    <a href="#examples">Examples</a> •
    <a href="#community">Community</a>
  </p>
</div>

---

## Why NIST?

NIST combines **NestJS's powerful backend architecture** with **Vite's lightning-fast development experience** to deliver server-side rendered React applications with unprecedented performance and developer experience.

```typescript
// Define your page in a NestJS controller
@Get()
@Page("home")
getHome(): PageResponse {
  return { data: { users: ["Alice", "Bob"] } };
}
```

```tsx
// Render with React - props are fully typed!
export default function Home({ users }) {
  return (
    <ul>
      {users.map((u) => (
        <li key={u}>{u}</li>
      ))}
    </ul>
  );
}
```

**Result:** Sub-20ms SSR, full type safety, and instant HMR. No configuration needed.

---

## At a Glance

| Feature                  | NIST             | Next.js              | Remix             |
| ------------------------ | ---------------- | -------------------- | ----------------- |
| **Backend Framework**    | Full NestJS      | Limited API routes   | Express-like      |
| **SSR Performance**      | ~19ms (cached)   | ~150-300ms           | ~200-400ms        |
| **Dependency Injection** | ✅ Built-in      | ❌ Manual            | ❌ Manual         |
| **Type Safety**          | ✅ End-to-end    | ⚠️ Partial           | ⚠️ Partial        |
| **Guards & Auth**        | ✅ NestJS guards | ⚠️ Custom middleware | ⚠️ Custom loaders |
| **Build Tool**           | Vite 7           | Turbopack            | esbuild           |
| **Hot Reload**           | ✅ Instant HMR   | ✅ Fast Refresh      | ✅ Live reload    |

---

## Quick Start

### Installation

```bash
npm install nist-stack
```

That's it! One package gives you everything.

### 1. Server Setup (main.ts)

```typescript
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { bootstrapNist } from "nist-stack";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await bootstrapNist(app); // One line setup!

  await app.listen(3000);
}
bootstrap();
```

### 2. Create a Controller with Pages

```typescript
import { Controller, Get } from "@nestjs/common";
import { Page, PageRoot } from "nist-stack";

@Controller()
@PageRoot(__dirname)
export class AppController {
  @Get("/")
  @Page("app")
  home() {
    return { users: ["Alice", "Bob"] };
  }
}
```

### 3. Create a React Page (src/pages/app.page.tsx)

```typescript
import { Link } from "nist-stack/client";

export default function App({ users }) {
  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map((u) => (
          <li key={u}>{u}</li>
        ))}
      </ul>
      <Link href="/about">About</Link>
    </div>
  );
}
```

## Available Imports

### Server-Side

```typescript
// From 'nist-stack'
import {
  Page, // Decorator: Mark controller method as page
  PageRoot, // Decorator: Set page root directory
  Layout, // Decorator: Set custom layout
  NistInterceptor, // SSR interceptor
  createViteDevServer, // Create Vite server
  NistError, // Framework error class
} from "nist-stack";

// From 'nist-stack/decorators' (alternative)
import { Page, PageRoot, Layout } from "nist-stack/decorators";
```

### Client-Side

```typescript
// From 'nist-stack/client'
import {
  Link, // Client-side navigation component
  Image, // Optimized image component
  ErrorBoundary, // Error boundary component
  Router, // Router component
  useRouter, // Router hook
  useParams, // Get route params
  useQuery, // Get query params
  usePathname, // Get current pathname
  useParam, // Get single param
  useQueryParam, // Get single query param
  useRouteData, // Get all route data
  useNistData, // Get full hydration data
} from "nist-stack/client";

// TypeScript types
import type {
  Metadata, // Page/layout metadata
  LayoutProps, // Layout component props
  PageProps, // Page component props
  PageConfig, // Page configuration (ISR, etc.)
  RouteData, // Route data interface
} from "nist-stack/client";
```

## Features

- ✅ Server-Side Rendering (SSR)
- ✅ Hot Module Replacement (HMR)
- ✅ Type-safe routing with decorators
- ✅ Automatic page validation
- ✅ Built-in security (CSRF, XSS protection)
- ✅ Production-ready builds
- ✅ Client-side navigation
- ✅ SEO metadata support
- ✅ ISR support (Incremental Static Regeneration)

## Examples

### Simple Page

```typescript
// my-page.page.tsx
export default function MyPage() {
  return <div>Hello World</div>;
}
```

### Using Route Params

```typescript
import { useParams } from "nist-stack/client";

export default function UserPage() {
  const { id } = useParams<{ id: string }>();
  return <div>User ID: {id}</div>;
}
```

### Custom Layout

```typescript
// app.layout.tsx
export default function Layout({ children }) {
  return (
    <div>
      <nav>Navigation</nav>
      {children}
    </div>
  );
}
```

### Controller with Layout

```typescript
import { Controller, Get } from "@nestjs/common";
import { Page, PageRoot, Layout } from "nist-stack";

@Controller()
@PageRoot(__dirname)
export class AppController {
  @Get("/profile")
  @Page("profile")
  @Layout("app") // Use app.layout.tsx
  profile() {
    return { user: { name: "Alice" } };
  }
}
```

## Development

The framework is optimized for hot reloading:

- **Frontend changes** → Vite HMR (instant updates, no page reload)
- **Backend changes** → NestJS restarts (Vite HMR preserved)

Run with your preferred NestJS dev tool:

```bash
# Using ts-node-dev
ts-node-dev --respawn --transpile-only src/main.ts

# Using nodemon
nodemon --watch src -e ts --exec ts-node src/main.ts

# Using NestJS CLI
nest start --watch
```

The Vite dev server persists across NestJS restarts, so frontend HMR is never interrupted.

## Production Build

```bash
# Build everything
npm run build

# Start production server
npm run start:prod
```

The framework automatically switches between dev (HMR) and production (static bundles) based on `NODE_ENV`.

## TypeScript Configuration

Full TypeScript support out of the box. All exports are typed.

### Development vs Production Configuration

NIST requires **two separate TypeScript configs** to prevent conflicts between NestJS compilation and Vite HMR:

**1. `tsconfig.build.json`** (for development - excludes `.tsx`):

```json
{
  "extends": "./tsconfig.json",
  "exclude": [
    "node_modules",
    "test",
    "dist",
    "**/*spec.ts",
    "public",
    "**/*.tsx"
  ]
}
```

**2. `tsconfig.prod.json`** (for production builds - includes `.tsx`):

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "declaration": true
  },
  "include": ["src/**/*", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
}
```

**Key points:**

- ✅ **`tsconfig.build.json`** excludes `**/*.tsx` - prevents `nest start --watch` from compiling React files
- ✅ **`tsconfig.prod.json`** includes `"src/**/*.tsx"` - compiles pages/layouts for production
- ✅ **Development:** Vite handles all `.tsx` compilation with HMR
- ✅ **Production:** TypeScript compiles `.tsx` files to JavaScript
- ⚠️ Without the exclude in build config, NestJS will try to compile `.tsx` files and break HMR

## License

MIT

## Who Should Use NIST?

**Perfect for:**

- 🏢 **Enterprise applications** requiring robust backend architecture
- 🔐 **Auth-heavy applications** with complex permission systems
- 📊 **Data-intensive apps** with significant server-side logic
- 🚀 **Performance-critical** applications needing fast SSR
- 🧩 **Microservices** architectures wanting consistent frontend

---

## Documentation

- 📚 [Full Documentation](https://github.com/ohanronnie/nist-stack/tree/main/docs)
- 🚀 [Getting Started Guide](https://github.com/ohanronnie/nist-stack/blob/main/docs/guide/getting-started.md)
- 📖 [API Reference](https://github.com/ohanronnie/nist-stack/blob/main/docs/api/decorators.md)
- 🎯 [Examples](https://github.com/ohanronnie/nist-stack/tree/main/docs/examples)
- 🔧 [Configuration](https://github.com/ohanronnie/nist-stack/blob/main/docs/guide/configuration.md)
- 🚢 [Deployment Guide](https://github.com/ohanronnie/nist-stack/blob/main/docs/advanced/deployment.md)

---

## Community & Support

- 💬 [GitHub Discussions](https://github.com/ohanronnie/nist-stack/discussions) - Ask questions and share ideas
- 🐛 [Issue Tracker](https://github.com/ohanronnie/nist-stack/issues) - Report bugs and request features
- 📧 [Email Support](mailto:support@nist-stack.dev) - For private inquiries
- 💼 [Enterprise Support](https://github.com/ohanronnie/nist-stack#enterprise) - Professional support options

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/ohanronnie/nist-stack/blob/main/CONTRIBUTING.md) for details.

- 🐛 [Report a bug](https://github.com/ohanronnie/nist-stack/issues/new?template=bug_report.md)
- ✨ [Request a feature](https://github.com/ohanronnie/nist-stack/issues/new?template=feature_request.md)
- 📖 [Improve documentation](https://github.com/ohanronnie/nist-stack/tree/main/docs)

---

## Security

Found a security vulnerability? Please review our [Security Policy](https://github.com/ohanronnie/nist-stack/blob/main/SECURITY.md) and report it responsibly.

---

## Changelog

See [CHANGELOG.md](https://github.com/ohanronnie/nist-stack/blob/main/CHANGELOG.md) for release notes and version history.

---

## License

MIT

---

## Acknowledgments

Built with:

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [React](https://react.dev/) - Library for building user interfaces

---

<div align="center">
  <p><strong>Built with ❤️ by Ronnie</strong></p>
  <p>⭐ Star us on <a href="https://github.com/ohanronnie/nist-stack">GitHub</a> if you find this useful!</p>
</div>
