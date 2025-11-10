# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial documentation improvements
- Professional README with badges and enhanced structure
- Contributing guidelines (CONTRIBUTING.md)
- Security policy (SECURITY.md)
- Code of Conduct (CODE_OF_CONDUCT.md)

## [1.0.0] - 2025-01-XX

### Added

- ⚡ Core SSR engine with Vite integration
- 🎯 Decorator-based routing with `@Page()`, `@PageRoot()`, and `@CustomLayout()`
- 🔐 Built-in authentication guards and redirect handling
- 📄 Dynamic metadata generation for SEO and OpenGraph
- 🎨 React 19 support with client-side hydration
- 🏗️ Full NestJS integration with dependency injection
- 📡 Server-side data fetching with PageResponse interface
- 🔄 Hot Module Replacement (HMR) for instant development feedback
- 🎭 Layout system with nested layouts support
- 🛡️ Error boundaries and custom error handling
- 🧪 TypeScript support with full type safety
- 📦 Single package distribution (`nist-stack`)
- 🔗 Client-side routing with `Link` component and `useRouter` hook
- 🖼️ Optimized `Image` component
- 🚀 Production build optimization
- 📚 Comprehensive documentation with VitePress
- 🎯 CLI tool for project initialization

### Features

#### Server-Side

- `createViteDevServer()` - Development server creation
- `NistInterceptor` - Main SSR interceptor
- `RedirectExceptionFilter` - Redirect handling
- `PageValidatorService` - Page validation logic
- `createConfig()` - Vite configuration helper
- `bootstrapNist()` - Complete bootstrap function

#### Client-Side

- `createClientEntry()` - Client entry point creator
- `Link` - Client-side navigation component
- `Image` - Optimized image component
- `Router` - Client routing component
- `ErrorBoundary` - Error boundary component
- `useRouter()` - Router hook
- `useParams()` - Route params hook
- `useQuery()` - Query params hook
- `usePathname()` - Current pathname hook
- `useRouteData()` - Route data hook

#### Decorators

- `@Page(name)` - Mark controller method as page
- `@PageRoot(path)` - Set page root directory
- `@CustomLayout(name)` - Apply custom layout
- `@AuthGuard(options)` - Authentication guard

#### Types

- `PageResponse<T>` - Page response interface
- `PageMetadata` - SEO metadata interface
- `LayoutProps` - Layout component props
- `PageProps` - Page component props
- `RouteData` - Route data interface

### Documentation

- Getting Started guide
- Installation guide
- Configuration guide
- Features documentation (pages, layouts, metadata, guards, etc.)
- API reference (decorators and types)
- Advanced topics (deployment, performance, testing)
- Example projects

### Performance

- Sub-20ms SSR response times (cached)
- Instant HMR during development
- Optimized production builds with code splitting
- Parallel data loading support

### Developer Experience

- Zero-config setup with sensible defaults
- Full TypeScript support
- Automatic page validation
- Comprehensive error messages
- Built-in development tools

## [0.9.0-beta] - 2024-12-XX

### Added

- Beta release for testing
- Core functionality implementation
- Basic documentation

### Known Issues

- Performance optimization needed
- Documentation incomplete
- Some edge cases not handled

## Release Notes

### Version 1.0.0 - Stable Release

NIST Stack 1.0.0 is the first stable release, providing a production-ready full-stack framework combining NestJS and Vite for server-side rendered React applications.

**Highlights:**

- Production-ready SSR with enterprise-grade architecture
- Full NestJS integration with all its features (DI, guards, interceptors)
- Lightning-fast development with Vite HMR
- Complete type safety from server to client
- Comprehensive documentation and examples
- CLI tools for easy project setup

**Migration Notes:**
This is the first stable release. If upgrading from beta versions, please review the breaking changes in the beta release notes.

---

## How to Update

### Patch Updates (1.0.x)

```bash
npm update nist-stack
```

### Minor Updates (1.x.0)

```bash
npm install nist-stack@latest
```

### Major Updates (x.0.0)

Review the breaking changes section and migration guide before updating:

```bash
npm install nist-stack@next
```

---

## Support

- 📖 [Documentation](./docs)
- 🐛 [Report Issues](https://github.com/ohanronnie/nist-stack/issues)
- 💬 [Discussions](https://github.com/ohanronnie/nist-stack/discussions)
- 📧 [Email Support](mailto:support@nist-stack.dev)

---

[Unreleased]: https://github.com/ohanronnie/nist-stack/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/ohanronnie/nist-stack/releases/tag/v1.0.0
[0.9.0-beta]: https://github.com/ohanronnie/nist-stack/releases/tag/v0.9.0-beta
