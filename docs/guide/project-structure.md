# Project Structure

Understanding the NIST project structure will help you organize your application effectively.

## Basic Structure

```
my-nist-app/
├── src/
│   ├── main.ts              # NestJS entry point
│   ├── app.module.ts        # Root module
│   ├── app.controller.ts    # Root controller
│   ├── app.layout.tsx       # Root layout (wraps all pages)
│   ├── entry-client.tsx     # Client-side entry
│   ├── home.page.tsx        # Homepage component
│   └── pages/               # Optional: organize pages
│       ├── about.page.tsx
│       └── contact.page.tsx
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript config
└── package.json
```

## File Naming Conventions

NIST uses specific file naming patterns:

### Page Files: `*.page.tsx`

Page components that get server-side rendered:

```
src/home.page.tsx           → @Page('home')
src/pages/about.page.tsx    → @Page('pages/about')
src/users/profile.page.tsx  → @Page('users/profile')
```

### Layout Files: `*.layout.tsx`

Layout components that wrap pages:

```
src/app.layout.tsx          → Root layout (wraps all pages)
src/pages/pages.layout.tsx  → Wraps /pages/* routes
src/users/users.layout.tsx  → Wraps /users/* routes
```

## Controllers

Controllers define your routes and return data to pages:

```typescript
// src/app.controller.ts
@PageRoot(__dirname)
@Controller()
export class AppController {
  @Get()
  @Page("home")
  getHome(): PageResponse {
    return { data: {} };
  }
}

// src/users/users.controller.ts
@PageRoot(__dirname)
@Controller("users")
export class UsersController {
  @Get("profile")
  @Page("profile")
  getProfile(): PageResponse {
    return { data: {} };
  }
}
```

## Entry Points

### Server Entry: `src/main.ts`

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
  const vite = await createViteDevServer();
  const app = await NestFactory.create(AppModule);

  app.use(vite.dev.middlewares);

  const reflector = app.get(Reflector);
  app.useGlobalFilters(new RedirectExceptionFilter());
  app.useGlobalInterceptors(new NistInterceptor(reflector, vite));

  await app.listen(3000);
}
bootstrap();
```

### Client Entry: `src/entry-client.tsx`

```typescript
import { createClientEntry } from "nist-stack/client";

const globals = window as any;
const { __PAGE_NAME__ } = globals;

const pages = import.meta.glob(["/src/**/*.page.tsx"], {
  eager: false,
});

const layouts = import.meta.glob(["/src/**/*.layout.tsx"], {
  eager: false,
});

const { render } = createClientEntry({
  globals,
  pages,
  layouts,
  targetId: "root",
});

render();

if (import.meta.hot) {
  import.meta.hot.accept(Object.keys(pages), async () => {
    await render();
  });
}
```

## Layouts

### Root Layout: `app.layout.tsx`

Wraps all pages in your application:

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

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{metadata?.title || "My App"}</title>
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

### Nested Layout (Optional)

Create layouts for specific sections:

```tsx
// src/pages/pages.layout.tsx
import type { LayoutProps } from "nist-stack/client";

export default function PagesLayout({ children }: LayoutProps) {
  return (
    <div className="pages-wrapper">
      <nav>
        <a href="/pages/about">About</a>
        <a href="/pages/contact">Contact</a>
      </nav>
      {children}
    </div>
  );
}
```

## Pages

Page components receive props from controllers:

```tsx
// src/home.page.tsx
interface HomeProps {
  message: string;
  users: string[];
}

export default function Home({ message, users }: HomeProps) {
  return (
    <div>
      <h1>{message}</h1>
      <ul>
        {users.map((user) => (
          <li key={user}>{user}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Modules

Organize features into NestJS modules:

```
src/
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── profile.page.tsx
│   └── settings.page.tsx
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── login.page.tsx
│   └── signup.page.tsx
└── app.module.ts
```

## Configuration Files

### `vite.config.ts`

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

### `tsconfig.json`

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
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  }
}
```

## Advanced Structure

For larger applications:

```
src/
├── main.ts
├── app.module.ts
├── app.layout.tsx
├── entry-client.tsx
├── guards/               # Custom guards
│   └── auth.guard.ts
├── interceptors/         # Custom interceptors
│   └── logger.interceptor.ts
├── features/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── login.page.tsx
│   │   └── signup.page.tsx
│   ├── blog/
│   │   ├── blog.module.ts
│   │   ├── blog.controller.ts
│   │   ├── blog.service.ts
│   │   ├── posts.page.tsx
│   │   └── post.page.tsx
│   └── users/
│       ├── users.module.ts
│       ├── users.controller.ts
│       ├── users.service.ts
│       ├── profile.page.tsx
│       └── settings.page.tsx
├── shared/
│   ├── components/       # React components
│   │   ├── Button.tsx
│   │   └── Card.tsx
│   ├── services/         # NestJS services
│   │   └── database.service.ts
│   └── types/           # TypeScript types
│       └── index.ts
└── config/
    └── configuration.ts
```

## Import Paths

With the alias configuration:

```typescript
// Instead of:
import { Button } from "../../../shared/components/Button";

// Use:
import { Button } from "@/shared/components/Button";
```

## Next Steps

- [Configuration](/guide/configuration) - Customize your setup
- [Pages & Routing](/features/pages) - Learn about routing
- [Layouts](/features/layouts) - Master layouts
