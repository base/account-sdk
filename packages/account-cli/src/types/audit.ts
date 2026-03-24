import type { SessionMode } from './session.js';

export type AuditOperation = 'session_create' | 'session_destroy' | 'session_destroy_all';

export type AuditEntry = {
  timestamp: string;
  operation: AuditOperation;
  mode: SessionMode;
  identifier: string;
  details?: string;
};
