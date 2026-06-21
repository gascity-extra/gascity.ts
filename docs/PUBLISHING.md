# Publishing to npm

This guide explains how to publish the gascity.ts packages to npm.

## Prerequisites

1. **npm account**: You need an npm account with permission to publish to the `@gascity` scope
2. **npm token**: Create an automation token from npmjs.com
3. **Environment variable**: Set your npm token as an environment variable

## Setup

### 1. Create npm token

1. Go to [npmjs.com](https://www.npmjs.com/)
2. Log in to your account
3. Go to Access Tokens → Create New Token
4. Select "Automation" token type
5. Copy the token

### 2. Set environment variable

```bash
# Linux/Mac
export NPM_TOKEN=your_npm_token_here

# Windows (PowerShell)
$env:NPM_TOKEN="your_npm_token_here"

# Windows (Command Prompt)
set NPM_TOKEN=your_npm_token_here
```

### 3. Verify npm authentication

```bash
npm whoami
```

## Package Information

### Published Packages

- **@gascity/client** - Type-safe API client
- **@gascity/sdk** - High-level SDK workflows

### Not Published

- **@gascity/console** - Console UI (marked as private, not intended for npm)

## Publishing Process

### Option 1: Using the publish script

```bash
# Set your npm token
export NPM_TOKEN=your_npm_token

# Publish all packages
bun run publish
```

### Option 2: Manual publishing

```bash
# Build packages
bun run build

# Publish client package
cd packages/@gascity/client
npm publish --access public

# Publish SDK package
cd packages/@gascity/sdk
npm publish --access public
```

### Dry Run

Test the publishing process without actually publishing:

```bash
bun run publish:dry
```

## Version Management

### Update version

```bash
# Update version in package.json files
# Update version in root package.json

# Commit changes
git add .
git commit -m "chore: bump version to 1.0.1"

# Create git tag
git tag v1.0.1

# Push to GitHub
git push origin main
git push origin v1.0.1

# Publish to npm
bun run publish
```

### Semantic Versioning

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes (2.0.0)
- **MINOR**: New features, backward compatible (1.1.0)
- **PATCH**: Bug fixes, backward compatible (1.0.1)

## Pre-release Publishing

For alpha, beta, or rc versions:

```bash
# Update version to pre-release
npm version 1.0.1-beta.0

# Publish with tag
npm publish --tag beta
```

## Troubleshooting

### Package name already exists

```bash
# Check if package name is available
npm view @gascity/client

# If it exists, you may need to unpublish first (if you own it)
npm unpublish @gascity/client --force
```

### Authentication errors

```bash
# Clear npm cache
npm cache clean --force

# Re-authenticate
npm login

# Or use token directly
npm config set //registry.npmjs.org/:_authToken YOUR_TOKEN
```

### Workspace dependencies

The SDK package depends on the client package using workspace protocol. When publishing:

1. The workspace dependency `@gascity/client: workspace:*` in SDK package.json needs to be replaced with the actual version
2. This is handled automatically by npm when using workspaces

### Build artifacts missing

```bash
# Ensure packages are built before publishing
bun run build

# Verify dist directories exist
ls packages/@gascity/client/dist
ls packages/@gascity/sdk/dist
```

## Post-Publishing Checklist

- [ ] Verify packages are published: `npm view @gascity/client`
- [ ] Verify version is correct
- [ ] Test installation: `npm install @gascity/client`
- [ ] Update documentation if needed
- [ ] Create GitHub release if this is a new version
- [ ] Announce the release

## Automated Publishing

For CI/CD automation:

```yaml
# .github/workflows/publish.yml
name: Publish to npm

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - run: bun install
      - run: bun run build
      
      - name: Publish client
        run: cd packages/@gascity/client && npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      - name: Publish SDK
        run: cd packages/@gascity/sdk && npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Security Considerations

- Never commit npm tokens to the repository
- Use automation tokens, not personal tokens
- Rotate tokens regularly
- Use `.npmignore` to exclude sensitive files
- Review package contents before publishing

## .npmignore

Each package should have a `.npmignore` file to exclude development files:

```
# Example .npmignore for @gascity/client
src/
tests/
*.spec.ts
*.test.ts
tsconfig.json
vitest.config.ts
playwright.config.ts
```

## Support

If you encounter issues:

1. Check npm status: https://status.npmjs.org/
2. Review npm documentation: https://docs.npmjs.com/
3. Open an issue: https://github.com/gascity-extra/gascity.ts/issues
