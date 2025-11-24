/**
 * Extracts the paymaster URL from payWithToken code
 * @param code - The code string to extract from
 * @returns The paymaster URL if found, undefined otherwise
 */
export function extractPaymasterUrl(code: string): string | undefined {
  // Match paymaster.url in the code - handle various whitespace patterns
  const paymasterMatch = code.match(/paymaster\s*:\s*\{[\s\S]*?url\s*:\s*['"]([^'"]+)['"]/);
  return paymasterMatch ? paymasterMatch[1] : undefined;
}

/**
 * Updates the paymaster URL in payWithToken code
 * @param code - The code string to update
 * @param paymasterUrl - The new paymaster URL to use
 * @returns The updated code with the new paymaster URL
 */
export function updatePaymasterUrl(code: string, paymasterUrl: string): string {
  // Check if paymaster already exists in the code
  const hasPaymaster = /paymaster\s*:\s*\{/.test(code);
  
  if (!hasPaymaster) {
    // If no paymaster exists, we need to add it
    // Find the payWithToken call and locate where to insert paymaster
    const payWithTokenMatch = code.match(/base\.payWithToken\s*\(\s*\{/);
    if (!payWithTokenMatch) {
      return code; // Can't find payWithToken call
    }

    const startIndex = payWithTokenMatch.index! + payWithTokenMatch[0].length;
    let braceDepth = 1;
    let i = startIndex;

    // Find the closing brace of the payWithToken options object
    while (i < code.length && braceDepth > 0) {
      if (code[i] === '{') {
        braceDepth++;
      } else if (code[i] === '}') {
        braceDepth--;
        if (braceDepth === 0) {
          // Found the closing brace - insert before it
          const beforeBrace = code.substring(0, i).trimEnd();
          const afterBrace = code.substring(i);

          // Check if we need a comma before paymaster
          const needsComma = !beforeBrace.endsWith(',') && 
                            !beforeBrace.endsWith('{') &&
                            beforeBrace.length > 0;

          const paymasterBlock = `,
    paymaster: {
      url: '${paymasterUrl}'
    }`;

          return beforeBrace + (needsComma ? paymasterBlock : paymasterBlock.substring(1)) + afterBrace;
        }
      }
      i++;
    }
  } else {
    // Update existing paymaster URL - handle various whitespace patterns
    const updatedCode = code.replace(
      /(paymaster\s*:\s*\{[\s\S]*?url\s*:\s*['"])[^'"]+(['"])/,
      `$1${paymasterUrl}$2`
    );
    return updatedCode;
  }

  return code;
}

