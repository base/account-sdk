import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { secureDelete } from './secure-delete.js';

describe('secureDelete', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'secure-del-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('removes the file from disk', () => {
    const file = join(tmpDir, 'secret.json');
    writeFileSync(file, '{"key": "value"}');

    secureDelete(file);

    expect(existsSync(file)).toBe(false);
  });

  it('overwrites file contents before removing', () => {
    const file = join(tmpDir, 'sensitive.json');
    const original = '{"password": "hunter2"}';
    writeFileSync(file, original);

    const sizeBefore = statSync(file).size;
    expect(sizeBefore).toBe(original.length);

    secureDelete(file);

    expect(existsSync(file)).toBe(false);
  });

  it('is a no-op for nonexistent files', () => {
    expect(() => secureDelete(join(tmpDir, 'nope.json'))).not.toThrow();
  });

  it('handles empty files', () => {
    const file = join(tmpDir, 'empty.json');
    writeFileSync(file, '');
    expect(statSync(file).size).toBe(0);

    secureDelete(file);

    expect(existsSync(file)).toBe(false);
  });

  it('handles large files', () => {
    const file = join(tmpDir, 'large.bin');
    const content = Buffer.alloc(64 * 1024, 'x');
    writeFileSync(file, content);

    secureDelete(file);

    expect(existsSync(file)).toBe(false);
  });

  it('handles files with only whitespace', () => {
    const file = join(tmpDir, 'whitespace.txt');
    writeFileSync(file, '   \n\n  \t  ');

    secureDelete(file);

    expect(existsSync(file)).toBe(false);
  });

  it('handles binary content', () => {
    const file = join(tmpDir, 'binary.dat');
    writeFileSync(file, Buffer.from([0x00, 0xff, 0xfe, 0x01, 0x80]));

    secureDelete(file);

    expect(existsSync(file)).toBe(false);
  });

  it('does not affect other files in the same directory', () => {
    const target = join(tmpDir, 'target.json');
    const bystander = join(tmpDir, 'keep.json');
    writeFileSync(target, 'delete me');
    writeFileSync(bystander, 'keep me');

    secureDelete(target);

    expect(existsSync(target)).toBe(false);
    expect(existsSync(bystander)).toBe(true);
    expect(readFileSync(bystander, 'utf-8')).toBe('keep me');
  });
});
