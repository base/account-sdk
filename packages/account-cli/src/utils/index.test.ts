import { type MockInstance, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CLIError } from '../types/errors.js';
import { formatError, formatOutput } from './index.js';

describe('formatOutput', () => {
  // biome-ignore lint/suspicious/noExplicitAny: test spy
  let stdoutSpy: MockInstance<any>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  it('writes JSON to stdout when json=true', () => {
    formatOutput({ status: 'ok' }, true);
    expect(stdoutSpy).toHaveBeenCalledWith(`${JSON.stringify({ status: 'ok' }, null, 2)}\n`);
  });

  it('writes output to stdout when json=false', () => {
    formatOutput({ value: 42 }, false);
    expect(stdoutSpy).toHaveBeenCalledOnce();
  });
});

describe('formatError', () => {
  // biome-ignore lint/suspicious/noExplicitAny: test spy
  let exitSpy: MockInstance<any>;
  // biome-ignore lint/suspicious/noExplicitAny: test spy
  let stdoutSpy: MockInstance<any>;
  // biome-ignore lint/suspicious/noExplicitAny: test spy
  let stderrSpy: MockInstance<any>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    stderrSpy = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  it('outputs JSON envelope and exits for CLIError when json=true', () => {
    const err = new CLIError('BAD_INPUT', 'missing field', 2);
    formatError(err, true);
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('"code": "BAD_INPUT"'));
    expect(exitSpy).toHaveBeenCalledWith(2);
  });

  it('writes to stderr for CLIError when json=false', () => {
    const err = new CLIError('NOT_FOUND', 'gone');
    formatError(err, false);
    expect(stderrSpy).toHaveBeenCalledWith('Error [NOT_FOUND]: gone\n');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('handles non-CLIError with UNKNOWN code and exit code 1', () => {
    formatError(new Error('unexpected'), true);
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('"code": "UNKNOWN"'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('handles non-Error values', () => {
    formatError('string error', false);
    expect(stderrSpy).toHaveBeenCalledWith('Error [UNKNOWN]: string error\n');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
