# Testing

Comprehensive testing guide for NIST applications. Learn how to write unit tests, integration tests, and end-to-end tests to ensure your application works correctly.

## Testing Stack

NIST applications can be tested using:

- **Vitest** - Fast unit testing framework (recommended)
- **Jest** - Traditional testing framework
- **React Testing Library** - Component testing
- **Supertest** - HTTP endpoint testing
- **Playwright/Cypress** - E2E testing

## Setup

### Install Testing Dependencies

```bash
# Vitest (recommended)
bun add -d vitest @vitest/ui happy-dom

# React Testing Library
bun add -d @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Supertest for API testing
bun add -d supertest @types/supertest

# E2E testing (optional)
bun add -d @playwright/test
```

### Vitest Configuration

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "dist/", "**/*.spec.ts", "**/*.test.tsx"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### Test Setup File

Create `test/setup.ts`:

```typescript
import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test"
  }
}
```

## Unit Testing

### Testing Services

```typescript
// user.service.spec.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { UserService } from "./user.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";

describe("UserService", () => {
  let service: UserService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      find: vi.fn(),
      findOne: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return an array of users", async () => {
      const users = [
        { id: 1, name: "Alice", email: "alice@example.com" },
        { id: 2, name: "Bob", email: "bob@example.com" },
      ];

      mockRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(mockRepository.find).toHaveBeenCalledOnce();
    });
  });

  describe("findById", () => {
    it("should return a user by id", async () => {
      const user = { id: 1, name: "Alice", email: "alice@example.com" };
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findById(1);

      expect(result).toEqual(user);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should return null if user not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create and return a new user", async () => {
      const createUserDto = { name: "Charlie", email: "charlie@example.com" };
      const savedUser = { id: 3, ...createUserDto };

      mockRepository.save.mockResolvedValue(savedUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(savedUser);
      expect(mockRepository.save).toHaveBeenCalledWith(createUserDto);
    });
  });
});
```

### Testing Controllers

```typescript
// app.controller.spec.ts
import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { UserService } from "./user.service";

describe("AppController", () => {
  let controller: AppController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: UserService,
          useValue: {
            findAll: vi.fn().mockResolvedValue([
              { id: 1, name: "Alice" },
              { id: 2, name: "Bob" },
            ]),
          },
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    userService = module.get<UserService>(UserService);
  });

  describe("getHome", () => {
    it("should return page response with users", async () => {
      const result = await controller.getHome();

      expect(result).toEqual({
        data: {
          users: [
            { id: 1, name: "Alice" },
            { id: 2, name: "Bob" },
          ],
        },
        metadata: {
          title: "Home - NIST-JS",
          description: "Welcome to NIST-JS SSR Framework",
        },
      });

      expect(userService.findAll).toHaveBeenCalledOnce();
    });
  });
});
```

## Component Testing

### Testing Page Components

```tsx
// app.page.spec.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AppPage from "./app.page";

describe("AppPage", () => {
  it("renders user list", () => {
    const users = ["Alice", "Bob", "Charlie"];

    render(<AppPage users={users} />);

    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("renders empty state when no users", () => {
    render(<AppPage users={[]} />);

    expect(screen.getByText("No users found")).toBeInTheDocument();
  });
});
```

### Testing Interactive Components

```tsx
// counter.spec.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Counter from "./Counter";

describe("Counter", () => {
  it("increments count when button is clicked", async () => {
    const user = userEvent.setup();

    render(<Counter />);

    const button = screen.getByRole("button", { name: /increment/i });
    const count = screen.getByText(/count: 0/i);

    expect(count).toBeInTheDocument();

    await user.click(button);
    expect(screen.getByText(/count: 1/i)).toBeInTheDocument();

    await user.click(button);
    expect(screen.getByText(/count: 2/i)).toBeInTheDocument();
  });

  it("resets count when reset button is clicked", async () => {
    const user = userEvent.setup();

    render(<Counter />);

    const incrementBtn = screen.getByRole("button", { name: /increment/i });
    const resetBtn = screen.getByRole("button", { name: /reset/i });

    await user.click(incrementBtn);
    await user.click(incrementBtn);
    expect(screen.getByText(/count: 2/i)).toBeInTheDocument();

    await user.click(resetBtn);
    expect(screen.getByText(/count: 0/i)).toBeInTheDocument();
  });
});
```

## Integration Testing

### HTTP Endpoint Testing

```typescript
// app.integration.spec.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";

describe("AppController (Integration)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /", () => {
    it("should return 200 and HTML", async () => {
      const response = await request(app.getHttpServer()).get("/").expect(200);

      expect(response.headers["content-type"]).toContain("text/html");
      expect(response.text).toContain("<!DOCTYPE html>");
    });
  });

  describe("GET /about", () => {
    it("should return about page", async () => {
      await request(app.getHttpServer())
        .get("/about")
        .expect(200)
        .expect((res) => {
          expect(res.text).toContain("About");
        });
    });
  });

  describe("GET /nonexistent", () => {
    it("should return 404", async () => {
      await request(app.getHttpServer()).get("/nonexistent").expect(404);
    });
  });
});
```

### Testing Guards

```typescript
// auth.guard.spec.ts
import { describe, it, expect, beforeEach } from "vitest";
import { ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "./auth.guard";
import { RedirectException } from "nist-stack";

describe("AuthGuard", () => {
  let guard: AuthGuard;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    guard = new AuthGuard();

    mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ session: {} }),
      }),
    } as any;
  });

  it("should allow access when user is authenticated", () => {
    mockContext.switchToHttp().getRequest().session.user = { id: 1 };

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it("should throw RedirectException when user is not authenticated", () => {
    expect(() => guard.canActivate(mockContext)).toThrow(RedirectException);

    try {
      guard.canActivate(mockContext);
    } catch (error) {
      expect(error).toBeInstanceOf(RedirectException);
      expect(error.url).toBe("/login");
      expect(error.statusCode).toBe(302);
    }
  });
});
```

### Testing with Database

```typescript
// user.integration.spec.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Test } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserService } from "./user.service";
import { User } from "./entities/user.entity";

describe("UserService (Database Integration)", () => {
  let service: UserService;
  let connection: any;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "sqlite",
          database: ":memory:",
          entities: [User],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([User]),
      ],
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
    connection = module.get("Connection");
  });

  afterAll(async () => {
    await connection.close();
  });

  beforeEach(async () => {
    // Clear database before each test
    await connection.synchronize(true);
  });

  it("should create and retrieve user", async () => {
    const userData = { name: "Alice", email: "alice@example.com" };

    const created = await service.create(userData);
    expect(created.id).toBeDefined();
    expect(created.name).toBe("Alice");

    const found = await service.findById(created.id);
    expect(found).toEqual(created);
  });

  it("should update user", async () => {
    const user = await service.create({
      name: "Bob",
      email: "bob@example.com",
    });

    await service.update(user.id, { name: "Robert" });

    const updated = await service.findById(user.id);
    expect(updated.name).toBe("Robert");
  });
});
```

## E2E Testing

### Playwright Setup

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],

  webServer: {
    command: "bun run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Tests

```typescript
// e2e/home.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should display home page", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Home/);
    await expect(page.locator("h1")).toContainText("Welcome");
  });

  test("should navigate to about page", async ({ page }) => {
    await page.goto("/");

    await page.click("text=About");

    await expect(page).toHaveURL("/about");
    await expect(page.locator("h1")).toContainText("About");
  });

  test("should display user list", async ({ page }) => {
    await page.goto("/");

    const users = page.locator("li");
    await expect(users).toHaveCount(3);

    await expect(users.first()).toContainText("Alice");
  });
});
```

### Testing Authentication Flow

```typescript
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should redirect to login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL("/login");
  });

  test("should login successfully", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("text=Welcome back")).toBeVisible();
  });

  test("should logout successfully", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Logout
    await page.click("text=Logout");

    await expect(page).toHaveURL("/");
    await expect(page.locator("text=Login")).toBeVisible();
  });
});
```

## Mocking

### Mocking Services

```typescript
import { vi } from "vitest";

const mockUserService = {
  findAll: vi.fn().mockResolvedValue([]),
  findById: vi.fn().mockResolvedValue(null),
  create: vi.fn().mockResolvedValue({ id: 1 }),
};
```

### Mocking HTTP Requests

```typescript
import { vi } from "vitest";

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: "mocked" }),
  } as Response)
);
```

### Mocking Environment Variables

```typescript
beforeEach(() => {
  process.env.DATABASE_URL = "test-database-url";
  process.env.NODE_ENV = "test";
});

afterEach(() => {
  delete process.env.DATABASE_URL;
  delete process.env.NODE_ENV;
});
```

## Coverage

### Generate Coverage Reports

```bash
# Run tests with coverage
bun run test:coverage

# View coverage report
open coverage/index.html
```

### Coverage Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.spec.ts",
        "**/*.test.tsx",
        "test/",
      ],
    },
  },
});
```

## Best Practices

### 1. Follow AAA Pattern

```typescript
it("should do something", async () => {
  // Arrange
  const input = { name: "Test" };

  // Act
  const result = await service.process(input);

  // Assert
  expect(result).toBe("processed");
});
```

### 2. Test Behavior, Not Implementation

```typescript
// Bad - Testing implementation details
it("should call userRepository.find", async () => {
  await service.getUsers();
  expect(mockRepo.find).toHaveBeenCalled();
});

// Good - Testing behavior
it("should return list of users", async () => {
  const users = await service.getUsers();
  expect(users).toHaveLength(3);
  expect(users[0]).toHaveProperty("name");
});
```

### 3. Use Descriptive Test Names

```typescript
// Bad
it("works", () => {
  /* ... */
});

// Good
it("should return 404 when user is not found", () => {
  /* ... */
});
```

### 4. Isolate Tests

Each test should be independent and not rely on other tests.

### 5. Use Factories for Test Data

```typescript
// test/factories/user.factory.ts
export const createUserDto = (overrides = {}) => ({
  name: "Test User",
  email: "test@example.com",
  password: "password123",
  ...overrides,
});
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run tests
        run: bun run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## See Also

- [Data Fetching](/features/data-fetching) - Testing data loading
- [Guards](/features/guards) - Testing authentication
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing) - Official docs
