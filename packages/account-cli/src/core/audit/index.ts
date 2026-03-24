import { appendFileSync, mkdirSync } from 'node:fs';
import type { AuditEntry, AuditOperation } from '../../types/audit.js';
import type { SessionMode } from '../../types/session.js';
import { auditLogFile, logsDir } from '../paths.js';

export function appendAuditLog(
  operation: AuditOperation,
  mode: SessionMode,
  identifier: string,
  details?: string
): void {
  const dir = logsDir();
  mkdirSync(dir, { recursive: true, mode: 0o700 });

  const entry: AuditEntry = {
    timestamp: new Date().toISOString(),
    operation,
    mode,
    identifier,
    ...(details ? { details } : {}),
  };

  appendFileSync(auditLogFile(), `${JSON.stringify(entry)}\n`, { mode: 0o600 });
}
