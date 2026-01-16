# Implementation Tasks

## Phase 1: Foundation - Agent Management

- [x] **1.1 Update type definitions**
  - Add `AgentConfig` interface to `src/types.ts`
  - Modify `CommandTemplate` interface: replace `defaultAgent: string` with `agentId: string`
  - Modify `AITerminalSettings` interface: add `agents: AgentConfig[]`
  - **Verify**: TypeScript compilation succeeds

- [x] **1.2 Create default agents**
  - Update `DEFAULT_SETTINGS` in `src/settings.ts` to include default agent list
  - Default agents: GitHub Copilot and OpenCode
  - **Verify**: Default settings include two agents with valid configuration

- [x] **1.3 Implement migration logic**
  - Add migration function in `src/settings.ts` to convert old `defaultAgent` to `agentId`
  - Extract unique agent names from existing templates
  - Create agent entries for each unique name
  - Map template `agentId` references
  - **Verify**: Unit test with legacy settings data produces migrated structure

- [x] **1.4 Update settings load/save**
  - Call migration function on `loadData()` if `settings.agents` is undefined
  - Add version tracking to detect migration need
  - **Verify**: Plugin loads with existing settings without errors

## Phase 2: Settings UI - Agent List Editor

- [x] **2.1 Create agent list editor component**
  - Create `src/ui/agent-list-editor.ts`
  - Implement add/edit/delete/reorder functionality
  - Add validation for agent `id`, `name`, `command` fields
  - **Verify**: Can add/edit/delete agents in settings UI

- [x] **2.2 Integrate agent editor into settings tab**
  - Add "AI Agents" section to `AITerminalSettingTab.display()`
  - Render agent list with controls
  - Position before "Command Templates" section
  - **Verify**: Settings tab displays agent list correctly

- [x] **2.3 Add agent deletion safeguards**
  - Check if agent is referenced by any command templates before deletion
  - Show confirmation dialog if agent is in use
  - List affected templates in warning message
  - **Verify**: Cannot delete agent without confirmation if used by templates

- [x] **2.4 Implement enable/disable toggle**
  - Add toggle control for each agent
  - Update `enabled` field on toggle
  - Disabled agents should not appear in dropdowns
  - **Verify**: Disabled agents disappear from agent selection dropdowns

## Phase 3: Command Template Updates

- [x] **3.1 Update command template editor**
  - Modify `src/ui/command-editor.ts` to use agent dropdown
  - Replace `defaultAgent` text input with dropdown populated from `settings.agents`
  - Filter to show only enabled agents
  - **Verify**: Template editor shows agent dropdown

- [x] **3.2 Add agent reference validation**
  - Validate `agentId` references existing agent on template save
  - Show error if referenced agent doesn't exist
  - Update `CommandManager.validateTemplate()` method
  - **Verify**: Cannot save template with invalid agent reference

- [x] **3.3 Handle missing agent scenarios**
  - Show warning in template editor if `agentId` references deleted agent
  - Display agent name as "[Deleted Agent]" with warning icon
  - Provide option to select new agent
  - **Verify**: Templates with deleted agents show clear warning

- [x] **3.4 Update command execution**
  - Modify `src/commands/command-executor.ts` to resolve agent by `agentId`
  - Lookup agent command from `settings.agents`
  - Fallback to agent name if agent not found (backward compatibility)
  - **Verify**: Command templates execute correctly with agent lookup

## Phase 4: Direct Prompt Modal

- [x] **4.1 Create DirectPromptModal component**
  - Create `src/ui/direct-prompt-modal.ts` extending Obsidian `Modal`
  - Implement basic modal structure with title and buttons
  - Add close/cancel handlers
  - **Verify**: Modal opens and closes correctly

- [x] **4.2 Implement agent selection dropdown**
  - Add agent dropdown populated from `settings.agents` (enabled only)
  - Set default selection to first enabled agent
  - Handle case where no agents are enabled (disable Execute button)
  - **Verify**: Agent dropdown displays all enabled agents

- [x] **4.3 Implement context display area**
  - Add read-only textarea showing resolved context placeholders
  - Format: `<file:/path/to/file.md>` and `<selection:text...>`
  - Accept file and selection context from constructor
  - **Verify**: Context area displays file path and selection correctly

- [x] **4.4 Implement prompt input area**
  - Add editable textarea for user prompt
  - Auto-focus prompt input on modal open
  - Allow multi-line input
  - **Verify**: Can type and edit prompt text

- [x] **4.5 Implement Execute button handler**
  - Construct command from: agent command + context + user prompt
  - Use `CommandExecutor` to execute constructed command
  - Close modal after successful execution
  - Show error notice if execution fails
  - **Verify**: Execute button launches terminal with correct command

- [x] **4.6 Add empty agent validation**
  - Check if agent list is empty on modal open
  - Disable Execute button if no agents available
  - Show message: "Please configure at least one AI agent in settings"
  - **Verify**: Modal gracefully handles empty agent list

## Phase 5: Context Menu Integration

- [x] **5.1 Add "Direct Prompt..." to file context menu**
  - Register file menu event in `src/main.ts`
  - Add "AI Terminal: Direct Prompt..." menu item at top of submenu
  - Use `edit` icon to distinguish from template commands
  - Collect file context and open DirectPromptModal
  - **Verify**: Right-click file shows "Direct Prompt..." option

- [x] **5.2 Add "Direct Prompt..." to editor context menu**
  - Register editor menu event in `src/main.ts`
  - Add "AI Terminal: Direct Prompt..." menu item
  - Collect file + selection context and open DirectPromptModal
  - **Verify**: Right-click in editor shows "Direct Prompt..." option

- [x] **5.3 Add "Direct Prompt" to command palette**
  - Register Obsidian command: "AI Terminal: Direct Prompt"
  - Use active file as context
  - Handle case where no file is open (show warning or use empty context)
  - **Verify**: Command palette includes "AI Terminal: Direct Prompt"

- [x] **5.4 Position menu items correctly**
  - Ensure "Direct Prompt..." appears before command template items
  - Add separator between direct prompt and templates if desired
  - **Verify**: Menu structure is clean and logical

## Phase 6: Testing & Validation

- [x] **6.1 Unit tests for agent management**
  - Test agent validation rules (id, name, command)
  - Test migration logic with various legacy settings structures
  - Test agent lookup by id
  - **Verify**: All unit tests pass

- [x] **6.2 Unit tests for DirectPromptModal**
  - Test context formatting
  - Test command construction
  - Test empty agent list handling
  - **Verify**: Modal logic tests pass

- [ ] **6.3 Integration tests**
  - Test full flow: right-click → dialog → execute → terminal launch
  - Test agent dropdown population in both modal and template editor
  - Test template execution with agent lookup
  - **Verify**: End-to-end flows work correctly

- [ ] **6.4 Manual testing checklist**
  - Fresh install: verify default agents created
  - Upgrade: verify migration from old settings works
  - Add/edit/delete agents in settings
  - Create new template with agent dropdown
  - Open direct prompt from file context menu
  - Open direct prompt from editor context menu
  - Execute direct prompt with and without selection
  - Delete agent used by template (verify warning)
  - Disable agent (verify removal from dropdowns)
  - **Verify**: All manual test scenarios pass

- [x] **6.5 OpenSpec validation**
  - Run `openspec validate add-direct-prompt-input`
  - Fix any validation errors or warnings
  - Ensure all requirements have scenarios
  - **Verify**: Validation passes with no errors

## Phase 7: Documentation & Polish

- [ ] **7.1 Update README**
  - Document new direct prompt feature
  - Add screenshots of dialog UI
  - Explain agent management in settings
  - **Verify**: README clearly explains new features

- [ ] **7.2 Add user-facing help text**
  - Add helper text in settings for agent configuration
  - Add placeholder text in dialog prompt input
  - Add tooltip on disabled Execute button when no agents configured
  - **Verify**: UI provides helpful guidance

- [ ] **7.3 Update changelog**
  - Document breaking changes (agent migration)
  - List new features (direct prompt, agent management)
  - Note any API changes
  - **Verify**: Changelog is complete and accurate

## Dependencies & Parallelization

**Sequential Dependencies**:
- Phase 1 must complete before Phase 2, 3, 4
- Phase 4 must complete before Phase 5
- Phase 6 depends on all previous phases

**Parallelizable Work**:
- Phase 2 and Phase 3 can be done in parallel after Phase 1
- Phase 6 testing can overlap with Phase 7 documentation

## Verification Strategy

Each task includes a **Verify** step. Before marking complete:
1. Code compiles without errors
2. Relevant unit tests pass (if applicable)
3. Manual testing confirms expected behavior
4. No regressions in existing functionality

## Rollback Plan

If critical issues discovered:
1. Agent migration is backward compatible (preserves old data)
2. Settings can be manually reset to defaults
3. Feature flag could be added to disable direct prompt if needed
