/**
 * Extract a string message from an unknown caught value without throwing.
 */
export const parseErrorMessageFromAny = (error: unknown): string => {
  if (typeof error !== 'object' || error === null || !('message' in error)) {
    return '';
  }

  const message = (error as { message?: unknown }).message;
  return typeof message === 'string' ? message : '';
};
