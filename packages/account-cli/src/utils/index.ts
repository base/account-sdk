import { CLIError } from '../types/errors.js';

export function formatOutput(data: unknown, json: boolean): void {
  if (json) {
    process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
  } else {
    process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
  }
}

export function formatError(error: unknown, json: boolean): never {
  const code = error instanceof CLIError ? error.code : 'UNKNOWN';
  const message = error instanceof Error ? error.message : String(error);
  const exitCode = error instanceof CLIError ? error.exitCode : 1;

  const envelope = { error: { code, message } };
  if (json) {
    process.stdout.write(`${JSON.stringify(envelope, null, 2)}\n`);
  } else {
    process.stderr.write(`Error [${code}]: ${message}\n`);
  }
  process.exit(exitCode);
}

export function formatTable(headers: string[], rows: string[][]): string {
  const colWidths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length))
  );

  const headerLine = headers.map((h, i) => h.padEnd(colWidths[i])).join('  ');
  const separator = colWidths.map((w) => '─'.repeat(w)).join('──');
  const body = rows
    .map((row) => row.map((cell, i) => (cell ?? '').padEnd(colWidths[i])).join('  '))
    .join('\n');

  return `${headerLine}\n${separator}\n${body}`;
}

export function formatKeyValue(entries: [string, string][]): string {
  const maxKey = Math.max(...entries.map(([k]) => k.length));
  return entries.map(([k, v]) => `${k.padEnd(maxKey)}  ${v}`).join('\n');
}
