import type { PaymentResult } from '@base/account-sdk';
import { pay } from '@base/account-sdk';
import { useCallback, useState } from 'react';
import { transformImports } from '../utils/codeTransform';
import { useConsoleCapture } from './useConsoleCapture';

export const useCodeExecution = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);
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
        // Create a function from the user's code with additional context
        const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

        // Create a context object with commonly used utilities
        const context = {
          pay,
        };

        // Transform imports in the code
        const transformedCode = transformImports(code);

        // Create function with destructured context
        const userFunction = new AsyncFunction(...Object.keys(context), transformedCode);

        const paymentResult = await userFunction(...Object.values(context));

        // biome-ignore lint/suspicious/noConsole: Useful for debugging payment results
        console.log('Payment result:', paymentResult);
        
        setResult(paymentResult);
        setConsoleOutput(logs);
      } catch (error) {
        console.error('Execution error:', error);

        let errorMessage = 'Unknown error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }

        setError(errorMessage);
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
