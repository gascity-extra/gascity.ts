# Contributing to gascity.ts

Thank you for your interest in contributing to gascity.ts! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Style Guide](#style-guide)

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- Node.js 24+
- Bun 1.3.14+
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/gascity.ts
   cd gascity.ts
   ```
3. Install dependencies:
   ```bash
   bun install
   ```
4. Create a branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Making Changes

1. Make your changes in the appropriate package
2. Follow the code style guidelines (see [Style Guide](#style-guide))
3. Write tests for new functionality
4. Ensure all tests pass:
   ```bash
   bun run test
   ```
5. Run linters and fix any issues:
   ```bash
   bun run lint
   bun run format
   ```

### Package Structure

- `@gascity/client` - API client changes
- `@gascity/sdk` - SDK workflow changes
- `@gascity/console` - Console UI changes

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages. The commit-msg hook enforces this format.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Test changes
- `chore` - Build process or auxiliary tool changes
- `ci` - CI/CD changes
- `perf` - Performance improvements
- `build` - Build system changes

### Examples

```
feat(client): add support for streaming responses

Implement streaming response handling for long-running operations
to improve user experience with large datasets.

Closes #123
```

```
fix(sdk): handle connection timeout errors

Add proper error handling for connection timeouts to prevent
unhandled promise rejections.

Fixes #456
```

## Pull Request Process

1. Update the documentation if needed
2. Ensure all tests pass
3. Update the CHANGELOG.md if applicable
4. Submit a pull request with:
   - Clear title and description
   - Reference related issues
   - Screenshots for UI changes (if applicable)

### PR Review Process

- All PRs must pass CI checks
- At least one approval is required
- Address all review comments
- Ensure the PR is up-to-date with main branch

## Testing

### Running Tests

```bash
# Run all tests
bun run test

# Run tests for a specific package
cd packages/@gascity/client && bun run test
cd packages/@gascity/sdk && bun run test
cd packages/@gascity/console && bun run test
```

### Writing Tests

- Write unit tests for new functionality
- Aim for high test coverage
- Use descriptive test names
- Mock external dependencies appropriately

## Style Guide

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Prefer explicit types over implicit types
- Use interfaces for object shapes
- Use type aliases for union types

### Code Formatting

We use Biome for formatting and linting:

```bash
bun run format   # Format code
bun run lint     # Lint code
```

### Naming Conventions

- **Files**: kebab-case (`my-component.ts`)
- **Variables/Functions**: camelCase (`myVariable`)
- **Classes/Interfaces**: PascalCase (`MyClass`)
- **Constants**: UPPER_SNAKE_CASE (`MY_CONSTANT`)
- **Private members**: underscore prefix (`_privateMethod`)

### Best Practices

- Keep functions small and focused
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Avoid premature optimization
- Write self-documenting code

## Security

- Never commit secrets or API keys
- Report security vulnerabilities privately
- Follow security best practices
- Use environment variables for sensitive data

## Getting Help

- 📖 [Documentation](https://docs.gascity.com)
- 🐛 [Issues](https://github.com/gascity-extra/gascity.ts/issues)
- 💬 [Discussions](https://github.com/gascity-extra/gascity.ts/discussions)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
