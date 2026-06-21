# gascity.ts

TypeScript SDK and Console for Gas City - AI agent orchestration platform.

## Overview

This project provides a comprehensive TypeScript SDK and Console UI for interacting with Gas City, an AI agent orchestration platform. The monorepo is organized into three main packages:

- **@gascity/client** - Type-safe API client generated from OpenAPI specification
- **@gascity/sdk** - High-level workflows for city, task, session, and agent management
- **@gascity/console** - Console UI for managing Gas City resources

## Features

- 🚀 **Type-safe API client** with full TypeScript support
- 🏙️ **City management** - Create, configure, and manage Gas City instances
- 🤖 **Agent orchestration** - Deploy and manage AI agents
- 📋 **Task management** - Submit and track tasks across agents
- 💬 **Session management** - Interactive sessions with agents
- 🎨 **Modern Console UI** - Built with TanStack Start
- 🔒 **Security-first** - Input validation, environment isolation, production safeguards

## Documentation

- [Full Documentation](https://docs.gascity.com)
- [Interactive Guide](./docs/guide.md) - Hands-on examples with screenshots
- [API Reference](./packages/@gascity/client/README.md)
- [SDK Guide](./packages/@gascity/sdk/README.md)
- [Console Guide](./packages/@gascity/console/README.md)

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/gascity-extra/gascity.ts
cd gascity.ts

# Install dependencies
bun install

# Start development server
bun run dev
```

### Using the SDK

```typescript
import { GasCityClient } from '@gascity/client';
import { slingTask } from '@gascity/sdk';

const client = new GasCityClient({
  baseUrl: 'https://api.gascity.com',
  token: 'your-api-token'
});

// Sling a task to an agent
const result = await slingTask({
  client,
  agent: 'my-agent',
  city: 'my-city',
  task: 'Analyze this data'
});
```

### Development

```bash
bun install          # Install dependencies
bun run dev          # Start development server
bun run build        # Build all packages
bun run test         # Run tests
bun run lint         # Run linters
bun run format       # Format code
bun run screenshots  # Generate documentation screenshots
```

## Project Structure

```
gascity.ts/
├── packages/
│   ├── @gascity/client/     # API client
│   ├── @gascity/sdk/       # SDK workflows
│   └── @gascity/console/   # Console UI
├── configs/                # Shared configurations
├── .github/               # CI/CD workflows
├── .devcontainer/         # Dev container setup
└── .husky/               # Git hooks
```

## Development Container

The project includes a dev container with all necessary tools:

```bash
# Rebuild the dev container
devcontainer up --workspace-folder .

# Access the dev container
devcontainer exec --workspace-folder . bash
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a list of changes in each version.

## License

MIT

## Support

- 📖 [Documentation](https://docs.gascity.com)
- 🐛 [Issues](https://github.com/gascity-extra/gascity.ts/issues)
- 💬 [Discussions](https://github.com/gascity-extra/gascity.ts/discussions)
