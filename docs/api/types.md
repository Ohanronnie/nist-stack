# TypeScript Types Reference

Complete type definitions for building type-safe NIST applications.

## Controller Types

### PageResponse

The return type for controller methods that render pages.

```typescript
interface PageResponse<T = any> {
  data: T;
  metadata?: PageMetadata;
}
```

**Type Parameters:**

- `T`: Type of the data object (default: `any`)

**Properties:**

- `data`: Data passed to the page component as props
- `metadata`: Optional SEO and OpenGraph metadata

**Example:**

```typescript
@Get()
@Page('home')
getHome(): PageResponse<{ users: User[] }> {
  return {
    data: { users: ['Alice', 'Bob'] },
    metadata: {
      title: 'Home Page',
      description: 'Welcome home',
    },
  };
}
```

**With Full Type Safety:**

```typescript
interface HomePageData {
  users: User[];
  stats: Statistics;
}

@Get()
getHome(): PageResponse<HomePageData> {
  return {
    data: {
      users: this.userService.getUsers(),
      stats: this.statsService.getStats(),
    },
    metadata: { title: 'Home' },
  };
}

// Page component automatically infers props
export default function HomePage({ users, stats }: HomePageData) {
  // ...
}
```

---

### PageMetadata

Metadata object for SEO and social media optimization.

```typescript
interface PageMetadata {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  robots?: string;
  canonical?: string;
  openGraph?: OpenGraphMetadata;
  twitter?: TwitterMetadata;
}
```

**Properties:**

| Property      | Type                | Description                                          |
| ------------- | ------------------- | ---------------------------------------------------- |
| `title`       | `string`            | Page title (shown in browser tab and search results) |
| `description` | `string`            | Meta description for SEO                             |
| `keywords`    | `string`            | Comma-separated keywords                             |
| `author`      | `string`            | Content author                                       |
| `robots`      | `string`            | Robot directives (e.g., `"noindex, nofollow"`)       |
| `canonical`   | `string`            | Canonical URL for duplicate content                  |
| `openGraph`   | `OpenGraphMetadata` | Open Graph tags for social sharing                   |
| `twitter`     | `TwitterMetadata`   | Twitter Card metadata                                |

**Example:**

```typescript
const metadata: PageMetadata = {
  title: "My Blog Post - Blog Name",
  description: "This is an amazing blog post about TypeScript",
  keywords: "typescript, programming, web development",
  author: "John Doe",
  canonical: "https://example.com/blog/my-post",
  robots: "index, follow",
  openGraph: {
    title: "My Blog Post",
    description: "This is an amazing blog post",
    image: "https://example.com/og-image.jpg",
    url: "https://example.com/blog/my-post",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    site: "@myblog",
    creator: "@johndoe",
  },
};
```

---

### OpenGraphMetadata

Open Graph protocol metadata for social media sharing.

```typescript
interface OpenGraphMetadata {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  locale?: string;
}
```

**Properties:**

| Property      | Type     | Description                                        |
| ------------- | -------- | -------------------------------------------------- |
| `title`       | `string` | OG title (may differ from page title)              |
| `description` | `string` | OG description                                     |
| `image`       | `string` | OG image URL (recommended: 1200x630px)             |
| `url`         | `string` | Canonical URL for this page                        |
| `type`        | `string` | Content type (`website`, `article`, `video`, etc.) |
| `siteName`    | `string` | Name of the website                                |
| `locale`      | `string` | Locale (e.g., `en_US`)                             |

**Example:**

```typescript
const openGraph: OpenGraphMetadata = {
  title: "Amazing Article",
  description: "Read this amazing article",
  image: "https://cdn.example.com/images/article-og.jpg",
  url: "https://example.com/articles/amazing",
  type: "article",
  siteName: "My Blog",
  locale: "en_US",
};
```

---

### TwitterMetadata

Twitter Card metadata for Twitter sharing.

```typescript
interface TwitterMetadata {
  card?: "summary" | "summary_large_image" | "app" | "player";
  site?: string;
  creator?: string;
  title?: string;
  description?: string;
  image?: string;
}
```

**Properties:**

| Property      | Type     | Description                                        |
| ------------- | -------- | -------------------------------------------------- |
| `card`        | `string` | Card type (`summary`, `summary_large_image`, etc.) |
| `site`        | `string` | Twitter handle for the website (`@site`)           |
| `creator`     | `string` | Twitter handle for content creator (`@creator`)    |
| `title`       | `string` | Title for Twitter Card                             |
| `description` | `string` | Description for Twitter Card                       |
| `image`       | `string` | Image URL for Twitter Card                         |

**Example:**

```typescript
const twitter: TwitterMetadata = {
  card: "summary_large_image",
  site: "@myblog",
  creator: "@johndoe",
  title: "Amazing Article",
  description: "Read this on Twitter",
  image: "https://cdn.example.com/images/article-twitter.jpg",
};
```

## Component Types

### LayoutProps

Props passed to layout components.

```typescript
interface LayoutProps {
  children: ReactNode;
  metaTags: ReactElement;
  hydrationScripts: ReactElement;
  metadata?: PageMetadata;
}
```

**Properties:**

| Property           | Type           | Description                |
| ------------------ | -------------- | -------------------------- |
| `children`         | `ReactNode`    | Page content to render     |
| `metaTags`         | `ReactElement` | Server-generated meta tags |
| `hydrationScripts` | `ReactElement` | Client hydration scripts   |
| `metadata`         | `PageMetadata` | Merged metadata object     |

**Example:**

```tsx
import type { LayoutProps } from "nist-stack/client";

export default function AppLayout({
  children,
  metaTags,
  hydrationScripts,
  metadata,
}: LayoutProps) {
  return (
    <html lang="en">
      <head>
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

---

### PageConfig

Configuration object for page-level settings.

```typescript
interface PageConfig {
  revalidate?: number;
}
```

**Properties:**

| Property     | Type     | Description                              |
| ------------ | -------- | ---------------------------------------- |
| `revalidate` | `number` | Cache duration in seconds (0 = no cache) |

**Example:**

```tsx
// home.page.tsx
export const config: PageConfig = {
  revalidate: 60, // Cache for 60 seconds
};

export default function HomePage() {
  return <div>Home</div>;
}
```

## Exception Types

### RedirectException

Custom exception for server-side redirects.

```typescript
class RedirectException {
  readonly name: "RedirectException";
  readonly url: string;
  readonly statusCode: number;
  readonly message: string;

  constructor(url: string, statusCode?: number);
}
```

**Constructor Parameters:**

| Parameter    | Type     | Default | Description               |
| ------------ | -------- | ------- | ------------------------- |
| `url`        | `string` | -       | Redirect target URL       |
| `statusCode` | `number` | `302`   | HTTP redirect status code |

**Example:**

```typescript
import { RedirectException } from "nist-stack";

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    if (!request.session?.user) {
      throw new RedirectException("/login", 302);
    }

    return true;
  }
}
```

**Status Codes:**

- `301` - Permanent redirect
- `302` - Temporary redirect (default)
- `303` - See Other
- `307` - Temporary (preserves HTTP method)
- `308` - Permanent (preserves HTTP method)

## Utility Types

### Extracted Props Type

Extract props type from a page component:

```typescript
import type HomePage from "./home.page";

type HomePageProps = React.ComponentProps<typeof HomePage>;
```

### Service Return Type

Type controller response from service:

```typescript
class UserService {
  async getUsers() {
    return [{ id: 1, name: 'Alice' }];
  }
}

type UsersData = Awaited<ReturnType<UserService['getUsers']>>;

@Get()
getHome(): PageResponse<{ users: UsersData }> {
  const users = await this.userService.getUsers();
  return { data: { users }, metadata: {} };
}
```

## Type Guards

### isPageResponse

Check if value is a valid PageResponse:

```typescript
function isPageResponse(value: any): value is PageResponse {
  return (
    value &&
    typeof value === "object" &&
    "data" in value &&
    (value.metadata === undefined || typeof value.metadata === "object")
  );
}
```

### hasMetadata

Check if page response includes metadata:

```typescript
function hasMetadata<T>(
  response: PageResponse<T>
): response is PageResponse<T> & { metadata: PageMetadata } {
  return response.metadata !== undefined;
}
```

## Generic Types

### Paginated Response

Common pattern for paginated data:

```typescript
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Get('posts')
getPosts(
  @Query('page') page: number = 1
): PageResponse<PaginatedResponse<Post>> {
  const { items, total } = await this.postService.findPaginated(page);

  return {
    data: {
      items,
      total,
      page,
      pageSize: 20,
      totalPages: Math.ceil(total / 20),
    },
    metadata: { title: `Posts - Page ${page}` },
  };
}
```

### API Response Wrapper

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

## Declaration Merging

### Extending Session

Extend express-session types:

```typescript
// types/express-session.d.ts
import "express-session";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      username: string;
      email: string;
    };
    views?: number;
  }
}
```

### Extending Request

Add custom properties to Express request:

```typescript
// types/express.d.ts
import "express";

declare global {
  namespace Express {
    interface Request {
      startTime?: number;
      requestId?: string;
    }
  }
}
```

## Best Practices

### 1. Always Define Data Types

```typescript
// Bad
@Get()
getHome(): PageResponse {
  return { data: { users: [] }, metadata: {} };
}

// Good
interface HomeData {
  users: User[];
}

@Get()
getHome(): PageResponse<HomeData> {
  return { data: { users: [] }, metadata: {} };
}
```

### 2. Use Strict Typing

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### 3. Create Shared Types

```typescript
// types/page-data.types.ts
export interface BlogPostData {
  post: Post;
  author: Author;
  related: Post[];
}

export interface UserProfileData {
  user: User;
  posts: Post[];
  stats: Statistics;
}
```

### 4. Use Type Inference

```typescript
// Let TypeScript infer return type
const getUser = () => ({
  id: 1,
  name: "Alice",
  email: "alice@example.com",
});

type User = ReturnType<typeof getUser>;
```

### 5. Document Complex Types

```typescript
/**
 * Page response with user profile data.
 *
 * @property user - The user's profile information
 * @property posts - Array of user's recent posts (max 10)
 * @property stats - User statistics (followers, posts count)
 */
interface ProfilePageData {
  user: User;
  posts: Post[];
  stats: UserStats;
}
```

## See Also

- [Pages](/features/pages) - Using typed page responses
- [Metadata](/features/metadata) - Working with metadata
- [Data Fetching](/features/data-fetching) - Type-safe data loading
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) - Official TypeScript docs
