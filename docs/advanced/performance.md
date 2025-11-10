# Performance Optimization

NIST is designed for high-performance server-side rendering, achieving sub-20ms response times in development. This guide covers optimization strategies, profiling techniques, and best practices for building fast applications.

## Performance Overview

### Benchmark Results

NIST achieves impressive performance metrics:

- **Development (cached):** ~19ms response time
- **Development (cold start):** ~150-200ms initial load
- **Production:** Sub-10ms with optimized builds
- **Time to First Byte (TTFB):** <50ms
- **First Contentful Paint (FCP):** <200ms

### Architecture Benefits

1. **Vite's Module System** - Instant module loading with ES modules
2. **Module Caching** - Aggressive caching of loaded modules
3. **Parallel Loading** - Concurrent loading of layouts, pages, and data
4. **Streaming SSR** - React 18 streaming capabilities (future)

## Module Loading Optimization

### Vite Module Caching

NIST leverages Vite's built-in module caching:

```typescript
// packages/nist-core/src/common/page.interceptor.ts

// Vite automatically caches transformed modules
const pageModule = await this.vite.ssrLoadModule(pagePath);
```

**Key Points:**

- First request: ~150ms (module transformation)
- Subsequent requests: ~19ms (cached modules)
- HMR invalidates only changed modules
- Production builds are pre-bundled

### Custom Module Caching

Implement application-level caching for expensive operations:

```typescript
const MODULE_CACHE = new Map<string, CachedModule>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedModule {
  component: any;
  metadata: any;
  timestamp: number;
}

async function loadPageModule(pagePath: string): Promise<CachedModule> {
  const cached = MODULE_CACHE.get(pagePath);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached;
  }

  const pageModule = await vite.ssrLoadModule(pagePath);

  const cachedModule = {
    component: pageModule.default,
    metadata: pageModule.metadata || {},
    timestamp: Date.now(),
  };

  MODULE_CACHE.set(pagePath, cachedModule);
  return cachedModule;
}
```

## Parallel Data Loading

### Promise.all for Concurrent Requests

Load multiple data sources simultaneously:

```typescript
@Get('dashboard')
@Page('dashboard')
async getDashboard(): Promise<PageResponse> {
  // Parallel execution - much faster than sequential
  const [user, posts, stats] = await Promise.all([
    this.userService.getCurrentUser(),
    this.postService.findRecent(5),
    this.analyticsService.getStats(),
  ]);

  return {
    data: { user, posts, stats },
    metadata: { title: 'Dashboard' },
  };
}
```

**Performance Impact:**

- Sequential: 150ms + 100ms + 80ms = 330ms
- Parallel: max(150ms, 100ms, 80ms) = 150ms
- **Improvement: 54% faster**

### Parallel Layout/Page Loading

NIST loads layouts and pages concurrently:

```typescript
// Internal implementation
const [pageModule, cachedLayout, rootLayout] = await Promise.all([
  this.loadPageModule(pagePath),
  hasPagesDir
    ? this.loadLayout(sourcePath, customLayout)
    : Promise.resolve(null),
  this.loadRootLayout(sourcePath),
]);
```

## Response Caching

### Page-Level Caching

Configure caching with the `revalidate` config:

```tsx
// pages/blog.page.tsx

export const config = {
  revalidate: 60, // Cache for 60 seconds
};

export default function Blog({ posts }) {
  return <div>{/* ... */}</div>;
}
```

This sets the `Cache-Control` header:

```
Cache-Control: s-maxage=60, stale-while-revalidate
```

### Static Page Caching

For pages that rarely change:

```tsx
export const config = {
  revalidate: 3600, // 1 hour
};
```

### Dynamic Content

Skip caching for dynamic content:

```tsx
export const config = {
  revalidate: 0, // No caching
};
```

### CDN Caching

Leverage CDN caching for static assets and pages:

```typescript
@Get('blog/:slug')
@Page('post')
async getPost(
  @Param('slug') slug: string,
  @Res({ passthrough: true }) res: Response,
): Promise<PageResponse> {
  const post = await this.blogService.findBySlug(slug);

  // Cache at CDN level
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  return {
    data: { post },
    metadata: { title: post.title },
  };
}
```

## Data Caching

### Service-Level Caching

Install NestJS cache manager:

```bash
bun add @nestjs/cache-manager cache-manager
```

Configure caching module:

```typescript
import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  imports: [
    CacheModule.register({
      ttl: 300, // 5 minutes
      max: 100, // Maximum items in cache
    }),
  ],
})
export class AppModule {}
```

Use in services:

```typescript
import { Injectable, Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

@Injectable()
export class BlogService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private postRepo: PostRepository
  ) {}

  async findAll(): Promise<Post[]> {
    const cacheKey = "posts:all";

    // Try cache first
    const cached = await this.cacheManager.get<Post[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const posts = await this.postRepo.findAll();

    // Store in cache
    await this.cacheManager.set(cacheKey, posts, 300); // 5 minutes

    return posts;
  }

  async clearCache() {
    await this.cacheManager.del("posts:all");
  }
}
```

### Redis Caching

For distributed caching:

```bash
bun add cache-manager-redis-store redis
```

```typescript
import { CacheModule } from "@nestjs/cache-manager";
import * as redisStore from "cache-manager-redis-store";

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      ttl: 300,
    }),
  ],
})
export class AppModule {}
```

## Database Optimization

### Query Optimization

Use database indexes and efficient queries:

```typescript
// Bad - N+1 query problem
async getPosts() {
  const posts = await this.postRepo.find();
  for (const post of posts) {
    post.author = await this.userRepo.findById(post.authorId); // N queries
  }
  return posts;
}

// Good - Single query with join
async getPosts() {
  return this.postRepo.find({
    relations: ['author'], // Single query with JOIN
  });
}
```

### Connection Pooling

Configure database connection pooling:

```typescript
TypeOrmModule.forRoot({
  type: "postgres",
  host: process.env.DB_HOST,
  poolSize: 20, // Adjust based on load
  extra: {
    max: 20,
    min: 5,
    idleTimeoutMillis: 30000,
  },
});
```

### Pagination

Implement efficient pagination:

```typescript
@Get('posts')
async getPosts(@Query('page') page: number = 1) {
  const limit = 20;
  const skip = (page - 1) * limit;

  const [posts, total] = await this.postRepo.findAndCount({
    skip,
    take: limit,
    order: { createdAt: 'DESC' },
  });

  return {
    data: { posts, total, pages: Math.ceil(total / limit) },
    metadata: {},
  };
}
```

## Build Optimization

### Production Build

Optimize your production build:

```json
// package.json
{
  "scripts": {
    "build": "nest build && vite build",
    "build:analyze": "vite build --mode analyze"
  }
}
```

### Code Splitting

Vite automatically splits code. Lazy load heavy components:

```tsx
import { lazy, Suspense } from "react";

const HeavyChart = lazy(() => import("./HeavyChart"));

export default function Dashboard() {
  return (
    <div>
      <Suspense fallback={<div>Loading chart...</div>}>
        <HeavyChart />
      </Suspense>
    </div>
  );
}
```

### Bundle Analysis

Analyze bundle size:

```bash
bun add -d rollup-plugin-visualizer
```

```typescript
// vite.config.ts
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [react(), visualizer({ open: true })],
});
```

## Profiling and Monitoring

### Request Timing

Add timing middleware:

```typescript
import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class TimingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = performance.now();

    res.on("finish", () => {
      const duration = performance.now() - start;
      res.setHeader("Server-Timing", `total;dur=${duration.toFixed(2)}`);

      if (duration > 100) {
        console.warn(
          `Slow request: ${req.method} ${req.url} - ${duration.toFixed(2)}ms`
        );
      }
    });

    next();
  }
}
```

### Performance Marks

Add custom performance marks:

```typescript
@Get('dashboard')
async getDashboard(): Promise<PageResponse> {
  const t1 = performance.now();

  const data = await this.fetchData();
  const t2 = performance.now();

  console.log(`Data fetch: ${(t2 - t1).toFixed(2)}ms`);

  return { data, metadata: {} };
}
```

### APM Integration

Integrate with Application Performance Monitoring:

```bash
bun add @sentry/node @sentry/profiling-node
```

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
});
```

## Memory Optimization

### Avoid Memory Leaks

```typescript
// Bad - Memory leak
const cache = new Map(); // Never cleared
setInterval(() => {
  cache.set(Date.now(), data);
}, 1000);

// Good - LRU cache with size limit
import LRU from "lru-cache";

const cache = new LRU({
  max: 500,
  maxAge: 1000 * 60 * 5,
});
```

### Streaming Large Responses

For large datasets, use streaming:

```typescript
import { StreamableFile } from '@nestjs/common';
import { createReadStream } from 'fs';

@Get('large-file')
getLargeFile(): StreamableFile {
  const file = createReadStream('large-file.json');
  return new StreamableFile(file);
}
```

## Best Practices

### 1. Measure First, Optimize Second

Always profile before optimizing:

```bash
# Development profiling
NODE_OPTIONS='--inspect' bun run dev

# Chrome DevTools -> chrome://inspect
```

### 2. Use Appropriate Caching

| Content Type    | Cache Strategy        |
| --------------- | --------------------- |
| Static assets   | Long-term (1 year)    |
| Blog posts      | Medium-term (1 hour)  |
| User dashboards | Short-term (1 minute) |
| Real-time data  | No cache              |

### 3. Optimize Critical Path

Focus on optimizing the most frequently accessed routes first.

### 4. Monitor in Production

Use APM tools like:

- New Relic
- DataDog
- Sentry
- Prometheus + Grafana

### 5. Regular Performance Audits

```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun
```

## Performance Checklist

- [ ] Enable module caching
- [ ] Use parallel data loading
- [ ] Configure response caching appropriately
- [ ] Add service-level caching for expensive operations
- [ ] Optimize database queries (avoid N+1)
- [ ] Implement connection pooling
- [ ] Use code splitting for large components
- [ ] Add performance monitoring
- [ ] Configure CDN caching
- [ ] Optimize images (WebP, lazy loading)
- [ ] Minify and compress assets
- [ ] Use HTTP/2 or HTTP/3
- [ ] Enable gzip/brotli compression

## Troubleshooting

### Slow Cold Starts

**Symptom:** First request takes 150-200ms  
**Solution:** This is normal in development. Vite transforms modules on-demand. Subsequent requests are cached (~19ms).

### Memory Growth

**Symptom:** Memory usage grows over time  
**Solution:** Implement cache size limits and TTL. Use LRU cache.

### Slow Database Queries

**Symptom:** Requests timeout or take >1s  
**Solution:** Add database indexes, use query profiling, implement caching.

### High CPU Usage

**Symptom:** CPU at 100% during SSR  
**Solution:** SSR is CPU-bound. Scale horizontally or use caching.

## See Also

- [Data Fetching](/features/data-fetching) - Optimizing data loading
- [Deployment](/advanced/deployment) - Production deployment
- [NestJS Caching](https://docs.nestjs.com/techniques/caching) - Official caching docs
