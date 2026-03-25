import { describe, expect, it } from 'vitest';
import { CLIError } from './errors.js';

describe('CLIError', () => {
  it('sets code, message, and default exitCode', () => {
    const err = new CLIError('NOT_FOUND', 'resource missing');
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('resource missing');
    expect(err.exitCode).toBe(1);
    expect(err.name).toBe('CLIError');
  });

  it('accepts a custom exitCode', () => {
    const err = new CLIError('BAD_INPUT', 'invalid value', 2);
    expect(err.exitCode).toBe(2);
  });

  it('is an instance of Error', () => {
    const err = new CLIError('FAIL', 'boom');
    expect(err).toBeInstanceOf(Error);
  });
});
