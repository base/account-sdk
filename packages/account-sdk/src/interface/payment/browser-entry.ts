/**
 * Browser entry point for Base Pay SDK
 * This file exposes the payment interface to the global window object
 */

import { base } from './base.js';
import { CHAIN_IDS, TOKENS } from './constants.js';
import { getPaymentStatus } from './getPaymentStatus.js';
import { pay } from './pay.js';
import type {
  InfoRequest,
  PayerInfo,
  PaymentOptions,
  PaymentResult,
  PaymentStatus,
  PaymentStatusOptions
} from './types.js';

// Expose to global window object
if (typeof window !== 'undefined') {
  (window as any).base = base;
}

// Export for module usage
export { base, CHAIN_IDS, getPaymentStatus, pay, TOKENS };
export type {
  InfoRequest,
  PayerInfo, PaymentOptions,
  PaymentResult,
  PaymentStatus,
  PaymentStatusOptions
};

