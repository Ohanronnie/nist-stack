# Configuration

Learn how to configure NIST for your application.

## Vite Configuration

The `createConfig` helper from NIST provides sensible defaults:

```typescript
import { resolve } from "path";
import { createConfig } from "nist-stack";

export default createConfig({
  // Your custom config here
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
```

### What `createConfig` Provides

The helper automatically configures:

- **React Plugin**: Enables JSX transformation and Fast Refresh
- **Server Middleware Mode**: Integrates with NestJS
- **Custom App Type**: For SSR applications
- **SSR Optimizations**: Pre-configured for server rendering
- **Module externals**: Properly handles NestJS dependencies

### Custom Vite Options

You can pass any Vite configuration:

```typescript
export default createConfig({
  // Path aliases
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@components": resolve(__dirname, "./src/components"),
      "@utils": resolve(__dirname, "./src/utils"),
    },
  },

  // CSS processing
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },

  // Build options
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
      },
    },
  },

  // Development server
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
});
```

## NestJS Configuration

### Main.ts Setup

```typescript
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { bootstrapNist } from "nist-stack";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Setup NIST SSR in one line
  await bootstrapNist(app);

  await app.listen(3000);
}
bootstrap();
```

### Production vs Development

`bootstrapNist` automatically handles both environments:

```typescript
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { bootstrapNist } from "nist-stack";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Automatically detects NODE_ENV and configures accordingly
  await bootstrapNist(app);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Server running at http://localhost:${port}`);
}
bootstrap();
```

**What `bootstrapNist` does based on NODE_ENV:**

**Development (`NODE_ENV !== 'production'`):**

- Creates Vite dev server with HMR
- Mounts Vite middleware for instant hot reload
- Removes CSP headers for dev tools

**Production (`NODE_ENV === 'production'`):**

- Serves pre-built assets from `dist/client/`
- Sets long-term caching headers (1 year for assets)
- No Vite dev server overhead

## Entry Client Configuration

### Basic Setup

```typescript
import { createClientEntry } from "nist-stack/client";

const globals = window as any;
const { __PAGE_NAME__ } = globals;

if (!__PAGE_NAME__) {
  throw new Error("Missing __PAGE_NAME__ — cannot hydrate");
}

const pages = import.meta.glob(["/src/**/*.page.tsx"], {
  eager: false,
});

const layouts = import.meta.glob(["/src/**/*.layout.tsx"], {
  eager: false,
});

const { render, rootEl } = createClientEntry({
  globals,
  pages,
  layouts,
  targetId: "root",
});

render();
```

### Multiple Page Directories

If you organize pages in different folders:

```typescript
const pages = import.meta.glob(
  ["/src/**/*.page.tsx", "/app/**/*.page.tsx", "/features/**/*.page.tsx"],
  {
    eager: false,
  }
);

const layouts = import.meta.glob(
  ["/src/**/*.layout.tsx", "/app/**/*.layout.tsx", "/features/**/*.layout.tsx"],
  {
    eager: false,
  }
);
```

### Hot Module Replacement

Enable HMR for instant updates:

```typescript
// @ts-ignore – Vite-specific import.meta.glob
if (import.meta.hot) {
  // @ts-ignore – Vite-specific import.meta.glob
  import.meta.hot.accept(
    Object.keys(pages),
    async (modules: Record<string, any>) => {
      const updated =
        modules[
          Object.keys(modules).find((k) =>
            k.endsWith(`${__PAGE_NAME__}.page.tsx`)
          )!
        ];
      if (!updated?.default) return;
      await render();
    }
  );
}
```

## TypeScript Configuration

### Recommended `tsconfig.json`

```json
{
  "compilerOptions": {
    // NestJS requirements
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,

    // Modern JavaScript
    "target": "ES2021",
    "lib": ["ES2021", "DOM", "DOM.Iterable"],

    // Module resolution
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,

    // React
    "jsx": "react-jsx",
    "jsxImportSource": "react",

    // Type checking
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,

    // Output
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,

    // Path aliases (match vite.config.ts)
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Environment Variables

### Using .env Files

Create `.env` file:

```bash
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb

# API Keys
API_KEY=your-api-key
```

### Access in NestJS

```typescript
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
```

```typescript
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AppService {
  constructor(private config: ConfigService) {}

  getApiKey() {
    return this.config.get<string>("API_KEY");
  }
}
```

### Pass to Client

```typescript
@Get()
@Page('home')
getHome(): PageResponse {
  return {
    data: {
      apiUrl: process.env.API_URL,
      // Don't expose secrets!
    },
  };
}
```

## Global Styles

### Import in entry-client.tsx

```typescript
import "./globals.css"; // <-- Add this
import { createClientEntry } from "nist-stack/client";

// ... rest of code
```

### CSS Modules

```typescript
// Button.module.css
import styles from "./Button.module.css";

export function Button() {
  return <button className={styles.primary}>Click</button>;
}
```

### Tailwind CSS

Install Tailwind:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Configure `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

Add to `globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## CORS Configuration

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: ["http://localhost:3000"],
    credentials: true,
  });

  // ... rest of setup
}
```

## Custom Port

```typescript
const port = process.env.PORT || 3000;
await app.listen(port);
console.log(`Server running on port ${port}`);
```

## TypeScript Configuration

### Required tsconfig.json Settings

Ensure your `tsconfig.json` has these React and decorator settings:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "esModuleInterop": true
  }
}
```

### Production Build Configuration

**Critical:** If you use `tsconfig.build.json` for builds, include `.tsx` files:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
}
```

**Why this separation matters:**

✅ **Production (`tsconfig.build.json`):**

- Include `"src/**/*.tsx"` to compile page/layout files
- Used by: `npm run build` or `nest build`
- Without this, you get "Cannot find module" errors in production

❌ **Development (`nest start --watch`):**

- Should NOT compile `.tsx` files
- Vite handles all React/JSX compilation with HMR
- Compiling `.tsx` with NestJS breaks hot reload
- Only `.ts` controller/service files should be watched by NestJS

### Verify Your Build

Check that `.tsx` files are being compiled:

```bash
npm run build
ls -la dist/  # Should contain compiled .js files for your pages
```

## Next Steps

- [Pages & Routing](/features/pages) - Build your first page
- [Layouts](/features/layouts) - Create layouts
- [Guards](/features/guards) - Add authentication
