import type { PaymentResult, PaymentStatus } from '@base-org/account';
import { getPaymentStatus, pay } from '@base-org/account';
import { useCallback, useState } from 'react';
import { transformAndSanitizeCode } from '../utils/codeTransform';
import { useConsoleCapture } from './useConsoleCapture';

export const useCodeExecution = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PaymentResult | PaymentStatus | null>(null);
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

      try {
        // Sanitize and validate the code first
        const sanitizationResult = transformAndSanitizeCode(code);
        
        if (!sanitizationResult.isValid) {
          // Format validation errors for display
          const errorMessages = sanitizationResult.errors
            .map(err => {
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
          // Namespaced access via base object
          base: {
            pay,
            getPaymentStatus,
          },
        };

        // Use the sanitized code
        const sanitizedCode = sanitizationResult.code;

        // Create function with destructured context
        const userFunction = new AsyncFunction(...Object.keys(context), sanitizedCode);

        const paymentResult = await userFunction(...Object.values(context));

        // biome-ignore lint/suspicious/noConsole: Useful for debugging payment results
        console.log('Payment result:', paymentResult);

        setResult(paymentResult);
        setConsoleOutput(logs);
      } catch (error) {
        console.error('Execution error:', error);

        // Create a more detailed error object/message
        let errorDetails: any = {
          message: 'Unknown error occurred',
          type: 'unknown',
          details: null
        };

        if (error instanceof Error) {
          errorDetails.message = error.message;
          errorDetails.type = error.name || 'Error';
          
          // Check if the error has additional properties (common in SDK errors)
          if ((error as any).code) {
            errorDetails.code = (error as any).code;
          }
          if ((error as any).details) {
            errorDetails.details = (error as any).details;
          }
          if ((error as any).response) {
            errorDetails.response = (error as any).response;
          }
          if ((error as any).statusCode) {
            errorDetails.statusCode = (error as any).statusCode;
          }
          
          // For stack traces in development
          if (process.env.NODE_ENV === 'development' && error.stack) {
            errorDetails.stack = error.stack;
          }
        } else if (typeof error === 'string') {
          errorDetails.message = error;
          errorDetails.type = 'string';
        } else if (error && typeof error === 'object') {
          // Handle plain objects that might be thrown
          errorDetails = {
            ...errorDetails,
            ...error,
            message: (error as any).message || JSON.stringify(error)
          };
        }

        // Set error as JSON string to preserve structure
        setError(JSON.stringify(errorDetails));
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

