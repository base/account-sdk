/**
 * Custom error classes for the Account SDK.
 *
 * These provide structured, actionable error messages to help developers
 * quickly identify what went wrong and how to fix it.
 */

/**
 * Thrown when user-provided input fails validation (amounts, addresses, parameters).
 */
export class ValidationError extends Error {
  readonly name = 'ValidationError';

  constructor(
    message: string,
    public readonly field?: string,
    public readonly providedValue?: unknown,
    public readonly expectedFormat?: string,
  ) {
    super(message);
  }
}

/**
 * Thrown when a payment operation fails (user ops, charge, subscribe).
 */
export class PaymentError extends Error {
  readonly name = 'PaymentError';

  constructor(
    message: string,
    public readonly code?: string,
    public readonly retryable: boolean = false,
  ) {
    super(message);
  }
}
