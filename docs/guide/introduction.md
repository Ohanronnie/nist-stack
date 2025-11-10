# What is NIST?

**NIST** (NestJS + Vite SSR) is a full-stack framework that combines the power of NestJS with Vite's lightning-fast development experience to deliver server-side rendered React applications.

## The Problem

Building modern SSR applications typically requires choosing between:

- **Next.js**: Great for React, but limited backend capabilities
- **Remix**: Good SSR, but no dependency injection or modular architecture
- **Custom Setup**: Full control, but time-consuming and complex

## The Solution

NIST gives you:

✅ **Full NestJS backend** - Complete dependency injection, modules, guards, interceptors  
✅ **Vite-powered frontend** - Instant HMR, optimized builds, modern tooling  
✅ **Seamless SSR** - 19ms response times with intelligent caching  
✅ **Type-safe** - End-to-end TypeScript with full type inference  
✅ **Production ready** - Battle-tested architecture for scalable applications

## Key Features

### 🚀 Lightning Fast Development

With Vite's instant hot module replacement and optimized module loading, you get:

- **19ms** SSR response times (cached)
- **Instant feedback** on code changes
- **Fast builds** for production

### 🏗️ Enterprise Architecture

Built on NestJS, you get access to:

- **Dependency Injection** for clean, testable code
- **Modules** for organizing large applications
- **Guards & Interceptors** for cross-cutting concerns
- **Full NestJS ecosystem** compatibility

### 🎯 Developer Experience

- **File-based routing** with decorators
- **Type-safe props** from server to client
- **Dynamic metadata** for SEO
- **Built-in auth guards** with redirects
- **React + TypeScript** with full intellisense

### 📦 Production Ready

- **Optimized builds** with Vite
- **Caching strategies** for performance
- **Security headers** built-in
- **Easy deployment** to any Node.js host

## How It Works

```
Request → NestJS Controller → SSR Engine → React Component → HTML Response
            ↓                    ↓              ↓
         Business Logic    Vite Transform   Server Render
         + Data Fetching   + HMR Support    + Hydration
```

1. **Request hits NestJS controller** - Handle auth, fetch data, business logic
2. **Controller returns data + metadata** - Type-safe response with SEO tags
3. **SSR engine renders React** - Fast server-side rendering with Vite
4. **Client hydrates** - Seamless transition to interactive SPA

## Philosophy

NIST follows these principles:

1. **Convention over Configuration** - Sensible defaults, easy to customize
2. **Type Safety First** - End-to-end TypeScript with no type casting
3. **Performance Matters** - Sub-20ms SSR in development
4. **Developer Happiness** - Great DX with instant feedback
5. **Production Ready** - Built for real-world applications

## When to Use NIST

**Perfect for:**

- 🏢 **Enterprise applications** needing NestJS architecture
- 🔐 **Auth-heavy apps** with complex permission systems
- 📊 **Data-intensive** applications with lots of server logic
- 🚀 **Performance-critical** SSR applications
- 🧩 **Microservices** wanting consistent frontend

**Consider alternatives if:**

- You only need static site generation (use Astro, VitePress)
- You want edge-first rendering (use Next.js with Vercel)
- You're building a simple blog (use WordPress, Ghost)

## Next Steps

Ready to build your first NIST application?

<div class="tip custom-block">
  <p class="custom-block-title">Get Started</p>
  <p>Follow the <a href="/guide/getting-started">Getting Started</a> guide to create your first NIST app in 5 minutes!</p>
</div>
