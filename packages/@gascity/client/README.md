# @gascity/client

Type-safe API client for Gas City, generated from the official OpenAPI specification.

## Installation

```bash
bun add @gascity/client
```

## Usage

### Initialize Client

```typescript
import { GasCityClient } from '@gascity/client';

const client = new GasCityClient({
  baseUrl: 'https://api.gascity.com',
  token: 'your-api-token'
});
```

### API Methods

The client provides type-safe methods for all Gas City API endpoints:

```typescript
// City management
const city = await client.getCity({ cityName: 'my-city' });
const createdCity = await client.createCity({
  cityName: 'new-city',
  cityConfig: { /* config */ }
});

// Agent management
const agents = await client.listAgents();
const agent = await client.getAgent({ agentName: 'my-agent' });

// Task management
const bead = await client.beadCreate({
  cityName: 'my-city',
  agentName: 'my-agent',
  task: 'Analyze this data'
});

// Session management
const session = await client.createSession({
  cityName: 'my-city',
  agentName: 'my-agent'
});
```

### Error Handling

The client provides detailed error information:

```typescript
try {
  const result = await client.someMethod();
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error: ${error.message}`);
    console.error(`Status: ${error.status}`);
    console.error(`Body:`, error.body);
  }
}
```

## Configuration

### Client Options

```typescript
interface GasCityClientConfig {
  baseUrl: string;        // API base URL
  token?: string;         // Authentication token
  timeout?: number;       // Request timeout in milliseconds
  headers?: Record<string, string>; // Additional headers
}
```

### Environment Variables

You can also configure the client using environment variables:

```bash
export GASCITY_BASE_URL=https://api.gascity.com
export GASCITY_TOKEN=your-api-token
```

## Generated Types

The client includes full TypeScript types for all API requests and responses:

```typescript
import type {
  CityCreateRequest,
  AgentResponse,
  Bead,
  SessionResponse,
  // ... more types
} from '@gascity/client';
```

## Advanced Usage

### Custom Request Options

```typescript
const result = await client.someMethod({
  // ... method parameters
}, {
  timeout: 5000,
  headers: {
    'X-Custom-Header': 'value'
  }
});
```

### Retry Logic

For custom retry logic, wrap the client methods:

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

const result = await withRetry(() => client.someMethod());
```

## License

MIT
