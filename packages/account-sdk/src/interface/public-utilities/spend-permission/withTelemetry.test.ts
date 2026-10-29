import {
  logSpendPermissionUtilCompleted,
  logSpendPermissionUtilError,
  logSpendPermissionUtilStarted,
} from ':core/telemetry/events/spend-permission.js';
import { store } from ':store/store.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { withTelemetry } from './withTelemetry.js';

// Mock telemetry events (house pattern)
vi.mock(':core/telemetry/events/spend-permission.js', () => ({
  logSpendPermissionUtilStarted: vi.fn(),
  logSpendPermissionUtilCompleted: vi.fn(),
  logSpendPermissionUtilError: vi.fn(),
}));

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('withTelemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure telemetry is enabled (wrapper active). The flag is read at
    // withTelemetry(fn) call time, so reset it before each test.
    store.config.set({ preference: undefined });
  });

  it('logs Completed only AFTER the wrapped async fn resolves', async () => {
    const deferred = createDeferred<string>();
    const fn = vi.fn(() => deferred.promise);

    const wrapped = withTelemetry(fn);
    const resultPromise = wrapped();

    // Started fired synchronously; Completed must NOT fire until the promise resolves.
    expect(logSpendPermissionUtilStarted).toHaveBeenCalledTimes(1);
    expect(logSpendPermissionUtilCompleted).not.toHaveBeenCalled();
    expect(logSpendPermissionUtilError).not.toHaveBeenCalled();

    deferred.resolve('done');
    await resultPromise;

    expect(logSpendPermissionUtilCompleted).toHaveBeenCalledTimes(1);
    expect(logSpendPermissionUtilError).not.toHaveBeenCalled();
  });

  it('logs Error when the wrapped async fn rejects', async () => {
    const fetchPermissionFn = async () => {
      throw new Error('boom');
    };

    const wrapped = withTelemetry(fetchPermissionFn);

    await expect(wrapped()).rejects.toThrow('boom');

    expect(logSpendPermissionUtilError).toHaveBeenCalledTimes(1);
    expect(logSpendPermissionUtilError).toHaveBeenCalledWith('fetchPermission', 'boom');
    expect(logSpendPermissionUtilCompleted).not.toHaveBeenCalled();
  });

  it('logs Started before completion', async () => {
    const deferred = createDeferred<string>();
    const fn = vi.fn(() => deferred.promise);

    const wrapped = withTelemetry(fn);
    const resultPromise = wrapped();

    expect(logSpendPermissionUtilStarted).toHaveBeenCalledTimes(1);

    deferred.resolve('done');
    await resultPromise;
  });

  it('passes through and logs nothing when telemetry is disabled', async () => {
    store.config.set({ preference: { telemetry: false } });

    const fn = vi.fn(async () => 'value');
    const wrapped = withTelemetry(fn);

    // Passthrough: the raw fn is returned unchanged.
    expect(wrapped).toBe(fn);

    await wrapped();

    expect(logSpendPermissionUtilStarted).not.toHaveBeenCalled();
    expect(logSpendPermissionUtilCompleted).not.toHaveBeenCalled();
    expect(logSpendPermissionUtilError).not.toHaveBeenCalled();
  });

  it('propagates the resolved value unchanged', async () => {
    const fn = async () => 'the-value';
    const wrapped = withTelemetry(fn);

    await expect(wrapped()).resolves.toBe('the-value');
  });

  it('derives the function name (strips the Fn suffix)', async () => {
    const fetchPermissionFn = async () => 'ok';
    const wrapped = withTelemetry(fetchPermissionFn);

    await wrapped();

    expect(logSpendPermissionUtilStarted).toHaveBeenCalledWith('fetchPermission');
    expect(logSpendPermissionUtilCompleted).toHaveBeenCalledWith('fetchPermission');
  });
});
