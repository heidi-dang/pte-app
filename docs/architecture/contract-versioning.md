# Contract Versioning

## Version Format

All contracts and configurations use semantic versioning (semver) via the `Version` branded type from `@pte-app/types`.

## Versioned Configuration

Every versioned configuration object includes:

| Field            | Type                      | Description                                                          |
| ---------------- | ------------------------- | -------------------------------------------------------------------- |
| `id`             | `ConfigurationId`         | Unique identifier for the configuration                              |
| `version`        | `Version`                 | Semver version string                                                |
| `status`         | `ConfigurationStatus`     | One of `active`, `deprecated`, `superseded`, `draft`                 |
| `effectiveFrom`  | `ISO8601Date`             | Date from which this configuration is effective                      |
| `effectiveUntil` | `ISO8601Date \| null`     | Date until which this configuration is effective (null = indefinite) |
| `source`         | `string`                  | Provenance source (e.g., `estimated-training-configuration`)         |
| `supersededBy`   | `ConfigurationId \| null` | ID of the configuration that supersedes this one                     |

## Lifecycle

1. **Draft**: Configuration is being prepared.
2. **Active**: Configuration is in use. Only one version per ID should be active at a time.
3. **Deprecated**: Configuration is still available but new consumers should use the superseding version.
4. **Superseded**: Configuration has been fully replaced.

## Lookup Semantics

- Configurations are looked up by their `ConfigurationId`.
- If a configuration ID is not found, an explicit error is thrown — never a silent fallback.
- Version history is maintained via the provenance chain.

## Breaking Changes

When a breaking change is made to a configuration shape:

1. A new `ConfigurationId` is allocated.
2. The old configuration's `supersededBy` field points to the new ID.
3. The old configuration's status transitions to `superseded`.
