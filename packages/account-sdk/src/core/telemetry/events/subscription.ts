import { ActionType, AnalyticsEventImportance, ComponentType, logEvent } from '../logEvent.js';

/**
 * Logs when a subscription request is started
 */
export function logSubscriptionStarted(data: {
  amount: string;
  periodInDays: number;
  testnet: boolean;
  correlationId: string;
}) {
  logEvent(
    `subscription.subscribe.started.${data.periodInDays}days`,
    {
      action: ActionType.process,
      componentType: ComponentType.unknown,
      method: 'subscribe',
      correlationId: data.correlationId,
      signerType: 'base-account',
      amount: data.amount,
      testnet: data.testnet,
    },
    AnalyticsEventImportance.high
  );
}

/**
 * Logs when a subscription request is completed successfully
 */
export function logSubscriptionCompleted(data: {
  amount: string;
  periodInDays: number;
  testnet: boolean;
  correlationId: string;
  permissionHash: string;
}) {
  logEvent(
    `subscription.subscribe.completed.${data.periodInDays}days`,
    {
      action: ActionType.process,
      componentType: ComponentType.unknown,
      method: 'subscribe',
      correlationId: data.correlationId,
      signerType: 'base-account',
      amount: data.amount,
      testnet: data.testnet,
      status: data.permissionHash, // Using status field to store permission hash
    },
    AnalyticsEventImportance.high
  );
}

/**
 * Logs when a subscription request fails
 */
export function logSubscriptionError(data: {
  amount: string;
  periodInDays: number;
  testnet: boolean;
  correlationId: string;
  errorMessage: string;
}) {
  logEvent(
    `subscription.subscribe.error.${data.periodInDays}days`,
    {
      action: ActionType.error,
      componentType: ComponentType.unknown,
      method: 'subscribe',
      correlationId: data.correlationId,
      signerType: 'base-account',
      amount: data.amount,
      testnet: data.testnet,
      errorMessage: data.errorMessage,
    },
    AnalyticsEventImportance.high
  );
}
