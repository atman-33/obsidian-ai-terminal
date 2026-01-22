# Agent UUID Migration

**Status**: Draft  
**Created**: 2026-01-22  
**Type**: Refactoring

## Context

Currently, the Obsidian AI Terminal plugin manages AI agents using a name-based identification system. When a user configures agents in settings, the system:

- Stores agents with only `name` and `enabled` properties
- References agents from `CommandTemplate` via `agentName` (string)
- References agents from `AITerminalSettings.lastUsedDirectPromptAgent` via name (string)

This approach has several limitations:

1. **Data integrity issues**: When an agent's name is changed, all references in command templates must be manually updated via `renameAgent()` method
2. **Name collision risk**: The system must validate that no duplicate names exist when creating or renaming agents
3. **Complexity in reference management**: Code must traverse all command templates to find and update references when names change
4. **Limited extensibility**: Future features like agent export/import or duplication become difficult without stable identifiers

## Problem Statement

The current name-based agent identification system creates maintenance overhead and potential data integrity issues. Agent renaming requires cascading updates across multiple data structures, and the system lacks stable identifiers for reliable cross-referencing.

## Proposed Solution

Migrate from name-based agent identification to UUID-based identification while preserving names for display purposes. This involves:

1. **Add UUID identifier**: Extend `AgentConfig` with `id: string` (UUID v4)
2. **Update references**: Change `CommandTemplate.agentName` to `CommandTemplate.agentId`
3. **Update last-used tracking**: Change `AITerminalSettings.lastUsedDirectPromptAgent` from name to UUID
4. **Structure-based validation**: Check for UUID structure instead of version numbers to determine if reset is needed
5. **Update validation logic**: Validate by UUID instead of name for references

**Breaking Change**: This is a one-time breaking change. Settings without UUID structure (old name-based format) will be reset. Once migrated to UUID structure, all future updates will preserve settings regardless of version number.

## Benefits

- **Data integrity**: Agent renaming no longer requires cascading updates to command templates
- **Simplified validation**: Duplicate name detection becomes informational rather than critical
- **Future-proof**: Enables features like agent duplication, export/import with preserved relationships
- **Maintainability**: Clear separation between stable identifiers (UUID) and mutable display properties (name)

## Scope

### In Scope

- Extending `AgentConfig` interface with UUID field
- Updating `CommandTemplate` to reference agents by UUID
- Updating last-used agent tracking to use UUID
- Simple version check that resets incompatible settings
- Updating all agent lookup logic throughout the codebase
- Updating UI components to continue displaying names while using UUIDs internally
- Version bump for settings schema

### Out of Scope

- Complex data migration logic (settings will be reset instead)
- Backward compatibility with old data formats
- Changes to terminal launching functionality
- Changes to placeholder resolution logic
- UI/UX redesign (display behavior remains unchanged)
- New agent management features beyond UUID migration

## Dependencies

None. This is an internal refactoring that improves data model robustness.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Settings reset on UUID migration | Low | Single user can reconfigure in 5-10 minutes; clear documentation in CHANGELOG |
| Future version upgrades | None | Structure-based validation ensures UUID-based settings are always preserved |
| User confusion | Low | Clear notice message on settings reset; documentation with upgrade notes |

## Success Criteria

- [ ] All agents have valid UUIDs in default settings
- [ ] All command templates reference agents by UUID
- [ ] Agent renaming no longer requires updating command templates
- [ ] Core functionality preserved (no regression)
- [ ] Settings reset works correctly on version mismatch
- [ ] Tests pass with >85% coverage for core logic
- [ ] User can reconfigure settings after upgrade
