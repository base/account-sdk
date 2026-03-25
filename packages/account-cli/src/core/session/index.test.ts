import { chmodSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ChainId } from '../../types/caip.js';
import { CLIError } from '../../types/errors.js';
import { SESSION_VERSION } from '../../types/session.js';
import type {
  ExternalEoaSession,
  OperatorSession,
  SmartWalletSession,
} from '../../types/session.js';
import { verifyDirectoryPermissions, verifyFilePermissions } from '../../utils/permissions.js';
import { secureDelete } from '../../utils/secure-delete.js';
import { appendAuditLog } from '../audit/index.js';
import { setBaseDir } from '../paths.js';
import {
  destroyAllSessions,
  destroySession,
  listSessions,
  loadSession,
  resolveSession,
  sessionKey,
  writeSession,
} from './index.js';

function makeSmartWalletSession(overrides: Partial<SmartWalletSession> = {}): SmartWalletSession {
  return {
    version: SESSION_VERSION,
    mode: 'smart-wallet',
    subAccount: '0xSubAccount1234' as `0x${string}`,
    account: '0xBaseAccount5678' as `0x${string}`,
    signer: '0xSignerAddress0000' as `0x${string}`,
    chainId: 'eip155:84532' as ChainId,
    createdAt: '2026-03-19T00:00:00Z',
    ...overrides,
  };
}

function makeExternalEoaSession(overrides: Partial<ExternalEoaSession> = {}): ExternalEoaSession {
  return {
    version: SESSION_VERSION,
    mode: 'external-eoa',
    eoa: '0xExternalEoa9999' as `0x${string}`,
    account: '0xBaseAccount5678' as `0x${string}`,
    chainId: 'eip155:84532' as ChainId,
    createdAt: '2026-03-19T00:00:00Z',
    ...overrides,
  };
}

function makeOperatorSession(overrides: Partial<OperatorSession> = {}): OperatorSession {
  return {
    version: SESSION_VERSION,
    mode: 'operator',
    account: '0xUserAccount9999' as `0x${string}`,
    createdAt: '2026-03-19T00:00:00Z',
    ...overrides,
  };
}

describe('session management', () => {
  let tmpDir: string;
  let restore: () => void;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'base-cli-test-'));
    restore = setBaseDir(tmpDir);
    delete process.env.BASE_SESSION;
  });

  afterEach(() => {
    restore();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('sessionKey', () => {
    it('returns account for operator sessions', () => {
      const session = makeOperatorSession();
      expect(sessionKey(session)).toBe(session.account);
    });

    it('returns subAccount for smart-wallet sessions', () => {
      const session = makeSmartWalletSession();
      expect(sessionKey(session)).toBe(session.subAccount);
    });

    it('returns eoa for external-eoa sessions', () => {
      const session = makeExternalEoaSession();
      expect(sessionKey(session)).toBe(session.eoa);
    });
  });

  describe('schema version', () => {
    it('smart-wallet session includes version', () => {
      const session = makeSmartWalletSession();
      writeSession(session);

      const filePath = join(tmpDir, 'sessions', `smart-wallet-${session.subAccount}.json`);
      const parsed = JSON.parse(readFileSync(filePath, 'utf-8'));
      expect(parsed.version).toBe(SESSION_VERSION);
    });

    it('external-eoa session includes version', () => {
      const session = makeExternalEoaSession();
      writeSession(session);

      const loaded = loadSession('external-eoa', session.eoa);
      expect(loaded!.version).toBe(SESSION_VERSION);
    });

    it('operator session includes version', () => {
      const session = makeOperatorSession();
      writeSession(session);

      const loaded = loadSession('operator', session.account);
      expect(loaded!.version).toBe(SESSION_VERSION);
    });
  });

  describe('CAIP-2 chain identifiers', () => {
    it('stores chainId as CAIP-2 string on smart-wallet session', () => {
      const session = makeSmartWalletSession({ chainId: 'eip155:8453' as ChainId });
      writeSession(session);

      const loaded = loadSession('smart-wallet', session.subAccount) as SmartWalletSession;
      expect(loaded.chainId).toBe('eip155:8453');
    });

    it('stores chainId as CAIP-2 string on external-eoa session', () => {
      const session = makeExternalEoaSession({ chainId: 'eip155:8453' as ChainId });
      writeSession(session);

      const loaded = loadSession('external-eoa', session.eoa) as ExternalEoaSession;
      expect(loaded.chainId).toBe('eip155:8453');
    });

    it('allows omitting chainId', () => {
      const session = makeSmartWalletSession({ chainId: undefined });
      writeSession(session);

      const loaded = loadSession('smart-wallet', session.subAccount) as SmartWalletSession;
      expect(loaded.chainId).toBeUndefined();
    });
  });

  describe('permission verification', () => {
    it('verifyDirectoryPermissions passes for 0o700 directory', () => {
      const dir = join(tmpDir, 'secure-dir');
      mkdirSync(dir, { mode: 0o700 });
      expect(() => verifyDirectoryPermissions(dir)).not.toThrow();
    });

    it('verifyDirectoryPermissions throws for world-readable directory', () => {
      const dir = join(tmpDir, 'insecure-dir');
      mkdirSync(dir, { mode: 0o755 });
      expect(() => verifyDirectoryPermissions(dir)).toThrow(CLIError);
      try {
        verifyDirectoryPermissions(dir);
      } catch (e) {
        expect((e as CLIError).code).toBe('INSECURE_PERMISSIONS');
      }
    });

    it('verifyDirectoryPermissions is no-op for nonexistent directory', () => {
      expect(() => verifyDirectoryPermissions(join(tmpDir, 'nope'))).not.toThrow();
    });

    it('verifyFilePermissions passes for 0o600 file', () => {
      const filePath = join(tmpDir, 'secure.json');
      writeFileSync(filePath, '{}', { mode: 0o600 });
      expect(() => verifyFilePermissions(filePath)).not.toThrow();
    });

    it('verifyFilePermissions throws for group-readable file', () => {
      const filePath = join(tmpDir, 'insecure.json');
      writeFileSync(filePath, '{}', { mode: 0o644 });
      expect(() => verifyFilePermissions(filePath)).toThrow(CLIError);
      try {
        verifyFilePermissions(filePath);
      } catch (e) {
        expect((e as CLIError).code).toBe('INSECURE_PERMISSIONS');
      }
    });

    it('listSessions throws when sessions dir has wrong permissions', () => {
      const sessDir = join(tmpDir, 'sessions');
      mkdirSync(sessDir, { mode: 0o700 });
      const session = makeOperatorSession();
      writeFileSync(join(sessDir, `operator-${session.account}.json`), JSON.stringify(session), {
        mode: 0o600,
      });
      chmodSync(sessDir, 0o755);

      expect(() => listSessions()).toThrow(CLIError);
    });

    it('listSessions throws when a session file has wrong permissions', () => {
      const session = makeOperatorSession();
      writeSession(session);

      const filePath = join(tmpDir, 'sessions', `operator-${session.account}.json`);
      chmodSync(filePath, 0o644);

      expect(() => listSessions()).toThrow(CLIError);
    });

    it('loadSession throws when sessions dir has wrong permissions', () => {
      const session = makeOperatorSession();
      writeSession(session);

      chmodSync(join(tmpDir, 'sessions'), 0o755);

      expect(() => loadSession('operator', session.account)).toThrow(CLIError);
    });
  });

  describe('secureDelete', () => {
    it('overwrites file contents with random bytes then removes it', () => {
      const filePath = join(tmpDir, 'secret.json');
      const content = '{"sensitive": "data"}';
      writeFileSync(filePath, content);
      const originalSize = statSync(filePath).size;

      secureDelete(filePath);

      expect(existsSync(filePath)).toBe(false);
      expect(originalSize).toBe(content.length);
    });

    it('is a no-op for nonexistent files', () => {
      expect(() => secureDelete(join(tmpDir, 'nope.json'))).not.toThrow();
    });

    it('handles empty files', () => {
      const filePath = join(tmpDir, 'empty.json');
      writeFileSync(filePath, '');

      secureDelete(filePath);

      expect(existsSync(filePath)).toBe(false);
    });
  });

  describe('audit logging', () => {
    it('appendAuditLog creates log file with entry', () => {
      appendAuditLog('session_create', 'operator', '0xTest');

      const logPath = join(tmpDir, 'logs', 'audit.jsonl');
      expect(existsSync(logPath)).toBe(true);

      const lines = readFileSync(logPath, 'utf-8').trim().split('\n');
      expect(lines).toHaveLength(1);

      const entry = JSON.parse(lines[0]);
      expect(entry.operation).toBe('session_create');
      expect(entry.mode).toBe('operator');
      expect(entry.identifier).toBe('0xTest');
      expect(entry.timestamp).toBeDefined();
    });

    it('appendAuditLog appends multiple entries', () => {
      appendAuditLog('session_create', 'operator', '0xA');
      appendAuditLog('session_destroy', 'smart-wallet', '0xB');

      const logPath = join(tmpDir, 'logs', 'audit.jsonl');
      const lines = readFileSync(logPath, 'utf-8').trim().split('\n');
      expect(lines).toHaveLength(2);
      expect(JSON.parse(lines[0]).operation).toBe('session_create');
      expect(JSON.parse(lines[1]).operation).toBe('session_destroy');
    });

    it('appendAuditLog includes details when provided', () => {
      appendAuditLog('session_destroy_all', 'operator', '0xTest', 'bulk cleanup');

      const logPath = join(tmpDir, 'logs', 'audit.jsonl');
      const entry = JSON.parse(readFileSync(logPath, 'utf-8').trim());
      expect(entry.details).toBe('bulk cleanup');
    });

    it('writeSession writes an audit entry', () => {
      writeSession(makeOperatorSession());

      const logPath = join(tmpDir, 'logs', 'audit.jsonl');
      const entry = JSON.parse(readFileSync(logPath, 'utf-8').trim());
      expect(entry.operation).toBe('session_create');
    });

    it('destroySession writes an audit entry', () => {
      const session = makeOperatorSession();
      writeSession(session);

      destroySession('operator', session.account);

      const logPath = join(tmpDir, 'logs', 'audit.jsonl');
      const lines = readFileSync(logPath, 'utf-8').trim().split('\n');
      const destroyEntry = JSON.parse(lines[lines.length - 1]);
      expect(destroyEntry.operation).toBe('session_destroy');
    });

    it('destroyAllSessions writes audit entries for each session', () => {
      writeSession(makeSmartWalletSession({ subAccount: '0xSubA' as `0x${string}` }));
      writeSession(makeOperatorSession({ account: '0xAccountB' as `0x${string}` }));

      destroyAllSessions();

      const logPath = join(tmpDir, 'logs', 'audit.jsonl');
      const lines = readFileSync(logPath, 'utf-8').trim().split('\n');
      const destroyEntries = lines
        .map((l) => JSON.parse(l))
        .filter((e) => e.operation === 'session_destroy_all');
      expect(destroyEntries).toHaveLength(2);
    });
  });

  describe('listSessions', () => {
    it('returns empty array when sessions dir does not exist', () => {
      expect(listSessions()).toEqual([]);
    });

    it('returns smart-wallet sessions from disk', () => {
      const session = makeSmartWalletSession();
      writeSession(session);

      const result = listSessions();
      expect(result).toHaveLength(1);
      expect(result[0].mode).toBe('smart-wallet');
      expect((result[0] as SmartWalletSession).subAccount).toBe(session.subAccount);
    });

    it('returns external-eoa sessions from disk', () => {
      const session = makeExternalEoaSession();
      writeSession(session);

      const result = listSessions();
      expect(result).toHaveLength(1);
      expect(result[0].mode).toBe('external-eoa');
      expect((result[0] as ExternalEoaSession).eoa).toBe(session.eoa);
    });

    it('returns operator sessions from disk', () => {
      const session = makeOperatorSession();
      writeSession(session);

      const result = listSessions();
      expect(result).toHaveLength(1);
      expect(result[0].mode).toBe('operator');
      expect(result[0].account).toBe(session.account);
    });

    it('returns all three session types', () => {
      writeSession(makeSmartWalletSession());
      writeSession(makeExternalEoaSession());
      writeSession(makeOperatorSession());

      const result = listSessions();
      expect(result).toHaveLength(3);
      const modes = result.map((s) => s.mode).sort();
      expect(modes).toEqual(['external-eoa', 'operator', 'smart-wallet']);
    });

    it('ignores non-matching files', () => {
      const sessDir = join(tmpDir, 'sessions');
      mkdirSync(sessDir, { recursive: true, mode: 0o700 });
      writeFileSync(join(sessDir, 'readme.txt'), 'not a session', { mode: 0o600 });
      writeFileSync(join(sessDir, 'legacy-0xOld.json'), '{}', { mode: 0o600 });

      expect(listSessions()).toEqual([]);
    });
  });

  describe('resolveSession', () => {
    it('throws NO_SESSION when no sessions exist', () => {
      expect(() => resolveSession()).toThrow(CLIError);
      try {
        resolveSession();
      } catch (e) {
        expect((e as CLIError).code).toBe('NO_SESSION');
      }
    });

    it('auto-selects single smart-wallet session', () => {
      writeSession(makeSmartWalletSession());

      const resolved = resolveSession();
      expect(resolved.mode).toBe('smart-wallet');
      expect(resolved.resolvedVia).toBe('auto_select');
    });

    it('auto-selects single external-eoa session', () => {
      writeSession(makeExternalEoaSession());

      const resolved = resolveSession();
      expect(resolved.mode).toBe('external-eoa');
      expect(resolved.resolvedVia).toBe('auto_select');
    });

    it('auto-selects single operator session', () => {
      writeSession(makeOperatorSession());

      const resolved = resolveSession();
      expect(resolved.mode).toBe('operator');
      expect(resolved.resolvedVia).toBe('auto_select');
    });

    it('resolves smart-wallet session via BASE_SESSION env var', () => {
      const session = makeSmartWalletSession();
      writeSession(session);
      process.env.BASE_SESSION = session.subAccount;

      const resolved = resolveSession();
      expect(resolved.mode).toBe('smart-wallet');
      expect(resolved.resolvedVia).toBe('env_var');
    });

    it('resolves external-eoa session via BASE_SESSION env var', () => {
      const session = makeExternalEoaSession();
      writeSession(session);
      process.env.BASE_SESSION = session.eoa;

      const resolved = resolveSession();
      expect(resolved.mode).toBe('external-eoa');
      expect(resolved.resolvedVia).toBe('env_var');
    });

    it('resolves operator session via BASE_SESSION env var', () => {
      const session = makeOperatorSession();
      writeSession(session);
      process.env.BASE_SESSION = session.account;

      const resolved = resolveSession();
      expect(resolved.mode).toBe('operator');
      expect(resolved.resolvedVia).toBe('env_var');
    });

    it('throws NO_SESSION when BASE_SESSION points to missing address', () => {
      process.env.BASE_SESSION = '0xDoesNotExist';

      expect(() => resolveSession()).toThrow(CLIError);
      try {
        resolveSession();
      } catch (e) {
        expect((e as CLIError).code).toBe('NO_SESSION');
      }
    });

    it('throws MULTIPLE_SESSIONS when multiple sessions exist', () => {
      writeSession(makeSmartWalletSession());
      writeSession(makeOperatorSession());

      expect(() => resolveSession()).toThrow(CLIError);
      try {
        resolveSession();
      } catch (e) {
        expect((e as CLIError).code).toBe('MULTIPLE_SESSIONS');
      }
    });

    it('BASE_SESSION resolves correctly even with multiple sessions', () => {
      writeSession(makeSmartWalletSession({ subAccount: '0xSubA' as `0x${string}` }));
      writeSession(makeExternalEoaSession({ eoa: '0xEoaB' as `0x${string}` }));
      writeSession(makeOperatorSession({ account: '0xAccountC' as `0x${string}` }));
      process.env.BASE_SESSION = '0xEoaB';

      const resolved = resolveSession();
      expect(resolved.mode).toBe('external-eoa');
      expect((resolved as ExternalEoaSession).eoa).toBe('0xEoaB');
      expect(resolved.resolvedVia).toBe('env_var');
    });
  });

  describe('loadSession', () => {
    it('returns null for missing smart-wallet session', () => {
      expect(loadSession('smart-wallet', '0xMissing')).toBeNull();
    });

    it('returns null for missing external-eoa session', () => {
      expect(loadSession('external-eoa', '0xMissing')).toBeNull();
    });

    it('returns null for missing operator session', () => {
      expect(loadSession('operator', '0xMissing')).toBeNull();
    });

    it('returns smart-wallet session from disk', () => {
      const session = makeSmartWalletSession();
      writeSession(session);

      const loaded = loadSession('smart-wallet', session.subAccount);
      expect(loaded).not.toBeNull();
      expect(loaded!.mode).toBe('smart-wallet');
      expect((loaded as SmartWalletSession).subAccount).toBe(session.subAccount);
    });

    it('returns external-eoa session from disk', () => {
      const session = makeExternalEoaSession();
      writeSession(session);

      const loaded = loadSession('external-eoa', session.eoa);
      expect(loaded).not.toBeNull();
      expect(loaded!.mode).toBe('external-eoa');
      expect((loaded as ExternalEoaSession).eoa).toBe(session.eoa);
    });

    it('returns operator session from disk', () => {
      const session = makeOperatorSession();
      writeSession(session);

      const loaded = loadSession('operator', session.account);
      expect(loaded).not.toBeNull();
      expect(loaded!.mode).toBe('operator');
      expect(loaded!.account).toBe(session.account);
    });
  });

  describe('writeSession', () => {
    it('writes smart-wallet file with correct name', () => {
      const session = makeSmartWalletSession();
      writeSession(session);

      const filePath = join(tmpDir, 'sessions', `smart-wallet-${session.subAccount}.json`);
      const parsed = JSON.parse(readFileSync(filePath, 'utf-8'));
      expect(parsed.mode).toBe('smart-wallet');
      expect(parsed.subAccount).toBe(session.subAccount);
    });

    it('writes external-eoa file with correct name', () => {
      const session = makeExternalEoaSession();
      writeSession(session);

      const filePath = join(tmpDir, 'sessions', `external-eoa-${session.eoa}.json`);
      const parsed = JSON.parse(readFileSync(filePath, 'utf-8'));
      expect(parsed.mode).toBe('external-eoa');
      expect(parsed.eoa).toBe(session.eoa);
    });

    it('writes operator file with correct name', () => {
      const session = makeOperatorSession();
      writeSession(session);

      const filePath = join(tmpDir, 'sessions', `operator-${session.account}.json`);
      const parsed = JSON.parse(readFileSync(filePath, 'utf-8'));
      expect(parsed.mode).toBe('operator');
      expect(parsed.account).toBe(session.account);
    });

    it('writes file with 0o600 permissions', () => {
      const session = makeSmartWalletSession();
      writeSession(session);

      const filePath = join(tmpDir, 'sessions', `smart-wallet-${session.subAccount}.json`);
      const stats = statSync(filePath);
      const mode = stats.mode & 0o777;
      expect(mode).toBe(0o600);
    });

    it('overwrites existing session (idempotent)', () => {
      const session = makeSmartWalletSession();
      writeSession(session);
      writeSession({ ...session, chainId: 'eip155:8453' as ChainId });

      const loaded = loadSession('smart-wallet', session.subAccount) as SmartWalletSession;
      expect(loaded.chainId).toBe('eip155:8453');
    });
  });

  describe('destroySession', () => {
    it('securely deletes smart-wallet session file', () => {
      const session = makeSmartWalletSession();
      writeSession(session);

      destroySession('smart-wallet', session.subAccount);
      expect(loadSession('smart-wallet', session.subAccount)).toBeNull();
    });

    it('securely deletes external-eoa session file', () => {
      const session = makeExternalEoaSession();
      writeSession(session);

      destroySession('external-eoa', session.eoa);
      expect(loadSession('external-eoa', session.eoa)).toBeNull();
    });

    it('securely deletes operator session file', () => {
      const session = makeOperatorSession();
      writeSession(session);

      destroySession('operator', session.account);
      expect(loadSession('operator', session.account)).toBeNull();
    });

    it('throws INVALID_INPUT for missing session', () => {
      expect(() => destroySession('smart-wallet', '0xMissing')).toThrow(CLIError);
      try {
        destroySession('smart-wallet', '0xMissing');
      } catch (e) {
        expect((e as CLIError).code).toBe('INVALID_INPUT');
      }
    });
  });

  describe('destroyAllSessions', () => {
    it('removes all session files across modes', () => {
      writeSession(makeSmartWalletSession({ subAccount: '0xSubA' as `0x${string}` }));
      writeSession(makeExternalEoaSession({ eoa: '0xEoaB' as `0x${string}` }));
      writeSession(makeOperatorSession({ account: '0xAccountC' as `0x${string}` }));

      const destroyed = destroyAllSessions();
      expect(destroyed).toHaveLength(3);
      expect(listSessions()).toEqual([]);
    });

    it('returns empty array when no sessions', () => {
      expect(destroyAllSessions()).toEqual([]);
    });
  });
});
