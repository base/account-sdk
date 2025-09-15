import { ActionType, AnalyticsEventImportance, ComponentType, logEvent } from '../logEvent.js';

export const logPopupSetupStarted = (mode: 'embedded' | 'popup' = 'popup') => {
  logEvent(
    'communicator.popup_setup.started',
    {
      action: ActionType.unknown,
      componentType: ComponentType.unknown,
      mode,
    },
    AnalyticsEventImportance.high
  );
};

export const logPopupSetupCompleted = (mode: 'embedded' | 'popup' = 'popup') => {
  logEvent(
    'communicator.popup_setup.completed',
    {
      action: ActionType.unknown,
      componentType: ComponentType.unknown,
      mode,
    },
    AnalyticsEventImportance.high
  );
};

export const logPopupUnloadReceived = () => {
  logEvent(
    'communicator.popup_unload.received',
    {
      action: ActionType.unknown,
      componentType: ComponentType.unknown,
    },
    AnalyticsEventImportance.high
  );
};

export const logIframeTimeout = () => {
  logEvent(
    'communicator.iframe.timeout',
    {
      action: ActionType.unknown,
      componentType: ComponentType.unknown,
    },
    AnalyticsEventImportance.high
  );
};

export const logIframeVisible = () => {
  logEvent(
    'communicator.iframe.visible',
    {
      action: ActionType.render,
      componentType: ComponentType.unknown,
    },
    AnalyticsEventImportance.high
  );
};

export const logIframeCreateStart = () => {
  logEvent(
    'communicator.iframe.create_start',
    {
      action: ActionType.unknown,
      componentType: ComponentType.unknown,
    },
    AnalyticsEventImportance.high
  );
};

export const logIframeCreateSuccess = () => {
  logEvent(
    'communicator.iframe.create_success',
    {
      action: ActionType.unknown,
      componentType: ComponentType.unknown,
    },
    AnalyticsEventImportance.high
  );
};

export const logIframeCreateFailure = () => {
  logEvent(
    'communicator.iframe.create_failure',
    {
      action: ActionType.unknown,
      componentType: ComponentType.unknown,
    },
    AnalyticsEventImportance.high
  );
};

export const logIframeDestroyed = () => {
  logEvent(
    'communicator.iframe.destroyed',
    {
      action: ActionType.unknown,
      componentType: ComponentType.unknown,
    },
    AnalyticsEventImportance.high
  );
};
