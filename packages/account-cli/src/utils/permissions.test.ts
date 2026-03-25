import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CLIError } from '../types/errors.js';
import { verifyDirectoryPermissions, verifyFilePermissions } from './permissions.js';

describe('verifyDirectoryPermissions', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'perm-dir-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('passes for 0o700 directory', () => {
    const dir = join(tmpDir, 'secure');
    mkdirSync(dir, { mode: 0o700 });
    expect(() => verifyDirectoryPermissions(dir)).not.toThrow();
  });

  it('is a no-op for nonexistent directory', () => {
    expect(() => verifyDirectoryPermissions(join(tmpDir, 'nope'))).not.toThrow();
  });

  it('throws INSECURE_PERMISSIONS for 0o755 (world-readable)', () => {
    const dir = join(tmpDir, 'open');
    mkdirSync(dir, { mode: 0o755 });
    expect(() => verifyDirectoryPermissions(dir)).toThrow(CLIError);
    try {
      verifyDirectoryPermissions(dir);
    } catch (e) {
      const err = e as CLIError;
      expect(err.code).toBe('INSECURE_PERMISSIONS');
      expect(err.message).toContain('755');
      expect(err.message).toContain('chmod 700');
    }
  });

  it('throws INSECURE_PERMISSIONS for 0o770 (group-readable)', () => {
    const dir = join(tmpDir, 'group');
    mkdirSync(dir, { mode: 0o770 });
    expect(() => verifyDirectoryPermissions(dir)).toThrow(CLIError);
  });

  it('throws INSECURE_PERMISSIONS for 0o701 (world-executable)', () => {
    const dir = join(tmpDir, 'world-exec');
    mkdirSync(dir, { mode: 0o701 });
    expect(() => verifyDirectoryPermissions(dir)).toThrow(CLIError);
  });

  it('throws even when permissions are more restrictive than 0o700 but different', () => {
    const dir = join(tmpDir, 'restrictive');
    mkdirSync(dir, { mode: 0o500 });
    expect(() => verifyDirectoryPermissions(dir)).toThrow(CLIError);
  });

  it('includes the directory path in error message', () => {
    const dir = join(tmpDir, 'bad-dir');
    mkdirSync(dir, { mode: 0o755 });
    try {
      verifyDirectoryPermissions(dir);
    } catch (e) {
      expect((e as CLIError).message).toContain(dir);
    }
  });
});

describe('verifyFilePermissions', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'perm-file-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('passes for 0o600 file', () => {
    const file = join(tmpDir, 'secure.json');
    writeFileSync(file, '{}', { mode: 0o600 });
    expect(() => verifyFilePermissions(file)).not.toThrow();
  });

  it('is a no-op for nonexistent file', () => {
    expect(() => verifyFilePermissions(join(tmpDir, 'nope.json'))).not.toThrow();
  });

  it('throws INSECURE_PERMISSIONS for 0o644 (group-readable)', () => {
    const file = join(tmpDir, 'open.json');
    writeFileSync(file, '{}', { mode: 0o644 });
    expect(() => verifyFilePermissions(file)).toThrow(CLIError);
    try {
      verifyFilePermissions(file);
    } catch (e) {
      const err = e as CLIError;
      expect(err.code).toBe('INSECURE_PERMISSIONS');
      expect(err.message).toContain('644');
      expect(err.message).toContain('chmod 600');
    }
  });

  it('throws INSECURE_PERMISSIONS for 0o666 (world-writable)', () => {
    const file = join(tmpDir, 'world.json');
    writeFileSync(file, '{}', { mode: 0o666 });
    expect(() => verifyFilePermissions(file)).toThrow(CLIError);
  });

  it('throws INSECURE_PERMISSIONS for 0o640 (group-readable only)', () => {
    const file = join(tmpDir, 'group.json');
    writeFileSync(file, '{}', { mode: 0o640 });
    expect(() => verifyFilePermissions(file)).toThrow(CLIError);
  });

  it('throws for executable file 0o700', () => {
    const file = join(tmpDir, 'exec.json');
    writeFileSync(file, '{}', { mode: 0o700 });
    expect(() => verifyFilePermissions(file)).toThrow(CLIError);
  });

  it('includes the file path in error message', () => {
    const file = join(tmpDir, 'bad-file.json');
    writeFileSync(file, '{}', { mode: 0o644 });
    try {
      verifyFilePermissions(file);
    } catch (e) {
      expect((e as CLIError).message).toContain(file);
    }
  });

  it('catches permission change after initial write', () => {
    const file = join(tmpDir, 'changed.json');
    writeFileSync(file, '{}', { mode: 0o600 });
    expect(() => verifyFilePermissions(file)).not.toThrow();

    chmodSync(file, 0o644);
    expect(() => verifyFilePermissions(file)).toThrow(CLIError);
  });
});
