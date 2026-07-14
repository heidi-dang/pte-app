# Contract Migration Guide

## Overview

When contract shapes change, the following migration strategy applies:

## Adding New Fields

Adding a new optional field to a contract is a backward-compatible change:

1. Add the field with `| null` or optional marker to the contract interface.
2. Update the corresponding Zod schema to accept the new field.
3. Increment the minor version.
4. Existing consumers that do not provide the field continue to work.

## Renaming Fields

Renaming a field is a breaking change:

1. Create a new contract version with the renamed field.
2. Assign a new `ConfigurationId` if applicable.
3. Set `supersededBy` on the old configuration to point to the new one.
4. Set the old configuration's status to `superseded`.
5. Increment the major version.

## Removing Fields

Removing a field is a breaking change:

1. Follow the same process as renaming.
2. Document the removed field in migration notes.

## Changing Field Types

Changing a field's type is a breaking change:

1. Allocate a new `ConfigurationId`.
2. Update the schema validation.
3. Set `migrationCompatibility` on the new configuration to describe how to map old data.

## Versioned Configuration Migration

For versioned configuration objects:

1. Set the old configuration's `status` to `deprecated` or `superseded`.
2. Set `supersededBy` to the new configuration's ID.
3. Set `effectiveUntil` on the old configuration.
4. Set `effectiveFrom` on the new configuration.
5. Consumers should resolve the active configuration by checking status and effective dates.

## Schema Validation

All schema changes are validated through the Zod schemas in `@pte-app/schemas`. When migrating:

1. Ensure new schemas accept both old and new formats during the transition period.
2. Use `.transform()` for data migration where needed.
3. Reject invalid data at the boundary — never silently coerce.
