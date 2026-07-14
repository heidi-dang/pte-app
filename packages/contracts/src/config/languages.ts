import type { ConfigurationId, Version, ConfigurationStatus, ISO8601Date } from '@pte-app/types';
import type { VersionedLanguageConfig, LanguageMetadataConfig } from '../configuration.js';

const TRAINING_SOURCE = 'estimated-training-configuration';

export const TRAINING_LANGUAGE_CONFIG: VersionedLanguageConfig = Object.freeze({
  id: 'cfg-languages-default' as ConfigurationId,
  version: '1.0.0' as Version,
  status: 'active' as ConfigurationStatus,
  languages: Object.freeze([
    Object.freeze({
      code: 'en',
      name: 'English',
      nativeName: 'English',
      enabled: true,
    } as LanguageMetadataConfig),
    Object.freeze({
      code: 'zh-CN',
      name: 'Chinese (Simplified)',
      nativeName: '简体中文',
      enabled: true,
    } as LanguageMetadataConfig),
    Object.freeze({
      code: 'zh-TW',
      name: 'Chinese (Traditional)',
      nativeName: '繁體中文',
      enabled: false,
    } as LanguageMetadataConfig),
    Object.freeze({
      code: 'ja',
      name: 'Japanese',
      nativeName: '日本語',
      enabled: false,
    } as LanguageMetadataConfig),
    Object.freeze({
      code: 'ko',
      name: 'Korean',
      nativeName: '한국어',
      enabled: false,
    } as LanguageMetadataConfig),
    Object.freeze({
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      enabled: false,
    } as LanguageMetadataConfig),
    Object.freeze({
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      enabled: false,
    } as LanguageMetadataConfig),
    Object.freeze({
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      enabled: false,
    } as LanguageMetadataConfig),
  ] as ReadonlyArray<LanguageMetadataConfig>),
  source: TRAINING_SOURCE,
  effectiveFrom: '2026-01-01' as ISO8601Date,
  effectiveUntil: null,
  supersededBy: null,
});

const LANGUAGE_CONFIG_INDEX = new Map<ConfigurationId, VersionedLanguageConfig>([
  [TRAINING_LANGUAGE_CONFIG.id, TRAINING_LANGUAGE_CONFIG],
]);

export function getLanguageConfigById(configId: ConfigurationId): VersionedLanguageConfig | undefined {
  return LANGUAGE_CONFIG_INDEX.get(configId);
}

export function requireLanguageConfig(configId: ConfigurationId): VersionedLanguageConfig {
  const config = LANGUAGE_CONFIG_INDEX.get(configId);
  if (config === undefined) {
    throw new Error(`Unknown language configuration: ${configId}`);
  }
  return config;
}

export function getActiveLanguageConfig(): VersionedLanguageConfig {
  return TRAINING_LANGUAGE_CONFIG;
}

export function getEnabledLanguages(config: VersionedLanguageConfig): ReadonlyArray<LanguageMetadataConfig> {
  return config.languages.filter((lang) => lang.enabled);
}

export function getLanguageByCode(config: VersionedLanguageConfig, code: string): LanguageMetadataConfig | undefined {
  return config.languages.find((lang) => lang.code === code);
}

export function isLanguageEnabled(config: VersionedLanguageConfig, code: string): boolean {
  const lang = getLanguageByCode(config, code);
  return lang?.enabled ?? false;
}
