import { RequestArguments } from ':core/provider/interface.js';
import {
  logHandshakeCompleted,
  logHandshakeError,
  logHandshakeStarted,
  logRequestCompleted,
  logRequestError,
  logRequestStarted,
} from ':core/telemetry/events/scw-signer.js';
import { parseErrorMessageFromAny } from ':core/telemetry/utils.js';
import { correlationIds } from ':store/correlation-ids/store.js';

type WithSignerMeasurementOptions = {
  isEphemeral?: boolean;
};

/**
 * Higher-order function that wraps a handshake handler with telemetry.
 *
 * Handles:
 * - Retrieving correlation ID (set by provider)
 * - Logging handshake start/completed/error
 *
 * @param getOptions - Getter function for options (evaluated at call time, not definition time)
 * @param handler - The actual handshake handler function
 * @returns Wrapped handler with measurement instrumentation
 */
export function withHandshakeMeasurement(
  getOptions: () => WithSignerMeasurementOptions,
  handler: (args: RequestArguments) => Promise<void>
): (args: RequestArguments) => Promise<void> {
  return async (args: RequestArguments): Promise<void> => {
    const options = getOptions();
    const correlationId = correlationIds.get(args);
    const measurementParams = {
      method: args.method,
      correlationId,
      isEphemeral: !!options.isEphemeral,
    };
    logHandshakeStarted(measurementParams);

    try {
      await handler(args);
      logHandshakeCompleted(measurementParams);
    } catch (error) {
      logHandshakeError({
        ...measurementParams,
        errorMessage: parseErrorMessageFromAny(error),
      });
      throw error;
    }
  };
}

/**
 * Higher-order function that wraps a signer request handler with telemetry.
 *
 * Handles:
 * - Retrieving correlation ID (set by provider)
 * - Logging request start/completed/error
 *
 * Note: This is different from the provider's withMeasurement - it doesn't
 * generate or clean up correlation IDs (the provider does that).
 *
 * @param getOptions - Getter function for options (evaluated at call time, not definition time)
 * @param handler - The actual request handler function
 * @returns Wrapped handler with measurement instrumentation
 */
export function withSignerRequestMeasurement(
  getOptions: () => WithSignerMeasurementOptions,
  handler: <T>(args: RequestArguments) => Promise<T>
): <T>(args: RequestArguments) => Promise<T> {
  return async <T>(args: RequestArguments): Promise<T> => {
    const options = getOptions();
    const correlationId = correlationIds.get(args);
    const measurementParams = {
      method: args.method,
      correlationId,
      isEphemeral: !!options.isEphemeral,
    };
    logRequestStarted(measurementParams);

    try {
      const result = await handler<T>(args);
      logRequestCompleted(measurementParams);
      return result;
    } catch (error) {
      logRequestError({
        ...measurementParams,
        errorMessage: parseErrorMessageFromAny(error),
      });
      throw error;
    }
  };
}

