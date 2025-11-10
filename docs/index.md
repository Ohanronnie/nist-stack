---
layout: home

hero:
  name: "NIST Stack"
  text: "Full-Stack SSR Framework"
  tagline: Enterprise-grade NestJS backend meets lightning-fast Vite frontend
  actions:
    - theme: brand
      text: Get Started →
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/ohanronnie/nist-stack
    - theme: alt
      text: Live Demo
      link: https://demo.nist-stack.dev

features:
  - icon: ⚡
    title: Lightning Fast SSR
    details: Achieve 19ms response times in development with Vite's instant HMR, aggressive module caching, and parallel data loading

  - icon: 🎯
    title: Type-Safe End-to-End
    details: Full TypeScript support with complete type inference from controller to component. Never write prop types manually

  - icon: 🔐
    title: Authentication & Guards
    details: Built-in guard system with server-side redirects, session management, and flexible authorization patterns

  - icon: 📄
    title: Dynamic SEO Metadata
    details: Controller-based metadata generation with OpenGraph and Twitter Card support. Perfect for SEO and social sharing

  - icon: 🏗️
    title: NestJS Architecture
    details: Enterprise-grade dependency injection, modular design, and battle-tested patterns from NestJS

  - icon: 🎨
    title: React 18 + Vite
    details: Modern React development with Fast Refresh, code splitting, and optimized production builds powered by Vite

  - icon: 🔄
    title: Decorator-Based Routing
    details: Intuitive routing with @Page decorators. No route config files, no manual page registration required

  - icon: 🚀
    title: Production Ready
    details: HTTP/2, caching strategies, health checks, monitoring integration, and comprehensive deployment guides

  - icon: 📡
    title: Data Fetching
    details: Server-side data loading with parallel requests, error handling, and automatic prop passing to components

  - icon: 🎣
    title: Client-Side Hooks
    details: Complete set of React hooks - useRouter, useParams, useQuery, and more for full control of navigation and state

  - icon: 🛡️
    title: Error Handling
    details: Custom exception filters, redirect exceptions, error boundaries, and graceful degradation patterns

  - icon: 🧪
    title: Testing Built-In
    details: Comprehensive testing support with Vitest, React Testing Library, and E2E testing with Playwright

  - icon: 📦
    title: Zero Config
    details: Sensible defaults with Vite config helper. Start coding immediately without complex configuration
---

## Quick Example

```typescript
// app.controller.ts
import { Controller, Get } from "@nestjs/common";
import { Page, PageRoot } from "nist-stack";
import type { PageResponse } from "nist-stack";

@PageRoot(__dirname)
@Controller()
export class AppController {
  @Get()
  @Page("home")
  getHome(): PageResponse {
    return {
      data: { users: ["Alice", "Bob", "Charlie"] },
      metadata: {
        title: "Home - My App",
        description: "Welcome to my SSR app",
      },
    };
  }
}
```

```tsx
// home.page.tsx
export default function Home({ users }) {
  return (
    <div>
      <h1>Welcome!</h1>
      <ul>
        {users.map((user) => (
          <li key={user}>{user}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Why Choose NIST?

NIST combines enterprise-grade backend architecture with modern frontend tooling, providing a comprehensive solution for building scalable, performant web applications.

### Performance First

- **Sub-20ms SSR** in development with intelligent caching
- **Parallel data loading** for optimal request handling
- **Production optimizations** including code splitting and HTTP/2

### Enterprise Architecture

- **Full NestJS integration** with dependency injection and modular design
- **Type-safe** from database to UI with complete TypeScript inference
- **Built-in patterns** for authentication, authorization, and error handling

### Developer Experience

- **Vite-powered HMR** for instant feedback during development
- **Decorator-based routing** - no configuration files needed
- **Comprehensive documentation** with real-world examples

### SEO & Metadata

- **Dynamic metadata generation** based on request context
- **OpenGraph & Twitter Cards** for perfect social sharing
- **Server-side rendering** ensures content is crawlable

## Framework Comparison

| Feature                  | NIST           | Next.js            | Remix           |
| ------------------------ | -------------- | ------------------ | --------------- |
| **Backend Framework**    | Full NestJS    | Limited API routes | Express-like    |
| **SSR Performance**      | ~19ms (cached) | ~150-300ms         | ~200-400ms      |
| **Dependency Injection** | ✅ NestJS      | ❌                 | ❌              |
| **Type Safety**          | ✅ End-to-end  | ⚠️ Partial         | ⚠️ Partial      |
| **Guards & Auth**        | ✅ Built-in    | ⚠️ Custom          | ⚠️ Custom       |
| **Build Tool**           | Vite 7         | Turbopack/Webpack  | esbuild         |
| **Module System**        | ESM + NestJS   | ESM                | ESM             |
| **Testing Support**      | ✅ Built-in    | ⚠️ Manual setup    | ⚠️ Manual setup |
| **Middleware**           | ✅ Full NestJS | ⚠️ Limited         | ⚠️ Limited      |
| **Enterprise Ready**     | ✅ Yes         | ⚠️ Partial         | ⚠️ Partial      |

<br>

::: tip Ready to start?
Check out the [Getting Started](/guide/getting-started) guide to build your first NIST app!
:::
