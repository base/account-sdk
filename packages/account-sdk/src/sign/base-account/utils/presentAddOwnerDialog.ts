import {
  logDialogActionClicked,
  logDialogDismissed,
  logDialogShown,
} from ':core/telemetry/events/dialog.js';
import { t } from ':i18n/index.js';
import { store } from ':store/store.js';
import { initDialog } from ':ui/Dialog/index.js';

export async function presentAddOwnerDialog() {
  const appName = store.config.get().metadata?.appName ?? 'App';
  const dialog = initDialog();
  return new Promise<'authenticate' | 'cancel'>((resolve) => {
    logDialogShown({ dialogContext: 'sub_account_add_owner' });
    dialog.presentItem({
      title: t('dialog.reauthorize.title', { app: appName }),
      message: t('dialog.reauthorize.message', { app: appName }),
      onClose: () => {
        logDialogDismissed({ dialogContext: 'sub_account_add_owner' });
        resolve('cancel');
      },
      actionItems: [
        {
          text: t('button.continue'),
          variant: 'primary',
          onClick: () => {
            logDialogActionClicked({
              dialogContext: 'sub_account_add_owner',
              dialogAction: 'confirm',
            });
            dialog.clear();
            resolve('authenticate');
          },
        },
        {
          text: t('button.not_now'),
          variant: 'secondary',
          onClick: () => {
            logDialogActionClicked({
              dialogContext: 'sub_account_add_owner',
              dialogAction: 'cancel',
            });
            dialog.clear();
            resolve('cancel');
          },
        },
      ],
    });
  });
}
