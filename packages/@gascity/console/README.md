# @gascity/console

Modern Console UI for managing Gas City resources, built with TanStack Start.

## Features

- 🏙️ City management dashboard
- 🤖 Agent monitoring and control
- 📋 Task tracking and visualization
- 💬 Interactive session management
- 🎨 Modern, responsive UI
- 🚀 Fast development with TanStack Start

## Development

### Prerequisites

- Node.js 18+
- Bun 1.0+

### Setup

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

The console will be available at `http://localhost:3000`

### Build

```bash
# Build for production
bun run build

# Preview production build
bun run preview
```

## Architecture

The console uses TanStack Start's file-based routing:

```
src/routes/
├── __root.tsx          # App shell
├── index.tsx           # Home page
├── cities/             # City management
├── agents/             # Agent management
├── tasks/              # Task management
└── sessions/           # Session management
```

## Routing

TanStack Start uses file-based routing. Every `.tsx` file in `src/routes/` is a route:

| File | URL |
| --- | --- |
| `index.tsx` | `/` |
| `cities/index.tsx` | `/cities` |
| `cities/$id.tsx` | `/cities/:id` |
| `agents/index.tsx` | `/agents` |
| `tasks/index.tsx` | `/tasks` |
| `sessions/index.tsx` | `/sessions` |

## Components

### City Management

```tsx
import { CityList } from '@/components/city/CityList';
import { CityDetail } from '@/components/city/CityDetail';
```

### Agent Management

```tsx
import { AgentList } from '@/components/agent/AgentList';
import { AgentDetail } from '@/components/agent/AgentDetail';
```

### Task Management

```tsx
import { TaskList } from '@/components/task/TaskList';
import { TaskDetail } from '@/components/task/TaskDetail';
```

### Session Management

```tsx
import { SessionList } from '@/components/session/SessionList';
import { SessionChat } from '@/components/session/SessionChat';
```

## API Integration

The console uses the `@gascity/client` and `@gascity/sdk` packages:

```tsx
import { GasCityClient } from '@gascity/client';
import { slingTask } from '@gascity/sdk';

const client = new GasCityClient({
  baseUrl: import.meta.env.VITE_GASCITY_API_URL,
  token: import.meta.env.VITE_GASCITY_API_TOKEN
});
```

## Environment Variables

Create a `.env.local` file:

```bash
VITE_GASCITY_API_URL=https://api.gascity.com
VITE_GASCITY_API_TOKEN=your-api-token
```

## Styling

The console uses Tailwind CSS for styling:

```tsx
<div className="bg-white rounded-lg shadow-md p-6">
  <h2 className="text-xl font-bold text-gray-900">City Management</h2>
</div>
```

## State Management

TanStack Start includes built-in state management:

```tsx
import { useQuery, useMutation } from '@tanstack/react-query';

// Fetch data
const { data, isLoading } = useQuery({
  queryKey: ['cities'],
  queryFn: () => client.listCities()
});

// Mutate data
const mutation = useMutation({
  mutationFn: (data) => client.createCity(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['cities'] });
  }
});
```

## Development Tools

### Dev Container

The project includes a dev container with all necessary tools:

```bash
# Rebuild the dev container
devcontainer up --workspace-folder .

# Access the dev container
devcontainer exec --workspace-folder . bash
```

### PTY Endpoint (Local Development Only)

The console includes a PTY endpoint for local tmux integration:

- **Security**: Disabled in production
- **Input validation**: All inputs are validated
- **Environment isolation**: No sensitive env vars passed to tmux
- **Local only**: Intended for local development use

## Testing

```bash
# Run tests
bun run test

# Run tests in watch mode
bun run test:watch
```

## Linting and Formatting

```bash
# Lint code
bun run lint

# Format code
bun run format
```

## Deployment

### Build for Production

```bash
bun run build
```

The optimized build will be in the `dist/` directory.

### Deploy to Vercel

```bash
vercel deploy
```

### Deploy to Netlify

```bash
netlify deploy --prod
```

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT
