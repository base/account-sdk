import { logSnackbarActionClicked, logSnackbarShown } from ':core/telemetry/events/snackbar.js';
import { initDialogue } from ':ui/Dialogue/index.js';

export async function presentAddOwnerDialog() {
  const dialogue = initDialogue();
  return new Promise<'authenticate' | 'cancel'>((resolve) => {
    logSnackbarShown({ snackbarContext: 'sub_account_add_owner' });
    dialogue.presentItem({
      title: 'App requires a signer update',
      message: 'App requires a signer update',
      actionItems: [
        {
          text: 'Confirm',
          variant: 'primary',
          onClick: () => {
            logSnackbarActionClicked({
              snackbarContext: 'sub_account_add_owner',
              snackbarAction: 'confirm',
            });
            dialogue.clear();
            resolve('authenticate');
          },
        },
        // {
        //   isRed: true,
        //   info: 'Cancel',
        //   svgWidth: '10',
        //   svgHeight: '11',
        //   path: '',
        //   defaultFillRule: 'evenodd',
        //   defaultClipRule: 'evenodd',
        //   onClick: () => {
        //     logSnackbarActionClicked({
        //       snackbarContext: 'sub_account_add_owner',
        //       snackbarAction: 'cancel',
        //     });
        //     snackbar.clear();
        //     resolve('cancel');
        //   },
        // },
      ],
    });
  });
}
