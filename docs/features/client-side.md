# Client-Side Features

NIST provides a rich set of client-side components and hooks for building interactive React applications with seamless navigation, optimized assets, and full access to route data.

## Navigation

### Link Component

The `Link` component provides client-side navigation with prefetching and smooth transitions.

```tsx
import { Link } from "nist-stack/client";

export default function Navigation() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/blog/my-post">Blog Post</Link>
    </nav>
  );
}
```

#### Props

```typescript
interface LinkProps {
  href: string; // Destination URL
  prefetch?: boolean; // Prefetch on hover (default: true)
  replace?: boolean; // Replace history instead of push
  scroll?: boolean; // Scroll to top on navigation (default: true)
  className?: string; // CSS class name
  children: React.ReactNode; // Link content
  onClick?: (e: MouseEvent) => void;
}
```

#### Features

- **Automatic prefetching** - Hover to preload the page
- **Smooth transitions** - No full page reload
- **Active state** - Style the current page link
- **External links** - Automatically detects and uses regular `<a>` tags

```tsx
// Active link styling
export default function Nav() {
  const pathname = usePathname();

  return (
    <nav>
      <Link
        href="/dashboard"
        className={pathname === "/dashboard" ? "active" : ""}>
        Dashboard
      </Link>
    </nav>
  );
}
```

---

## Images

### Image Component

The `Image` component provides optimized image loading with lazy loading and placeholder support.

```tsx
import { Image } from "nist-stack/client";

export default function Profile({ user }) {
  return (
    <div>
      <Image
        src={user.avatar}
        alt={user.name}
        width={200}
        height={200}
        loading="lazy"
      />
    </div>
  );
}
```

#### Props

```typescript
interface ImageProps {
  src: string; // Image source URL
  alt: string; // Alt text for accessibility
  width?: number; // Image width
  height?: number; // Image height
  loading?: "lazy" | "eager"; // Loading strategy
  className?: string; // CSS class name
  style?: React.CSSProperties; // Inline styles
  onLoad?: () => void; // Load callback
  onError?: () => void; // Error callback
}
```

#### Features

- **Lazy loading** - Only load images when they enter the viewport
- **Automatic optimization** - Serve optimal formats
- **Placeholder support** - Show loading state
- **Responsive images** - Adapt to different screen sizes

```tsx
// Responsive image with placeholder
export default function Hero() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero banner"
      width={1200}
      height={600}
      loading="eager"
      className="w-full h-auto"
    />
  );
}
```

---

## Router Hooks

### useRouter

Access the router instance for programmatic navigation.

```tsx
import { useRouter } from "nist-stack/client";

export default function LoginForm() {
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login();

    if (success) {
      router.push("/dashboard");
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

#### Router Methods

```typescript
interface Router {
  push(url: string): void; // Navigate to URL
  replace(url: string): void; // Replace current URL
  back(): void; // Go back
  forward(): void; // Go forward
  refresh(): void; // Refresh current page
  prefetch(url: string): void; // Prefetch a URL
}
```

---

### useParams

Get URL parameters from dynamic routes.

```tsx
import { useParams } from "nist-stack/client";

// Controller: @Get('/blog/:slug')
export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();

  return <h1>Post: {slug}</h1>;
}
```

#### Multiple Parameters

```tsx
// Controller: @Get('/users/:userId/posts/:postId')
export default function UserPost() {
  const { userId, postId } = useParams<{
    userId: string;
    postId: string;
  }>();

  return (
    <div>
      <p>User: {userId}</p>
      <p>Post: {postId}</p>
    </div>
  );
}
```

---

### useParam

Get a single URL parameter.

```tsx
import { useParam } from "nist-stack/client";

export default function UserProfile() {
  const userId = useParam("userId");

  return <div>User ID: {userId}</div>;
}
```

---

### useQuery

Get all query string parameters.

```tsx
import { useQuery } from "nist-stack/client";

// URL: /search?q=react&sort=date
export default function SearchResults() {
  const query = useQuery();

  return (
    <div>
      <p>Search: {query.q}</p>
      <p>Sort: {query.sort}</p>
    </div>
  );
}
```

#### Type-Safe Query

```tsx
interface SearchQuery {
  q?: string;
  sort?: "date" | "relevance";
  page?: string;
}

export default function SearchResults() {
  const query = useQuery() as SearchQuery;

  return (
    <div>
      <p>Query: {query.q || "all"}</p>
      <p>Sort: {query.sort || "date"}</p>
      <p>Page: {query.page || "1"}</p>
    </div>
  );
}
```

---

### useQueryParam

Get a single query parameter.

```tsx
import { useQueryParam } from "nist-stack/client";

export default function SearchPage() {
  const searchTerm = useQueryParam("q");
  const page = useQueryParam("page") || "1";

  return (
    <div>
      <p>Searching for: {searchTerm}</p>
      <p>Page: {page}</p>
    </div>
  );
}
```

---

### usePathname

Get the current pathname.

```tsx
import { usePathname } from "nist-stack/client";

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav>
      <Link href="/" className={pathname === "/" ? "active" : ""}>
        Home
      </Link>
      <Link href="/about" className={pathname === "/about" ? "active" : ""}>
        About
      </Link>
    </nav>
  );
}
```

---

### useRouteData

Get all route data including params, query, and pathname.

```tsx
import { useRouteData } from "nist-stack/client";

export default function DebugInfo() {
  const routeData = useRouteData();

  return (
    <pre>
      {JSON.stringify(
        {
          pathname: routeData.pathname,
          params: routeData.params,
          query: routeData.query,
        },
        null,
        2
      )}
    </pre>
  );
}
```

#### RouteData Interface

```typescript
interface RouteData {
  pathname: string; // Current path
  params: Record<string, string>; // URL parameters
  query: Record<string, string>; // Query parameters
  hash: string; // URL hash
}
```

---

### useNistData

Get the full hydration data passed from the server.

```tsx
import { useNistData } from "nist-stack/client";

export default function MyPage() {
  const nistData = useNistData();

  // Access server-provided data
  const { data, metadata, route } = nistData;

  return (
    <div>
      <h1>{metadata.title}</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

#### NistData Interface

```typescript
interface NistData {
  data: any; // Controller return data
  metadata: PageMetadata; // Page metadata
  route: RouteData; // Route information
  layout?: string; // Layout name
  error?: any; // Error if any
}
```

---

## Error Boundaries

### ErrorBoundary Component

Catch and handle React errors gracefully.

```tsx
import { ErrorBoundary } from "nist-stack/client";

export default function MyPage() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div>
          <h1>Something went wrong</h1>
          <p>{error.message}</p>
          <button onClick={reset}>Try again</button>
        </div>
      )}>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

#### Props

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}
```

#### Default Fallback

If no fallback is provided, NIST shows a default error UI:

```tsx
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

---

## Complete Example

Here's a comprehensive example using multiple client-side features:

```tsx
import {
  Link,
  Image,
  useParams,
  useQuery,
  usePathname,
  useRouter,
  ErrorBoundary,
} from "nist-stack/client";

export default function BlogPost() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const query = useQuery();
  const pathname = usePathname();

  const handleShare = () => {
    navigator.share({
      title: "Check this out",
      url: pathname,
    });
  };

  return (
    <ErrorBoundary>
      <article>
        <Image
          src={`/images/${slug}.jpg`}
          alt={slug}
          width={800}
          height={400}
          loading="eager"
        />

        <h1>{slug.replace(/-/g, " ")}</h1>

        {query.preview && <div className="preview-banner">Preview Mode</div>}

        <nav>
          <Link href="/blog">← Back to Blog</Link>
          <button onClick={handleShare}>Share</button>
        </nav>

        <div className="content">{/* Your content */}</div>

        <nav className="pagination">
          <Link href="/blog/prev-post">Previous</Link>
          <Link href="/blog/next-post">Next</Link>
        </nav>
      </article>
    </ErrorBoundary>
  );
}
```

---

## Best Practices

### 1. Use Link for Internal Navigation

Always use `Link` for internal links to benefit from client-side navigation:

```tsx
// ✅ Good
<Link href="/about">About</Link>

// ❌ Avoid (causes full page reload)
<a href="/about">About</a>
```

### 2. Type Your Route Parameters

Use TypeScript generics for type-safe route parameters:

```tsx
// ✅ Good
const { id } = useParams<{ id: string }>();

// ❌ Less safe
const { id } = useParams();
```

### 3. Handle Missing Query Parameters

Always provide defaults for optional query parameters:

```tsx
const page = useQueryParam("page") || "1";
const sort = useQueryParam("sort") || "date";
```

### 4. Wrap Error-Prone Components

Use ErrorBoundary around components that might fail:

```tsx
<ErrorBoundary>
  <AsyncDataComponent />
</ErrorBoundary>
```

### 5. Optimize Images

Use the Image component with appropriate loading strategies:

```tsx
// Above the fold - load immediately
<Image src="/hero.jpg" loading="eager" />

// Below the fold - lazy load
<Image src="/footer-logo.jpg" loading="lazy" />
```

---

## TypeScript Types

All client-side features are fully typed:

```typescript
import type {
  LinkProps,
  ImageProps,
  Router,
  RouteData,
  NistData,
  ErrorBoundaryProps,
} from "nist-stack/client";
```

---

## Next Steps

- [Pages](/features/pages) - Learn about creating pages
- [Layouts](/features/layouts) - Build shared layouts
- [Request Context](/features/request-context) - Access request data
- [Error Handling](/features/error-handling) - Handle errors gracefully
