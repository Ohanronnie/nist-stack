# Monitoring & Observability

Learn how to monitor, log, and observe your NIST applications in production.

## Overview

Production monitoring is essential for maintaining healthy applications. This guide covers:

- **Logging** - Application and access logs
- **Metrics** - Performance and business metrics
- **Tracing** - Request tracing across services
- **Health Checks** - Endpoint health monitoring
- **Error Tracking** - Error reporting and analysis
- **APM** - Application Performance Monitoring

---

## Logging

### Basic Logging

NestJS includes a built-in logger:

```typescript
import { Logger } from "@nestjs/common";

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  @Get()
  @Page("home")
  getHome() {
    this.logger.log("Home page accessed");
    this.logger.debug("Debug information");
    this.logger.warn("Warning message");
    this.logger.error("Error occurred");

    return { data: {} };
  }
}
```

### Structured Logging with Winston

Install Winston:

```bash
npm install nest-winston winston
```

Configure in `main.ts`:

```typescript
import { WinstonModule } from "nest-winston";
import * as winston from "winston";

const logger = WinstonModule.createLogger({
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
      format: winston.format.json(),
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      format: winston.format.json(),
    }),
  ],
});

const app = await NestFactory.create(AppModule, {
  logger,
});
```

### Log Levels

Set log level by environment:

```typescript
const logLevels = {
  production: ["error", "warn", "log"],
  development: ["error", "warn", "log", "debug", "verbose"],
  test: ["error", "warn"],
};

const app = await NestFactory.create(AppModule, {
  logger: logLevels[process.env.NODE_ENV] || logLevels.development,
});
```

### Request Logging

Log all HTTP requests:

```typescript
import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger("HTTP");

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get("user-agent") || "";

    res.on("finish", () => {
      const { statusCode } = res;
      const contentLength = res.get("content-length");

      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent} ${ip}`
      );
    });

    next();
  }
}

// Apply in AppModule
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
```

---

## Health Checks

### Basic Health Check

Install the health check package:

```bash
npm install @nestjs/terminus
```

Create a health controller:

```typescript
import { Controller, Get } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
} from "@nestjs/terminus";

@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.http.pingCheck("api", "https://api.example.com"),
    ]);
  }
}
```

### Database Health Check

```typescript
import { TypeOrmHealthIndicator } from "@nestjs/terminus";

@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.db.pingCheck("database")]);
  }
}
```

### Custom Health Indicators

```typescript
import { Injectable } from "@nestjs/common";
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from "@nestjs/terminus";

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private redis: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.redis.ping();
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        "Redis check failed",
        this.getStatus(key, false)
      );
    }
  }
}
```

---

## Metrics

### Prometheus Integration

Install Prometheus client:

```bash
npm install @willsoto/nestjs-prometheus prom-client
```

Configure in `app.module.ts`:

```typescript
import { PrometheusModule } from "@willsoto/nestjs-prometheus";

@Module({
  imports: [
    PrometheusModule.register({
      path: "/metrics",
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
})
export class AppModule {}
```

### Custom Metrics

Track custom application metrics:

```typescript
import { Injectable } from "@nestjs/common";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Counter, Histogram } from "prom-client";

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric("http_requests_total")
    private readonly requestCounter: Counter,
    @InjectMetric("http_request_duration_seconds")
    private readonly requestHistogram: Histogram
  ) {}

  recordRequest(method: string, route: string, statusCode: number) {
    this.requestCounter.inc({
      method,
      route,
      status_code: statusCode,
    });
  }

  recordDuration(method: string, route: string, duration: number) {
    this.requestHistogram.observe(
      { method, route },
      duration / 1000 // Convert to seconds
    );
  }
}
```

### Business Metrics

Track business-specific metrics:

```typescript
import { makeCounterProvider } from "@willsoto/nestjs-prometheus";

@Module({
  providers: [
    makeCounterProvider({
      name: "user_registrations_total",
      help: "Total number of user registrations",
    }),
    makeCounterProvider({
      name: "purchases_total",
      help: "Total number of purchases",
      labelNames: ["product_category"],
    }),
  ],
})
export class AppModule {}
```

---

## Application Performance Monitoring (APM)

### New Relic

Install and configure:

```bash
npm install newrelic
```

Create `newrelic.js`:

```javascript
exports.config = {
  app_name: ["NIST App"],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: "info",
  },
};
```

Import at the very top of `main.ts`:

```typescript
// Must be first import!
require("newrelic");

import { NestFactory } from "@nestjs/core";
// ... rest of imports
```

### Datadog APM

Install:

```bash
npm install dd-trace
```

Create `tracer.ts`:

```typescript
import tracer from "dd-trace";

tracer.init({
  logInjection: true,
  runtimeMetrics: true,
  profiling: true,
});

export default tracer;
```

Import in `main.ts`:

```typescript
import "./tracer"; // Must be first!

import { NestFactory } from "@nestjs/core";
// ... rest
```

### Sentry Integration

Install Sentry:

```bash
npm install @sentry/node @nestjs/sentry
```

Configure:

```typescript
import { SentryModule } from "@ntegral/nestjs-sentry";

@Module({
  imports: [
    SentryModule.forRoot({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
    }),
  ],
})
export class AppModule {}
```

---

## Error Tracking

### Sentry Error Tracking

Capture errors automatically:

```typescript
import * as Sentry from "@sentry/node";

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    Sentry.captureException(exception);

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus?.() || 500;

    response.status(status).json({
      statusCode: status,
      message: exception.message,
    });
  }
}
```

### Custom Error Context

Add user context to errors:

```typescript
@Injectable()
export class ErrorContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();

    Sentry.configureScope((scope) => {
      scope.setUser({
        id: request.user?.id,
        email: request.user?.email,
      });
      scope.setExtra("url", request.url);
      scope.setExtra("method", request.method);
    });

    return next.handle();
  }
}
```

---

## Distributed Tracing

### OpenTelemetry

Install OpenTelemetry:

```bash
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
```

Create `tracing.ts`:

```typescript
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "nist-app",
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

process.on("SIGTERM", () => {
  sdk.shutdown().then(
    () => console.log("SDK shut down successfully"),
    (err) => console.error("Error shutting down SDK", err)
  );
});
```

Import before your application:

```typescript
import "./tracing";
import { NestFactory } from "@nestjs/core";
// ...
```

---

## Performance Monitoring

### Response Time Tracking

Track SSR response times:

```typescript
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger("Performance");

  intercept(context: ExecutionContext, next: CallHandler) {
    const now = Date.now();
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        this.logger.log(`${request.method} ${request.url} - ${duration}ms`);

        // Alert if slow
        if (duration > 1000) {
          this.logger.warn(`Slow response: ${request.url} took ${duration}ms`);
        }
      })
    );
  }
}
```

### Memory Monitoring

Track memory usage:

```typescript
setInterval(() => {
  const used = process.memoryUsage();

  console.log({
    rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(used.external / 1024 / 1024)} MB`,
  });
}, 60000); // Every minute
```

---

## Dashboards & Visualization

### Grafana Dashboard

Create a dashboard with:

1. **Request Rate** - Requests per second
2. **Response Time** - P50, P95, P99 latency
3. **Error Rate** - Errors per second
4. **CPU & Memory** - Resource utilization
5. **Active Users** - Concurrent users

Example Prometheus queries:

```promql
# Request rate
rate(http_requests_total[5m])

# Response time P95
histogram_quantile(0.95, http_request_duration_seconds_bucket)

# Error rate
rate(http_requests_total{status_code=~"5.."}[5m])
```

### Custom Dashboards

Use tools like:

- **Grafana** - Open-source dashboards
- **Datadog** - All-in-one monitoring
- **New Relic** - APM dashboards
- **CloudWatch** - AWS native
- **Azure Monitor** - Azure native

---

## Alerting

### Basic Alerting Rules

Alert on critical metrics:

```yaml
# Prometheus alerting rules
groups:
  - name: nist_app
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected

      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: Slow response times detected

      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes > 1e9
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: High memory usage
```

### PagerDuty Integration

Set up PagerDuty for critical alerts:

```bash
npm install @pagerduty/pdjs
```

```typescript
import { Event } from "@pagerduty/pdjs";

async function sendAlert(message: string) {
  const event = new Event({
    data: {
      routing_key: process.env.PAGERDUTY_ROUTING_KEY,
      event_action: "trigger",
      payload: {
        summary: message,
        severity: "critical",
        source: "nist-app",
      },
    },
  });

  await event.send();
}
```

---

## Best Practices

### 1. Log Structured Data

```typescript
// ✅ Good
logger.log({
  message: "User login",
  userId: user.id,
  email: user.email,
  ip: request.ip,
});

// ❌ Bad
logger.log(`User ${user.id} logged in from ${request.ip}`);
```

### 2. Set Appropriate Log Levels

- `error`: Errors requiring attention
- `warn`: Potential issues
- `log`: Important business events
- `debug`: Detailed debugging info
- `verbose`: Very detailed tracing

### 3. Don't Log Sensitive Data

```typescript
// ❌ Never log passwords, tokens, or PII
logger.log({ password: user.password }); // BAD!

// ✅ Redact sensitive fields
logger.log({
  userId: user.id,
  password: "[REDACTED]",
});
```

### 4. Use Correlation IDs

Track requests across services:

```typescript
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    req.correlationId = req.headers["x-correlation-id"] || uuidv4();
    res.setHeader("x-correlation-id", req.correlationId);
    next();
  }
}
```

### 5. Monitor Business Metrics

Don't just monitor technical metrics:

- User registrations
- Purchases
- Page views
- Feature usage
- Revenue metrics

---

## Tools Comparison

| Tool                     | Type           | Best For              | Pricing |
| ------------------------ | -------------- | --------------------- | ------- |
| **Prometheus + Grafana** | Metrics        | Self-hosted, flexible | Free    |
| **Datadog**              | APM + Logs     | All-in-one solution   | $$$     |
| **New Relic**            | APM            | Easy setup            | $$$     |
| **Sentry**               | Error tracking | Error management      | $$      |
| **LogRocket**            | Session replay | Frontend debugging    | $$      |
| **CloudWatch**           | AWS native     | AWS deployments       | $       |
| **Azure Monitor**        | Azure native   | Azure deployments     | $       |

---

## Next Steps

- Set up basic logging
- Add health checks
- Configure error tracking (Sentry)
- Add metrics collection (Prometheus)
- Create dashboards (Grafana)
- Set up alerting
- Monitor in production

For deployment-specific monitoring, see the [Deployment Guide](./deployment.md).
