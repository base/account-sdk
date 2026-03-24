import { existsSync, statSync } from 'node:fs';
import { CLIError } from '../types/errors.js';

const REQUIRED_DIR_MODE = 0o700;
const REQUIRED_FILE_MODE = 0o600;

/**
 * Verify that a directory has owner-only permissions (0o700).
 * Throws if the directory is group- or world-readable.
 */
export function verifyDirectoryPermissions(dir: string): void {
  if (process.platform === 'win32') return;
  if (!existsSync(dir)) return;
  const stats = statSync(dir);
  const mode = stats.mode & 0o777;
  if (mode !== REQUIRED_DIR_MODE) {
    throw new CLIError(
      'INSECURE_PERMISSIONS',
      `Directory ${dir} has mode ${mode.toString(8).padStart(3, '0')}, expected 700. ` +
        `Fix with: chmod 700 "${dir}"`
    );
  }
}

/**
 * Verify that a file has owner-only read/write permissions (0o600).
 * Throws if the file is group- or world-readable.
 */
export function verifyFilePermissions(filePath: string): void {
  if (process.platform === 'win32') return;
  if (!existsSync(filePath)) return;
  const stats = statSync(filePath);
  const mode = stats.mode & 0o777;
  if (mode !== REQUIRED_FILE_MODE) {
    throw new CLIError(
      'INSECURE_PERMISSIONS',
      `File ${filePath} has mode ${mode.toString(8).padStart(3, '0')}, expected 600. ` +
        `Fix with: chmod 600 "${filePath}"`
    );
  }
}
