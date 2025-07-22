import { AccountSDKTranslationKeys } from '../index.js';

export const zhCN: AccountSDKTranslationKeys = {
  // Dialog messages
  'dialog.base_account': 'Base Account',
  'dialog.signed_in_as': '以 {username} 身份登录',
  'dialog.popup_blocked.title': '{app} 想要在 Base Account 中继续',
  'dialog.popup_blocked.message': '此操作需要您的许可才能打开新窗口。',
  'dialog.insufficient_balance.title': '支出权限不足',
  'dialog.insufficient_balance.message': '您的支出权限余额无法支付此笔交易。请选择如何继续：',
  'dialog.reauthorize.title': '重新授权 {app}',
  'dialog.reauthorize.message': '{app} 已失去对您账户的访问权限。请在下一步签名以重新授权 {app}',

  // Button text
  'button.try_again': '重试',
  'button.cancel': '取消',
  'button.edit_spend_permission': '编辑支出权限',
  'button.use_primary_account': '使用主账户',
  'button.continue': '继续',
  'button.not_now': '现在不',
};
