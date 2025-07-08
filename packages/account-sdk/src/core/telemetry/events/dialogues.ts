import { ActionType, AnalyticsEventImportance, ComponentType, logEvent } from '../logEvent.js';

type DialogueContext =
  | 'popup_blocked'
  | 'sub_account_add_owner'
  | 'sub_account_insufficient_balance';

export const logDialogueShown = ({ dialogueContext }: { dialogueContext: DialogueContext }) => {
  logEvent(
    `dialogue.${dialogueContext}.shown`,
    {
      action: ActionType.render,
      componentType: ComponentType.modal,
      dialogueContext,
    },
    AnalyticsEventImportance.high
  );
};

export const logDialogueDismissed = ({ dialogueContext }: { dialogueContext: DialogueContext }) => {
  logEvent(
    `dialogue.${dialogueContext}.dismissed`,
    {
      action: ActionType.dismiss,
      componentType: ComponentType.modal,
      dialogueContext,
    },
    AnalyticsEventImportance.high
  );
};

type GenericDialogueAction = 'confirm' | 'cancel';
type SubAccountInsufficientBalanceDialogueAction = 'create_permission' | 'continue_in_popup';

export const logDialogueActionClicked = ({
  dialogueContext,
  dialogueAction,
}: {
  dialogueContext: DialogueContext;
  dialogueAction: GenericDialogueAction | SubAccountInsufficientBalanceDialogueAction;
}) => {
  logEvent(
    `dialogue.${dialogueContext}.action_clicked`,
    {
      action: ActionType.click,
      componentType: ComponentType.button,
      dialogueContext,
      dialogueAction,
    },
    AnalyticsEventImportance.high
  );
};
