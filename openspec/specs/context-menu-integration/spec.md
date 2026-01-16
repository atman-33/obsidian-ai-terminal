# context-menu-integration Specification

## Purpose
TBD - created by archiving change add-ai-terminal-launcher. Update Purpose after archive.
## Requirements
### Requirement: Add commands to file context menu

The plugin MUST add enabled command templates to the file context menu in Obsidian's file explorer.

#### Scenario: Show commands in file context menu

**Given** user has enabled command templates
**When** user right-clicks on a file in file explorer
**Then** context menu should display all enabled command templates
**And** each command should have the template's display name
**And** commands should be grouped under "AI Terminal" submenu

#### Scenario: Execute command from file context menu

**Given** user right-clicks on file `notes/readme.md`
**When** user selects "AI Terminal > Copilot - Interactive" from context menu
**Then** the command template should execute
**And** `<file>` placeholders should resolve to file information
**And** terminal should launch with resolved command

#### Scenario: Context menu updates when settings change

**Given** user has configured command templates
**When** user adds, removes, or disables a command template
**Then** file context menu should update immediately
**And** only enabled commands should appear

### Requirement: Add commands to editor context menu

The plugin MUST add enabled command templates to the editor context menu.

#### Scenario: Show commands in editor context menu

**Given** user has enabled command templates
**When** user right-clicks in the editor
**Then** context menu should display all enabled command templates
**And** commands should appear in "AI Terminal" submenu

#### Scenario: Execute command with selection

**Given** user has selected text in the editor
**When** user right-clicks and selects "AI Terminal > OpenCode - Analyze"
**Then** the command should execute
**And** `<selection>` placeholder should resolve to selected text
**And** `<file>` placeholder should resolve to current file

#### Scenario: Execute command without selection

**Given** user has not selected any text
**When** user executes command from editor context menu
**Then** `<selection>` placeholder should resolve to empty string
**And** command should still execute normally

### Requirement: Register commands in command palette

The plugin MUST register enabled command templates as commands in Obsidian's command palette.

#### Scenario: Show commands in command palette

**Given** user has enabled command templates
**When** user opens command palette (Ctrl+P)
**Then** all enabled commands should appear with prefix "AI Terminal: "
**And** command names should match template display names

#### Scenario: Execute command from command palette

**Given** user opens command palette
**When** user selects "AI Terminal: Copilot - Interactive"
**Then** command should execute using active file as context
**And** if no active file, placeholders should use vault root or empty values

#### Scenario: Commands update dynamically

**Given** plugin is loaded
**When** user modifies command templates in settings
**Then** command palette should reflect changes immediately
**And** old commands should be unregistered
**And** new/updated commands should be registered

### Requirement: Use consistent iconography

All command template menu items MUST use consistent, recognizable icons.

#### Scenario: Terminal icon in context menus

**Given** command templates appear in context menus
**When** viewing the menu
**Then** all command items should use the "terminal" icon
**And** icon should be consistent across file and editor menus

### Requirement: Group commands in submenus

Command templates MUST be grouped in submenus to avoid cluttering context menus.

#### Scenario: Commands grouped under "AI Terminal" submenu

**Given** user has multiple command templates
**When** opening file or editor context menu
**Then** an "AI Terminal" submenu MUST appear
**And** all command templates MUST be nested under this submenu

#### Scenario: Submenu not shown when no commands enabled

**Given** user has no enabled command templates
**When** opening context menu
**Then** "AI Terminal" submenu should not appear

### Requirement: Support keyboard shortcuts for commands

Users MUST be able to assign keyboard shortcuts to command templates through Obsidian's hotkey settings.

#### Scenario: Command appears in hotkey settings

**Given** command template is enabled
**When** user opens Obsidian hotkey settings
**Then** command should appear as "AI Terminal: [Template Name]"
**And** user should be able to assign a hotkey

#### Scenario: Execute command via hotkey

**Given** user has assigned Ctrl+Shift+T to a command template
**When** user presses Ctrl+Shift+T
**Then** command should execute using current file context

### Requirement: Preserve command IDs across sessions

Command IDs MUST remain stable to preserve user-assigned hotkeys and command history.

#### Scenario: Stable command IDs

**Given** command template has ID "copilot-interactive"
**When** plugin registers the command
**Then** command ID should be "ai-terminal-copilot-interactive"
**And** ID should not change unless user manually changes template ID

#### Scenario: Handle ID conflicts

**Given** user creates command template with duplicate ID
**When** attempting to save
**Then** validation error should be shown
**And** user should be prompted to choose unique ID

