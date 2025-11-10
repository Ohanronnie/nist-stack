# Troubleshooting

Common issues and their solutions when working with NIST Stack.

## Installation Issues

### Cannot find module 'nist-stack'

**Problem:** TypeScript or Node.js cannot resolve the `nist-stack` module.

**Solutions:**

1. Ensure the package is installed:

```bash
npm install nist-stack
# or
bun add nist-stack
```

2. Clear node_modules and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

3. Check your `package.json` includes the dependency:

```json
{
  "dependencies": {
    "nist-stack": "^1.0.0"
  }
}
```

### Peer dependency warnings

**Problem:** npm warns about missing peer dependencies.

**Solution:** Install the required peer dependencies:

```bash
npm install @nestjs/common @nestjs/core @nestjs/platform-express react react-dom vite
```

Required versions:

- `@nestjs/common`: ^11.0.0

### TypeScript not compiling .tsx files

**Problem:** Production build fails or page files are not compiled.

**Solution:** Ensure your `tsconfig.build.json` (or build config) includes `.tsx` files:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "declaration": true
  },
  "include": ["src/**/*", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

**Key points:**

- Add `"src/**/*.tsx"` to the `include` array in `tsconfig.build.json` (production builds ONLY)
- This ensures page and layout files are compiled during production build
- Without this, you'll get "Cannot find module" errors in production
- ⚠️ **Do NOT** compile `.tsx` files during development (`nest start --watch`) - this breaks Vite HMR
- In dev mode, Vite handles all `.tsx` compilation with instant hot reload
- `@nestjs/core`: ^11.0.0
- `react`: ^19.0.0
- `react-dom`: ^19.0.0
- `vite`: ^7.0.0

---

## Development Server Issues

### Port already in use

**Problem:** Error: `EADDRINUSE: address already in use :::3000`

**Solutions:**

1. **Change the port:**

```typescript
await app.listen(3001); // Use a different port
```

2. **Kill the process using the port:**

```bash
# Find process
lsof -i :3000

# Kill it
kill -9 <PID>
```

3. **Use environment variable:**

```typescript
const port = process.env.PORT || 3000;
await app.listen(port);
```

### Vite dev server not starting

**Problem:** Vite fails to start or shows connection errors.

**Solutions:**

1. **Check Vite configuration:**

```typescript
// vite.config.ts
import { createConfig } from "nist-stack";

export default createConfig(); // Must use createConfig
```

2. **Clear Vite cache:**

```bash
rm -rf node_modules/.vite
```

3. **Check for port conflicts:**
   Vite HMR uses port 24678 by default. Ensure it's available.

### Hot Module Replacement (HMR) not working

**Problem:** Changes don't reflect without full page reload.

**Solutions:**

1. **Ensure entry-client.tsx has HMR code:**

```typescript
if (import.meta.hot) {
  import.meta.hot.accept(Object.keys(pages), async () => {
    await render();
  });
}
```

2. **Check browser console for errors:**
   HMR can fail silently if there are runtime errors.

3. **Verify Vite dev server is running:**

```bash
# Should see Vite HMR websocket connection in network tab
```

---

## Build Issues

### Build fails with TypeScript errors

**Problem:** `tsc` compilation errors during build.

**Solutions:**

1. **Check tsconfig.json:**

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

2. **Fix type errors:**

```bash
npm run build 2>&1 | grep error
```

3. **Skip lib check temporarily (not recommended for production):**

```json
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

### Vite build fails

**Problem:** `vite build` command fails.

**Solutions:**

1. **Check for syntax errors in .tsx files:**

```bash
npx vite build --debug
```

2. **Clear build output:**

```bash
rm -rf dist/client dist/client-ssr
```

3. **Verify entry-client.tsx exists:**

```bash
ls -la src/entry-client.tsx
```

### Production build works but app doesn't render

**Problem:** Production build completes but page shows blank.

**Solutions:**

1. **Check NODE_ENV is set to production:**

```bash
NODE_ENV=production node dist/main.js
```

2. **Verify client build artifacts exist:**

```bash
ls -la dist/client/
# Should contain .manifest.json and assets/
```

3. **Check browser console for errors:**
   Often caused by missing environment variables or incorrect paths.

---

## SSR & Hydration Issues

### App doesn't hydrate / React not interactive

**Problem:** Your app renders but clicks don't work, or you see "React is not defined" errors.

**Cause:** Missing `hydrationScripts` in your layout.

**Solution:** Ensure your root layout includes the required props:

```tsx
// src/app.layout.tsx
import type { LayoutProps } from "nist-stack/client";

export default function AppLayout({
  children,
  metaTags, // ✅ REQUIRED
  hydrationScripts, // ✅ REQUIRED
  metadata,
}: LayoutProps) {
  const isClient = typeof window !== "undefined";

  if (isClient) {
    return <>{children}</>;
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <title>{metadata?.title || "My App"}</title>
        {metaTags} {/* ✅ Must be in <head> for SEO */}
      </head>
      <body>
        <div id="root">{children}</div>
        {hydrationScripts} {/* ✅ Must be before </body> for hydration */}
      </body>
    </html>
  );
}
```

**What these do:**

- `{metaTags}` - Injects SEO meta tags from your controller's metadata
- `{hydrationScripts}` - Injects React client bundle for interactivity

Without these, your app will be static HTML only!

### Hydration mismatch errors

**Problem:** React shows "Hydration failed" warnings.

**Cause:** Server and client render different HTML.

**Solutions:**

1. **Avoid browser-only APIs during render:**

```tsx
// ❌ BAD
export default function Page() {
  const width = window.innerWidth; // Fails on server
  return <div>{width}</div>;
}

// ✅ GOOD
export default function Page() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setWidth(window.innerWidth);
  }, []);

  return <div>{width || "Loading..."}</div>;
}
```

2. **Avoid Date.now() or Math.random() during render:**

```tsx
// ❌ BAD
const timestamp = Date.now(); // Different on server/client

// ✅ GOOD - pass from server
export default function Page({ timestamp }) {
  return <div>{timestamp}</div>;
}
```

3. **Use suppressHydrationWarning for intentional mismatches:**

```tsx
<div suppressHydrationWarning>{new Date().toLocaleString()}</div>
```

### Page not found during SSR

**Problem:** "Page not found: home"

**Solutions:**

1. **Check page file exists:**

```bash
ls -la src/home.page.tsx
# Pages are relative to @PageRoot(__dirname), not a fixed src/pages/ folder
```

2. **Verify @PageRoot points to correct directory:**

```typescript
@PageRoot(__dirname) // Should point to directory containing pages
@Controller()
```

3. **Check file naming:**
   File must end with `.page.tsx` (not `.page.ts` or `.tsx`)

### Props undefined in page component

**Problem:** Props are `undefined` in page component.

**Solutions:**

1. **Return data from controller:**

```typescript
@Get()
@Page("home")
getHome(): PageResponse {
  return {
    data: { message: "Hello" }, // ✅ Must return data
  };
}
```

2. **Check prop names match:**

```typescript
// Controller
return { data: { userName: "Alice" } };

// Component
export default function Home({ userName }) {
  // Must match exactly
  return <div>{userName}</div>;
}
```

---

## Routing Issues

### 404 on nested routes

**Problem:** Nested routes return 404.

**Solutions:**

1. **Ensure controller route matches:**

```typescript
@Controller() // Base path: /
export class AppController {
  @Get("about") // Full path: /about
  @Page("about")
  getAbout() {
    return { data: {} };
  }
}
```

2. **Check for conflicting routes:**

```typescript
// ❌ BAD - both match /users
@Get('users')
@Get('users/:id')

// ✅ GOOD - specific route first
@Get('users/:id')
@Get('users')
```

### Client-side navigation not working

**Problem:** `Link` component causes full page reload.

**Solutions:**

1. **Import Link from correct package:**

```tsx
import { Link } from "nist-stack/client"; // ✅ Correct

import { Link } from "nist-stack"; // ❌ Wrong
```

2. **Check router is set up:**

```tsx
// entry-client.tsx should have router setup
const { render } = createClientEntry({
  globals,
  pages,
  layouts,
  targetId: "root",
});
```

---

## Type Issues

### TypeScript can't find types

**Problem:** Types not recognized for NIST imports.

**Solutions:**

1. **Add to tsconfig.json:**

```json
{
  "compilerOptions": {
    "types": ["node", "vite/client"]
  }
}
```

2. **Restart TypeScript server:**
   In VS Code: `Cmd+Shift+P` → "TypeScript: Restart TS Server"

### Props not type-safe

**Problem:** No autocomplete for page props.

**Solution:** Define interface and use in both places:

```typescript
// Controller
interface HomeData {
  users: string[];
  count: number;
}

@Get()
@Page("home")
getHome(): PageResponse<HomeData> {
  return {
    data: { users: ["Alice"], count: 1 },
  };
}

// Component
export default function Home({ users, count }: HomeData) {
  // Full type safety ✅
}
```

---

## Performance Issues

### Slow SSR response times

**Problem:** Server responses take > 500ms.

**Solutions:**

1. **Enable caching:**

```typescript
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [CacheModule.register()],
})
```

2. **Optimize database queries:**

```typescript
// Use select to limit fields
const users = await this.userRepo.find({
  select: ["id", "name"], // Only fetch needed fields
});
```

3. **Profile with Chrome DevTools:**
   Check "Server Timing" tab in Network panel.

### Large bundle size

**Problem:** Client bundle > 1MB.

**Solutions:**

1. **Check bundle composition:**

```bash
npx vite-bundle-visualizer
```

2. **Enable code splitting:**

```typescript
// Use dynamic imports for large components
const HeavyChart = lazy(() => import("./HeavyChart"));
```

3. **Tree-shake unused code:**
   Ensure imports are ESM:

```typescript
import { specific } from "library"; // ✅ Tree-shakeable
import * as lib from "library"; // ❌ Bundles everything
```

---

## Common Errors

### "Missing **PAGE_NAME**"

**Cause:** Client hydration data not passed from server.

**Solution:** Ensure layout includes hydration scripts:

```tsx
export default function AppLayout({ children, hydrationScripts }) {
  return (
    <html>
      <body>
        <div id="root">{children}</div>
        {hydrationScripts} {/* ✅ Required */}
      </body>
    </html>
  );
}
```

### "Cannot find page: ..."

**Cause:** Page file doesn't exist or is in wrong location.

**Solution:**

1. Check file path matches `@PageRoot` + `@Page` name
2. Ensure file ends with `.page.tsx`
3. Check for typos in page name

### Circular dependency warnings

**Cause:** Files import each other.

**Solution:**

1. Extract shared code to separate file
2. Use dependency injection instead of imports
3. Refactor to remove circular references

---

## Getting More Help

If your issue isn't covered here:

1. **Check the FAQ:** See [FAQ](./faq.md) for quick answers
2. **Search existing issues:** [GitHub Issues](https://github.com/ohanronnie/nist-stack/issues)
3. **Ask the community:** [GitHub Discussions](https://github.com/ohanronnie/nist-stack/discussions)
4. **Report a bug:** [New Issue](https://github.com/ohanronnie/nist-stack/issues/new)

### Include when asking for help:

- NIST Stack version (`npm list nist-stack`)
- Node.js version (`node --version`)
- Operating system
- Relevant code snippets
- Error messages (full stack trace)
- Steps to reproduce

---

::: tip Pro Tip
Enable verbose logging for debugging:

```typescript
// main.ts
if (process.env.DEBUG) {
  app.useLogger(["log", "error", "warn", "debug", "verbose"]);
}
```

:::
