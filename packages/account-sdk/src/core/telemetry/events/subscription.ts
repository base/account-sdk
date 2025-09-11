import { ActionType, AnalyticsEventImportance, ComponentType, logEvent } from '../logEvent.js';

/**
 * Logs when a subscription request is started
 */
export function logSubscriptionStarted(data: {
  recurringCharge: string;
  periodInDays: number;
  testnet: boolean;
  correlationId: string;
}) {
  logEvent(
    'subscription.subscribe.started',
    {
      action: ActionType.process,
      componentType: ComponentType.unknown,
      method: 'subscribe',
      correlationId: data.correlationId,
      signerType: 'base-account',
      amount: data.recurringCharge,
      testnet: data.testnet,
      periodInDays: data.periodInDays,
    },
    AnalyticsEventImportance.high
  );
}

/**
 * Logs when a subscription request is completed successfully
 */
export function logSubscriptionCompleted(data: {
  recurringCharge: string;
  periodInDays: number;
  testnet: boolean;
  correlationId: string;
  permissionHash: string;
}) {
  logEvent(
    'subscription.subscribe.completed',
    {
      action: ActionType.process,
      componentType: ComponentType.unknown,
      method: 'subscribe',
      correlationId: data.correlationId,
      signerType: 'base-account',
      amount: data.recurringCharge,
      testnet: data.testnet,
      periodInDays: data.periodInDays,
      status: data.permissionHash, // Using status field to store permission hash
    },
    AnalyticsEventImportance.high
  );
}

/**
 * Logs when a subscription request fails
 */
export function logSubscriptionError(data: {
  recurringCharge: string;
  periodInDays: number;
  testnet: boolean;
  correlationId: string;
  errorMessage: string;
}) {
  logEvent(
    'subscription.subscribe.error',
    {
      action: ActionType.error,
      componentType: ComponentType.unknown,
      method: 'subscribe',
      correlationId: data.correlationId,
      signerType: 'base-account',
      amount: data.recurringCharge,
      testnet: data.testnet,
      periodInDays: data.periodInDays,
      errorMessage: data.errorMessage,
    },
    AnalyticsEventImportance.high
  );
}
