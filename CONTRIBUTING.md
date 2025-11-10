# Contributing to NIST Stack

First off, thank you for considering contributing to NIST Stack! It's people like you that make NIST such a great framework.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Guidelines](#coding-guidelines)
- [Commit Messages](#commit-messages)
- [Documentation](#documentation)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/yourusername/nist-stack/issues) to avoid duplicates.

When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, repository links)
- **Describe the behavior you observed** and what you expected
- **Include screenshots** if applicable
- **Environment details**: OS, Node.js version, package versions

**Bug Report Template:**

```markdown
### Bug Description

A clear description of what the bug is.

### Steps to Reproduce

1. Go to '...'
2. Click on '...'
3. See error

### Expected Behavior

What you expected to happen.

### Actual Behavior

What actually happened.

### Environment

- OS: [e.g., macOS 13.0]
- Node.js: [e.g., 20.10.0]
- NIST Version: [e.g., 1.0.0]
- Package Manager: [npm/yarn/pnpm/bun]

### Additional Context

Any other relevant information.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful**
- **List examples** of how it would be used
- **Specify which version** you're using

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:

- `good first issue` - Good for newcomers
- `help wanted` - Issues that need assistance
- `documentation` - Documentation improvements

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (see [Commit Messages](#commit-messages))
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js 18+ or Bun 1.0+
- Git
- A code editor (VS Code recommended)

### Setup Instructions

1. **Fork and clone the repository**

```bash
git clone https://github.com/ohanronnie/nist-stack.git
cd nist-stack
```

2. **Install dependencies**

```bash
# Using npm
npm install

# Using bun
bun install
```

3. **Build the project**

```bash
npm run build
```

4. **Run tests**

```bash
npm test
```

5. **Link for local development**

```bash
npm link
cd /path/to/your/test-project
npm link nist-stack
```

### Project Structure

```
nist-stack/
├── src/
│   ├── cli/          # CLI commands
│   ├── client/       # Client-side code
│   ├── common/       # Shared decorators and utilities
│   ├── core/         # Core framework functionality
│   └── index.ts      # Main entry point
├── docs/             # Documentation
├── dist/             # Compiled output
└── tests/            # Test files
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm test:cov
```

## Pull Request Process

1. **Update documentation** - If you change APIs, update the docs
2. **Add tests** - Ensure your code is tested
3. **Update CHANGELOG.md** - Add your changes under "Unreleased"
4. **Ensure CI passes** - All checks must pass
5. **Request review** - Tag relevant maintainers
6. **Address feedback** - Make requested changes promptly

### PR Checklist

Before submitting, ensure:

- [ ] Code follows the project's coding style
- [ ] Tests pass locally (`npm test`)
- [ ] New code has appropriate test coverage
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated
- [ ] Commit messages follow conventions
- [ ] No breaking changes (or clearly documented)

## Coding Guidelines

### TypeScript

- Use TypeScript for all code
- Enable strict mode
- Avoid `any` types when possible
- Document complex types with JSDoc comments

```typescript
/**
 * Configuration options for NIST pages
 */
export interface PageConfig {
  /** Enable ISR (Incremental Static Regeneration) */
  revalidate?: number;
  /** Cache strategy for the page */
  cache?: "public" | "private" | "no-cache";
}
```

### Code Style

We use ESLint and Prettier. Run before committing:

```bash
# Format code
npm run format

# Lint code
npm run lint
```

**Key conventions:**

- Use 2 spaces for indentation
- Use single quotes for strings
- Use semicolons
- Use camelCase for variables and functions
- Use PascalCase for classes and types
- Use UPPER_SNAKE_CASE for constants

### React Components

```typescript
// Good
export default function HomePage({ title, items }: HomePageProps) {
  return (
    <div>
      <h1>{title}</h1>
      {items.map((item) => (
        <Item key={item.id} {...item} />
      ))}
    </div>
  );
}

// Avoid
export default function HomePage(props: any) {
  return <div>{props.title}</div>;
}
```

### Testing

- Write unit tests for utilities and services
- Write integration tests for core functionality
- Use descriptive test names

```typescript
describe("PageValidator", () => {
  it("should validate page file exists", async () => {
    // Arrange
    const validator = new PageValidator();

    // Act
    const result = await validator.validate("home");

    // Assert
    expect(result.isValid).toBe(true);
  });
});
```

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Examples

```bash
feat(client): add useRouter hook for navigation

Implements a new useRouter hook that provides access to
the current route state and navigation functions.

Closes #123
```

```bash
fix(ssr): resolve hydration mismatch on initial load

Fixed an issue where server and client rendered different
HTML due to Date.now() being called during render.

Fixes #456
```

### Scope

Common scopes:

- `client` - Client-side code
- `server` - Server-side code
- `core` - Core functionality
- `cli` - CLI commands
- `docs` - Documentation
- `types` - TypeScript types

## Documentation

### When to Update Docs

Update documentation when you:

- Add new features
- Change APIs
- Add configuration options
- Fix bugs that affect documented behavior

### Documentation Style

- Use clear, concise language
- Include code examples
- Use proper markdown formatting
- Add links to related documentation
- Keep examples up-to-date

### Running Docs Locally

```bash
npm run docs:dev
```

Visit `http://localhost:5173` to see your changes.

## Questions?

Don't hesitate to ask questions:

- Open a [GitHub Discussion](https://github.com/ohanronnie/nist-stack/discussions)
- Join our [Discord server](https://discord.gg/nist-stack)
- Email us at [support@nist-stack.dev](mailto:support@nist-stack.dev)

## Recognition

Contributors are recognized in:

- The project README
- Release notes
- Our [Contributors page](https://github.com/ohanronnie/nist-stack/graphs/contributors)

Thank you for contributing! 🎉
