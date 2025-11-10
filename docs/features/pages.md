# Pages & Routing

Learn how to create pages and handle routing in NIST.

## Creating a Page

A page in NIST consists of two parts:

1. **Controller method** with `@Page()` decorator (defines route)
2. **React component** file ending in `.page.tsx` (renders UI)

### Basic Example

**Controller:**

```typescript
@PageRoot(__dirname)
@Controller()
export class AppController {
  @Get()
  @Page("home")
  getHome(): PageResponse {
    return {
      data: { message: "Welcome!" },
      metadata: { title: "Home" },
    };
  }
}
```

**Component:**

```tsx
// home.page.tsx
export default function Home({ message }) {
  return (
    <div>
      <h1>{message}</h1>
    </div>
  );
}
```

## Decorators

### `@PageRoot()`

Tells NIST where to find page components:

```typescript
@PageRoot(__dirname)
@Controller()
export class AppController {
  // Pages will be resolved relative to this file
}
```

Always use `__dirname` to reference the current directory.

### `@Page()`

Maps a controller method to a React component:

```typescript
@Get('about')
@Page('about')  // → looks for about.page.tsx
getAbout() {
  return { data: {} };
}
```

### Organized File Structure

Group related pages with their controller using `@PageRoot(__dirname)`:

```typescript
// src/blog/blog.controller.ts
@PageRoot(__dirname) // Pages are resolved relative to this directory
@Controller("blog")
export class BlogController {
  @Get("post")
  @Page("post") // → looks for post.page.tsx in src/blog/
  getPost() {}

  @Get("archive")
  @Page("archive") // → looks for archive.page.tsx in src/blog/
  getArchive() {}
}
```

File structure:

```
src/blog/
├── blog.controller.ts
├── post.page.tsx      ← @Page('post') resolves here
└── archive.page.tsx   ← @Page('archive') resolves here
```

**Key Point:** `@PageRoot(__dirname)` makes NIST resolve pages relative to the controller's directory, not from a global `src/pages/` folder.

## Return Data

### Basic Data

```typescript
@Get()
@Page('home')
getHome() {
  return {
    data: {
      message: 'Hello',
      count: 42
    }
  };
}
```

### With Metadata

```typescript
@Get()
@Page('home')
getHome(): PageResponse {
  return {
    data: { message: 'Hello' },
    metadata: {
      title: 'Home - My App',
      description: 'Welcome to my app',
      keywords: 'nist, ssr, react'
    }
  };
}
```

### Using Services

```typescript
@Controller()
@PageRoot(__dirname)
export class BlogController {
  constructor(private blogService: BlogService) {}

  @Get("blog")
  @Page("blog")
  async getBlog(): Promise<PageResponse> {
    const posts = await this.blogService.getPosts();

    return {
      data: { posts },
      metadata: {
        title: `Blog - ${posts.length} posts`,
        description: "Latest blog posts",
      },
    };
  }
}
```

## Routing Patterns

### Root Route

```typescript
@Get()  // → /
@Page('home')
getHome() { }
```

### Named Routes

```typescript
@Get('about')  // → /about
@Page('about')
getAbout() { }
```

### Nested Routes

```typescript
@Controller("blog")
export class BlogController {
  @Get() // → /blog
  @Page("posts")
  getPosts() {}

  @Get("archive") // → /blog/archive
  @Page("archive")
  getArchive() {}
}
```

### Dynamic Parameters

```typescript
@Get('users/:id')  // → /users/123
@Page('profile')
getProfile(@Param('id') id: string): PageResponse {
  return {
    data: { userId: id }
  };
}
```

### Query Parameters

```typescript
@Get('search')  // → /search?q=react
@Page('search')
getSearch(@Query('q') query: string): PageResponse {
  return {
    data: { query, results: [] }
  };
}
```

## Page Components

### Receiving Props

Props come from the `data` object:

```typescript
// Controller
return {
  data: {
    user: { name: "Alice" },
    posts: [],
  },
};
```

```tsx
// Component
interface ProfileProps {
  user: { name: string };
  posts: any[];
}

export default function Profile({ user, posts }: ProfileProps) {
  return (
    <div>
      <h1>{user.name}</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Client-Side Code

```tsx
import { useState } from "react";

export default function Counter({ initialCount }) {
  const [count, setCount] = useState(initialCount);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

### Event Handlers

```tsx
export default function Form() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="name" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Type Safety

### Define Types

```typescript
// types.ts
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface PageResponse<T = any> {
  data: T;
  metadata?: PageMetadata;
}
```

### Use in Controller

```typescript
import type { PageResponse } from 'nist-stack';
import type { User } from './types';

@Get('profile')
@Page('profile')
getProfile(): PageResponse<{ user: User }> {
  return {
    data: {
      user: {
        id: 1,
        name: 'Alice',
        email: 'alice@example.com'
      }
    }
  };
}
```

### Use in Component

```tsx
import type { User } from "./types";

interface ProfileProps {
  user: User;
}

export default function Profile({ user }: ProfileProps) {
  return <h1>{user.name}</h1>;
}
```

## Multiple Pages in One Controller

```typescript
@PageRoot(__dirname)
@Controller()
export class AppController {
  @Get()
  @Page("home")
  getHome(): PageResponse {
    return {
      data: { title: "Home" },
      metadata: { title: "Home" },
    };
  }

  @Get("about")
  @Page("about")
  getAbout(): PageResponse {
    return {
      data: { title: "About" },
      metadata: { title: "About" },
    };
  }

  @Get("contact")
  @Page("contact")
  getContact(): PageResponse {
    return {
      data: { title: "Contact" },
      metadata: { title: "Contact" },
    };
  }
}
```

## Error Handling

### Try-Catch in Controller

```typescript
@Get('user/:id')
@Page('profile')
async getProfile(@Param('id') id: string): Promise<PageResponse> {
  try {
    const user = await this.userService.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      data: { user },
      metadata: { title: `${user.name}'s Profile` }
    };
  } catch (error) {
    throw new NotFoundException('User not found');
  }
}
```

### Error Page

```tsx
// error.page.tsx
export default function Error({ message }) {
  return (
    <div>
      <h1>Oops!</h1>
      <p>{message}</p>
    </div>
  );
}
```

## Best Practices

### 1. Colocate Files

Keep controllers and pages together:

```
src/blog/
├── blog.controller.ts
├── blog.service.ts
├── posts.page.tsx
├── post.page.tsx
└── archive.page.tsx
```

### 2. Use TypeScript

Always type your props and responses:

```typescript
interface HomeProps {
  message: string;
}

export default function Home({ message }: HomeProps) {
  return <h1>{message}</h1>;
}
```

### 3. Separate Business Logic

Don't put logic in page components:

```typescript
// ❌ Bad
export default function Posts() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    fetch('/api/posts').then(r => r.json()).then(setPosts);
  }, []);
  return <div>{/* ... */}</div>;
}

// ✅ Good - fetch in controller
@Get('blog')
@Page('posts')
async getPosts() {
  const posts = await this.blogService.getPosts();
  return { data: { posts } };
}
```

### 4. Name Pages Clearly

Use descriptive names:

```
home.page.tsx
about.page.tsx
contact.page.tsx
posts.page.tsx
profile.page.tsx
```

## Next Steps

- [Layouts](/features/layouts) - Wrap pages with layouts
- [Dynamic Metadata](/features/metadata) - SEO and meta tags
- [Guards](/features/guards) - Protect routes
