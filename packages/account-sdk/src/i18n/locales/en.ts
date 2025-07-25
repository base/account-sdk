import { AccountSDKTranslationKeys } from '../index.js';

export const en: AccountSDKTranslationKeys = {
  // Dialog messages
  'dialog.base_account': 'Base Account',
  'dialog.signed_in_as': 'Signed in as {username}',
  'dialog.popup_blocked.title': '{app} wants to continue in Base Account',
  'dialog.popup_blocked.message': 'This action requires your permission to open a new window.',
  'dialog.insufficient_balance.title': 'Insufficient spend permission',
  'dialog.insufficient_balance.message':
    "Your spend permission's remaining balance cannot cover this transaction. Please choose how to proceed:",
  'dialog.reauthorize.title': 'Re-authorize {app}',
  'dialog.reauthorize.message':
    '{app} has lost access to your account. Please sign at the next step to re-authorize {app}',

  // Button text
  'button.try_again': 'Try again',
  'button.cancel': 'Cancel',
  'button.edit_spend_permission': 'Edit spend permission',
  'button.use_primary_account': 'Use primary account',
  'button.continue': 'Continue',
  'button.not_now': 'Not now',
};
