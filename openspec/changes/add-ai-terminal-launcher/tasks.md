# Implementation Tasks: AI Terminal Launcher

This document outlines the implementation tasks in order of execution. Each task should be completed and verified before moving to the next.

## Phase 1: Foundation & Settings

### Task 1.1: Define TypeScript interfaces and types
- [ ] Create `src/types.ts` with core interfaces:
  - `CommandTemplate`
  - `PluginSettings`
  - `ExecutionContext`
  - `PlatformType`
- [ ] Export types for use across modules
- [ ] Add JSDoc comments for all interfaces

**Verification**: TypeScript compiles without errors

### Task 1.2: Implement settings storage and defaults
- [ ] Update `src/settings.ts` with full `PluginSettings` interface
- [ ] Define `DEFAULT_SETTINGS` with sensible defaults:
  - Default terminal type based on platform detection
  - 3-5 default command templates (Copilot, OpenCode)
  - Default WSL distribution: "Ubuntu"
- [ ] Implement settings load/save in `main.ts`

**Verification**: Plugin loads with default settings, settings persist after restart

### Task 1.3: Create settings UI
- [ ] Create `src/ui/settings-tab.ts`
- [ ] Implement terminal type selector (dropdown)
- [ ] Implement WSL distribution input field (shown only when WSL selected)
- [ ] Add placeholder reference documentation in settings
- [ ] Style settings tab for clarity

**Verification**: Settings UI displays, terminal type can be changed and saved

## Phase 2: Command Template Management

### Task 2.1: Implement command template storage
- [ ] Create `src/commands/command-manager.ts`
- [ ] Implement `addCommand()` method
- [ ] Implement `updateCommand()` method
- [ ] Implement `removeCommand()` method
- [ ] Implement `getEnabledCommands()` method
- [ ] Ensure unique ID validation

**Verification**: Commands can be added/removed/updated in settings

### Task 2.2: Build command template editor UI
- [ ] Create `src/ui/command-editor.ts` modal
- [ ] Add form fields: id, name, template, defaultPrompt, defaultAgent, enabled
- [ ] Implement template syntax validation
- [ ] Show validation errors in UI
- [ ] Add placeholder reference help section

**Verification**: Modal opens, validation works, templates can be saved

### Task 2.3: Implement command list UI in settings
- [ ] Display all command templates in settings tab
- [ ] Add "Edit" button for each template
- [ ] Add "Remove" button with confirmation
- [ ] Add "Move Up" / "Move Down" buttons for reordering
- [ ] Add "Add Command" button
- [ ] Show enabled/disabled toggle for each template

**Verification**: All command management operations work in UI

### Task 2.4: Implement template validation
- [ ] Create validation function for placeholder syntax
- [ ] Validate against allowed placeholders list
- [ ] Warn on dangerous commands (rm, dd, etc.)
- [ ] Show clear error messages for invalid templates

**Verification**: Invalid templates are rejected, warnings shown for dangerous commands

## Phase 3: Placeholder System

### Task 3.1: Implement context collector
- [ ] Create `src/placeholders/context-collector.ts`
- [ ] Implement `collectFileContext()` for file-based execution
- [ ] Implement `collectEditorContext()` for editor-based execution
- [ ] Implement `collectVaultContext()` for vault information
- [ ] Handle missing context gracefully (return undefined or empty)

**Verification**: Context collection works for various execution scenarios

### Task 3.2: Implement placeholder resolver
- [ ] Create `src/placeholders/placeholder-resolver.ts`
- [ ] Implement `resolvePlaceholders()` function
- [ ] Replace `<file>`, `<path>`, `<relative-path>`, `<dir>`, `<vault>`
- [ ] Replace `<selection>`, `<prompt>`, `<agent>`
- [ ] Handle nested placeholders (e.g., `<prompt>` contains `<file>`)
- [ ] Use empty string for unavailable placeholders

**Verification**: All placeholders resolve correctly with test cases

### Task 3.3: Implement shell escaping
- [ ] Install `shell-escape` or similar library
- [ ] Apply escaping to all placeholder values before substitution
- [ ] Test with filenames containing spaces, quotes, special characters

**Verification**: Commands with special characters don't cause injection issues

### Task 3.4: Add placeholder documentation to settings
- [ ] Create help section in settings UI listing all placeholders
- [ ] Include description and example for each placeholder
- [ ] Make documentation easily accessible from template editor

**Verification**: Documentation is clear and visible in settings

## Phase 4: Terminal Launcher

### Task 4.1: Implement platform detection
- [ ] Create `src/terminal/platform-strategy.ts`
- [ ] Detect current platform (Windows, Linux, macOS)
- [ ] Expose `getPlatform()` function

**Verification**: Platform is correctly detected

### Task 4.2: Implement Windows Terminal launcher
- [ ] Create launcher for Windows Terminal (wt.exe)
- [ ] Set working directory and command
- [ ] Use detached process
- [ ] Handle errors if Windows Terminal not installed

**Verification**: Windows Terminal launches on Windows systems

### Task 4.3: Implement WSL terminal launcher
- [ ] Create `src/terminal/path-converter.ts`
- [ ] Implement Windows → WSL path conversion
- [ ] Create WSL launcher using `wsl.exe`
- [ ] Pass distribution parameter
- [ ] Set working directory in WSL environment

**Verification**: WSL terminal launches with correct paths on Windows

### Task 4.4: Implement Linux terminal launcher
- [ ] Detect available terminal emulators (gnome-terminal, konsole, xterm)
- [ ] Try terminals in priority order
- [ ] Fallback to next terminal if one fails
- [ ] Set working directory and command

**Verification**: Terminal launches on Linux with common terminal emulators

### Task 4.5: Implement macOS Terminal.app launcher
- [ ] Use AppleScript to launch Terminal.app
- [ ] Set working directory and execute command
- [ ] Handle Terminal.app not responding

**Verification**: Terminal.app launches correctly on macOS

### Task 4.6: Implement unified terminal launcher
- [ ] Create `src/terminal/terminal-launcher.ts`
- [ ] Implement `launchTerminal()` function
- [ ] Select appropriate platform strategy
- [ ] Handle errors and show user-friendly notices
- [ ] Log errors for debugging

**Verification**: Terminal launches correctly on all platforms

## Phase 5: Command Execution & Integration

### Task 5.1: Implement command executor
- [ ] Create `src/commands/command-executor.ts`
- [ ] Implement `executeCommand()` orchestration function:
  1. Collect execution context
  2. Resolve placeholders in template
  3. Call terminal launcher with resolved command
  4. Handle errors
- [ ] Show success/error notices to user

**Verification**: Commands execute end-to-end successfully

### Task 5.2: Register commands in command palette
- [ ] Update `main.ts` to register all enabled commands on load
- [ ] Use command ID format: `ai-terminal-${template.id}`
- [ ] Use display name format: `AI Terminal: ${template.name}`
- [ ] Pass current file context when executing

**Verification**: Commands appear in command palette and execute

### Task 5.3: Implement settings change handler
- [ ] Unregister all commands when settings change
- [ ] Re-register updated commands
- [ ] Update context menus

**Verification**: Commands update immediately after settings change

### Task 5.4: Add file context menu integration
- [ ] Register `file-menu` event handler in `main.ts`
- [ ] Add "AI Terminal" submenu
- [ ] Add all enabled commands to submenu
- [ ] Pass file context to command executor

**Verification**: Right-clicking files shows AI Terminal commands

### Task 5.5: Add editor context menu integration
- [ ] Register `editor-menu` event handler in `main.ts`
- [ ] Add "AI Terminal" submenu
- [ ] Add all enabled commands to submenu
- [ ] Pass file and selection context to command executor

**Verification**: Right-clicking in editor shows commands with selection support

### Task 5.6: Add icons to menu items
- [ ] Use `terminal` icon for all command menu items
- [ ] Ensure consistent icon display

**Verification**: All menu items show terminal icon

## Phase 6: Testing & Polish

### Task 6.1: Manual cross-platform testing
- [ ] Test on Windows with Windows Terminal
- [ ] Test on Windows with WSL (Ubuntu, Debian if available)
- [ ] Test on Linux with gnome-terminal, konsole
- [ ] Test on macOS with Terminal.app
- [ ] Verify path conversion works correctly

**Verification**: All platforms work as expected

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

## Estimated Timeline

- Phase 1: 1 day
- Phase 2: 2 days
- Phase 3: 1-2 days
- Phase 4: 2-3 days
- Phase 5: 1-2 days
- Phase 6: 2-3 days
- Phase 7: 1 day

**Total: 10-14 days**
