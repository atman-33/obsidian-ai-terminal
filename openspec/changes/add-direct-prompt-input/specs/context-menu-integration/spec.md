# context-menu-integration Specification Delta

## ADDED Requirements

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

## MODIFIED Requirements

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

## REMOVED Requirements

None. All existing requirements remain valid with additions noted above.
