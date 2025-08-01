import { I18nInstance, Locale, TranslationKeys, Translations, createI18n } from './index.js';

/**
 * Quick setup function for packages that want to get started immediately
 * Usage:
 * ```typescript
 * interface MyKeys extends TranslationKeys {
 *   'button.save': string;
 *   'error.invalid': string;
 * }
 *
 * const { t, i18n } = quickSetup<MyKeys>('my-package', {
 *   en: { 'button.save': 'Save', 'error.invalid': 'Invalid input' },
 *   es: { 'button.save': 'Guardar', 'error.invalid': 'Entrada inválida' }
 * });
 * ```
 */
export function quickSetup<T extends TranslationKeys>(
  namespace: string,
  translations: Partial<Translations<T>>
): {
  t: (key: keyof T, params?: Record<string, string>) => string;
  i18n: I18nInstance<T>;
  setLocale: (locale: Locale) => void;
  getLocale: () => Locale;
} {
  const i18n = createI18n<T>(namespace, translations);
  i18n.detectAndSetBrowserLocale();

  return {
    t: i18n.t.bind(i18n),
    i18n,
    setLocale: i18n.setLocale.bind(i18n),
    getLocale: i18n.getLocale.bind(i18n),
  };
}

/**
 * Utility to merge multiple translation namespaces
 * Useful when a package wants to extend another package's translations
 */
export function mergeTranslations<T extends TranslationKeys, U extends TranslationKeys>(
  base: Partial<Translations<T>>,
  extension: Partial<Translations<U>>
): Partial<Translations<T & U>> {
  const merged: Partial<Translations<T & U>> = {};

  // Get all unique locales from both translation sets
  const allLocales = new Set([
    ...(Object.keys(base) as Locale[]),
    ...(Object.keys(extension) as Locale[]),
  ]);

  allLocales.forEach((locale) => {
    merged[locale] = {
      ...(base[locale] || {}),
      ...(extension[locale] || {}),
    } as T & U;
  });

  return merged;
}
