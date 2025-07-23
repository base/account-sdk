/**
 * Browser entry point for Base Pay SDK
 * This file exposes the payment interface to the global window object
 */

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

// Create the base namespace with payment methods
const base = {
  pay,
  getPaymentStatus,
  constants: {
    CHAIN_IDS,
    TOKENS,
  },
  // Export types as documentation
  types: {} as {
    PaymentOptions: PaymentOptions;
    PaymentResult: PaymentResult;
    PaymentStatusOptions: PaymentStatusOptions;
    PaymentStatus: PaymentStatus;
    InfoRequest: InfoRequest;
    PayerInfo: PayerInfo;
  }
};

// Expose to global window object
if (typeof window !== 'undefined') {
  (window as any).base = base;
}

// Also export for module usage
export default base;
export { CHAIN_IDS, getPaymentStatus, pay, TOKENS };
export type {
    InfoRequest,
    PayerInfo, PaymentOptions,
    PaymentResult,
    PaymentStatus,
    PaymentStatusOptions
};

