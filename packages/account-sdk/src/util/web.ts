import { PACKAGE_NAME, PACKAGE_VERSION } from ':core/constants.js';
import { standardErrors } from ':core/error/errors.js';
import { logIframeCreateFailure, logIframeCreateStart, logIframeCreateSuccess, logIframeDestroyed } from ':core/telemetry/events/communicator.js';
import { logDialogActionClicked, logDialogShown } from ':core/telemetry/events/dialog.js';
import { externalCorrelationIds } from ':store/external-correlation-id/store.js';
import { store } from ':store/store.js';
import { initDialog } from '../ui/Dialog/index.js';
import { getCrossOriginOpenerPolicy } from './checkCrossOriginOpenerPolicy.js';

const POPUP_WIDTH = 420;
const POPUP_HEIGHT = 700;

const POPUP_BLOCKED_TITLE = '{app} wants to continue in Base Account';
const POPUP_BLOCKED_MESSAGE = 'This action requires your permission to open a new window.';

// iFrame constants for embedded mode
export const IFRAME_ID = 'keys-frame';
const IFRAME_ALLOW = 'publickey-credentials-get; publickey-credentials-create; clipboard-write';
const IFRAME_STYLES = {
  overflow: 'hidden',
  overflowX: 'hidden',
  overflowY: 'hidden',
  height: '100%',
  width: '100%',
  position: 'absolute',
  top: '0px',
  left: '0px',
  right: '0px',
  bottom: '0px',
  backgroundColor: 'transparent',
  border: 'none',
  'z-index': '1000',
  // The iframe is initially hidden and then made 
  // visible once the popup is loaded
  opacity: '0',
} as const;

export function openPopup(url: URL, mode: 'embedded' | 'popup'): Promise<Window> {
  appendAppInfoQueryParams(url);

  if (mode === 'embedded') {
    return Promise.resolve(createEmbeddedIframe(url));
  }

  const left = (window.innerWidth - POPUP_WIDTH) / 2 + window.screenX;
  const top = (window.innerHeight - POPUP_HEIGHT) / 2 + window.screenY;

  function tryOpenPopup(): Window | null {
    const popupId = `wallet_${crypto.randomUUID()}`;
    const popup = window.open(
      url,
      popupId,
      `width=${POPUP_WIDTH}, height=${POPUP_HEIGHT}, left=${left}, top=${top}`
    );

    popup?.focus();

    if (!popup) {
      return null;
    }

    return popup;
  }

  const popup = tryOpenPopup();

  // If the popup was blocked, show a snackbar with a retry button
  if (!popup) {
    return openPopupWithDialog(tryOpenPopup);
  }

  return Promise.resolve(popup);
}

export function closePopup(popup: Window | null) {
  if (!popup) {
    return;
  }

  // If embedded, remove the iframe element
  const iframe = document.getElementById(IFRAME_ID) as HTMLIFrameElement;
  if (iframe && iframe.contentWindow === popup) {
    iframe.style.transition = 'opacity 0.3s ease-in-out';
    iframe.style.opacity = '0';
    
    setTimeout(() => {
      iframe.remove();
      logIframeDestroyed();
    }, 300);
    return;
  }

  // Otherwise, close the popup
  if (!popup.closed) {
    popup.close();
  }
}

function appendAppInfoQueryParams(url: URL) {
  const externalCorrelationId = externalCorrelationIds.get();
  const params = {
    sdkName: PACKAGE_NAME,
    sdkVersion: PACKAGE_VERSION,
    origin: window.location.origin,
    coop: getCrossOriginOpenerPolicy(),
    ...(externalCorrelationId && { externalCorrelationId }),
  };

  for (const [key, value] of Object.entries(params)) {
    if (!url.searchParams.has(key)) {
      url.searchParams.append(key, value.toString());
    }
  }
}

function openPopupWithDialog(tryOpenPopup: () => Window | null) {
  const dappName = store.config.get().metadata?.appName ?? 'App';
  const dialog = initDialog();
  return new Promise<Window>((resolve, reject) => {
    logDialogShown({ dialogContext: 'popup_blocked' });
    dialog.presentItem({
      title: POPUP_BLOCKED_TITLE.replace('{app}', dappName),
      message: POPUP_BLOCKED_MESSAGE,
      onClose: () => {
        logDialogActionClicked({
          dialogContext: 'popup_blocked',
          dialogAction: 'cancel',
        });
        reject(standardErrors.rpc.internal('Popup window was blocked'));
      },
      actionItems: [
        {
          text: 'Try again',
          variant: 'primary',
          onClick: () => {
            logDialogActionClicked({
              dialogContext: 'popup_blocked',
              dialogAction: 'confirm',
            });
            const popup = tryOpenPopup();
            if (popup) {
              resolve(popup);
            } else {
              reject(standardErrors.rpc.internal('Popup window was blocked'));
            }
            dialog.clear();
          },
        },
        {
          text: 'Cancel',
          variant: 'secondary',
          onClick: () => {
            logDialogActionClicked({
              dialogContext: 'popup_blocked',
              dialogAction: 'cancel',
            });
            reject(standardErrors.rpc.internal('Popup window was blocked'));
            dialog.clear();
          },
        },
      ],
    });
  });
}

function createEmbeddedIframe(url: URL): Window {
  logIframeCreateStart();
  
  const iframe = document.createElement('iframe');
  iframe.id = IFRAME_ID;
  iframe.allowFullscreen = true;
  iframe.allow = IFRAME_ALLOW;

  iframe.style.cssText = Object.entries(IFRAME_STYLES)
    .map(([key, value]) => `${key}:${value}`)
    .join(';');

  iframe.src = url.toString();
  document.body.appendChild(iframe);

  if (!iframe.contentWindow) {
    logIframeCreateFailure();
    throw standardErrors.rpc.internal('iframe failed to initialize');
  }

  logIframeCreateSuccess();
  return iframe.contentWindow;
}
