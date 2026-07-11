/**
 * Feature-flag interface.
 *
 * Flags are resolved at runtime from configuration or a remote store.
 */

export interface FeatureFlag {
  readonly key: string;
  readonly enabled: boolean;
}

export interface FeatureFlagService {
  isEnabled(key: string, defaults?: { userId?: string; courseId?: string }): boolean | Promise<boolean>;
  getAll(): FeatureFlag[] | Promise<FeatureFlag[]>;
}
