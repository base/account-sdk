import { AccountSDKTranslationKeys } from '../index.js';

export const zhTW: AccountSDKTranslationKeys = {
  // Dialog messages
  'dialog.base_account': 'Base Account',
  'dialog.signed_in_as': '以 {username} 身份登入',
  'dialog.popup_blocked.title': '{app} 想要在 Base Account 中繼續',
  'dialog.popup_blocked.message': '此操作需要您的許可才能開啟新視窗。',
  'dialog.insufficient_balance.title': '支出權限不足',
  'dialog.insufficient_balance.message': '您的支出權限餘額無法支付此筆交易。請選擇如何繼續：',
  'dialog.reauthorize.title': '重新授權 {app}',
  'dialog.reauthorize.message': '{app} 已失去對您帳戶的存取權限。請在下一步簽名以重新授權 {app}',

  // Button text
  'button.try_again': '重試',
  'button.cancel': '取消',
  'button.edit_spend_permission': '編輯支出權限',
  'button.use_primary_account': '使用主帳戶',
  'button.continue': '繼續',
  'button.not_now': '現在不要',
};
