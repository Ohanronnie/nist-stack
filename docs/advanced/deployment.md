# Deployment

Deploy your NIST application to production with confidence. This guide covers deployment strategies, hosting platforms, environment configuration, and production best practices.

## Production Build

### Building for Production

Build both the NestJS server and Vite client assets:

```bash
# Install dependencies
bun install

# Build server (NestJS)
bun run build

# Build client (Vite)
bun run build:client

# Or build both
bun run build:all
```

### Build Scripts

Configure your `package.json`:

```json
{
  "scripts": {
    "build": "nest build",
    "build:client": "vite build",
    "build:all": "npm run build && npm run build:client",
    "start:prod": "node dist/main.js"
  }
}
```

### Build Output

```
dist/
├── main.js              # NestJS server bundle
├── *.js                 # Server modules
└── ...

dist/client/
├── index.html
├── assets/
│   ├── index-[hash].js  # Client bundle
│   ├── index-[hash].css
│   └── ...
```

## Environment Configuration

### Environment Variables

Create environment-specific configuration:

```bash
# .env.production
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
SESSION_SECRET=your-strong-secret-key
VITE_API_URL=https://api.yourdomain.com
```

### Configuration Service

Use NestJS ConfigModule for type-safe configuration:

```bash
bun add @nestjs/config
```

```typescript
// config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    url: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production",
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  session: {
    secret: process.env.SESSION_SECRET,
  },
});
```

```typescript
// app.module.ts
import { ConfigModule } from "@nestjs/config";
import configuration from "./config/configuration";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
```

### Using Configuration

```typescript
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getDatabaseUrl(): string {
    return this.configService.get<string>("database.url");
  }
}
```

## Hosting Platforms

### Docker Deployment

Create a production-ready Dockerfile:

```dockerfile
# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./
COPY packages/nist-core/package.json ./packages/nist-core/
COPY packages/*/package.json ./packages/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN bun run build:all

# Production stage
FROM oven/bun:1-slim

WORKDIR /app

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["bun", "run", "start:prod"]
```

**Docker Compose for development:**

```yaml
# docker-compose.yml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

**Build and run:**

```bash
docker-compose up --build
```

### VPS / Dedicated Server

Deploy to any VPS (DigitalOcean, Linode, AWS EC2, etc.):

**1. Install dependencies:**

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install PM2 for process management
npm install -g pm2
```

**2. Deploy application:**

```bash
# Clone repository
git clone https://github.com/yourusername/your-app.git
cd your-app

# Install dependencies
bun install

# Build
bun run build:all

# Start with PM2
pm2 start dist/main.js --name "nist-app"
pm2 save
pm2 startup
```

**3. Configure Nginx reverse proxy:**

```nginx
# /etc/nginx/sites-available/your-app
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static assets (if serving separately)
    location /assets {
        alias /var/www/your-app/dist/client/assets;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**4. Enable SSL with Let's Encrypt:**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Platform as a Service (PaaS)

#### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

**railway.json:**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "bun install && bun run build:all"
  },
  "deploy": {
    "startCommand": "bun run start:prod",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

#### Render

Create `render.yaml`:

```yaml
services:
  - type: web
    name: nist-app
    env: node
    plan: starter
    buildCommand: bun install && bun run build:all
    startCommand: bun run start:prod
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: myapp-db
          property: connectionString

databases:
  - name: myapp-db
    plan: starter
```

#### Vercel (Serverless)

**Note:** NIST is optimized for long-running Node servers. For serverless, consider adjustments.

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/main.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/main.js"
    }
  ]
}
```

## Database Migrations

### TypeORM Migrations

Generate and run migrations:

```bash
# Generate migration
bun run typeorm migration:generate -n CreateUsers

# Run migrations
bun run typeorm migration:run

# Revert migration
bun run typeorm migration:revert
```

**Production migration script:**

```json
{
  "scripts": {
    "migration:run": "typeorm migration:run -d dist/config/typeorm.config.js",
    "predeploy": "npm run migration:run"
  }
}
```

### Prisma Migrations

```bash
# Generate migration
bunx prisma migrate dev --name init

# Deploy to production
bunx prisma migrate deploy
```

## Monitoring and Logging

### Application Logging

Use NestJS built-in logger:

```typescript
import { Logger } from "@nestjs/common";

export class AppService {
  private readonly logger = new Logger(AppService.name);

  async doSomething() {
    this.logger.log("Starting operation");
    try {
      // ... operation
      this.logger.log("Operation completed successfully");
    } catch (error) {
      this.logger.error("Operation failed", error.stack);
      throw error;
    }
  }
}
```

### External Logging Services

**Integrate with Winston:**

```bash
bun add nest-winston winston
```

```typescript
import { WinstonModule } from "nest-winston";
import * as winston from "winston";

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
        }),
        new winston.transports.File({
          filename: "logs/combined.log",
        }),
      ],
    }),
  ],
})
export class AppModule {}
```

### APM Integration

**Sentry:**

```bash
bun add @sentry/node @sentry/profiling-node
```

```typescript
// main.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Sentry error handling
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());

  await app.listen(3000);

  app.use(Sentry.Handlers.errorHandler());
}
```

## Health Checks

### Basic Health Endpoint

```typescript
import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  check() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }
}
```

### Advanced Health Checks

```bash
bun add @nestjs/terminus
```

```typescript
import { Controller, Get } from "@nestjs/common";
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  DiskHealthIndicator,
  MemoryHealthIndicator,
} from "@nestjs/terminus";

@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck("database"),
      () =>
        this.disk.checkStorage("storage", { path: "/", thresholdPercent: 0.9 }),
      () => this.memory.checkHeap("memory_heap", 150 * 1024 * 1024),
    ]);
  }
}
```

## SSL/TLS

### Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (already configured by Certbot)
sudo certbot renew --dry-run
```

### Manual SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.com.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        # ... other proxy settings
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## Scaling

### Horizontal Scaling

Run multiple instances behind a load balancer:

```bash
# PM2 cluster mode
pm2 start dist/main.js -i max --name "nist-app"
```

**Load Balancer (Nginx):**

```nginx
upstream nist_app {
    least_conn;
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    listen 80;

    location / {
        proxy_pass http://nist_app;
    }
}
```

### Session Persistence

Use Redis for session storage in multi-instance deployments:

```bash
bun add connect-redis redis
```

```typescript
import * as session from "express-session";
import * as connectRedis from "connect-redis";
import { createClient } from "redis";

const RedisStore = connectRedis(session);
const redisClient = createClient({ url: process.env.REDIS_URL });

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Run tests
        run: bun test

      - name: Build
        run: bun run build:all

      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/your-app
            git pull
            bun install
            bun run build:all
            pm2 restart nist-app
```

## Security Best Practices

### 1. Environment Variables

Never commit `.env` files. Use secrets management:

```bash
# Use secret managers in production
# AWS Secrets Manager
# HashiCorp Vault
# Railway/Render secret management
```

### 2. Helmet for Security Headers

```bash
bun add helmet
```

```typescript
import helmet from "helmet";

app.use(helmet());
```

### 3. Rate Limiting

```bash
bun add @nestjs/throttler
```

```typescript
import { ThrottlerModule } from "@nestjs/throttler";

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
  ],
})
export class AppModule {}
```

### 4. CORS Configuration

```typescript
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(","),
  credentials: true,
});
```

## Production Checklist

- [ ] Build optimized production bundle
- [ ] Configure environment variables securely
- [ ] Set up database with SSL
- [ ] Configure Redis for sessions (if multi-instance)
- [ ] Enable SSL/TLS with valid certificates
- [ ] Set up monitoring and logging (Sentry, DataDog, etc.)
- [ ] Configure health checks
- [ ] Set up automated backups
- [ ] Implement rate limiting
- [ ] Enable security headers (Helmet)
- [ ] Configure CORS properly
- [ ] Set up CI/CD pipeline
- [ ] Test error handling and recovery
- [ ] Configure log rotation
- [ ] Set up alerts for critical errors
- [ ] Document deployment process

## See Also

- [Performance](/advanced/performance) - Optimization strategies
- [Testing](/advanced/testing) - Testing before deployment
- [Configuration](/guide/configuration) - Application configuration
