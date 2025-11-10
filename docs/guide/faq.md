# Frequently Asked Questions (FAQ)

Quick answers to common questions about NIST Stack.

## General Questions

### What is NIST Stack?

NIST Stack is a full-stack framework that combines NestJS (backend) with Vite and React (frontend) to create server-side rendered applications with excellent performance and developer experience.

### Why choose NIST over Next.js or Remix?

**Choose NIST if you need:**

- Full NestJS backend with dependency injection
- Enterprise-grade architecture patterns
- Complex server-side business logic
- Advanced authentication and authorization
- Microservices integration

**Choose Next.js if you need:**

- Edge rendering capabilities
- Static site generation focus
- Vercel-optimized deployment
- Simpler backend requirements

**Choose Remix if you need:**

- Loader/action pattern
- Progressive enhancement focus
- Different data loading approach

### What's the performance like?

- **Development SSR**: ~19ms (cached)
- **Production SSR**: Depends on your data fetching
- **HMR**: Instant (Vite powered)
- **Build time**: Faster than Webpack-based tools

### Is NIST production-ready?

Yes! NIST is built on battle-tested technologies:

- NestJS (used by thousands of enterprise apps)
- React 19 (most popular UI library)
- Vite 7 (industry-standard build tool)

---

## Installation & Setup

### What are the minimum requirements?

- **Node.js**: 18.0.0 or higher
- **Bun**: 1.0.0 or higher (optional)
- **TypeScript**: 5.0+
- **React**: 19.0.0+
- **NestJS**: 11.0.0+

### Can I use NIST with JavaScript instead of TypeScript?

While technically possible, we **strongly recommend TypeScript**. NIST's main benefits include end-to-end type safety, which you lose with JavaScript.

### Can I add NIST to an existing NestJS project?

Yes! See our [Existing Project Integration](../advanced/existing-project.md) guide.

### Do I need to learn NestJS first?

Basic NestJS knowledge is helpful but not required. If you're familiar with:

- Decorators (`@Controller`, `@Get`, etc.)
- Dependency injection concepts
- Express.js middleware

You'll be able to use NIST effectively. Our docs include NestJS basics where relevant.

---

## Development

### How do I enable Hot Module Replacement (HMR)?

HMR is enabled by default when using `createViteDevServer()`. Ensure your `entry-client.tsx` includes:

```typescript
if (import.meta.hot) {
  import.meta.hot.accept(Object.keys(pages), async () => {
    await render();
  });
}
```

### Can I use CSS-in-JS libraries?

Yes! NIST supports:

- **Styled Components** ✅
- **Emotion** ✅
- **Tailwind CSS** ✅
- **CSS Modules** ✅ (built-in)
- **Sass/SCSS** ✅

### Can I use state management libraries?

Yes! Use any React state management:

- **Zustand** ✅
- **Redux Toolkit** ✅
- **Jotai** ✅
- **MobX** ✅
- **React Context** ✅ (built-in)

### How do I add global styles?

Import them in `entry-client.tsx`:

```typescript
import "./globals.css";
import { createClientEntry } from "nist-stack/client";
// ... rest of code
```

### Can I use React Server Components?

Not currently. NIST uses traditional SSR. React Server Components may be supported in a future version.

---

## Routing & Pages

### How does routing work?

Routing is decorator-based:

1. Define a route in your NestJS controller with `@Get()`, `@Post()`, etc.
2. Use `@Page('name')` to connect it to a React component
3. Create `name.page.tsx` in your pages directory

### Can I have dynamic routes?

Yes! Use NestJS route parameters:

```typescript
@Get('users/:id')
@Page('user-detail')
getUserDetail(@Param('id') id: string) {
  return { data: { userId: id } };
}
```

### How do I create nested routes?

Use NestJS controller paths:

```typescript
@Controller('blog')
export class BlogController {
  @Get()
  @Page('blog-home')

  @Get(':slug')
  @Page('blog-post')
}
```

### Can I use query parameters?

Yes! Access them in your controller and pass to the page:

```typescript
@Get('search')
@Page('search')
getSearch(@Query('q') query: string) {
  return {
    data: {
      query,
      results: this.searchService.search(query)
    }
  };
}
```

In your component, use `useQuery()`:

```tsx
import { useQuery } from "nist-stack/client";

export default function SearchPage() {
  const { q } = useQuery<{ q: string }>();
  return <div>Searching for: {q}</div>;
}
```

---

## Data Fetching

### Where should I fetch data?

**Server-side (recommended):**

```typescript
@Get()
@Page('home')
async getHome() {
  const data = await this.dataService.fetchData();
  return { data };
}
```

**Client-side (when needed):**

```tsx
export default function HomePage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/data")
      .then((res) => res.json())
      .then(setData);
  }, []);
}
```

### Can I use React Query or SWR?

Yes! For client-side data fetching, use any library you prefer:

```tsx
import { useQuery } from "@tanstack/react-query";

export default function HomePage() {
  const { data } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetch("/api/users").then((r) => r.json()),
  });
}
```

### How do I handle API calls?

Create NestJS services and inject them:

```typescript
@Injectable()
export class UserService {
  async getUsers() {
    return this.http.get("https://api.example.com/users");
  }
}

@Controller()
export class AppController {
  constructor(private userService: UserService) {}

  @Get()
  @Page("home")
  async getHome() {
    const users = await this.userService.getUsers();
    return { data: { users } };
  }
}
```

---

## Authentication & Security

### How do I implement authentication?

Use NestJS guards:

```typescript
import { AuthGuard } from './auth.guard';

@UseGuards(AuthGuard)
@Get('dashboard')
@Page('dashboard')
getDashboard(@Req() req) {
  return { data: { user: req.user } };
}
```

See our [Guards documentation](../features/guards.md) for details.

### Can I use Passport.js?

Yes! NestJS has excellent Passport integration:

```bash
npm install @nestjs/passport passport passport-local
```

Follow the [NestJS Passport docs](https://docs.nestjs.com/security/authentication).

### How do I protect routes?

Use guards at the controller or method level:

```typescript
@UseGuards(AuthGuard)
@Controller("admin")
export class AdminController {
  // All routes in this controller are protected
}
```

### How do I handle sessions?

Use express-session with NestJS:

```typescript
import * as session from "express-session";

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
```

---

## Deployment

### Where can I deploy NIST apps?

NIST apps can be deployed anywhere that supports Node.js:

- **AWS** (EC2, ECS, Lambda with adapter)
- **Google Cloud** (Cloud Run, App Engine)
- **Azure** (App Service)
- **DigitalOcean** (App Platform, Droplets)
- **Heroku**
- **Railway**
- **Render**
- **Fly.io**
- **Self-hosted** (VPS, Docker)

See our [Deployment Guide](../advanced/deployment.md).

### Can I deploy to Vercel?

Vercel is optimized for Next.js. While possible, we recommend:

- **Railway** - Zero config Node.js hosting
- **Render** - Auto-deploy from Git
- **Fly.io** - Global edge deployment

### How do I containerize my NIST app?

See the Docker example in our [Deployment Guide](../advanced/deployment.md#docker-deployment).

### Do I need a separate frontend and backend deployment?

No! NIST is a monolithic SSR application. Deploy as a single Node.js app.

---

## Performance

### How do I optimize bundle size?

1. **Enable code splitting** (automatic in production)
2. **Use dynamic imports:**

```tsx
const HeavyComponent = lazy(() => import("./HeavyComponent"));
```

3. **Analyze your bundle:**

```bash
npx vite-bundle-visualizer
```

### How do I cache pages?

Use NestJS interceptors or middleware:

```typescript
import { CacheInterceptor } from '@nestjs/cache-manager';

@UseInterceptors(CacheInterceptor)
@Get()
@Page('home')
getHome() {
  return { data: {} };
}
```

### How do I implement ISR (Incremental Static Regeneration)?

ISR is on our roadmap. Currently, use:

- Server-side caching (Redis, memory)
- CDN caching headers
- Static generation at build time

---

## Troubleshooting

### My page shows "Page not found"

Check:

1. Page file exists: `src/[pageName].page.tsx`
2. `@PageRoot(__dirname)` points to correct directory
3. File ends with `.page.tsx` (not `.tsx` or `.page.ts`)

### Props are undefined in my component

Ensure you're returning `data` from controller:

```typescript
// ✅ Correct
return { data: { message: "Hello" } };

// ❌ Wrong
return { message: "Hello" };
```

### HMR isn't working

1. Check browser console for errors
2. Verify Vite dev server is running
3. Ensure HMR code is in `entry-client.tsx`
4. Clear Vite cache: `rm -rf node_modules/.vite`

See [Troubleshooting Guide](./troubleshooting.md) for more issues.

---

## Compatibility

### What React versions are supported?

- **React 19.x** ✅ (recommended)
- **React 18.x** ⚠️ (should work but untested)
- **React 17.x** ❌ (not supported)

### What Node.js versions are supported?

- **Node.js 20.x** ✅ (recommended)
- **Node.js 18.x** ✅ (supported)
- **Node.js 16.x** ❌ (EOL, not supported)

### Can I use Bun instead of Node.js?

Yes! Bun 1.0+ is fully supported and offers faster performance.

### Does NIST work on Windows?

Yes! NIST works on:

- Windows 10/11 ✅
- macOS ✅
- Linux ✅

---

## Migration & Integration

### Can I migrate from Next.js to NIST?

Yes, but it requires refactoring:

1. Convert Next.js pages to NIST pages
2. Move page data fetching to controllers
3. Update routing to decorator-based
4. Migrate API routes to NestJS controllers

There's no automated migration tool currently.

### Can I use NIST with microservices?

Yes! NestJS has excellent microservices support:

- gRPC ✅
- Message queues (RabbitMQ, Kafka) ✅
- TCP/Redis transport ✅

### Can I use GraphQL with NIST?

Yes! Use `@nestjs/graphql`:

```bash
npm install @nestjs/graphql @nestjs/apollo @apollo/server graphql
```

Follow [NestJS GraphQL docs](https://docs.nestjs.com/graphql/quick-start).

---

## Community & Support

### Where can I get help?

1. **Documentation** - You're reading it!
2. **GitHub Discussions** - Ask questions, share ideas
3. **GitHub Issues** - Report bugs, request features
4. **Discord** - Real-time community help

### How do I report a bug?

1. Check [existing issues](https://github.com/ohanronnie/nist-stack/issues)
2. Create a [new issue](https://github.com/ohanronnie/nist-stack/issues/new)
3. Include reproduction steps and environment details

### How can I contribute?

See our [Contributing Guide](../../CONTRIBUTING.md)!

### Is there commercial support available?

Enterprise support options are coming soon. Email [support@nist-stack.dev](mailto:support@nist-stack.dev) for inquiries.

---

## Didn't find your answer?

- 📖 Check the [full documentation](../introduction.md)
- 🔍 [Search GitHub issues](https://github.com/ohanronnie/nist-stack/issues)
- 💬 [Ask on GitHub Discussions](https://github.com/ohanronnie/nist-stack/discussions)
- 🐛 [Report a bug](https://github.com/ohanronnie/nist-stack/issues/new)
