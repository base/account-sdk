import { AccountSDKTranslationKeys } from '../index.js';

export const es: AccountSDKTranslationKeys = {
  // Dialog messages
  'dialog.base_account': 'Base Account',
  'dialog.signed_in_as': 'Conectado como {username}',
  'dialog.popup_blocked.title': '{app} quiere continuar en Base Account',
  'dialog.popup_blocked.message': 'Esta acción requiere tu permiso para abrir una nueva ventana.',
  'dialog.insufficient_balance.title': 'Permiso de gasto insuficiente',
  'dialog.insufficient_balance.message':
    'El saldo restante de tu permiso de gasto no puede cubrir esta transacción. Por favor elige cómo proceder:',
  'dialog.reauthorize.title': 'Reautorizar {app}',
  'dialog.reauthorize.message':
    '{app} ha perdido acceso a tu cuenta. Por favor firma en el siguiente paso para reautorizar {app}',

  // Button text
  'button.try_again': 'Intentar de nuevo',
  'button.cancel': 'Cancelar',
  'button.edit_spend_permission': 'Editar permiso de gasto',
  'button.use_primary_account': 'Usar cuenta principal',
  'button.continue': 'Continuar',
  'button.not_now': 'Ahora no',
};
