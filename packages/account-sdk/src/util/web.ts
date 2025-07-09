import { PACKAGE_NAME, PACKAGE_VERSION } from ':core/constants.js';
import { standardErrors } from ':core/error/errors.js';
import { logDialogueActionClicked, logDialogueShown } from ':core/telemetry/events/dialogues.js';
import { store } from ':store/store.js';
import { initDialogue } from '../ui/Dialogue/index.js';
import { getCrossOriginOpenerPolicy } from './checkCrossOriginOpenerPolicy.js';

const POPUP_WIDTH = 420;
const POPUP_HEIGHT = 700;

const POPUP_BLOCKED_TITLE = 'Proceed in Base Account';
const POPUP_BLOCKED_MESSAGE =
  '{app} is requesting to proceed in your Base Account. Would you like to proceed?';

export function openPopup(url: URL): Promise<Window> {
  const left = (window.innerWidth - POPUP_WIDTH) / 2 + window.screenX;
  const top = (window.innerHeight - POPUP_HEIGHT) / 2 + window.screenY;
  appendAppInfoQueryParams(url);

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

  const popup = null;

  // If the popup was blocked, show a snackbar with a retry button
  if (!popup) {
    return openPopupWithDialogue(tryOpenPopup);
  }

  return Promise.resolve(popup);
}

export function closePopup(popup: Window | null) {
  if (popup && !popup.closed) {
    popup.close();
  }
}

function appendAppInfoQueryParams(url: URL) {
  const params = {
    sdkName: PACKAGE_NAME,
    sdkVersion: PACKAGE_VERSION,
    origin: window.location.origin,
    coop: getCrossOriginOpenerPolicy(),
  };

  for (const [key, value] of Object.entries(params)) {
    if (!url.searchParams.has(key)) {
      url.searchParams.append(key, value.toString());
    }
  }
}

function openPopupWithDialogue(tryOpenPopup: () => Window | null) {
  const dappName = store.config.get().metadata?.appName ?? 'App';
  const dialogue = initDialogue();
  return new Promise<Window>((resolve, reject) => {
    logDialogueShown({ dialogueContext: 'popup_blocked' });
    dialogue.presentItem({
      title: POPUP_BLOCKED_TITLE,
      message: POPUP_BLOCKED_MESSAGE.replace('{app}', dappName),
      onClose: () => {
        logDialogueActionClicked({
          dialogueContext: 'popup_blocked',
          dialogueAction: 'cancel',
        });
        reject(standardErrors.rpc.internal('Popup window was blocked'));
      },
      actionItems: [
        {
          text: 'Try again',
          variant: 'primary',
          onClick: () => {
            logDialogueActionClicked({
              dialogueContext: 'popup_blocked',
              dialogueAction: 'confirm',
            });
            const popup = tryOpenPopup();
            if (popup) {
              resolve(popup);
            } else {
              reject(standardErrors.rpc.internal('Popup window was blocked'));
            }
            dialogue.clear();
          },
        },
        {
          text: 'Cancel',
          variant: 'secondary',
          onClick: () => {
            logDialogueActionClicked({
              dialogueContext: 'popup_blocked',
              dialogueAction: 'cancel',
            });
            reject(standardErrors.rpc.internal('Popup window was blocked'));
            dialogue.clear();
          },
        },
      ],
    });
  });
}
