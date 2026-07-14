import type { LanguageMetadataConfig } from '../configuration.js';

export const SUPPORTED_LANGUAGES: ReadonlyArray<LanguageMetadataConfig> = Object.freeze([
  Object.freeze({
    code: 'en',
    name: 'English',
    nativeName: 'English',
    enabled: true,
  }),
  Object.freeze({
    code: 'zh-CN',
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    enabled: true,
  }),
  Object.freeze({
    code: 'zh-TW',
    name: 'Chinese (Traditional)',
    nativeName: '繁體中文',
    enabled: false,
  }),
  Object.freeze({
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    enabled: false,
  }),
  Object.freeze({
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    enabled: false,
  }),
  Object.freeze({
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    enabled: false,
  }),
  Object.freeze({
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    enabled: false,
  }),
  Object.freeze({
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    enabled: false,
  }),
]);

export function getEnabledLanguages(): ReadonlyArray<LanguageMetadataConfig> {
  return SUPPORTED_LANGUAGES.filter((lang) => lang.enabled);
}

export function getLanguageByCode(code: string): LanguageMetadataConfig | undefined {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
}

export function isLanguageEnabled(code: string): boolean {
  const lang = getLanguageByCode(code);
  return lang?.enabled ?? false;
}
