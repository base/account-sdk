import { homedir } from 'node:os';
import { join, resolve, sep } from 'node:path';

let baseDir = process.env.BASE_ACCOUNT_DIR || join(homedir(), '.base-account');

export function getBaseDir(): string {
  return baseDir;
}

/** Override base dir for testing. Returns a restore function. */
export function setBaseDir(dir: string): () => void {
  const prev = baseDir;
  baseDir = dir;
  return () => {
    baseDir = prev;
  };
}

export function sessionsDir(): string {
  return join(getBaseDir(), 'sessions');
}

export function keysDir(): string {
  return join(getBaseDir(), 'keys');
}

export function logsDir(): string {
  return join(getBaseDir(), 'logs');
}

export function sessionFile(mode: string, identifier: string): string {
  const dir = sessionsDir();
  const filePath = resolve(dir, `${mode}-${identifier}.json`);
  if (!filePath.startsWith(`${dir}${sep}`) && filePath !== dir) {
    throw new Error(`Invalid session identifier: path traversal detected`);
  }
  return filePath;
}

export function keyFile(address: string): string {
  return join(keysDir(), `${address}.json`);
}

export function auditLogFile(): string {
  return join(logsDir(), 'audit.jsonl');
}
