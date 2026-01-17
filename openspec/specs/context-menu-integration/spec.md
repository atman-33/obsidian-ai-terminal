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

The plugin MUST register enabled command templates **and direct prompt command** in Obsidian's command palette.

#### Scenario: Show "Direct Prompt" in command palette

**Given** plugin is loaded

**When** user opens command palette (Ctrl+P)

**Then** "AI Terminal: Direct Prompt" command should appear

**And** command should be listed alongside command template items

#### Scenario: Execute "Direct Prompt" from command palette

**Given** user opens command palette

**And** user has an active file open

**When** user selects "AI Terminal: Direct Prompt"

**Then** direct prompt dialog should open

**And** dialog should use active file as context

**And** if no file is active, context should be empty or vault root

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

### Requirement: Add direct prompt option to context menus

The plugin MUST add a "Direct Prompt..." option to file and editor context menus for ad-hoc AI terminal launches.

#### Scenario: Show "Direct Prompt..." in file context menu

**Given** user has plugin enabled

**When** user right-clicks on a file in file explorer

**Then** "AI Terminal" submenu should appear

**And** "Direct Prompt..." option should be displayed at the top of the submenu

**And** "Direct Prompt..." should use "edit" icon (to distinguish from command templates)

**And** "Direct Prompt..." should appear before any command template items

#### Scenario: Show "Direct Prompt..." in editor context menu

**Given** user has plugin enabled

**When** user right-clicks in the editor (with or without text selection)

**Then** "AI Terminal" submenu should appear

**And** "Direct Prompt..." option should be displayed at the top of the submenu

**And** option should be available regardless of whether text is selected

#### Scenario: Execute "Direct Prompt..." from file context menu

**Given** user right-clicks on file `notes/readme.md`

**When** user selects "AI Terminal > Direct Prompt..."

**Then** direct prompt dialog should open

**And** dialog should show file context: `<file:notes/readme.md>`

**And** user should be able to select agent and enter custom prompt

#### Scenario: Execute "Direct Prompt..." from editor context menu with selection

**Given** user has selected text "function example() { }" in editor

**When** user right-clicks and selects "AI Terminal > Direct Prompt..."

**Then** direct prompt dialog should open

**And** dialog should show both file and selection context

**And** selection context should display selected text

#### Scenario: Execute "Direct Prompt..." from editor context menu without selection

**Given** user has not selected any text in editor

**When** user selects "AI Terminal > Direct Prompt..." from context menu

**Then** direct prompt dialog should open

**And** dialog should show file context only

**And** selection context should be empty or omitted

#### Scenario: Separate "Direct Prompt..." from command templates visually

**Given** user has both direct prompt and command templates enabled

**When** viewing "AI Terminal" submenu

**Then** "Direct Prompt..." should appear first

**And** a separator line should appear after "Direct Prompt..." (optional but recommended)

**And** command template items should appear after the separator

