# Agent UUID Migration - Tasks

Implementation order follows a bottom-up approach: update data models first, then migration logic, then consuming code, and finally tests.

## Phase 1: Data Model Updates

1. **Update `AgentConfig` interface**
   - Add `id: string` field to `AgentConfig` in [src/types.ts](../../src/types.ts)
   - Update JSDoc comments to clarify UUID requirement
   - Location: `AgentConfig` interface definition

2. **Update `CommandTemplate` interface**
   - Rename `agentName: string` to `agentId: string` in [src/types.ts](../../src/types.ts)
   - Update JSDoc to indicate UUID reference
   - Location: `CommandTemplate` interface definition

3. **Update `AITerminalSettings` interface**
   - Rename `lastUsedDirectPromptAgent?: string` to `lastUsedDirectPromptAgentId?: string` in [src/types.ts](../../src/types.ts)
   - Update JSDoc comment
   - Location: `AITerminalSettings` interface definition

## Phase 2: Settings Initialization

4. **Update settings version**
   - Increment `SETTINGS_VERSION` constant in [src/settings.ts](../../src/settings.ts)
   - Current: needs investigation, New: current + 1

5. **Update default agents**
   - Add `id` field with generated UUIDs to `DEFAULT_AGENTS` in [src/settings.ts](../../src/settings.ts)
   - Use stable, predefined UUIDs for default agents

6. **Update default commands**
   - Replace `agentName` with `agentId` in default command templates in [src/settings.ts](../../src/settings.ts)
   - Reference UUIDs from default agents

7. **Implement structure-based loading**
   - Replace `migrateSettings()` with structure-based `loadSettings()` in [src/settings.ts](../../src/settings.ts)
   - Check for UUID structure (agents have `id`, commands have `agentId`)
   - Reset if structure missing, keep settings if structure present
   - Return `{ settings, wasReset }` tuple
   - Display notice to user if settings were reset

8. **Remove legacy type definitions**
   - Delete `LegacyCommandTemplate` type from [src/settings.ts](../../src/settings.ts)
   - Remove unused migration helper functions

## Phase 3: Agent Management Logic

9. **Update `AgentListEditor.deleteAgent`**
   - Change parameter from `agentName: string` to `agentId: string` in [src/ui/agent-list-editor.ts](../../src/ui/agent-list-editor.ts)
   - Update filtering logic to match by ID

10. **Update `AgentListEditor.getTemplatesUsingAgent`**
    - Change parameter from `agentName: string` to `agentId: string` in [src/ui/agent-list-editor.ts](../../src/ui/agent-list-editor.ts)
    - Update filtering logic to use `command.agentId`

11. **Remove `AgentListEditor.renameAgent` method**
    - Delete the `renameAgent` method from [src/ui/agent-list-editor.ts](../../src/ui/agent-list-editor.ts)
    - No longer needed since renaming doesn't affect references

12. **Update `AgentEditorModal.validateAgent`**
    - Update duplicate name validation logic in [src/ui/agent-list-editor.ts](../../src/ui/agent-list-editor.ts)
    - Check for duplicates excluding current agent by ID (not name)
    - Make duplicate names a warning, not error

## Phase 4: Command Template Management

13. **Update `CommandEditorModal` agent selection**
    - Update agent dropdown logic in [src/ui/command-editor.ts](../../src/ui/command-editor.ts)
    - Change from finding by `agent.name === this.command.agentName` to `agent.id === this.command.agentId`
    - Update dropdown value setting to use agent ID

14. **Update `CommandEditorModal` default agent logic**
    - Update initialization to set `agentId` instead of `agentName` in [src/ui/command-editor.ts](../../src/ui/command-editor.ts)
    - Use UUID from first enabled agent

15. **Update `CommandEditorModal` validation**
    - Update validation error messages in [src/ui/command-editor.ts](../../src/ui/command-editor.ts)
    - Check for `!this.command.agentId` instead of `!this.command.agentName`

16. **Update `CommandManager.validateTemplate`**
    - Change parameter from `agentName?: string` to `agentId?: string` in [src/commands/command-manager.ts](../../src/commands/command-manager.ts)
    - Update agent existence check to find by ID

## Phase 5: Command Execution

17. **Update `CommandExecutor.execute`**
    - Update agent lookup in [src/commands/command-executor.ts](../../src/commands/command-executor.ts)
    - Change from `agents.find(current => current.name === command.agentName)` to `agents.find(current => current.id === command.agentId)`
    - Update error message to reference agent ID

## Phase 6: Direct Prompt Feature

18. **Update `DirectPromptModal` agent selection**
    - Update agent dropdown value to use agent ID in [src/ui/direct-prompt-modal.ts](../../src/ui/direct-prompt-modal.ts)
    - Change `this.selectedAgentName` to `this.selectedAgentId`
    - Update saved last-used agent to UUID

19. **Update `DirectPromptModal.executePrompt`**
    - Update agent lookup to find by ID in [src/ui/direct-prompt-modal.ts](../../src/ui/direct-prompt-modal.ts)
    - Change from `agent.name === this.selectedAgentName` to `agent.id === this.selectedAgentId`

20. **Update `createDirectPromptCommand`**
    - Change `agentName` parameter to `agentId` in [src/ui/direct-prompt-utils.ts](../../src/ui/direct-prompt-utils.ts)
    - Update returned command template structure

## Phase 7: Testing

21. **Update existing tests**
    - Update test data to include agent IDs in [src/settings.test.ts](../../src/settings.test.ts)
    - Update assertions to check `agentId` instead of `agentName`
    - Update mock data in [src/integration/command-flow.test.ts](../../src/integration/command-flow.test.ts)

22. **Add structure validation tests**
   - Test settings without UUID structure trigger reset
   - Test settings with UUID structure are preserved
   - Test invalid data structure triggers reset
   - Test user notification displays correctly on reset
   - Test settings persist across plugin reloads

24. **Update CHANGELOG**
   - Add breaking change notice under appropriate version
   - Document that name-based settings will be reset to defaults (UUID migration)
   - Note: Future upgrades will preserve UUID-based settings
   - Note: Agent renaming no longer affects command templates
   - Recommend backing up settings before upgrade (optional)

25. **Update memory files if needed**
   - Update architecture decision document
   - Mark migration as completed with "no-migration" approach
