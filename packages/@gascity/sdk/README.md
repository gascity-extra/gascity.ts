# @gascity/sdk

High-level SDK for Gas City, providing convenient workflows for city, task, session, and agent management.

## Installation

```bash
bun add @gascity/sdk @gascity/client
```

## Usage

### Initialize SDK

```typescript
import { GasCityClient } from '@gascity/client';
import { initCity } from '@gascity/sdk';

const client = new GasCityClient({
  baseUrl: 'https://api.gascity.com',
  token: 'your-api-token'
});
```

## Workflows

### City Management

```typescript
import { initCity, startCity, stopCity, getCityStatus } from '@gascity/sdk';

// Initialize a city
const city = await initCity({
  client,
  cityName: 'my-city',
  config: {
    /* city configuration */
  }
});

// Start a city
await startCity({
  client,
  cityName: 'my-city'
});

// Get city status
const status = await getCityStatus({
  client,
  cityName: 'my-city'
});
```

### Task Management

```typescript
import { slingTask, getTaskStatus, waitForTaskCompletion } from '@gascity/sdk';

// Submit a task to an agent
const bead = await slingTask({
  client,
  agent: 'my-agent',
  city: 'my-city',
  task: 'Analyze this data',
  metadata: {
    /* optional metadata */
  }
});

// Get task status
const status = await getTaskStatus({
  client,
  city: 'my-city',
  beadId: bead.beadId
});

// Wait for task completion
const result = await waitForTaskCompletion({
  client,
  city: 'my-city',
  beadId: bead.beadId,
  timeout: 300000 // 5 minutes
});
```

### Session Management

```typescript
import { createSession, interactSession, getSessionTranscript } from '@gascity/sdk';

// Create an interactive session
const session = await createSession({
  client,
  city: 'my-city',
  agent: 'my-agent'
});

// Interact with the session
const response = await interactSession({
  client,
  city: 'my-city',
  agent: 'my-agent',
  sessionId: session.sessionId,
  message: 'Hello, agent!'
});

// Get session transcript
const transcript = await getSessionTranscript({
  client,
  city: 'my-city',
  agent: 'my-agent',
  sessionId: session.sessionId
});
```

### Agent Management

```typescript
import { listAgents, getAgent, createAgent, updateAgent } from '@gascity/sdk';

// List all agents
const agents = await listAgents({
  client,
  city: 'my-city'
});

// Get specific agent
const agent = await getAgent({
  client,
  city: 'my-city',
  agentName: 'my-agent'
});

// Create a new agent
const created = await createAgent({
  client,
  city: 'my-city',
  agentConfig: {
    /* agent configuration */
  }
});
```

## Event Streaming

```typescript
import { streamEvents } from '@gascity/sdk';

// Stream events from a city
const eventStream = await streamEvents({
  client,
  city: 'my-city'
});

for await (const event of eventStream) {
  console.log('Event:', event);
  // Handle events
}
```

## Error Handling

The SDK provides detailed error information:

```typescript
import { GasCityError, isGasCityError } from '@gascity/sdk';

try {
  const result = await slingTask({ /* ... */ });
} catch (error) {
  if (isGasCityError(error)) {
    console.error(`Gas City Error: ${error.message}`);
    console.error(`Code: ${error.code}`);
    console.error(`Details:`, error.details);
  }
}
```

## Configuration

### Workflow Options

Most workflows accept optional configuration:

```typescript
await slingTask({
  client,
  agent: 'my-agent',
  city: 'my-city',
  task: 'Analyze this data'
}, {
  timeout: 300000,      // 5 minute timeout
  retries: 3,           // Retry on failure
  retryDelay: 1000      // Delay between retries
});
```

## Utilities

### Correlation IDs

Generate unique correlation IDs for tracking:

```typescript
import { generateCorrelationId } from '@gascity/sdk';

const correlationId = generateCorrelationId();
console.log(`Tracking task with ID: ${correlationId}`);
```

### Retry Logic

Built-in retry logic for transient failures:

```typescript
import { withRetry } from '@gascity/sdk';

const result = await withRetry(
  async () => client.someMethod(),
  { maxRetries: 3, delay: 1000 }
);
```

## Type Safety

The SDK is fully typed with TypeScript:

```typescript
import type {
  CityConfig,
  TaskConfig,
  SessionConfig,
  AgentConfig
} from '@gascity/sdk';
```

## Best Practices

1. **Always handle errors**: Use try/catch blocks and check for GasCityError
2. **Use timeouts**: Set reasonable timeouts for long-running operations
3. **Clean up resources**: Close sessions and streams when done
4. **Use correlation IDs**: Track operations with correlation IDs
5. **Validate inputs**: Validate configuration before passing to workflows

## License

MIT
