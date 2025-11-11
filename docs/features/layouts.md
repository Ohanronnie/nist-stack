# Layouts

Layouts wrap your pages with common UI elements and HTML structure.

## Types of Layouts

NIST supports two types of layouts:

1. **Root Layout** (`app.layout.tsx`) - Wraps all pages
2. **Nested Layouts** - Wrap specific page sections

## Root Layout

The root layout provides the HTML structure for all pages.

### Basic Root Layout

```tsx
// src/app.layout.tsx
import type { LayoutProps } from "nist-stack/client";

export default function AppLayout({
  children,
  metaTags,
  hydrationScripts,
  metadata,
}: LayoutProps) {
  const isClient = typeof window !== "undefined";

  // Client-side: just return children
  if (isClient) {
    return <>{children}</>;
  }

  // Server-side: return full HTML
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

### LayoutProps Interface

```typescript
interface LayoutProps {
  children: React.ReactNode; // The page content
  metaTags?: React.ReactNode; // SEO meta tags
  hydrationScripts?: React.ReactNode; // Client hydration scripts
  metadata?: PageMetadata; // Metadata from controller
}
```

## Adding Common Elements

Add header, nav, footer to both client and server renders:

```tsx
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
        <title>{metadata?.title || "My App"}</title>
        {metaTags}
      </head>
      <body>
        <header>
          <nav>
            <a href="/">Home</a>
            <a href="/about">About</a>
          </nav>
        </header>
        <main id="root">{children}</main>
        <footer>&copy; 2025 My App</footer>
        {hydrationScripts}
      </body>
    </html>
  );
}
```

## Nested Layouts

Create layouts for specific page sections. Layouts are resolved relative to the controller's `@PageRoot(__dirname)`.

### Creating a Nested Layout

Example with controller in `src/blog/blog.controller.ts`:

```typescript
// src/blog/blog.controller.ts
@PageRoot(__dirname)
@Controller("blog")
export class BlogController {
  @Get("post")
  @Page("post")
  @Layout("blog") // Looks for src/blog/blog.layout.tsx
  getPost() {}
}
```

```
src/blog/
├── blog.controller.ts
├── blog.layout.tsx   ← Nested layout
├── post.page.tsx
└── archive.page.tsx
```

```tsx
// src/blog/blog.layout.tsx
import type { LayoutProps } from "nist-stack/client";

export default function BlogLayout({ children }: LayoutProps) {
  return (
    <div className="blog-wrapper">
      <aside className="sidebar">
        <nav>
          <a href="/blog/post">Latest Post</a>
          <a href="/blog/archive">Archive</a>
        </nav>
      </aside>
      <div className="content">{children}</div>
    </div>
  );
}
```

### How Layouts Nest

```
Root Layout (app.layout.tsx)
  └── Nested Layout (pages/pages.layout.tsx)
        └── Page Component (pages/about.page.tsx)
```

The final HTML structure:

```html
<html>
  <head>
    ...
  </head>
  <body>
    <header>...</header>
    <main>
      <div class="pages-wrapper">
        <aside class="sidebar">...</aside>
        <div class="content">
          <!-- Page content here -->
        </div>
      </div>
    </main>
    <footer>...</footer>
  </body>
</html>
```

## Default Metadata in Layouts

Metadata is defined in the controller's `PageResponse`:

```typescript
// Controller
@Get()
@Page('home')
getHome(): PageResponse {
  return {
    data: {},
    metadata: {
      title: "My App",
      description: "Default description",
    }
  };
}
```

```tsx
// app.layout.tsx
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
        <title>{metadata?.title}</title>
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

Controllers can override these defaults. See [Metadata Priority](/features/metadata#metadata-priority).

## Adding Assets

Add stylesheets and scripts in the `<head>`:

```tsx
<head>
  <link rel="stylesheet" href="/styles.css" />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"
    rel="stylesheet"
  />
  <title>{metadata?.title}</title>
  {metaTags}
</head>
```

## Multiple Root Layouts

You can have different root layouts for different page sections:

```
src/
├── app.layout.tsx           # Default layout
├── auth/
│   ├── auth.layout.tsx      # Auth pages layout
│   ├── login.page.tsx
│   └── signup.page.tsx
└── admin/
    ├── admin.layout.tsx     # Admin layout
    └── dashboard.page.tsx
```

The layout closest to the page will be used as the root layout.

## Best Practices

**1. Always include `{hydrationScripts}` before closing `</body>`**

```tsx
<body>
  <div id="root">{children}</div>
  {hydrationScripts}
</body>
```

**2. Always include `{metaTags}` in `<head>` for SEO**

```tsx
<head>
  <title>{metadata?.title}</title>
  {metaTags}
</head>
```

**3. Keep layouts simple - no data fetching or complex logic**

## Next Steps

- [Dynamic Metadata](/features/metadata) - SEO and meta tags
- [Guards](/features/guards) - Protect routes
- [Client-Side Hooks](/features/client-side) - Navigate between pages
