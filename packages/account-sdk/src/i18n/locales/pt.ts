import { AccountSDKTranslationKeys } from '../index.js';

export const pt: AccountSDKTranslationKeys = {
  // Dialog messages
  'dialog.base_account': 'Base Account',
  'dialog.signed_in_as': 'Conectado como {username}',
  'dialog.popup_blocked.title': '{app} quer continuar no Base Account',
  'dialog.popup_blocked.message': 'Esta ação requer sua permissão para abrir uma nova janela.',
  'dialog.insufficient_balance.title': 'Permissão de gasto insuficiente',
  'dialog.insufficient_balance.message':
    'O saldo restante da sua permissão de gasto não pode cobrir esta transação. Por favor escolha como prosseguir:',
  'dialog.reauthorize.title': 'Reautorizar {app}',
  'dialog.reauthorize.message':
    '{app} perdeu acesso à sua conta. Por favor assine na próxima etapa para reautorizar {app}',

  // Button text
  'button.try_again': 'Tentar novamente',
  'button.cancel': 'Cancelar',
  'button.edit_spend_permission': 'Editar permissão de gasto',
  'button.use_primary_account': 'Usar conta principal',
  'button.continue': 'Continuar',
  'button.not_now': 'Agora não',
};
