# Implementation Tasks: AI Terminal Launcher

This document outlines the implementation tasks in order of execution. Each task should be completed and verified before moving to the next.

## Phase 1: Foundation & Settings

### Task 1.1: Define TypeScript interfaces and types
- [x] Create `src/types.ts` with core interfaces:
  - `CommandTemplate`
  - `PluginSettings`
  - `ExecutionContext`
  - `PlatformType` (MVP: Windows Terminal only)
- [x] Export types for use across modules
- [x] Add JSDoc comments for all interfaces

**Verification**: TypeScript compiles without errors

### Task 1.2: Implement settings storage and defaults
- [x] Update `src/settings.ts` with full `PluginSettings` interface
- [x] Define `DEFAULT_SETTINGS` with sensible defaults:
  - Terminal type: `windows-terminal` (MVP: fixed)
  - 5 default command templates (Copilot, OpenCode)
- [x] Implement settings load/save in `main.ts`

**Verification**: Plugin loads with default settings, settings persist after restart

### Task 1.3: Create settings UI
- [x] Create settings tab in `src/settings.ts`
- [x] Implement terminal type selector (dropdown with single option for MVP)
- [x] Add placeholder reference documentation in settings
- [x] Style settings tab for clarity

**Verification**: Settings UI displays correctly

## Phase 2: Command Template Management

### Task 2.1: Implement command template storage
- [x] Create `src/commands/command-manager.ts`
- [x] Implement `addCommand()` method
- [x] Implement `updateCommand()` method
- [x] Implement `removeCommand()` method
- [x] Implement `getEnabledCommands()` method
- [x] Ensure unique ID validation

**Verification**: Commands can be added/removed/updated in settings

### Task 2.2: Build command template editor UI
- [x] Create `src/ui/command-editor.ts` modal
- [x] Add form fields: id, name, template, defaultPrompt, defaultAgent, enabled
- [x] Implement template syntax validation
- [x] Show validation errors in UI
- [x] Add placeholder reference help section

**Verification**: Modal opens, validation works, templates can be saved

### Task 2.3: Implement command list UI in settings
- [x] Display all command templates in settings tab
- [x] Add "Edit" button for each template
- [x] Add "Remove" button with confirmation
- [x] Add "Move Up" / "Move Down" buttons for reordering
- [x] Add "Add Command" button
- [x] Show enabled/disabled toggle for each template

**Verification**: All command management operations work in UI

### Task 2.4: Implement template validation
- [x] Create validation function for placeholder syntax
- [x] Validate against allowed placeholders list
- [x] Warn on dangerous commands (rm, dd, etc.)
- [x] Show clear error messages for invalid templates

**Verification**: Invalid templates are rejected, warnings shown for dangerous commands

## Phase 3: Placeholder System

### Task 3.1: Implement context collector
- [x] Create `src/placeholders/context-collector.ts`
- [x] Implement `collectFileContext()` for file-based execution
- [x] Implement `collectEditorContext()` for editor-based execution
- [x] Implement `collectVaultContext()` for vault information
- [x] Handle missing context gracefully (return undefined or empty)

**Verification**: Context collection works for various execution scenarios

### Task 3.2: Implement placeholder resolver
- [x] Create `src/placeholders/placeholder-resolver.ts`
- [x] Implement `resolvePlaceholders()` function
- [x] Replace `<file>`, `<path>`, `<relative-path>`, `<dir>`, `<vault>`
- [x] Replace `<selection>`, `<prompt>`, `<agent>`
- [x] Handle nested placeholders (e.g., `<prompt>` contains `<file>`)
- [x] Use empty string for unavailable placeholders

**Verification**: All placeholders resolve correctly with test cases

### Task 3.3: Implement PowerShell escaping
- [x] Implement PowerShell-specific escaping for placeholder values
- [x] Use Base64 encoding for commands to avoid escaping issues
- [x] Test with filenames containing spaces, quotes, special characters

**Verification**: Commands with special characters don't cause injection issues

### Task 3.4: Add placeholder documentation to settings
- [x] Create help section in settings UI listing all placeholders
- [x] Include description and example for each placeholder
- [x] Make documentation easily accessible from template editor

**Verification**: Documentation is clear and visible in settings

## Phase 4: Terminal Launcher (MVP: Windows Terminal Only)

### Task 4.1: Implement Windows Terminal launcher
- [x] Create `src/terminal/terminal-launcher.ts`
- [x] Implement launcher for Windows Terminal (wt.exe)
- [x] Use Base64-encoded PowerShell commands to avoid escaping issues
- [x] Set working directory via `Set-Location` in PowerShell script
- [x] Use detached process with `.unref()` for independent terminal sessions
- [x] Handle errors if Windows Terminal not installed

**Verification**: Windows Terminal launches successfully with PowerShell

### Task 4.2: Implement path utilities
- [x] Create `src/terminal/path-converter.ts`
- [x] Implement `escapePathForShell()` for shell argument safety
- [x] Keep minimal utilities (WSL conversion removed for MVP)

**Verification**: Path handling works correctly for Windows paths

**Note**: WSL, Linux, and macOS support deferred to post-MVP releases

## Phase 5: Command Execution & Integration

### Task 5.1: Implement command executor
- [x] Create `src/commands/command-executor.ts`
- [x] Implement `executeCommand()` orchestration function:
  1. Collect execution context
  2. Resolve placeholders in template (PowerShell mode)
  3. Call terminal launcher with resolved command
  4. Handle errors
- [x] Show success/error notices to user

**Verification**: Commands execute end-to-end successfully

### Task 5.2: Register commands in command palette
- [x] Update `main.ts` to register all enabled commands on load
- [x] Use command ID format: `ai-terminal-${template.id}`
- [x] Use display name format: `AI Terminal: ${template.name}`
- [x] Pass current file context when executing

**Verification**: Commands appear in command palette and execute

### Task 5.3: Implement settings change handler
- [x] Unregister all commands when settings change
- [x] Re-register updated commands
- [x] Update context menus

**Verification**: Commands update immediately after settings change

### Task 5.4: Add file context menu integration
- [x] Register `file-menu` event handler in `main.ts`
- [x] Add "AI Terminal" submenu
- [x] Add all enabled commands to submenu
- [x] Pass file context to command executor

**Verification**: Right-clicking files shows AI Terminal commands

### Task 5.5: Add editor context menu integration
- [x] Register `editor-menu` event handler in `main.ts`
- [x] Add "AI Terminal" submenu
- [x] Add all enabled commands to submenu
- [x] Pass file and selection context to command executor

**Verification**: Right-clicking in editor shows commands with selection support

### Task 5.6: Add icons to menu items
- [x] Use `terminal` icon for all command menu items
- [x] Ensure consistent icon display

**Verification**: All menu items show terminal icon

## Phase 6: Testing & Polish

### Task 6.1: Manual Windows Terminal testing
- [ ] Test on Windows with Windows Terminal
- [ ] Test PowerShell command execution
- [ ] Test working directory handling
- [ ] Verify Base64 encoding works correctly
- [ ] Test with different Windows Terminal configurations

**Verification**: Windows Terminal launches and executes commands correctly

### Task 6.2: Test placeholder resolution edge cases
- [ ] Test with files containing spaces in name
- [ ] Test with special characters in filenames
- [ ] Test with long file paths
- [ ] Test with no active file
- [ ] Test with empty selection
- [ ] Test nested placeholders in default prompts

**Verification**: Edge cases handled gracefully

### Task 6.3: Test command injection prevention
- [ ] Test filenames with shell metacharacters (; | & $ etc.)
- [ ] Verify escaping prevents command injection
- [ ] Test with malicious placeholder values

**Verification**: No command injection possible

### Task 6.4: Error handling testing
- [ ] Test with missing terminal executable
- [ ] Test with permission denied scenarios
- [ ] Test with invalid command templates
- [ ] Verify error messages are user-friendly

**Verification**: Errors handled gracefully with clear messages

### Task 6.5: Update README.md
- [ ] Document plugin features
- [ ] Explain how to configure command templates
- [ ] List all available placeholders with examples
- [ ] Add platform-specific installation notes
- [ ] Include security best practices
- [ ] Add troubleshooting section

**Verification**: README is comprehensive and clear

### Task 6.6: Update manifest.json
- [ ] Set correct plugin name
- [ ] Set `isDesktopOnly: true`
- [ ] Set minimum Obsidian version
- [ ] Update description

**Verification**: Manifest contains correct metadata

### Task 6.7: Clean up sample code
- [ ] Remove sample ribbon icon from `main.ts`
- [ ] Remove sample modal from `main.ts`
- [ ] Remove sample commands
- [ ] Remove unused sample settings code

**Verification**: No sample/demo code remains

## Phase 7: Release Preparation

### Task 7.1: Build and test release build
- [ ] Run `npm run build`
- [ ] Verify `main.js` is generated correctly
- [ ] Test plugin with release build in Obsidian
- [ ] Check for console errors

**Verification**: Release build works identically to dev build

### Task 7.2: Version bump
- [ ] Update `manifest.json` version to 1.0.0
- [ ] Update `versions.json` with minimum app version
- [ ] Create git tag for release

**Verification**: Version numbers are consistent

## Dependencies & Parallelization

**Can be parallelized:**
- Phase 2 (Command Template Management) can start after Task 1.2 completes
- Phase 3 (Placeholder System) can start after Task 1.2 completes
- Phase 4 (Terminal Launcher) can start after Task 1.2 completes

**Sequential dependencies:**
- Phase 5 (Integration) requires Phases 2, 3, and 4 to be complete
- Phase 6 (Testing) requires Phase 5 to be complete
- Phase 7 (Release) requires Phase 6 to be complete

## Estimated Timeline (MVP - Windows Terminal Only)

- Phase 1: 1 day ✓ Complete
- Phase 2: 2 days ✓ Complete
- Phase 3: 1-2 days ✓ Complete
- Phase 4: 1 day ✓ Complete (simplified for MVP)
- Phase 5: 1-2 days ✓ Complete
- Phase 6: 1-2 days (in progress)
- Phase 7: 1 day

**Total: 8-10 days** (reduced from 10-14 due to MVP scope)
**Status**: ~80% complete, testing and polish remaining
