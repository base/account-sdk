import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const CLI_PATH = join(import.meta.dirname, '../../index.ts');

function run(
  args: string[],
  env: Record<string, string> = {}
): { stdout: string; exitCode: number } {
  try {
    const stdout = execFileSync('npx', ['tsx', CLI_PATH, ...args], {
      encoding: 'utf-8',
      env: { ...process.env, ...env },
      timeout: 10_000,
    });
    return { stdout, exitCode: 0 };
  } catch (e: unknown) {
    const err = e as { stdout?: string; status?: number };
    return { stdout: err.stdout ?? '', exitCode: err.status ?? 1 };
  }
}

function runJson(args: string[], env: Record<string, string> = {}): Record<string, unknown> {
  const { stdout } = run([...args, '--json'], env);
  return JSON.parse(stdout);
}

function seedSession(dir: string, filename: string, data: Record<string, unknown>): void {
  const sessDir = join(dir, 'sessions');
  mkdirSync(sessDir, { recursive: true, mode: 0o700 });
  writeFileSync(join(sessDir, filename), JSON.stringify(data, null, 2), { mode: 0o600 });
}

const OPERATOR = {
  version: 1,
  mode: 'operator',
  account: '0xOperator111',
  createdAt: '2026-03-23T00:00:00Z',
};

const SMART_WALLET = {
  version: 1,
  mode: 'smart-wallet',
  account: '0xParent000',
  subAccount: '0xSubAcct222',
  signer: '0xSigner333',
  chainId: 'eip155:84532',
  createdAt: '2026-03-23T00:00:00Z',
};

const EXTERNAL_EOA = {
  version: 1,
  mode: 'external-eoa',
  account: '0xParent000',
  eoa: '0xEoa444',
  chainId: 'eip155:8453',
  createdAt: '2026-03-23T00:00:00Z',
};

describe('session CLI integration', () => {
  let tmpDir: string;
  let envOverride: Record<string, string>;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'base-cli-integ-'));
    envOverride = { BASE_ACCOUNT_DIR: tmpDir };
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('no sessions', () => {
    it('list returns empty array', () => {
      const result = runJson(['session', 'list'], envOverride);
      expect(result.sessions).toEqual([]);
    });

    it('info returns NO_SESSION error', () => {
      const result = runJson(['session', 'info'], envOverride);
      expect((result.error as Record<string, unknown>).code).toBe('NO_SESSION');
    });

    it('destroy returns INVALID_INPUT error', () => {
      const result = runJson(['session', 'destroy', '0xNope'], envOverride);
      expect((result.error as Record<string, unknown>).code).toBe('INVALID_INPUT');
    });
  });

  describe('single operator session', () => {
    beforeEach(() => {
      seedSession(tmpDir, `operator-${OPERATOR.account}.json`, OPERATOR);
    });

    it('list shows 1 session', () => {
      const result = runJson(['session', 'list'], envOverride);
      const sessions = result.sessions as Record<string, unknown>[];
      expect(sessions).toHaveLength(1);
      expect(sessions[0].mode).toBe('operator');
    });

    it('info auto-selects the only session', () => {
      const result = runJson(['session', 'info'], envOverride);
      expect(result.mode).toBe('operator');
      expect(result.resolved_via).toBe('auto_select');
    });
  });

  describe('single smart-wallet session', () => {
    beforeEach(() => {
      seedSession(tmpDir, `smart-wallet-${SMART_WALLET.subAccount}.json`, SMART_WALLET);
    });

    it('info shows sub_account, signer, and chain_id', () => {
      const result = runJson(['session', 'info'], envOverride);
      expect(result.mode).toBe('smart-wallet');
      expect(result.sub_account).toBe('0xSubAcct222');
      expect(result.signer).toBe('0xSigner333');
      expect(result.chain_id).toBe('eip155:84532');
      expect(result.resolved_via).toBe('auto_select');
    });
  });

  describe('single external-eoa session', () => {
    beforeEach(() => {
      seedSession(tmpDir, `external-eoa-${EXTERNAL_EOA.eoa}.json`, EXTERNAL_EOA);
    });

    it('info shows eoa and chain_id', () => {
      const result = runJson(['session', 'info'], envOverride);
      expect(result.mode).toBe('external-eoa');
      expect(result.eoa).toBe('0xEoa444');
      expect(result.chain_id).toBe('eip155:8453');
      expect(result.resolved_via).toBe('auto_select');
    });
  });

  describe('multiple sessions', () => {
    beforeEach(() => {
      seedSession(tmpDir, `operator-${OPERATOR.account}.json`, OPERATOR);
      seedSession(tmpDir, `external-eoa-${EXTERNAL_EOA.eoa}.json`, EXTERNAL_EOA);
      seedSession(tmpDir, `smart-wallet-${SMART_WALLET.subAccount}.json`, SMART_WALLET);
    });

    it('list shows all 3 sessions', () => {
      const result = runJson(['session', 'list'], envOverride);
      const sessions = result.sessions as Record<string, unknown>[];
      expect(sessions).toHaveLength(3);
      const modes = sessions.map((s) => s.mode).sort();
      expect(modes).toEqual(['external-eoa', 'operator', 'smart-wallet']);
    });

    it('info errors with MULTIPLE_SESSIONS', () => {
      const result = runJson(['session', 'info'], envOverride);
      expect((result.error as Record<string, unknown>).code).toBe('MULTIPLE_SESSIONS');
    });

    it('BASE_SESSION resolves operator', () => {
      const result = runJson(['session', 'info'], {
        ...envOverride,
        BASE_SESSION: '0xOperator111',
      });
      expect(result.mode).toBe('operator');
      expect(result.resolved_via).toBe('env_var');
    });

    it('BASE_SESSION resolves external-eoa', () => {
      const result = runJson(['session', 'info'], { ...envOverride, BASE_SESSION: '0xEoa444' });
      expect(result.mode).toBe('external-eoa');
      expect(result.resolved_via).toBe('env_var');
    });

    it('BASE_SESSION resolves smart-wallet', () => {
      const result = runJson(['session', 'info'], { ...envOverride, BASE_SESSION: '0xSubAcct222' });
      expect(result.mode).toBe('smart-wallet');
      expect(result.resolved_via).toBe('env_var');
    });
  });

  describe('destroy', () => {
    beforeEach(() => {
      seedSession(tmpDir, `operator-${OPERATOR.account}.json`, OPERATOR);
      seedSession(tmpDir, `external-eoa-${EXTERNAL_EOA.eoa}.json`, EXTERNAL_EOA);
    });

    it('destroys a single session by identifier', () => {
      const result = runJson(['session', 'destroy', '0xEoa444'], envOverride);
      expect(result.status).toBe('destroyed');

      const list = runJson(['session', 'list'], envOverride);
      expect((list.sessions as unknown[]).length).toBe(1);
    });

    it('destroys all sessions', () => {
      const result = runJson(['session', 'destroy', '--all'], envOverride);
      expect(result.status).toBe('destroyed');

      const list = runJson(['session', 'list'], envOverride);
      expect(list.sessions).toEqual([]);
    });

    it('writes audit log entries', () => {
      runJson(['session', 'destroy', '0xEoa444'], envOverride);

      const logPath = join(tmpDir, 'logs', 'audit.jsonl');
      expect(existsSync(logPath)).toBe(true);
      const lines = readFileSync(logPath, 'utf-8').trim().split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(1);
      const entry = JSON.parse(lines[0]);
      expect(entry.operation).toBe('session_destroy');
    });
  });
});
