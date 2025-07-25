// Supported locales
export type Locale = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'zh-CN' | 'zh-TW' | 'vi' | 'pt';

// Generic translation keys type - can be extended by any package
export type TranslationKeys = Record<string, string>;

// Translation data structure for any key set
export type Translations<T extends TranslationKeys> = Record<Locale, T>;

// Default locale
export const DEFAULT_LOCALE: Locale = 'en';

// I18n instance interface
export interface I18nInstance<T extends TranslationKeys> {
  setLocale(locale: Locale): void;
  getLocale(): Locale;
  registerTranslations(locale: Locale, messages: T): void;
  t(key: keyof T, params?: Record<string, string>): string;
  detectAndSetBrowserLocale(): void;
}

// Global translation storage for multiple namespaces
interface TranslationStore {
  [namespace: string]: {
    currentLocale: Locale;
    translations: Record<string, TranslationKeys>;
  };
}

const globalStore: TranslationStore = {};

/**
 * Create a new i18n instance with custom translation keys
 */
export function createI18n<T extends TranslationKeys>(
  namespace: string = 'default',
  defaultTranslations?: Partial<Translations<T>>
): I18nInstance<T> {
  // Initialize namespace if it doesn't exist
  if (!globalStore[namespace]) {
    globalStore[namespace] = {
      currentLocale: DEFAULT_LOCALE,
      translations: {},
    };
  }

  const store = globalStore[namespace];

  // Register default translations if provided
  if (defaultTranslations) {
    Object.entries(defaultTranslations).forEach(([locale, messages]) => {
      if (messages) {
        store.translations[locale] = messages;
      }
    });
  }

  return {
    setLocale(locale: Locale): void {
      store.currentLocale = locale;
    },

    getLocale(): Locale {
      return store.currentLocale;
    },

    registerTranslations(locale: Locale, messages: T): void {
      store.translations[locale] = messages;
    },

    t(key: keyof T, params?: Record<string, string>): string {
      const localeTranslations = store.translations[store.currentLocale] as T | undefined;
      let message: string;

      if (localeTranslations && localeTranslations[key as string]) {
        message = localeTranslations[key as string];
      } else {
        // Fallback to English
        const fallbackTranslations = store.translations[DEFAULT_LOCALE] as T | undefined;
        if (fallbackTranslations && fallbackTranslations[key as string]) {
          message = fallbackTranslations[key as string];
        } else {
          // Ultimate fallback - return the key
          return key as string;
        }
      }

      // Simple interpolation
      if (params) {
        Object.entries(params).forEach(([param, value]) => {
          message = message.replace(new RegExp(`{${param}}`, 'g'), value);
        });
      }

      return message;
    },

    detectAndSetBrowserLocale(): void {
      const detectedLocale = detectBrowserLocale();
      this.setLocale(detectedLocale);
    },
  };
}

/**
 * Helper function to create translation objects for all supported locales
 */
export function createTranslationSet<T extends TranslationKeys>(
  translations: Translations<T>
): Translations<T> {
  return translations;
}

/**
 * Utility function to detect browser language
 * Checks multiple sources in order of preference:
 * 1. HTML lang attribute (most specific to current page)
 * 2. Navigator language (browser preference)
 * 3. Navigator userLanguage (IE fallback)
 * 4. Default locale (ultimate fallback)
 */
export function detectBrowserLocale(): Locale {
  // Map browser language codes to supported locales
  const langMap: Record<string, Locale> = {
    en: 'en',
    'en-US': 'en',
    'en-GB': 'en',
    es: 'es',
    'es-ES': 'es',
    'es-MX': 'es',
    fr: 'fr',
    'fr-FR': 'fr',
    de: 'de',
    'de-DE': 'de',
    ja: 'ja',
    'ja-JP': 'ja',
    ko: 'ko',
    'ko-KR': 'ko',
    zh: 'zh-CN',
    'zh-CN': 'zh-CN',
    'zh-TW': 'zh-TW',
    'zh-HK': 'zh-TW',
    vi: 'vi',
    'vi-VN': 'vi',
    pt: 'pt',
    'pt-BR': 'pt',
    'pt-PT': 'pt',
  };

  // Helper function to map language code to supported locale
  const mapLanguage = (lang: string): Locale | null => {
    if (!lang) return null;

    // Try exact match first
    if (langMap[lang]) {
      return langMap[lang];
    }

    // Try language without region (e.g., 'en' from 'en-US')
    const baseLanguage = lang.split('-')[0];
    if (langMap[baseLanguage]) {
      return langMap[baseLanguage];
    }

    return null;
  };

  // 1. Check HTML lang attribute (most specific)
  if (typeof document !== 'undefined') {
    const htmlLang = document.documentElement.lang || document.documentElement.getAttribute('lang');
    if (htmlLang) {
      const mappedLang = mapLanguage(htmlLang);
      if (mappedLang) {
        return mappedLang;
      }
    }
  }

  // 2. Check navigator.language (modern browsers)
  if (typeof navigator !== 'undefined') {
    if (navigator.language) {
      const mappedLang = mapLanguage(navigator.language);
      if (mappedLang) {
        return mappedLang;
      }
    }

    // 3. Check navigator.userLanguage (IE fallback)
    const userLanguage = (navigator as any).userLanguage;
    if (userLanguage) {
      const mappedLang = mapLanguage(userLanguage);
      if (mappedLang) {
        return mappedLang;
      }
    }

    // 4. Check navigator.languages array (if available)
    if (navigator.languages && navigator.languages.length > 0) {
      for (const lang of navigator.languages) {
        const mappedLang = mapLanguage(lang);
        if (mappedLang) {
          return mappedLang;
        }
      }
    }
  }

  // 5. Ultimate fallback
  return DEFAULT_LOCALE;
}
