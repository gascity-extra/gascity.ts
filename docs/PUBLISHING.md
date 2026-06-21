# Publishing to npm

This project uses **Nx Release** for automated versioning and publishing based on conventional commits.

## Overview

- **Automated Versioning**: Versions are determined automatically based on conventional commits
- **Independent Releases**: Each package (@gascity/client, @gascity/sdk) is versioned independently
- **CI/CD Integration**: Releases are triggered automatically on push to main branch
- **GitHub Trust**: Uses npm trust for GitHub Actions (no tokens in CI)

## How It Works

### Conventional Commits

Versions are determined by commit messages:

- `feat:` - Minor version bump (1.0.0 → 1.1.0)
- `fix:` - Patch version bump (1.0.0 → 1.0.1)
- `feat!:` or `BREAKING CHANGE:` - Major version bump (1.0.0 → 2.0.0)

### Release Process

1. **Push to main**: Any push to main triggers the release workflow
2. **Version Detection**: Nx analyzes commits since last release
3. **Version Bump**: Automatically bumps versions for affected packages
4. **Changelog**: Generates changelog entries
5. **Git Tag**: Creates git tags for new versions
6. **Publish**: Publishes to npm using GitHub Actions trust

### Independent Releases

Each package is versioned independently:

- Changes to `@gascity/client` only bump client version
- Changes to `@gascity/sdk` bump SDK version (and client if dependency changes)
- Console package is private and not published

## Local Development

### Preview Release Changes

```bash
# Preview what would be released
bun run release:dry

# Preview version changes
bun run release:version --dry-run

# Preview changelog
bun run release:changelog --dry-run
```

### Manual Release (for testing)

```bash
# Create a version
bun run release:version patch

# Generate changelog
bun run release:changelog

# Publish (requires npm auth)
bun run release:publish
```

## CI/CD Workflow

The `.github/workflows/release.yml` workflow:

1. Runs on every push to `main`
2. Builds all packages
3. Runs `nx release` which:
   - Analyzes commits
   - Bumps versions
   - Generates changelogs
   - Creates git commits and tags
   - Publishes to npm

## Setup Requirements

### npm Trust (Already Configured)

GitHub Actions trust is already configured for:
- `@gascity/client`
- `@gascity/sdk`

No npm tokens needed in GitHub Secrets!

### GitHub Token

The workflow uses `GITHUB_TOKEN` automatically provided by GitHub Actions.

## Configuration

### nx.json

```json
{
  "release": {
    "projects": ["@gascity/client", "@gascity/sdk"],
    "projectsRelationship": "independent",
    "version": {
      "conventionalCommits": true
    },
    "changelog": {
      "workspaceChangelog": true,
      "createRelease": "github",
      "gitTagPattern": "{version}",
      "gitRemote": "origin"
    },
    "git": {
      "commit": true,
      "tag": true
    },
    "npm": {
      "publish": true
    }
  }
}
```

## Example Workflow

### Feature Release

```bash
# Make changes
git add .
git commit -m "feat(client): add streaming support"

# Push to main
git push origin main

# CI automatically:
# 1. Bumps @gascity/client to 1.1.0
# 2. Generates changelog
# 3. Creates git tag @gascity/client@1.1.0
# 4. Publishes to npm
```

### Bug Fix Release

```bash
# Fix bug
git add .
git commit -m "fix(sdk): handle connection timeout"

# Push to main
git push origin main

# CI automatically:
# 1. Bumps @gascity/sdk to 1.0.1
# 2. Generates changelog
# 3. Creates git tag @gascity/sdk@1.0.1
# 4. Publishes to npm
```

## Troubleshooting

### Release Not Triggered

Check that:
- Commit follows conventional commits format
- Push is to `main` branch
- Workflow is enabled in repository

### Version Not Bumped

Check that:
- Commit message includes `feat:`, `fix:`, or `BREAKING CHANGE:`
- Changes are in published packages (client/sdk)

## Support

- [Nx Release Documentation](https://nx.dev/docs/guides/nx-release)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Issues](https://github.com/gascity-extra/gascity.ts/issues)
