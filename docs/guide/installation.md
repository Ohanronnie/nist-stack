# Installation

## Package Manager

NIST works with any Node.js package manager:

::: code-group

```bash [npm]
npm install nist-stack
```

```bash [bun]
bun add nist-stack
```

```bash [yarn]
yarn add nist-stack
```

```bash [pnpm]
pnpm add nist-stack
```

:::

## Installation

NIST comes with everything you need - React, Vite, and all required dependencies are included:

::: code-group

```bash [npm]
# Create new NestJS project
npx @nestjs/cli new my-app
cd my-app

# Install NIST (includes React, Vite, and all dependencies)
npm install nist-stack
```

```bash [bun]
# Create new NestJS project
bunx @nestjs/cli new my-app
cd my-app

# Install NIST (includes React, Vite, and all dependencies)
bun add nist-stack
```

:::

## Verification

Verify your installation:

```typescript
import { Page, PageRoot, createViteDevServer, createConfig } from "nist-stack";
import { createClientEntry } from "nist-stack/client";

console.log("NIST installed successfully!");
```

## Version Compatibility

| NIST Version | NestJS | React | Node.js |
| ------------ | ------ | ----- | ------- |
| 1.x          | 10.x   | 18.x  | 18+     |

## Next Steps

- [Getting Started](/guide/getting-started) - Create your first app
- [Project Structure](/guide/project-structure) - Understand the file layout
- [Configuration](/guide/configuration) - Customize your setup
