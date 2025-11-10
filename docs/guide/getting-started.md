# Getting Started

This guide will walk you through creating your first NIST application from scratch.

## Prerequisites

Before you begin, make sure you have:

- **Node.js** 18+ or **Bun** 1.0+
- Basic knowledge of **TypeScript**
- Familiarity with **React** and **NestJS** (helpful but not required)

## Create a New Project

### Step 1: Initialize NestJS Project

```bash
# Using npm
npm i -g @nestjs/cli
nest new my-nist-app

# Using bun
bun add -g @nestjs/cli
nest new my-nist-app
```

Choose your preferred package manager when prompted.

### Step 2: Install NIST

```bash
cd my-nist-app

# Using npm
npm install nist-stack

# Using bun
bun add nist-stack
```

### Step 3: Install Required Dependencies

```bash
# Using npm
npm install react react-dom
npm install -D @types/react @types/react-dom

# Using bun
bun add react react-dom
bun add -d @types/react @types/react-dom
```

## Project Setup

### Step 4: Update `main.ts`

Replace the contents of `src/main.ts`:

```typescript
import { NestFactory } from "@nestjs/core";
import { bootstrapNist } from "nist-stack";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Setup NIST SSR
  await bootstrapNist(app);

  // Start server
  await app.listen(3000);
  console.log("🚀 Server running at http://localhost:3000");
}
bootstrap();
```

### Step 5: Update Controller

Replace `src/app.controller.ts`:

```typescript
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
      data: {
        message: "Welcome to NIST!",
        users: ["Alice", "Bob", "Charlie"],
      },
      metadata: {
        title: "Home - NIST App",
        description: "My first NIST application",
      },
    };
  }
}
```

### Step 6: Create Your First Page

Create `src/home.page.tsx`:

```tsx
export default function Home({ message, users }) {
  return (
    <div>
      <h1>{message}</h1>
      <h2>Users:</h2>
      <ul>
        {users.map((user) => (
          <li key={user}>{user}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Step 7: Create Client Entry Point

Create `src/entry-client.tsx`:

```tsx
import { createClientEntry } from "nist-stack/client";

// Extract hydration data
const globals = window as any;
const { __PAGE_NAME__ } = globals;
if (!__PAGE_NAME__) {
  throw new Error("Missing __PAGE_NAME__ — cannot hydrate");
}

// Setup dynamic imports
// @ts-ignore
const pages = import.meta.glob(["/src/**/*.page.tsx", "/app/**/*.page.tsx"], {
  eager: false,
});

// @ts-ignore
const layouts = import.meta.glob(
  ["/src/**/*.layout.tsx", "/app/**/*.layout.tsx"],
  { eager: false }
);

// Create entry and render
const { render } = createClientEntry({
  globals,
  pages,
  layouts,
  targetId: "root",
});

render();

// HMR support
// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept(Object.keys(pages), async () => {
    await render();
  });
}
```

### Step 8: Create Root Layout

Create `src/app.layout.tsx`:

```tsx
import type { LayoutProps } from "nist-stack/client";

export default function AppLayout({
  children,
  metaTags,
  hydrationScripts,
  metadata,
}: LayoutProps) {
  const isClient = typeof window !== "undefined";

  if (isClient) {
    return <>{children}</>;
  }

  const title = metadata?.title || "My App";

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        {metaTags}
      </head>
      <body>
        <div id="root">{children}</div>
        {hydrationScripts}
      </body>
    </html>
  );
}
```

### Step 9: Create Vite Config

Create `vite.config.ts` in the root:

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

The `createConfig` helper from NIST automatically sets up:

- React plugin
- Server middleware mode
- Custom app type
- Optimized SSR settings

### Step 10: Update TypeScript Configuration

Update your `tsconfig.json` to support React and decorators:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  }
}
```

**Important for Production Builds:**

If you use `tsconfig.build.json` for production builds, you need **two separate configs**:

**1. `tsconfig.json`** (for development, used by your IDE):

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react"
    // ... other options
  },
  "exclude": ["node_modules", "dist"]
}
```

**2. `tsconfig.build.json`** (for production builds only):

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

**Critical Notes:**

- ✅ **Production:** Add `"src/**/*.tsx"` to `tsconfig.build.json` so pages/layouts compile
- ❌ **Development:** Do NOT compile `.tsx` files with `nest start --watch` - this breaks Vite HMR
- Vite handles all `.tsx` compilation during development
- Only NestJS TypeScript files (`.ts`) should be watched by NestJS in dev mode

## Run Your App

Start the development server:

```bash
# Using npm
npm run start:dev

# Using bun
bun run start:dev
```

Visit [http://localhost:3000](http://localhost:3000) and you should see your app! 🎉

## What's Next?

Now that you have a basic app running:

- 📄 Learn about [Pages & Routing](/features/pages)
- 🎨 Explore [Layouts](/features/layouts)
- 🎣 Master [Client-Side Features](/features/client-side) - Navigation, hooks, and components
- 🏷️ Add [Dynamic Metadata](/features/metadata)
- 🔐 Implement [Authentication Guards](/features/guards)
- 📡 Understand [Data Fetching](/features/data-fetching) patterns

## Troubleshooting

### Port already in use

If port 3000 is taken:

```typescript
await app.listen(3001); // Change to any available port
```

### Module resolution errors

Make sure `jsxImportSource` is set to `"react"` in `tsconfig.json`.

### Hydration mismatches

Ensure your server and client render the same HTML. Avoid browser-specific code outside of `useEffect`.

::: tip Need Help?
Check out the [Examples](/examples/basic-app) section for complete working applications!
:::
