import { closeSync, existsSync, openSync, statSync, unlinkSync, writeSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

/**
 * Overwrite a file with random bytes before unlinking,
 * preventing recovery from disk.
 */
export function secureDelete(filePath: string): void {
  if (!existsSync(filePath)) return;
  const stats = statSync(filePath);
  const size = stats.size;
  if (size > 0) {
    const fd = openSync(filePath, 'w');
    writeSync(fd, randomBytes(size));
    closeSync(fd);
  }
  unlinkSync(filePath);
}
