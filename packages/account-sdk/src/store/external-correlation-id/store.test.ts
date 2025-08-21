import { beforeEach, describe, expect, it } from 'vitest';
import { externalCorrelationIds } from './store.js';

describe('externalCorrelationIds', () => {
  beforeEach(() => {
    externalCorrelationIds.clear();
  });

  it('should start with null value', () => {
    expect(externalCorrelationIds.get()).toBe(null);
  });

  it('should set and get external correlation ID', () => {
    const testId = 'test-external-correlation-id-123';
    externalCorrelationIds.set(testId);
    expect(externalCorrelationIds.get()).toBe(testId);
  });

  it('should update existing external correlation ID', () => {
    const firstId = 'first-id';
    const secondId = 'second-id';
    
    externalCorrelationIds.set(firstId);
    expect(externalCorrelationIds.get()).toBe(firstId);
    
    externalCorrelationIds.set(secondId);
    expect(externalCorrelationIds.get()).toBe(secondId);
  });

  it('should clear external correlation ID', () => {
    const testId = 'test-id';
    externalCorrelationIds.set(testId);
    expect(externalCorrelationIds.get()).toBe(testId);
    
    externalCorrelationIds.clear();
    expect(externalCorrelationIds.get()).toBe(null);
  });
});
