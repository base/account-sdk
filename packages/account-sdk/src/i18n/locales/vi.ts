import { AccountSDKTranslationKeys } from '../index.js';

export const vi: AccountSDKTranslationKeys = {
  // Dialog messages
  'dialog.base_account': 'Base Account',
  'dialog.signed_in_as': 'Đã đăng nhập bằng {username}',
  'dialog.popup_blocked.title': '{app} muốn tiếp tục trong Base Account',
  'dialog.popup_blocked.message': 'Hành động này yêu cầu quyền của bạn để mở cửa sổ mới.',
  'dialog.insufficient_balance.title': 'Quyền chi tiêu không đủ',
  'dialog.insufficient_balance.message':
    'Số dư còn lại của quyền chi tiêu không thể trang trải giao dịch này. Vui lòng chọn cách tiếp tục:',
  'dialog.reauthorize.title': 'Ủy quyền lại {app}',
  'dialog.reauthorize.message':
    '{app} đã mất quyền truy cập vào tài khoản của bạn. Vui lòng ký ở bước tiếp theo để ủy quyền lại {app}',

  // Button text
  'button.try_again': 'Thử lại',
  'button.cancel': 'Hủy',
  'button.edit_spend_permission': 'Chỉnh sửa quyền chi tiêu',
  'button.use_primary_account': 'Sử dụng tài khoản chính',
  'button.continue': 'Tiếp tục',
  'button.not_now': 'Không phải bây giờ',
};
