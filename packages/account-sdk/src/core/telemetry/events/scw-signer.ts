import { store } from ':store/store.js';
import { ActionType, AnalyticsEventImportance, ComponentType, logEvent } from '../logEvent.js';

export const logHandshakeStarted = ({
  method,
  correlationId,
  isEphemeral = false,
}: {
  method: string;
  correlationId: string | undefined;
  isEphemeral?: boolean;
}) => {
  const config = store.subAccountsConfig.get();
  logEvent(
    'scw_signer.handshake.started',
    {
      action: ActionType.unknown,
      componentType: ComponentType.unknown,
      method,
      correlationId,
      isEphemeral,
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
  isEphemeral = false,
}: {
  method: string;
  correlationId: string | undefined;
  errorMessage: string;
  isEphemeral?: boolean;
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
      isEphemeral,
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
  isEphemeral = false,
}: {
  method: string;
  correlationId: string | undefined;
  isEphemeral?: boolean;
}) => {
  const config = store.subAccountsConfig.get();
  logEvent(
    'scw_signer.handshake.completed',
    {
      action: ActionType.unknown,
      componentType: ComponentType.unknown,
      method,
      correlationId,
      isEphemeral,
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
  isEphemeral = false,
}: {
  method: string;
  correlationId: string | undefined;
  isEphemeral?: boolean;
}) => {
  const config = store.subAccountsConfig.get();
  logEvent(
    'scw_signer.request.started',
    {
      action: ActionType.unknown,
      componentType: ComponentType.unknown,
      method,
      correlationId,
      isEphemeral,
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
  isEphemeral = false,
}: {
  method: string;
  correlationId: string | undefined;
  errorMessage: string;
  isEphemeral?: boolean;
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
      isEphemeral,
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
  isEphemeral = false,
}: {
  method: string;
  correlationId: string | undefined;
  isEphemeral?: boolean;
}) => {
  const config = store.subAccountsConfig.get();
  logEvent(
    'scw_signer.request.completed',
    {
      action: ActionType.unknown,
      componentType: ComponentType.unknown,
      method,
      correlationId,
      isEphemeral,
      subAccountCreation: config?.creation,
      subAccountDefaultAccount: config?.defaultAccount,
      subAccountFunding: config?.funding,
    },
    AnalyticsEventImportance.high
  );
};
