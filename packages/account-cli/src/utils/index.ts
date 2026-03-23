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
