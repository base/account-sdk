import { AccountSDKTranslationKeys } from '../index.js';

export const ja: AccountSDKTranslationKeys = {
  // Dialog messages
  'dialog.base_account': 'Base Account',
  'dialog.signed_in_as': '{username}としてサインイン中',
  'dialog.popup_blocked.title': '{app}がBase Accountで続行したいとリクエスト中',
  'dialog.popup_blocked.message': 'この操作には新しいウィンドウを開く許可が必要です。',
  'dialog.insufficient_balance.title': '支出許可が不足しています',
  'dialog.insufficient_balance.message':
    'お客様の支出許可の残高では、この取引をカバーできません。続行方法を選択してください：',
  'dialog.reauthorize.title': '{app}を再認証',
  'dialog.reauthorize.message':
    '{app}がお客様のアカウントへのアクセスを失いました。次のステップで署名して{app}を再認証してください',

  // Button text
  'button.try_again': '再試行',
  'button.cancel': 'キャンセル',
  'button.edit_spend_permission': '支出許可を編集',
  'button.use_primary_account': 'プライマリアカウントを使用',
  'button.continue': '続行',
  'button.not_now': '今回はしない',
};
