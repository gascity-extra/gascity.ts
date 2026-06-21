import { EventEmitter } from 'eventemitter3';
import { DefaultService } from '@gascity/client';

/**
 * Options for configuring event subscriptions
 */
export interface EventOptions {
  /** City name to subscribe to events from */
  city?: string;
  /** Whether to connect to supervisor event stream */
  supervisor?: boolean;
}

/**
 * Subscription configuration for event filtering
 */
export interface EventSubscription {
  /** Specific event type to subscribe to (default: 'all') */
  eventType?: string;
  /** Filter function to determine which events to process */
  filter?: (event: any) => boolean;
  /** Correlation ID to group related events */
  correlationId?: string;
}

/**
 * Correlation metadata for tracking related events
 */
export interface EventCorrelation {
  /** Unique correlation identifier */
  id: string;
  /** Timestamp when correlation was created */
  createdAt: Date;
  /** Associated event types */
  eventTypes: Set<string>;
  /** Custom metadata */
  metadata?: Record<string, any>;
}

/**
 * Event-driven workflows for Gas City
 * Provides real-time event streaming and subscription management
 */
export class GasCityEventManager extends EventEmitter {
  private eventSource?: EventSource;
  private subscriptions: Map<string, EventSubscription> = new Map();
  private correlations: Map<string, EventCorrelation> = new Map();
  
  /**
   * Subscribe to events from Gas City
   * 
   * @param options - Subscription options including city, supervisor mode, and filters
   * @param callback - Optional callback function to handle events
   * @returns Promise that resolves when subscription is established
   * 
   * @example
   * ```typescript
   * const manager = new GasCityEventManager();
   * await manager.subscribe({ city: 'my-city', eventType: 'task.completed' }, (event) => {
   *   console.log('Task completed:', event);
   * });
   * ```
   */
  async subscribe(options: EventOptions & EventSubscription = {}, callback?: (event: any) => void): Promise<void> {
    const eventType = options.eventType || 'all';
    const subscriptionId = `${eventType}-${Date.now()}`;
    
    // Create correlation if provided
    if (options.correlationId) {
      this.createCorrelation(options.correlationId, eventType);
    }
    
    this.subscriptions.set(subscriptionId, {
      eventType,
      filter: options.filter,
      correlationId: options.correlationId,
    });
    
    if (callback) {
      this.on(eventType, callback);
    }
    
    // Connect to event stream
    if (!this.eventSource) {
      const url = options.supervisor 
        ? 'http://127.0.0.1:8372/v0/events/stream'
        : `http://127.0.0.1:8372/v0/city/${options.city || 'default'}/events/stream`;
      
      this.eventSource = new EventSource(url);
      
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Apply filter if provided
          if (options.filter && !options.filter(data)) {
            return;
          }
          
          // Add correlation metadata if applicable
          if (options.correlationId) {
            const correlation = this.correlations.get(options.correlationId);
            if (correlation) {
              correlation.eventTypes.add(data.type || 'unknown');
              data.correlation = {
                id: correlation.id,
                metadata: correlation.metadata,
              };
            }
          }
          
          // Emit event
          if (eventType === 'all') {
            this.emit(data.type, data);
            this.emit('all', data);
          } else if (data.type === eventType) {
            this.emit(eventType, data);
          }
        } catch (error) {
          console.error('Failed to parse event:', error);
          this.emit('parse-error', error);
        }
      };
      
      this.eventSource.onerror = (error) => {
        console.error('Event stream error:', error);
        this.emit('error', error);
      };
    }
  }
  
  /**
   * Unsubscribe from events by subscription ID
   * 
   * @param subscriptionId - The subscription ID to unsubscribe
   * 
   * @example
   * ```typescript
   * const manager = new GasCityEventManager();
   * const subId = await manager.subscribe({ eventType: 'task.completed' });
   * manager.unsubscribe(subId);
   * ```
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      this.off(subscription.eventType || 'all');
      this.subscriptions.delete(subscriptionId);
      
      // Clean up correlation if no more subscriptions use it
      if (subscription.correlationId) {
        this.cleanupCorrelation(subscription.correlationId);
      }
    }
  }
  
  /**
   * Unsubscribe from all event subscriptions
   * 
   * @example
   * ```typescript
   * const manager = new GasCityEventManager();
   * await manager.subscribe({ eventType: 'task.completed' });
   * await manager.subscribe({ eventType: 'agent.created' });
   * manager.unsubscribeAll();
   * ```
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((_, id) => {
      this.unsubscribe(id);
    });
  }
  
  /**
   * Close the event stream and clean up all subscriptions
   * 
   * @example
   * ```typescript
   * const manager = new GasCityEventManager();
   * await manager.subscribe({ city: 'my-city' });
   * // ... use the manager
   * manager.close();
   * ```
   */
  close(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
    this.unsubscribeAll();
    this.correlations.clear();
  }
  
  /**
   * Create a correlation context for grouping related events
   * 
   * @param correlationId - Unique identifier for the correlation
   * @param eventType - Initial event type for the correlation
   * @param metadata - Optional metadata to attach to the correlation
   * @returns The correlation object
   * 
   * @example
   * ```typescript
   * const manager = new GasCityEventManager();
   * const correlation = manager.createCorrelation('workflow-123', 'task.started', {
   *   userId: 'user-456',
   *   workflowName: 'data-processing'
   * });
   * ```
   */
  createCorrelation(correlationId: string, eventType: string, metadata?: Record<string, any>): EventCorrelation {
    const correlation: EventCorrelation = {
      id: correlationId,
      createdAt: new Date(),
      eventTypes: new Set([eventType]),
      metadata,
    };
    
    this.correlations.set(correlationId, correlation);
    return correlation;
  }
  
  /**
   * Get a correlation by its ID
   * 
   * @param correlationId - The correlation ID to retrieve
   * @returns The correlation object or undefined if not found
   * 
   * @example
   * ```typescript
   * const manager = new GasCityEventManager();
   * const correlation = manager.getCorrelation('workflow-123');
   * if (correlation) {
   *   console.log('Event types:', correlation.eventTypes);
   * }
   * ```
   */
  getCorrelation(correlationId: string): EventCorrelation | undefined {
    return this.correlations.get(correlationId);
  }
  
  /**
   * Get all active correlations
   * 
   * @returns Array of all active correlations
   * 
   * @example
   * ```typescript
   * const manager = new GasCityEventManager();
   * const allCorrelations = manager.getAllCorrelations();
   * console.log(`Active correlations: ${allCorrelations.length}`);
   * ```
   */
  getAllCorrelations(): EventCorrelation[] {
    return Array.from(this.correlations.values());
  }
  
  /**
   * Filter events by correlation ID
   * 
   * @param correlationId - The correlation ID to filter by
   * @returns A filter function that can be used with subscribe
   * 
   * @example
   * ```typescript
   * const manager = new GasCityEventManager();
   * const filter = manager.filterByCorrelation('workflow-123');
   * await manager.subscribe({ filter }, (event) => {
   *   console.log('Correlated event:', event);
   * });
   * ```
   */
  filterByCorrelation(correlationId: string): (event: any) => boolean {
    return (event: any) => {
      return event.correlation?.id === correlationId;
    };
  }
  
  /**
   * Filter events by type pattern
   * 
   * @param pattern - Regex pattern to match event types
   * @returns A filter function that can be used with subscribe
   * 
   * @example
   * ```typescript
   * const manager = new GasCityEventManager();
   * const filter = manager.filterByTypePattern(/^task\./);
   * await manager.subscribe({ filter }, (event) => {
   *   console.log('Task event:', event);
   * });
   * ```
   */
  filterByTypePattern(pattern: RegExp): (event: any) => boolean {
    return (event: any) => {
      return pattern.test(event.type || '');
    };
  }
  
  /**
   * Filter events by data property
   * 
   * @param property - The property path to check (e.g., 'data.status')
   * @param value - The value to match
   * @returns A filter function that can be used with subscribe
   * 
   * @example
   * ```typescript
   * const manager = new GasCityEventManager();
   * const filter = manager.filterByProperty('status', 'completed');
   * await manager.subscribe({ filter }, (event) => {
   *   console.log('Completed event:', event);
   * });
   * ```
   */
  filterByProperty(property: string, value: any): (event: any) => boolean {
    return (event: any) => {
      const keys = property.split('.');
      let current = event;
      
      for (const key of keys) {
        if (current == null) return false;
        current = current[key];
      }
      
      return current === value;
    };
  }
  
  /**
   * Clean up a correlation when no longer needed
   * 
   * @param correlationId - The correlation ID to clean up
   * @private
   */
  private cleanupCorrelation(correlationId: string): void {
    // Check if any other subscriptions use this correlation
    const isInUse = Array.from(this.subscriptions.values()).some(
      sub => sub.correlationId === correlationId
    );
    
    if (!isInUse) {
      this.correlations.delete(correlationId);
    }
  }
}

/**
 * Create a new event manager instance
 * 
 * @returns A new GasCityEventManager instance
 * 
 * @example
 * ```typescript
 * const manager = createEventManager();
 * await manager.subscribe({ city: 'my-city' });
 * ```
 */
export function createEventManager(): GasCityEventManager {
  return new GasCityEventManager();
}

/**
 * Subscribe to events with a convenience function
 * 
 * @param options - Subscription options including city, supervisor mode, and filters
 * @param callback - Optional callback function to handle events
 * @returns Promise that resolves to the event manager instance
 * 
 * @example
 * ```typescript
 * const manager = await subscribeToEvents({ city: 'my-city', eventType: 'task.completed' }, (event) => {
 *   console.log('Task completed:', event);
 * });
 * ```
 */
export async function subscribeToEvents(
  options: EventOptions & EventSubscription = {},
  callback?: (event: any) => void
): Promise<GasCityEventManager> {
  const manager = createEventManager();
  await manager.subscribe(options, callback);
  return manager;
}
