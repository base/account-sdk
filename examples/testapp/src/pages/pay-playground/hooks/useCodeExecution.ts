import type { PaymentResult, PaymentStatus, SubscriptionResult, SubscriptionStatus } from '@base-org/account';
import { getPaymentStatus, getSubscriptionStatus, pay, subscribe } from '@base-org/account';
import { useCallback, useState } from 'react';
import { transformAndSanitizeCode } from '../utils/codeTransform';
import { useConsoleCapture } from './useConsoleCapture';

export const useCodeExecution = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PaymentResult | PaymentStatus | SubscriptionResult | SubscriptionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const { captureConsole } = useConsoleCapture();

  const executeCode = useCallback(
    async (code: string) => {
      setIsLoading(true);
      setResult(null);
      setError(null);
      setConsoleOutput([]);

      const logs: string[] = [];
      const restoreConsole = captureConsole((message) => logs.push(message));

      // Declare sanitizedCode at a higher scope so it's available in catch block
      let sanitizedCode: string | undefined;

      try {
        // Sanitize and validate the code first
        const sanitizationResult = transformAndSanitizeCode(code);

        if (!sanitizationResult.isValid) {
          // Format validation errors for display
          const errorMessages = sanitizationResult.errors
            .map((err) => {
              if (err.line) {
                return `Line ${err.line}: ${err.message}`;
              }
              return err.message;
            })
            .join('\n');

          setError(`Code validation failed:\n${errorMessages}`);
          setConsoleOutput(logs);
          return;
        }

        // Create a function from the sanitized code with additional context
        const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

        // Create a context object with commonly used utilities
        const context = {
          // Individual functions for direct access
          pay,
          getPaymentStatus,
          subscribe,
          getSubscriptionStatus,
          // Namespaced access via base object
          base: {
            pay,
            getPaymentStatus,
            subscribe,
            subscription: {
              subscribe,
              getStatus: getSubscriptionStatus,
            },
          },
        };

        // Use the sanitized code
        sanitizedCode = sanitizationResult.code;

        // Create function with destructured context
        const userFunction = new AsyncFunction(...Object.keys(context), sanitizedCode);

        // Log execution start
        
        const paymentResult = await userFunction(...Object.values(context));

        // biome-ignore lint/suspicious/noConsole: Useful for debugging payment results
        console.log('Payment result:', paymentResult);
      

        setResult(paymentResult);
        setConsoleOutput(logs);
      } catch (error) {
        // Special logging for subscription failures
        if (sanitizedCode && sanitizedCode.includes('subscribe')) {
          console.error('ERROR: Subscription failed:', error instanceof Error ? error.message : String(error));
        } else if (sanitizedCode && sanitizedCode.includes('pay')) {
          console.error('ERROR: Payment failed:', error instanceof Error ? error.message : String(error));
        }
        
        console.error('Execution error:', error);
        console.error('ERROR: Execution error:', JSON.stringify(error, null, 2));

        // Create a more detailed error object/message
        interface ErrorDetails {
          message: string;
          type: string;
          details?: unknown;
          code?: string | number;
          response?: unknown;
          statusCode?: number;
          stack?: string;
          rawError?: unknown;
        }
        let errorDetails: ErrorDetails = {
          message: 'Unknown error occurred',
          type: 'unknown',
          details: null,
        };

        if (error instanceof Error) {
          errorDetails.message = error.message;
          errorDetails.type = error.name || 'Error';

          // Check if the error has additional properties (common in SDK errors)
          const errorObj = error as {
            code?: string | number;
            details?: unknown;
            response?: unknown;
            statusCode?: number;
          };
          if (errorObj.code) {
            errorDetails.code = errorObj.code;
          }
          if (errorObj.details) {
            errorDetails.details = errorObj.details;
          }
          if (errorObj.response) {
            errorDetails.response = errorObj.response;
          }
          if (errorObj.statusCode) {
            errorDetails.statusCode = errorObj.statusCode;
          }

          // Always include stack trace for better debugging
          if (error.stack) {
            errorDetails.stack = error.stack;
            // Also log the stack trace to console for immediate visibility
            console.error('Stack trace:', error.stack);
          }
        } else if (typeof error === 'string') {
          errorDetails.message = error;
          errorDetails.type = 'string';
        } else if (error && typeof error === 'object') {
          // Handle plain objects that might be thrown
          errorDetails = {
            ...errorDetails,
            ...error,
            message: (error as { message?: string }).message || JSON.stringify(error),
          };
        }
        
        // Store the raw error for complete debugging info
        errorDetails.rawError = error;

        // Set error as JSON string to preserve structure
        setError(JSON.stringify(errorDetails, null, 2));
        setConsoleOutput(logs);
      } finally {
        restoreConsole();
        setIsLoading(false);
      }
    },
    [captureConsole]
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setConsoleOutput([]);
  }, []);

  return {
    isLoading,
    result,
    error,
    consoleOutput,
    executeCode,
    reset,
  };
};
