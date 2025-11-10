# Security Policy

## Supported Versions

We take security seriously and actively maintain the following versions of NIST Stack:

| Version | Supported          | End of Support |
| ------- | ------------------ | -------------- |
| 1.0.x   | :white_check_mark: | Current        |
| < 1.0   | :x:                | Ended          |

## Reporting a Vulnerability

We appreciate responsible disclosure of security vulnerabilities. **Please do not report security vulnerabilities through public GitHub issues.**

### How to Report

**Email:** [security@nist-stack.dev](mailto:security@nist-stack.dev)

Please include the following information:

1. **Type of vulnerability** (e.g., XSS, CSRF, injection, etc.)
2. **Full paths** of source file(s) related to the issue
3. **Location** of the affected source code (tag/branch/commit or direct URL)
4. **Step-by-step instructions** to reproduce the issue
5. **Proof-of-concept or exploit code** (if possible)
6. **Impact** of the issue, including how an attacker might exploit it

### What to Expect

1. **Acknowledgment** - We'll acknowledge receipt within 48 hours
2. **Assessment** - We'll assess the vulnerability within 7 days
3. **Updates** - We'll keep you informed about our progress
4. **Resolution** - We aim to release a fix within 30 days
5. **Credit** - We'll credit you in our security advisory (unless you prefer to remain anonymous)

### Our Commitment

- We will **not pursue legal action** against researchers who report vulnerabilities in good faith
- We will work with you to understand and resolve the issue quickly
- We will keep you informed throughout the process
- We will publicly acknowledge your responsible disclosure (if you wish)

## Security Measures

### Built-in Protections

NIST Stack includes several built-in security measures:

#### 1. **XSS Protection**

- React's automatic escaping of content
- Helmet.js integration for security headers (recommended)
- Content Security Policy support

```typescript
// Recommended: Add helmet to your NestJS app
import helmet from "helmet";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  })
);
```

#### 2. **CSRF Protection**

- Use NestJS CSRF middleware for forms
- SameSite cookie attributes

```typescript
import * as csurf from "csurf";

app.use(csurf());
```

#### 3. **Authentication**

- Server-side authentication guards
- Secure session management
- Proper credential handling

```typescript
@UseGuards(AuthGuard)
@Get('/dashboard')
@Page('dashboard')
getDashboard(@Req() req) {
  return { data: { user: req.user } };
}
```

#### 4. **Input Validation**

- Use NestJS ValidationPipe
- DTOs with class-validator

```typescript
import { IsString, IsEmail, Length } from "class-validator";

export class CreateUserDto {
  @IsString()
  @Length(3, 50)
  username: string;

  @IsEmail()
  email: string;
}
```

#### 5. **Environment Variables**

- Never expose server-side secrets to client
- Use `VITE_*` prefix only for public values

```typescript
// ❌ BAD - Exposes secret
return {
  data: {
    apiSecret: process.env.API_SECRET, // Don't do this!
  },
};

// ✅ GOOD - Server-side only
const data = await this.api.fetch(process.env.API_SECRET);
return { data };
```

## Best Practices

### 1. Dependencies

Keep dependencies up-to-date:

```bash
# Check for vulnerabilities
npm audit

# Fix automatically if possible
npm audit fix

# Update dependencies
npm update
```

### 2. Environment Variables

```bash
# .env - Never commit this file!
DATABASE_PASSWORD=super-secret
SESSION_SECRET=random-string-here
API_KEY=private-key

# Only VITE_* variables are exposed to client
VITE_API_URL=https://api.example.com
```

### 3. Authentication

```typescript
// Store sessions securely
import * as session from "express-session";
import * as RedisStore from "connect-redis";

app.use(
  session({
    store: new RedisStore(redisClient),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in prod
      httpOnly: true, // Prevents XSS
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      sameSite: "strict", // CSRF protection
    },
  })
);
```

### 4. Rate Limiting

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

### 5. HTTPS in Production

Always use HTTPS in production:

```typescript
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      res.redirect(`https://${req.header("host")}${req.url}`);
    } else {
      next();
    }
  });
}
```

## Known Security Considerations

### Server-Side Rendering

SSR introduces unique security considerations:

1. **State Leakage** - Ensure user data doesn't leak between requests
2. **Serialization** - Be careful when serializing/deserializing data
3. **Hydration** - Avoid inline scripts that could introduce XSS

### Recommended Reading

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [NestJS Security](https://docs.nestjs.com/security/helmet)
- [React Security](https://react.dev/learn/keeping-components-pure)

## Security Updates

Subscribe to security updates:

- Watch our [GitHub repository](https://github.com/ohanronnie/nist-stack)
- Follow [@nist_stack on Twitter](https://twitter.com/nist_stack)
- Join our [Discord server](https://discord.gg/nist-stack)

## Bug Bounty Program

Currently, we do not have a formal bug bounty program. However, we deeply appreciate security researchers and will:

- Acknowledge your contribution publicly (if desired)
- Provide swag and merchandise for significant findings
- Credit you in our security advisories

We're exploring a formal bug bounty program for the future.

## Security Advisories

Past security advisories are published at:

- [GitHub Security Advisories](https://github.com/ohanronnie/nist-stack/security/advisories)

## Contact

- 🔒 Security Email: [security@nist-stack.dev](mailto:security@nist-stack.dev)
- 💬 General Support: [support@nist-stack.dev](mailto:support@nist-stack.dev)

---

Thank you for helping keep NIST Stack and its users safe! 🔒
