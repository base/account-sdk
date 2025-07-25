import { AccountSDKTranslationKeys } from '../index.js';

export const ko: AccountSDKTranslationKeys = {
  // Dialog messages
  'dialog.base_account': 'Base Account',
  'dialog.signed_in_as': '{username}로 로그인됨',
  'dialog.popup_blocked.title': '{app}이 Base Account에서 계속하려고 합니다',
  'dialog.popup_blocked.message': '이 작업을 수행하려면 새 창을 열 수 있는 권한이 필요합니다.',
  'dialog.insufficient_balance.title': '지출 권한 부족',
  'dialog.insufficient_balance.message':
    '귀하의 지출 권한 잔액으로는 이 거래를 처리할 수 없습니다. 진행 방법을 선택해 주세요:',
  'dialog.reauthorize.title': '{app} 재인증',
  'dialog.reauthorize.message':
    '{app}이 귀하의 계정에 대한 액세스를 잃었습니다. 다음 단계에서 서명하여 {app}을 재인증해 주세요',

  // Button text
  'button.try_again': '다시 시도',
  'button.cancel': '취소',
  'button.edit_spend_permission': '지출 권한 편집',
  'button.use_primary_account': '기본 계정 사용',
  'button.continue': '계속',
  'button.not_now': '나중에',
};
