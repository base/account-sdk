import { AccountSDKTranslationKeys } from '../index.js';

export const de: AccountSDKTranslationKeys = {
  // Dialog messages
  'dialog.base_account': 'Base Account',
  'dialog.signed_in_as': 'Angemeldet als {username}',
  'dialog.popup_blocked.title': '{app} möchte in Base Account fortfahren',
  'dialog.popup_blocked.message':
    'Diese Aktion erfordert Ihre Erlaubnis, ein neues Fenster zu öffnen.',
  'dialog.insufficient_balance.title': 'Unzureichende Ausgabenberechtigung',
  'dialog.insufficient_balance.message':
    'Das verbleibende Guthaben Ihrer Ausgabenberechtigung kann diese Transaktion nicht abdecken. Bitte wählen Sie, wie Sie fortfahren möchten:',
  'dialog.reauthorize.title': '{app} erneut autorisieren',
  'dialog.reauthorize.message':
    '{app} hat den Zugang zu Ihrem Konto verloren. Bitte unterschreiben Sie im nächsten Schritt, um {app} erneut zu autorisieren',

  // Button text
  'button.try_again': 'Erneut versuchen',
  'button.cancel': 'Abbrechen',
  'button.edit_spend_permission': 'Ausgabenberechtigung bearbeiten',
  'button.use_primary_account': 'Hauptkonto verwenden',
  'button.continue': 'Fortfahren',
  'button.not_now': 'Nicht jetzt',
};
