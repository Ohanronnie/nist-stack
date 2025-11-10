# Data Fetching

NIST provides powerful patterns for fetching and managing data in server-side rendered applications. All data fetching happens on the server before rendering, ensuring optimal SEO and performance.

## Overview

In NIST, data fetching follows these principles:

1. **Server-side only** - Data is fetched in controllers before rendering
2. **Type-safe** - Full TypeScript inference from controller to component
3. **Dependency injection** - Leverage NestJS services and providers
4. **Async-first** - Built-in support for promises and async/await

## Basic Data Fetching

### Controller-Based Data Loading

The primary pattern for data fetching in NIST is through controller methods:

```typescript
import { Controller, Get } from "@nestjs/common";
import { Page, PageRoot } from "nist-stack";
import type { PageResponse } from "nist-stack";

@PageRoot(__dirname)
@Controller()
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get("posts")
  @Page("posts")
  async getPosts(): Promise<PageResponse<{ posts: Post[] }>> {
    const posts = await this.blogService.findAll();

    return {
      data: { posts },
      metadata: {
        title: "Blog Posts",
        description: "Read our latest articles",
      },
    };
  }
}
```

### Type-Safe Props

The component receives fully typed props:

```tsx
interface PostsPageProps {
  posts: Post[];
}

export default function PostsPage({ posts }: PostsPageProps) {
  return (
    <div>
      <h1>Blog Posts</h1>
      {posts.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </div>
  );
}
```

## Data Fetching Patterns

### 1. Simple Queries

For straightforward data fetching:

```typescript
@Get()
@Page('home')
async getHome(): Promise<PageResponse> {
  const users = await this.userService.findAll();

  return {
    data: { users },
    metadata: { title: 'Home' },
  };
}
```

### 2. Dynamic Routes

Fetch data based on route parameters:

```typescript
@Get('post/:slug')
@Page('post')
async getPost(@Param('slug') slug: string): Promise<PageResponse> {
  const post = await this.blogService.findBySlug(slug);

  if (!post) {
    throw new NotFoundException(`Post "${slug}" not found`);
  }

  return {
    data: { post },
    metadata: {
      title: post.title,
      description: post.excerpt,
      openGraph: {
        title: post.title,
        description: post.excerpt,
        image: post.coverImage,
        type: 'article',
      },
    },
  };
}
```

### 3. Parallel Data Fetching

Fetch multiple data sources simultaneously:

```typescript
@Get('dashboard')
@Page('dashboard')
async getDashboard(): Promise<PageResponse> {
  const [user, stats, notifications] = await Promise.all([
    this.userService.getCurrentUser(),
    this.analyticsService.getStats(),
    this.notificationService.getRecent(),
  ]);

  return {
    data: { user, stats, notifications },
    metadata: { title: 'Dashboard' },
  };
}
```

### 4. Conditional Data Loading

Load data based on conditions:

```typescript
@Get('profile/:username')
@Page('profile')
async getProfile(
  @Param('username') username: string,
  @Req() req: Request,
): Promise<PageResponse> {
  const profile = await this.userService.findByUsername(username);

  if (!profile) {
    throw new NotFoundException('User not found');
  }

  // Load additional data if viewing own profile
  const isOwnProfile = req.session?.user?.username === username;
  const privateData = isOwnProfile
    ? await this.userService.getPrivateData(username)
    : null;

  return {
    data: { profile, privateData, isOwnProfile },
    metadata: {
      title: `${profile.name} - Profile`,
      description: profile.bio,
    },
  };
}
```

### 5. Query Parameters

Handle search and filtering:

```typescript
@Get('search')
@Page('search')
async search(
  @Query('q') query: string,
  @Query('category') category?: string,
  @Query('page') page: string = '1',
): Promise<PageResponse> {
  const pageNum = parseInt(page, 10);

  const results = await this.searchService.search({
    query,
    category,
    page: pageNum,
    limit: 20,
  });

  return {
    data: {
      results: results.items,
      totalPages: results.totalPages,
      currentPage: pageNum,
      query,
      category,
    },
    metadata: {
      title: `Search: ${query}`,
      robots: 'noindex', // Don't index search results
    },
  };
}
```

### 6. Pagination

Implement efficient pagination:

```typescript
@Get('posts')
@Page('posts')
async getPosts(
  @Query('page') page: string = '1',
  @Query('limit') limit: string = '10',
): Promise<PageResponse> {
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  const [posts, total] = await Promise.all([
    this.blogService.findPaginated(pageNum, limitNum),
    this.blogService.count(),
  ]);

  const totalPages = Math.ceil(total / limitNum);

  return {
    data: {
      posts,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    },
    metadata: {
      title: `Blog - Page ${pageNum}`,
      canonical: pageNum === 1 ? '/posts' : undefined,
    },
  };
}
```

## Organizing Data Logic

Keep controllers thin by extracting data logic into services:

```typescript
@Controller()
@PageRoot(__dirname)
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get("post/:slug")
  @Page("post")
  async getPost(@Param("slug") slug: string): Promise<PageResponse> {
    const post = await this.blogService.findBySlug(slug);

    if (!post) {
      throw new NotFoundException();
    }

    return {
      data: { post },
      metadata: {
        title: post.title,
        description: post.excerpt,
      },
    };
  }
}
```

## External API Calls

### Using HTTP Service

Make requests to external APIs:

```typescript
import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

@Injectable()
export class WeatherService {
  constructor(private readonly httpService: HttpService) {}

  async getWeather(city: string): Promise<Weather> {
    const response = await firstValueFrom(
      this.httpService.get(`https://api.weather.com/v1/current`, {
        params: { city, apiKey: process.env.WEATHER_API_KEY },
      })
    );

    return response.data;
  }
}
```

### Registering HttpModule

```typescript
import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { WeatherService } from "./weather.service";

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [WeatherService],
  exports: [WeatherService],
})
export class WeatherModule {}
```

## Error Handling

### Handling Failed Requests

```typescript
@Get('post/:id')
@Page('post')
async getPost(@Param('id') id: string): Promise<PageResponse> {
  try {
    const post = await this.blogService.findById(id);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return {
      data: { post },
      metadata: { title: post.title },
    };
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }

    this.logger.error(`Failed to fetch post ${id}:`, error);
    throw new InternalServerErrorException('Failed to load post');
  }
}
```

### Graceful Degradation

```typescript
@Get('dashboard')
@Page('dashboard')
async getDashboard(): Promise<PageResponse> {
  const [user, stats, notifications] = await Promise.allSettled([
    this.userService.getCurrentUser(),
    this.analyticsService.getStats(),
    this.notificationService.getRecent(),
  ]);

  return {
    data: {
      user: user.status === 'fulfilled' ? user.value : null,
      stats: stats.status === 'fulfilled' ? stats.value : null,
      notifications: notifications.status === 'fulfilled' ? notifications.value : [],
    },
    metadata: { title: 'Dashboard' },
  };
}
```

## Caching Strategies

### Response Caching

Configure caching headers for pages:

```typescript
// pages/home.page.tsx
export const config = {
  revalidate: 60, // Cache for 60 seconds
};

export default function Home({ posts }) {
  return <div>{/* ... */}</div>;
}
```

### Service-Level Caching

Implement caching at the service layer:

```typescript
import { Injectable } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject } from "@nestjs/common";
import { Cache } from "cache-manager";

@Injectable()
export class BlogService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(Post) private postRepo: Repository<Post>
  ) {}

  async findAll(): Promise<Post[]> {
    const cacheKey = "posts:all";
    const cached = await this.cacheManager.get<Post[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const posts = await this.postRepo.find();
    await this.cacheManager.set(cacheKey, posts, 300); // 5 minutes

    return posts;
  }
}
```

## Database Integration

### TypeORM

```typescript
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Post } from "./entities/post.entity";
import { BlogService } from "./blog.service";

@Module({
  imports: [TypeOrmModule.forFeature([Post])],
  providers: [BlogService],
  exports: [BlogService],
})
export class BlogModule {}
```

### Prisma

```typescript
import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.post.findMany({
      include: { author: true, tags: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.post.findUnique({
      where: { slug },
      include: { author: true, tags: true },
    });
  }
}
```

## Best Practices

### 1. Keep Controllers Thin

```typescript
// Bad - Business logic in controller
@Get()
async getHome() {
  const users = await this.db.query('SELECT * FROM users');
  const processedUsers = users.filter(u => u.active).map(u => ({
    ...u,
    displayName: `${u.firstName} ${u.lastName}`,
  }));
  return { data: { users: processedUsers }, metadata: {} };
}

// Good - Logic in service
@Get()
async getHome() {
  const users = await this.userService.getActiveUsers();
  return { data: { users }, metadata: {} };
}
```

### 2. Use TypeScript Generics

```typescript
interface PageResponse<T = any> {
  data: T;
  metadata?: PageMetadata;
}

@Get()
getHome(): Promise<PageResponse<{ users: User[] }>> {
  // Full type inference
}
```

### 3. Handle Loading States

```typescript
// Component receives data directly, no loading states needed
export default function Posts({ posts }: { posts: Post[] }) {
  // Posts are guaranteed to be loaded
  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

### 4. Validate Input

```typescript
import { IsString, IsOptional, Min, Max } from 'class-validator';

export class SearchDto {
  @IsString()
  q: string;

  @IsOptional()
  @Min(1)
  @Max(100)
  page?: number;
}

@Get('search')
async search(@Query() dto: SearchDto): Promise<PageResponse> {
  const results = await this.searchService.search(dto);
  return { data: { results }, metadata: {} };
}
```

### 5. Use Transactions

```typescript
async createPost(data: CreatePostDto): Promise<Post> {
  return this.dataSource.transaction(async (manager) => {
    const post = await manager.save(Post, data);
    await manager.save(PostHistory, { postId: post.id, action: 'created' });
    return post;
  });
}
```

## See Also

- [Pages](/features/pages) - Page component structure
- [Metadata](/features/metadata) - Dynamic metadata
- [Error Handling](/features/error-handling) - Error handling patterns
- [NestJS Providers](https://docs.nestjs.com/providers) - Service injection
