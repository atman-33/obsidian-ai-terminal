# direct-prompt-input Specification

## Purpose
TBD - created by archiving change add-direct-prompt-input. Update Purpose after archive.
## Requirements
### Requirement: Manage AI agent list in settings

The plugin MUST allow users to define, configure, and manage a list of available AI agents in plugin settings.

#### Scenario: Add new agent

**Given** user opens plugin settings

**When** user navigates to "AI Agents" section and clicks "Add Agent"

**Then** a new agent editor should appear

**And** user should be able to input: id (unique identifier), name (display name), command (base command)

**And** agent should be saved to plugin settings when confirmed

**And** agent should appear in agent selection dropdowns

#### Scenario: Edit existing agent

**Given** user has configured agents

**When** user clicks "Edit" on an agent in settings

**Then** agent editor should open with current values

**And** user should be able to modify name and command (id is immutable)

**And** changes should be saved when confirmed

**And** all references (templates, dropdowns) should reflect updated values

#### Scenario: Delete agent

**Given** user has configured agents

**When** user clicks "Delete" on an agent

**Then** if agent is not used by any command templates, agent should be deleted immediately

**And** if agent is used by templates, confirmation dialog should appear

**And** dialog should list affected templates

**And** agent should only be deleted after user confirms

#### Scenario: Enable/disable agent

**Given** user has configured agents

**When** user toggles the "Enabled" switch on an agent

**Then** agent's enabled status should be updated

**And** disabled agents should not appear in agent selection dropdowns

**And** disabled agents should not be available for new templates or direct prompts

**And** existing templates using disabled agents should continue to work

#### Scenario: Reorder agents

**Given** user has multiple agents

**When** user uses "Move Up" or "Move Down" buttons on an agent

**Then** agent order should change in settings

**And** agent dropdown order should reflect the new order

#### Scenario: Validate agent configuration

**Given** user is creating or editing an agent

**When** user inputs invalid data (duplicate id, empty name, empty command)

**Then** validation error should be shown

**And** agent should not be saved until errors are corrected

**And** error messages should clearly indicate what needs to be fixed

#### Scenario: Default agents on first install

**Given** user installs plugin for first time

**When** plugin initializes settings

**Then** default agents should be created automatically:
- GitHub Copilot (id: "copilot", command: "copilot")
- OpenCode (id: "opencode", command: "opencode")

**And** both agents should be enabled by default

### Requirement: Display direct prompt dialog from context menus

The plugin MUST provide a dialog interface for constructing custom AI terminal prompts with visible context and agent selection.

#### Scenario: Open direct prompt dialog from file context menu

**Given** user right-clicks on a file in file explorer

**When** user selects "AI Terminal: Direct Prompt..." from context menu

**Then** a modal dialog should open

**And** dialog should display file path in context area as `<file:/path/to/file.md>`

**And** dialog should have agent selection dropdown

**And** dialog should have editable prompt input area

**And** dialog should have Execute and Cancel buttons

#### Scenario: Open direct prompt dialog from editor context menu

**Given** user right-clicks in the editor

**When** user selects "AI Terminal: Direct Prompt..." from context menu

**Then** modal dialog should open

**And** context area should display both file and selection:
- `<file:/path/to/current-file.md>`
- `<selection:selected text content>` (if text is selected)

**And** if no text is selected, `<selection:>` should be empty or omitted

#### Scenario: Open direct prompt from command palette

**Given** user opens command palette (Ctrl+P)

**When** user selects "AI Terminal: Direct Prompt"

**Then** modal dialog should open

**And** active file should be used as context

**And** if no file is active, context should show empty or vault root

### Requirement: Provide agent selection in dialog

The dialog MUST allow users to select an AI agent from configured agents.

#### Scenario: Display enabled agents in dropdown

**Given** user has multiple enabled agents configured

**When** direct prompt dialog opens

**Then** agent dropdown should display all enabled agents

**And** agents should be listed in the order defined in settings

**And** first enabled agent should be selected by default

#### Scenario: Handle no enabled agents

**Given** user has no enabled agents (all disabled or none configured)

**When** direct prompt dialog opens

**Then** agent dropdown should be empty or show placeholder

**And** Execute button should be disabled

**And** message should display: "Please configure at least one AI agent in settings"

#### Scenario: Filter disabled agents from dropdown

**Given** user has both enabled and disabled agents

**When** direct prompt dialog opens

**Then** only enabled agents should appear in dropdown

**And** disabled agents should not be selectable

### Requirement: Display context placeholders in dialog

The dialog MUST clearly display resolved context information to users.

#### Scenario: Display file context

**Given** dialog was opened from file or editor context

**When** dialog renders

**Then** context area should show `<file:/absolute/path/to/file.md>`

**And** context area should be read-only (not editable)

**And** file path should be absolute or vault-relative based on system configuration

#### Scenario: Display selection context

**Given** user has selected text in editor before opening dialog

**When** dialog renders

**Then** context area should show `<selection:selected text content>`

**And** selection text should be truncated if longer than 200 characters

**And** truncated text should end with ellipsis "..."

#### Scenario: Display empty selection

**Given** user has not selected any text

**When** dialog opened from editor context menu

**Then** context area should show `<selection:>` as empty

**Or** `<selection:>` line should be omitted entirely

### Requirement: Accept custom prompt input

The dialog MUST provide a text input area for users to enter custom prompts.

#### Scenario: Enter custom prompt

**Given** direct prompt dialog is open

**When** user types in prompt input area

**Then** text should be captured for command construction

**And** input area should support multi-line text

**And** input area should auto-focus on dialog open

#### Scenario: Allow empty prompt

**Given** user has not entered any text in prompt area

**When** user clicks Execute button

**Then** command should execute with only context (no custom prompt)

**And** terminal should launch normally

### Requirement: Execute command from dialog

The dialog MUST construct and execute terminal commands based on user input.

#### Scenario: Execute command with full input

**Given** user has selected agent "GitHub Copilot"

**And** context shows `<file:/notes/readme.md>` and `<selection:function foo()>`

**And** user has entered prompt "Explain this function"

**When** user clicks Execute button

**Then** command should be constructed as: `copilot -i "<file:/notes/readme.md> <selection:function foo()> Explain this function"`

**And** command should be passed to CommandExecutor for placeholder resolution

**And** terminal should launch with resolved command

**And** dialog should close after successful execution

#### Scenario: Execute command with context only

**Given** user has selected agent "OpenCode"

**And** context shows `<file:/src/main.ts>`

**And** user has not entered any custom prompt (empty)

**When** user clicks Execute button

**Then** command should be constructed as: `opencode "<file:/src/main.ts>"`

**And** terminal should launch

**And** dialog should close

#### Scenario: Handle execution failure

**Given** user clicks Execute button

**When** command execution fails (e.g., terminal not found, invalid path)

**Then** error notice should be displayed to user

**And** dialog should remain open (not close)

**And** error details should be logged to console

#### Scenario: Cancel dialog

**Given** direct prompt dialog is open

**When** user clicks Cancel button or presses Escape key

**Then** dialog should close without executing any command

**And** no terminal should be launched

### Requirement: Migrate legacy agent configuration

The plugin MUST automatically migrate command templates from old `defaultAgent` string format to new agent list references.

#### Scenario: First load after update with legacy settings

**Given** plugin settings contain command templates with `defaultAgent` string fields

**And** settings do not contain `agents` array

**When** plugin loads for the first time after update

**Then** migration function should execute

**And** unique agent names should be extracted from all templates

**And** new agent entries should be created in `settings.agents` for each unique name

**And** each template's `defaultAgent` should be replaced with `agentId` referencing created agent

**And** migrated settings should be saved

**And** plugin should continue loading normally

#### Scenario: Migration preserves template functionality

**Given** legacy template had `defaultAgent: "copilot"`

**When** migration completes

**Then** new agent should exist with `id: "copilot"`, `name: "GitHub Copilot"`, `command: "copilot"`

**And** template should have `agentId: "copilot"`

**And** executing template should produce identical command as before migration

#### Scenario: Skip migration if agents already exist

**Given** plugin settings contain `agents` array

**When** plugin loads

**Then** migration should not run

**And** existing agent configuration should be preserved

### Requirement: Validate agent references

The plugin MUST ensure command templates and direct prompts only reference valid agents.

#### Scenario: Validate agent exists during execution

**Given** command template has `agentId: "custom-agent"`

**And** agent with id "custom-agent" exists in settings

**When** template is executed

**Then** agent command should be resolved successfully

**And** terminal should launch normally

#### Scenario: Handle missing agent reference

**Given** command template has `agentId: "deleted-agent"`

**And** no agent with id "deleted-agent" exists in settings

**When** attempting to execute template

**Then** error should be shown: "Agent 'deleted-agent' not found. Please update template."

**And** template should not execute

#### Scenario: Show warning for orphaned template

**Given** command template references deleted agent

**When** viewing template in settings

**Then** warning indicator should be displayed next to template

**And** template name should show "[Missing Agent]" or similar warning

**And** user should be able to reassign agent or delete template

