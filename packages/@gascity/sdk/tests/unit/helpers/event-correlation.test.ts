import { describe, it, expect } from 'vitest';
import {
  generateEventCorrelationId,
  extractCorrelationId,
  filterByCorrelation,
} from '../../../src/helpers/event-correlation';

describe('Event Correlation Helper', () => {
  describe('generateEventCorrelationId', () => {
    it('should generate a unique correlation ID', () => {
      const id1 = generateEventCorrelationId();
      const id2 = generateEventCorrelationId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('should generate ID with correct format', () => {
      const id = generateEventCorrelationId();

      // ID should start with 'corr-'
      expect(id).toMatch(/^corr-/);
      // ID should be a valid string
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(10);
    });

    it('should generate IDs with corr prefix', () => {
      const id = generateEventCorrelationId();
      const parts = id.split('-');

      expect(parts[0]).toBe('corr');
    });

    it('should generate different IDs when called rapidly', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateEventCorrelationId());
      }

      expect(ids.size).toBe(100);
    });
  });

  describe('extractCorrelationId', () => {
    it('should extract correlation ID from event metadata', () => {
      const event = {
        type: 'task.completed',
        metadata: {
          correlation_id: 'workflow-123',
        },
      };

      const result = extractCorrelationId(event);

      expect(result).toBe('workflow-123');
    });

    it('should extract correlation ID from event root', () => {
      const event = {
        type: 'task.completed',
        correlation_id: 'workflow-456',
      };

      const result = extractCorrelationId(event);

      expect(result).toBe('workflow-456');
    });

    it('should prefer metadata.correlation_id over root correlation_id', () => {
      const event = {
        type: 'task.completed',
        correlation_id: 'root-id',
        metadata: {
          correlation_id: 'metadata-id',
        },
      };

      const result = extractCorrelationId(event);

      expect(result).toBe('metadata-id');
    });

    it('should return null when correlation ID is not present', () => {
      const event = {
        type: 'task.completed',
        data: {},
      };

      const result = extractCorrelationId(event);

      expect(result).toBeNull();
    });

    it('should return null when event is null', () => {
      const result = extractCorrelationId(null);

      expect(result).toBeNull();
    });

    it('should return null when event is undefined', () => {
      const result = extractCorrelationId(undefined);

      expect(result).toBeNull();
    });

    it('should return null when metadata is null', () => {
      const event = {
        type: 'task.completed',
        metadata: null,
      };

      const result = extractCorrelationId(event);

      expect(result).toBeNull();
    });

    it('should return null when metadata is undefined', () => {
      const event = {
        type: 'task.completed',
        metadata: undefined,
      };

      const result = extractCorrelationId(event);

      expect(result).toBeNull();
    });

    it('should handle empty correlation ID string', () => {
      const event = {
        type: 'task.completed',
        metadata: {
          correlation_id: '',
        },
      };

      const result = extractCorrelationId(event);

      expect(result).toBeNull();
    });
  });

  describe('filterByCorrelation', () => {
    it('should filter events by correlation ID', () => {
      const events = [
        { type: 'task.started', metadata: { correlation_id: 'workflow-123' } },
        { type: 'task.completed', metadata: { correlation_id: 'workflow-456' } },
        { type: 'task.started', metadata: { correlation_id: 'workflow-123' } },
        { type: 'agent.created', metadata: { correlation_id: 'workflow-789' } },
      ];

      const result = filterByCorrelation(events, 'workflow-123');

      expect(result).toHaveLength(2);
      expect(result[0].metadata.correlation_id).toBe('workflow-123');
      expect(result[1].metadata.correlation_id).toBe('workflow-123');
    });

    it('should return empty array when no events match', () => {
      const events = [
        { type: 'task.started', metadata: { correlation_id: 'workflow-456' } },
        { type: 'task.completed', metadata: { correlation_id: 'workflow-789' } },
      ];

      const result = filterByCorrelation(events, 'workflow-123');

      expect(result).toHaveLength(0);
    });

    it('should handle events with correlation_id at root', () => {
      const events = [
        { type: 'task.started', correlation_id: 'workflow-123' },
        { type: 'task.completed', correlation_id: 'workflow-456' },
      ];

      const result = filterByCorrelation(events, 'workflow-123');

      expect(result).toHaveLength(1);
      expect(result[0].correlation_id).toBe('workflow-123');
    });

    it('should handle mixed correlation ID locations', () => {
      const events = [
        { type: 'task.started', correlation_id: 'workflow-123' },
        { type: 'task.completed', metadata: { correlation_id: 'workflow-123' } },
        { type: 'agent.created', correlation_id: 'workflow-456' },
      ];

      const result = filterByCorrelation(events, 'workflow-123');

      expect(result).toHaveLength(2);
    });

    it('should handle events without correlation ID', () => {
      const events = [
        { type: 'task.started' },
        { type: 'task.completed', metadata: { correlation_id: 'workflow-123' } },
        { type: 'agent.created' },
      ];

      const result = filterByCorrelation(events, 'workflow-123');

      expect(result).toHaveLength(1);
    });

    it('should handle empty events array', () => {
      const result = filterByCorrelation([], 'workflow-123');

      expect(result).toHaveLength(0);
    });

    it('should be case-sensitive', () => {
      const events = [
        { type: 'task.started', metadata: { correlation_id: 'Workflow-123' } },
        { type: 'task.completed', metadata: { correlation_id: 'workflow-123' } },
      ];

      const result = filterByCorrelation(events, 'workflow-123');

      expect(result).toHaveLength(1);
      expect(result[0].metadata.correlation_id).toBe('workflow-123');
    });

    it('should handle null correlation ID parameter', () => {
      const events = [
        { type: 'task.started', metadata: { correlation_id: 'workflow-123' } },
      ];

      const result = filterByCorrelation(events, null as any);

      expect(result).toHaveLength(0);
    });

    it('should handle undefined correlation ID parameter', () => {
      const events = [
        { type: 'task.started', metadata: { correlation_id: 'workflow-123' } },
      ];

      const result = filterByCorrelation(events, undefined as any);

      expect(result).toHaveLength(0);
    });
  });
});
