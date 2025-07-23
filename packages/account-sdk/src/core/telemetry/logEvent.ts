import { PACKAGE_NAME, PACKAGE_VERSION } from ':core/constants.js';
import { store } from ':store/store.js';

enum ComponentType {
  unknown = 'unknown',
  banner = 'banner',
  button = 'button',
  card = 'card',
  chart = 'chart',
  content_script = 'content_script',
  dropdown = 'dropdown',
  link = 'link',
  page = 'page',
  modal = 'modal',
  table = 'table',
  search_bar = 'search_bar',
  service_worker = 'service_worker',
  text = 'text',
  text_input = 'text_input',
  tray = 'tray',
  checkbox = 'checkbox',
  icon = 'icon',
}

enum ActionType {
  unknown = 'unknown',
  blur = 'blur',
  click = 'click',
  change = 'change',
  dismiss = 'dismiss',
  focus = 'focus',
  hover = 'hover',
  select = 'select',
  measurement = 'measurement',
  move = 'move',
  process = 'process',
  render = 'render',
  scroll = 'scroll',
  view = 'view',
  search = 'search',
  keyPress = 'keyPress',
  error = 'error',
}

enum AnalyticsEventImportance {
  low = 'low',
  high = 'high',
}

type CCAEventData = {
  // Standard Attributes
  action: ActionType;
  componentType: ComponentType;
  // Metadata
  sdkVersion?: string;
  appName?: string;
  appOrigin?: string;
  appPreferredSigner?: string;
  // Custom Attributes
  signerType?: 'base-account'; // backwards compatibility
  method?: string; // RPC method
  correlationId?: string;
  errorMessage?: string;
  dialogContext?: string;
  dialogAction?: string;
  enableAutoSubAccounts?: boolean;
  // Payment-specific attributes
  amount?: string;
  testnet?: boolean;
  status?: string;
};

type AnalyticsEventData = {
  name: string;
  event: CCAEventData;
  importance: AnalyticsEventImportance;
};

type LogEvent = (
  eventName: string,
  eventData: CCAEventData,
  importance?: AnalyticsEventImportance
) => void;

export function logEvent(
  name: string,
  event: CCAEventData,
  importance: AnalyticsEventImportance | undefined
) {
  // Surface errors to console when requested by the integrator.
  try {
    const pref = store.config.get().preference as { consoleErrors?: boolean } | undefined;
    if (pref?.consoleErrors && (event.action === ActionType.error || event.errorMessage)) {
      // eslint-disable-next-line no-console
      console.error(`[BaseAccountSDK] ${name}:`, { ...event, importance });
    }
  } catch (_) {
    // Best-effort console logging – do not break original flow.
  }

  if (window.ClientAnalytics) {
    window.ClientAnalytics?.logEvent(
      name,
      {
        ...event,
        sdkVersion: PACKAGE_VERSION,
        sdkName: PACKAGE_NAME,
        appName: store.config.get().metadata?.appName ?? '',
        appOrigin: window.location.origin,
      },
      importance
    );
  }
}

export function identify(event: CCAEventData) {
  if (window.ClientAnalytics) {
    window.ClientAnalytics?.identify(event);
  }
}

export { ActionType, AnalyticsEventImportance, ComponentType };
export type { AnalyticsEventData, CCAEventData, LogEvent };

