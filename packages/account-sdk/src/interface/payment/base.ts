/**
 * Base payment interface export
 * 
 * This module re-exports from base.node.js to maintain backward compatibility
 * for direct imports of this specific file. However, note that:
 * 
 * - The main package export (@base-org/account) uses base.browser.js for proper tree-shaking
 * - Server-side code requiring CDP SDK methods should use @base-org/account/payment/node
 * - This file is only used when explicitly importing from './base.js'
 */
export { base } from './base.node.js';
