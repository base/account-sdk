// Transform static imports to dynamic imports or handle special cases
export const transformImports = (code: string): string => {
  let transformedCode = code;

  // Special handling for @base-org/account-sdk - just remove the import line
  // since pay and getPaymentStatus are provided in the context
  transformedCode = transformedCode.replace(
    /import\s+{[^}]*(?:pay|getPaymentStatus)[^}]*}\s+from\s+['"]@base-org\/account-sdk['"]\s*;?\s*\n?/g,
    ''
  );

  // Also handle legacy @coinbase/base-pay-sdk imports if any
  transformedCode = transformedCode.replace(
    /import\s+{[^}]*(?:payToAddress|getPaymentStatus)[^}]*}\s+from\s+['"]@coinbase\/base-pay-sdk['"]\s*;?\s*\n?/g,
    ''
  );

  // Transform other imports: import { x } from 'module' -> const { x } = await import('module')
  const importRegex = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
  transformedCode = transformedCode.replace(importRegex, "const {$1} = await import('$2')");

  // Transform: import x from 'module' -> const x = (await import('module')).default
  const defaultImportRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
  transformedCode = transformedCode.replace(
    defaultImportRegex,
    "const $1 = (await import('$2')).default"
  );

  // Transform: import * as x from 'module' -> const x = await import('module')
  const namespaceImportRegex = /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
  transformedCode = transformedCode.replace(namespaceImportRegex, "const $1 = await import('$2')");

  return transformedCode;
};

// Helper function to safely stringify objects with circular references
export const safeStringify = (obj: unknown, indent = 2): string => {
  const seen = new WeakSet();
  return JSON.stringify(
    obj,
    (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    },
    indent
  );
};
