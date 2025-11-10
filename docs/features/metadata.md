# Dynamic Metadata

NIST provides powerful dynamic metadata for SEO and social media sharing.

## How Metadata Works

Metadata flows from controller → interceptor → layout:

```
Controller returns metadata
  ↓
Interceptor merges metadata
  ↓
Layout renders meta tags
```

## Basic Metadata

### In Controller

```typescript
@Get()
@Page('home')
getHome(): PageResponse {
  return {
    data: { message: 'Hello' },
    metadata: {
      title: 'Home - My App',
      description: 'Welcome to my app',
    }
  };
}
```

### Rendered Output

```html
<head>
  <title>Home - My App</title>
  <meta name="description" content="Welcome to my app" />
</head>
```

## Metadata Properties

### Basic SEO

```typescript
metadata: {
  title: 'Page Title',
  description: 'Page description for search engines',
  keywords: 'keyword1, keyword2, keyword3',
  author: 'Your Name',
  viewport: 'width=device-width, initial-scale=1.0',
  charset: 'UTF-8',
  robots: 'index, follow',
  canonical: 'https://example.com/page',
}
```

### Open Graph (Facebook)

```typescript
metadata: {
  title: 'My Page',
  description: 'Page description',
  openGraph: {
    type: 'website',
    url: 'https://example.com/page',
    title: 'My Page - Custom OG Title',
    description: 'Custom OG description',
    image: 'https://example.com/og-image.jpg',
    siteName: 'My App',
  }
}
```

### Twitter Card

```typescript
metadata: {
  title: 'My Page',
  twitter: {
    card: 'summary_large_image',
    site: '@myapp',
    creator: '@username',
    title: 'Custom Twitter Title',
    description: 'Custom Twitter description',
    image: 'https://example.com/twitter-image.jpg',
  }
}
```

### Complete Example

```typescript
@Get('article/:slug')
@Page('article')
getArticle(@Param('slug') slug: string): PageResponse {
  return {
    data: { article },
    metadata: {
      title: 'How to Build with NIST - My Blog',
      description: 'Learn how to build fast SSR apps with NIST framework',
      keywords: 'nist, ssr, react, nestjs',
      author: 'John Doe',
      canonical: `https://myblog.com/article/${slug}`,

      openGraph: {
        type: 'article',
        url: `https://myblog.com/article/${slug}`,
        title: 'How to Build with NIST',
        description: 'Complete guide to NIST framework',
        image: 'https://myblog.com/images/nist-guide.jpg',
        siteName: 'My Blog',
      },

      twitter: {
        card: 'summary_large_image',
        site: '@myblog',
        creator: '@johndoe',
        title: 'How to Build with NIST',
        description: 'Complete guide to NIST framework',
        image: 'https://myblog.com/images/nist-guide.jpg',
      },
    }
  };
}
```

## Dynamic Metadata

Metadata can be generated from route params, user data, or API responses.

### Based on Route Params

```typescript
@Get('users/:username')
@Page('profile')
async getProfile(@Param('username') username: string): Promise<PageResponse> {
  const user = await this.userService.findByUsername(username);

  return {
    data: { user },
    metadata: {
      title: `${user.name} (@${username}) - My App`,
      description: `${user.bio}`,
      openGraph: {
        type: 'profile',
        image: user.avatar,
      },
    }
  };
}
```

### Based on User Auth

```typescript
@Get('dashboard')
@Page('dashboard')
@UseGuards(AuthGuard)
getDashboard(@Req() req): PageResponse {
  const user = req.user;

  return {
    data: { stats: {} },
    metadata: {
      title: `${user.name}'s Dashboard`,
      description: `Welcome back, ${user.name}!`,
    }
  };
}
```

### Based on Database Query

```typescript
@Get('blog/:slug')
@Page('post')
async getPost(@Param('slug') slug: string): Promise<PageResponse> {
  const post = await this.blogService.findBySlug(slug);

  return {
    data: { post },
    metadata: {
      title: `${post.title} - My Blog`,
      description: post.excerpt,
      keywords: post.tags.join(', '),

      openGraph: {
        type: 'article',
        title: post.title,
        description: post.excerpt,
        image: post.coverImage,
        url: `https://myblog.com/blog/${slug}`,
      },

      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.excerpt,
        image: post.coverImage,
      },
    }
  };
}
```

## Metadata Priority

Metadata merges in this order (lowest to highest priority):

1. **Root layout metadata** (global defaults)
2. **Nested layout metadata** (section defaults)
3. **Page metadata** (page-specific)
4. **Controller metadata** (highest - dynamic)

### Set Default Metadata

Use companion `*.metadata.ts` files to set default metadata:

```
src/
├── app.layout.tsx
├── app.metadata.ts  ← Layout metadata
├── pages/
│   ├── home.page.tsx
│   └── home.metadata.ts  ← Page metadata
```

**Define metadata in the controller:**

```typescript
// Controller returns metadata
@Get()
@Page('home')
getHome(): PageResponse {
  return {
    data: {},
    metadata: {
      title: "Home Page",
      description: "Welcome home",
      author: "Your Name",
    }
  };
}
```

**Layout receives metadata from controller:**

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

**Page component receives data:**

```tsx
// pages/home.page.tsx
export default function Home() {
  return <div>Welcome!</div>;
}
```

**Controller metadata overrides all:**

```typescript
@Get("blog/:slug")
@Page("post")
getPost(): PageResponse {
  return {
    data: { post },
    metadata: {
      title: "Blog Post Title", // Overrides everything
      // Other fields inherited from layout
    }
  };
}
```

## Metadata in Layout

Access metadata in your layout:

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

  const title = metadata?.title || "Default Title";
  const description = metadata?.description || "Default description";

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <title>{title}</title>
        <meta name="description" content={description} />
        {metaTags} {/* Auto-generated SEO tags */}
      </head>
      <body>
        <div id="root">{children}</div>
        {hydrationScripts}
      </body>
    </html>
  );
}
```

## Custom Meta Tags

Add custom meta tags not in the standard set:

```typescript
metadata: {
  title: 'My Page',
  // Custom properties
  'theme-color': '#000000',
  'apple-mobile-web-app-capable': 'yes',
  'custom-tag': 'value',
}
```

These will be rendered as:

```html
<meta name="theme-color" content="#000000" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="custom-tag" content="value" />
```

## SEO Best Practices

- **Title**: 50-60 characters, always include
- **Description**: 150-160 characters, unique per page
- **og:image**: Required for social sharing
- **Canonical URL**: Prevents duplicate content

## Dynamic og:image Generation

Generate custom og:images per page:

```typescript
@Get('blog/:slug')
@Page('post')
async getPost(@Param('slug') slug: string): Promise<PageResponse> {
  const post = await this.blogService.findBySlug(slug);

  // Generate og:image URL with post data
  const ogImage = `https://og.mysite.com/generate?title=${encodeURIComponent(post.title)}&author=${post.author}`;

  return {
    data: { post },
    metadata: {
      title: post.title,
      openGraph: {
        image: ogImage,  // Dynamic image
      },
    }
  };
}
```

## Testing Metadata

**Validation Tools:**

- [Facebook Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- Google Lighthouse (Chrome DevTools)

## Example: Blog Post

Complete example for a blog post:

```typescript
@Get('blog/:slug')
@Page('post')
async getPost(@Param('slug') slug: string): Promise<PageResponse> {
  const post = await this.db.post.findUnique({
    where: { slug },
    include: { author: true },
  });

  if (!post) {
    throw new NotFoundException('Post not found');
  }

  return {
    data: { post },
    metadata: {
      title: `${post.title} | My Blog`,
      description: post.excerpt,
      keywords: post.tags.join(', '),
      author: post.author.name,
      canonical: `https://myblog.com/blog/${slug}`,

      openGraph: {
        type: 'article',
        url: `https://myblog.com/blog/${slug}`,
        title: post.title,
        description: post.excerpt,
        image: post.coverImage,
        siteName: 'My Blog',
      },

      twitter: {
        card: 'summary_large_image',
        site: '@myblog',
        creator: `@${post.author.twitter}`,
        title: post.title,
        description: post.excerpt,
        image: post.coverImage,
      },

      robots: 'index, follow',
    }
  };
}
```

## Next Steps

- [Guards](/features/guards) - Protect routes
- [SSR](/features/ssr) - How SSR works
- [Performance](/advanced/performance) - Optimize metadata
