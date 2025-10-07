import { store } from ':store/store.js';
import { ActionType, AnalyticsEventImportance, ComponentType, logEvent } from '../logEvent.js';

export const logHandshakeStarted = ({
  method,
  correlationId,
}: {
  method: string;
  correlationId: string | undefined;
}) => {
  const config = store.subAccountsConfig.get();
  logEvent(
    'scw_signer.handshake.started',
    {
      action: ActionType.unknown,
      componentType: ComponentType.unknown,
      method,
      correlationId,
      subAccountCreation: config?.creation,
      subAccountDefaultAccount: config?.defaultAccount,
      subAccountFunding: config?.funding,
    },
    AnalyticsEventImportance.high
  );
};

export const logHandshakeError = ({
  method,
  correlationId,
  errorMessage,
}: {
  method: string;
  correlationId: string | undefined;
  errorMessage: string;
}) => {
  const config = store.subAccountsConfig.get();
  logEvent(
    'scw_signer.handshake.error',
    {
      action: ActionType.error,
      componentType: ComponentType.unknown,
      method,
      correlationId,
      errorMessage,
      subAccountCreation: config?.creation,
      subAccountDefaultAccount: config?.defaultAccount,
      subAccountFunding: config?.funding,
    },
    AnalyticsEventImportance.high
  );
};

export const logHandshakeCompleted = ({
  method,
  correlationId,
}: {
  method: string;
  correlationId: string | undefined;
}) => {
  const config = store.subAccountsConfig.get();
  logEvent(
    'scw_signer.handshake.completed',
    {
      action: ActionType.unknown,
      componentType: ComponentType.unknown,
      method,
      correlationId,
      subAccountCreation: config?.creation,
      subAccountDefaultAccount: config?.defaultAccount,
      subAccountFunding: config?.funding,
    },
    AnalyticsEventImportance.high
  );
};

export const logRequestStarted = ({
  method,
  correlationId,
}: {
  method: string;
  correlationId: string | undefined;
}) => {
  const config = store.subAccountsConfig.get();
  logEvent(
    'scw_signer.request.started',
    {
      action: ActionType.unknown,
      componentType: ComponentType.unknown,
      method,
      correlationId,
      subAccountCreation: config?.creation,
      subAccountDefaultAccount: config?.defaultAccount,
      subAccountFunding: config?.funding,
    },
    AnalyticsEventImportance.high
  );
};

export const logRequestError = ({
  method,
  correlationId,
  errorMessage,
}: {
  method: string;
  correlationId: string | undefined;
  errorMessage: string;
}) => {
  const config = store.subAccountsConfig.get();
  logEvent(
    'scw_signer.request.error',
    {
      action: ActionType.error,
      componentType: ComponentType.unknown,
      method,
      correlationId,
      errorMessage,
      subAccountCreation: config?.creation,
      subAccountDefaultAccount: config?.defaultAccount,
      subAccountFunding: config?.funding,
    },
    AnalyticsEventImportance.high
  );
};

export const logRequestCompleted = ({
  method,
  correlationId,
}: {
  method: string;
  correlationId: string | undefined;
}) => {
  const config = store.subAccountsConfig.get();
  logEvent(
    'scw_signer.request.completed',
    {
      action: ActionType.unknown,
      componentType: ComponentType.unknown,
      method,
      correlationId,
      subAccountCreation: config?.creation,
      subAccountDefaultAccount: config?.defaultAccount,
      subAccountFunding: config?.funding,
    },
    AnalyticsEventImportance.high
  );
};
