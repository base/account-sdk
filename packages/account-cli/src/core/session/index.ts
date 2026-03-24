import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { CLIError } from '../../types/errors.js';
import type { ResolvedSession, Session, SessionMode } from '../../types/session.js';
import { verifyDirectoryPermissions, verifyFilePermissions } from '../../utils/permissions.js';
import { secureDelete } from '../../utils/secure-delete.js';
import { appendAuditLog } from '../audit/index.js';
import { sessionFile, sessionsDir } from '../paths.js';

const SESSION_FILE_RE = /^(operator|smart-wallet|external-eoa)-(.+)\.json$/;

export function sessionKey(session: Session): string {
  switch (session.mode) {
    case 'operator':
      return session.account;
    case 'smart-wallet':
      return session.subAccount;
    case 'external-eoa':
      return session.eoa;
  }
}

export function listSessions(): Session[] {
  const dir = sessionsDir();
  if (!existsSync(dir)) return [];

  verifyDirectoryPermissions(dir);

  const sessions: Session[] = [];
  for (const f of readdirSync(dir)) {
    if (!SESSION_FILE_RE.test(f)) continue;
    const filePath = join(dir, f);
    verifyFilePermissions(filePath);
    try {
      const raw = readFileSync(filePath, 'utf-8');
      sessions.push(JSON.parse(raw) as Session);
    } catch {
      throw new CLIError('CORRUPT_SESSION', `Failed to parse session file: ${f}`);
    }
  }
  return sessions;
}

export function resolveSession(): ResolvedSession {
  const envValue = process.env.BASE_SESSION;

  if (envValue) {
    const sessions = listSessions();
    const target = envValue.toLowerCase();
    const match = sessions.find((s) => sessionKey(s).toLowerCase() === target);
    if (!match) {
      throw new CLIError('NO_SESSION', `Session not found for ${envValue}. Run 'login' first.`);
    }
    return { ...match, resolvedVia: 'env_var' };
  }

  const sessions = listSessions();

  if (sessions.length === 0) {
    throw new CLIError('NO_SESSION', "No session found. Run 'login' first.");
  }

  if (sessions.length === 1) {
    return { ...sessions[0], resolvedVia: 'auto_select' };
  }

  const labels = sessions.map((s) => `${s.mode}:${sessionKey(s)}`).join(', ');
  throw new CLIError(
    'MULTIPLE_SESSIONS',
    `Multiple sessions found. Set BASE_SESSION=<address>. Available: ${labels}`
  );
}

export function loadSession(mode: SessionMode, identifier: string): Session | null {
  const dir = sessionsDir();
  if (existsSync(dir)) verifyDirectoryPermissions(dir);

  const filePath = sessionFile(mode, identifier);
  if (!existsSync(filePath)) return null;
  verifyFilePermissions(filePath);
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as Session;
}

export function writeSession(session: Session): void {
  const dir = sessionsDir();
  mkdirSync(dir, { recursive: true, mode: 0o700 });

  const key = sessionKey(session);
  const tmpFile = join(dir, `.tmp-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  writeFileSync(tmpFile, JSON.stringify(session, null, 2), { mode: 0o600 });
  renameSync(tmpFile, sessionFile(session.mode, key));

  appendAuditLog('session_create', session.mode, key);
}

export function destroySession(mode: SessionMode, identifier: string): void {
  const filePath = sessionFile(mode, identifier);
  if (!existsSync(filePath)) {
    throw new CLIError('INVALID_INPUT', `Session not found for ${mode}:${identifier}`);
  }
  secureDelete(filePath);
  appendAuditLog('session_destroy', mode, identifier);
}

export function destroyAllSessions(): string[] {
  const dir = sessionsDir();
  if (!existsSync(dir)) return [];
  verifyDirectoryPermissions(dir);

  const labels: string[] = [];
  for (const f of readdirSync(dir)) {
    const match = SESSION_FILE_RE.exec(f);
    if (!match) continue;
    secureDelete(join(dir, f));
    appendAuditLog('session_destroy_all', match[1] as SessionMode, match[2]);
    labels.push(`${match[1]}:${match[2]}`);
  }
  return labels;
}
