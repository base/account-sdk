import type { TranslationKeys } from ':core/i18n/index.js';
import { createI18n, createTranslationSet } from ':core/i18n/index.js';
import { de } from './locales/de.js';
import { en } from './locales/en.js';
import { es } from './locales/es.js';
import { fr } from './locales/fr.js';
import { ja } from './locales/ja.js';
import { ko } from './locales/ko.js';
import { pt } from './locales/pt.js';
import { vi } from './locales/vi.js';
import { zhCN } from './locales/zh-CN.js';
import { zhTW } from './locales/zh-TW.js';

// Account-SDK specific translation keys
export interface AccountSDKTranslationKeys extends TranslationKeys {
  // Dialog messages
  'dialog.base_account': string;
  'dialog.signed_in_as': string;
  'dialog.popup_blocked.title': string;
  'dialog.popup_blocked.message': string;
  'dialog.insufficient_balance.title': string;
  'dialog.insufficient_balance.message': string;
  'dialog.reauthorize.title': string;
  'dialog.reauthorize.message': string;

  // Button text
  'button.try_again': string;
  'button.cancel': string;
  'button.edit_spend_permission': string;
  'button.use_primary_account': string;
  'button.continue': string;
  'button.not_now': string;
}

const accountSDKTranslations = createTranslationSet<AccountSDKTranslationKeys>({
  en: en,
  es: es,
  fr: fr,
  de: de,
  ja: ja,
  ko: ko,
  vi: vi,
  pt: pt,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
});

const accountSDKi18n = createI18n<AccountSDKTranslationKeys>('account-sdk', accountSDKTranslations);

accountSDKi18n.detectAndSetBrowserLocale();

export const { t } = accountSDKi18n;
