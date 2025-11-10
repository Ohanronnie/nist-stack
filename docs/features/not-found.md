# 404 Not Found Pages

NIST automatically handles 404 errors with a built-in not-found page. You can customize it by creating your own `not-found.page.tsx` file.

## Default 404 Page

By default, NIST renders a clean, professional 404 page when a route doesn't exist:

- Shows "404 - Page Not Found" message
- Includes a "Go back home" link
- Automatically sets `404` HTTP status code
- Sets `robots: noindex, nofollow` meta tag

**No configuration needed** - it just works!

## Custom 404 Page

Create a `not-found.page.tsx` file in your source directory to customize the 404 page:

```tsx
// src/not-found.page.tsx
export default function NotFound() {
  return (
    <div className="not-found">
      <h1>Oops! Page Not Found</h1>
      <p>We couldn't find what you're looking for.</p>
      <a href="/">Return Home</a>
    </div>
  );
}
```

## Adding Metadata

Create a companion `not-found.metadata.ts` file to customize SEO tags:

```typescript
// src/not-found.metadata.ts
export const metadata = {
  title: "404 - Page Not Found",
  description: "This page doesn't exist.",
  robots: "noindex, nofollow",
};
```

## Complete Example

```tsx
// src/not-found.page.tsx
import { Link } from "nist-stack";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-800">404</h1>
        <h2 className="text-2xl font-semibold text-gray-600 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
```

## How It Works

When a user visits a non-existent route:

1. NIST attempts to load the requested page
2. If the page doesn't exist, it catches the error
3. It looks for `src/not-found.page.tsx`
4. If custom page exists, it renders that
5. Otherwise, it renders the built-in default page
6. HTTP status is automatically set to `404`

## Using Layouts

The not-found page inherits your app layout just like any other page:

```
Root Layout (app.layout.tsx)
  └── Not Found Page (not-found.page.tsx)
```

Your header, footer, and global styles will still apply!

## Programmatic 404

You can also trigger a 404 from a controller by throwing `NotFoundException`:

```typescript
import { NotFoundException } from "@nestjs/common";

@Get("post/:id")
@Page("post")
async getPost(@Param("id") id: string): PageResponse {
  const post = await this.postService.findById(id);

  if (!post) {
    throw new NotFoundException(); // Renders 404 page
  }

  return {
    data: { post },
    metadata: { title: post.title },
  };
}
```

## Best Practices

### 1. Keep It Simple

Don't overcomplicate your 404 page. Users just need:

- Clear "404" or "Not Found" message
- Link back to homepage
- Optional search or navigation

### 2. Match Your Brand

Style the 404 page to match your app's design:

```tsx
// Use your app's components and styles
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";

export default function NotFound() {
  return (
    <div>
      <Header />
      <main className="container">
        <h1>404</h1>
        <Button href="/">Go Home</Button>
      </main>
    </div>
  );
}
```

### 3. Add Helpful Links

Include links to popular pages:

```tsx
export default function NotFound() {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>Try one of these instead:</p>
      <ul>
        <li>
          <a href="/">Home</a>
        </li>
        <li>
          <a href="/blog">Blog</a>
        </li>
        <li>
          <a href="/contact">Contact</a>
        </li>
      </ul>
    </div>
  );
}
```

### 4. Track 404s

Log 404 errors for monitoring:

```typescript
@Get(":path*")
@Page("not-found")
catchAll(@Param("path") path: string) {
  this.logger.warn(`404: ${path}`);
  throw new NotFoundException();
}
```

## File Structure

```
src/
├── app.layout.tsx
├── not-found.page.tsx       ← Custom 404 page
├── not-found.metadata.ts    ← Optional metadata
└── pages/
    ├── home.page.tsx
    └── about.page.tsx
```

## See Also

- [Error Handling](/features/error-handling) - Handle all types of errors
- [Metadata](/features/metadata) - SEO and meta tags
- [Pages](/features/pages) - Creating pages
