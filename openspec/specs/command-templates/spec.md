# command-templates Specification

## Purpose
TBD - created by archiving change add-ai-terminal-launcher. Update Purpose after archive.
## Requirements
### Requirement: Store and manage command templates

The plugin MUST allow users to define, store, and manage multiple command templates in plugin settings.

#### Scenario: Add new command template

**Given** user opens plugin settings

**When** user clicks "Add Command" button

**Then** a new command template editor should appear

**And** user should be able to input: id, name, template, default prompt, **agent (selected from dropdown)**

**And** the template should be saved to plugin settings when confirmed

#### Scenario: Select agent for template

**Given** user is creating or editing a command template

**When** user views agent field in template editor

**Then** a dropdown should display all enabled agents from settings

**And** user should select an agent from the dropdown (not free-text input)

**And** selected agent's id should be stored in template as `agentId`

#### Scenario: Handle no enabled agents in template editor

**Given** user has no enabled agents configured

**When** user opens command template editor

**Then** agent dropdown should be empty or show placeholder

**And** warning should display: "Please configure at least one AI agent in settings"

**And** template should not be savable until agent is selected

### Requirement: Validate command template syntax

The plugin MUST validate command templates to ensure they contain valid placeholders, safe commands, and valid agent references.

#### Scenario: Validate agent reference on save

**Given** user is saving a command template

**And** template has `agentId: "copilot"`

**When** validation runs

**Then** validation should check if agent with id "copilot" exists in `settings.agents`

**And** if agent exists, validation should pass

**And** if agent does not exist, validation should fail with error: "Selected agent no longer exists. Please choose another agent."

#### Scenario: Prevent saving template with invalid agent

**Given** user attempts to save template with `agentId` referencing non-existent agent

**When** user clicks save

**Then** validation error should be shown

**And** template should not be saved

**And** user should be prompted to select valid agent

### Requirement: Persist command templates across sessions

Command templates MUST be persisted in plugin settings and restored when plugin loads.

#### Scenario: Save templates to plugin data

**Given** user has configured command templates
**When** plugin saves settings
**Then** all templates should be serialized to JSON
**And** saved via Obsidian's `saveData()` API

#### Scenario: Load templates on plugin startup

**Given** plugin has saved command templates
**When** plugin loads
**Then** templates should be deserialized from saved data
**And** commands should be registered in command palette
**And** context menu integrations should be activated

### Requirement: Provide default command templates

The plugin MUST include default command templates for common use cases.

#### Scenario: First-time plugin installation

**Given** user installs the plugin for the first time
**When** plugin initializes
**Then** default templates should be created for:
- GitHub Copilot CLI interactive mode
- OpenCode with prompt
- Simple terminal launch (no AI agent)
**And** user should be able to modify or remove defaults

#### Scenario: Default templates use safe placeholders

**Given** default command templates are provided
**When** examining default templates
**Then** placeholders should be limited to: `<file>`, `<prompt>`, `<agent>`
**And** default prompts should be generic and safe

### Requirement: Enable/disable command templates

Users MUST be able to enable or disable command templates without deleting them.

#### Scenario: Disable command template

**Given** user has an enabled command template
**When** user toggles the "Enabled" switch in settings
**Then** the template should be marked as disabled
**And** the command should be removed from command palette
**And** the command should be removed from context menus

#### Scenario: Enable disabled command template

**Given** user has a disabled command template
**When** user toggles the "Enabled" switch
**Then** the template should be marked as enabled
**And** the command should be registered in command palette
**And** the command should appear in context menus

### Requirement: Support platform-specific command templates

Command templates SHALL support optional platform restrictions to show only on compatible systems.

#### Scenario: Windows-only command template

**Given** command template is marked as Windows-only
**When** plugin loads on Windows
**Then** the command MUST be registered
**And** when plugin loads on Linux or macOS
**Then** the command MUST NOT be registered

