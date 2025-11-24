/**
 * Adds or removes payerInfo from payWithToken code
 * @param code - The current code string
 * @param includePayerInfo - Whether to include payerInfo
 * @returns The modified code with payerInfo added or removed
 */
export function togglePayerInfoInCode(code: string, includePayerInfo: boolean): string {
  // Check if code already has payerInfo
  const hasPayerInfo = /payerInfo\s*:\s*\{/.test(code);

  if (includePayerInfo && !hasPayerInfo) {
    // Add payerInfo before the closing brace of the payWithToken options object
    const payerInfoBlock = `,
    payerInfo: {
      requests: [
        { type: 'name'},
        { type: 'email' },
        { type: 'phoneNumber', optional: true },
        { type: 'physicalAddress', optional: true },
        { type: 'onchainAddress' }
      ]
    }`;

    // Find the payWithToken call and locate the closing brace of its options object
    // Look for base.payWithToken({ ... })
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

          // Check if we need a comma before payerInfo
          const needsComma = !beforeBrace.endsWith(',') && 
                            !beforeBrace.endsWith('{') &&
                            beforeBrace.length > 0;

          return beforeBrace + (needsComma ? payerInfoBlock : payerInfoBlock.substring(1)) + afterBrace;
        }
      }
      i++;
    }
  } else if (!includePayerInfo && hasPayerInfo) {
    // Remove payerInfo block using a regex that handles nested objects
    // Match: comma, whitespace, payerInfo:, whitespace, {, nested content, }
    // The nested content includes requests array with nested objects
    let modifiedCode = code;

    // First try to match payerInfo with proper nested structure
    // This regex matches from the comma before payerInfo to the closing brace
    const payerInfoRegex = /,\s*payerInfo\s*:\s*\{[\s\S]*?requests\s*:\s*\[[\s\S]*?\][\s\S]*?\}/;
    modifiedCode = modifiedCode.replace(payerInfoRegex, '');

    // If that didn't work, try a simpler pattern
    if (modifiedCode === code) {
      // Fallback: match payerInfo property more broadly
      const fallbackRegex = /,\s*payerInfo\s*:\s*\{[^}]*\{[^}]*\}[^}]*\}/s;
      modifiedCode = modifiedCode.replace(fallbackRegex, '');
    }

    // Clean up formatting issues
    // Remove double commas
    modifiedCode = modifiedCode.replace(/,\s*,/g, ',');
    // Remove trailing comma before closing brace
    modifiedCode = modifiedCode.replace(/,\s*}/g, '}');
    // Remove leading comma after opening brace
    modifiedCode = modifiedCode.replace(/{\s*,/g, '{');
    // Clean up extra whitespace
    modifiedCode = modifiedCode.replace(/\n\s*\n\s*\n/g, '\n\n');

    return modifiedCode;
  }

  return code;
}

