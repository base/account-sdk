import {
  logDialogueActionClicked,
  logDialogueDismissed,
  logDialogueShown,
} from ':core/telemetry/events/dialogues.js';
import { initDialogue } from ':ui/Dialogue/index.js';

export async function presentAddOwnerDialog() {
  const dialogue = initDialogue();
  return new Promise<'authenticate' | 'cancel'>((resolve) => {
    logDialogueShown({ dialogueContext: 'sub_account_add_owner' });
    dialogue.presentItem({
      title: 'App requires a signer update',
      message: 'App requires a signer update',
      onClose: () => {
        logDialogueDismissed({ dialogueContext: 'sub_account_add_owner' });
        resolve('cancel');
      },
      actionItems: [
        {
          text: 'Confirm',
          variant: 'primary',
          onClick: () => {
            logDialogueActionClicked({
              dialogueContext: 'sub_account_add_owner',
              dialogueAction: 'confirm',
            });
            dialogue.clear();
            resolve('authenticate');
          },
        },
        {
          text: 'Not now',
          variant: 'secondary',
          onClick: () => {
            logDialogueActionClicked({
              dialogueContext: 'sub_account_add_owner',
              dialogueAction: 'cancel',
            });
            dialogue.clear();
            resolve('cancel');
          },
        },
      ],
    });
  });
}
