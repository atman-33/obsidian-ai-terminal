# Specification: Command Templates

## ADDED Requirements

### Requirement: Store and manage command templates

The plugin MUST allow users to define, store, and manage multiple command templates in plugin settings.

#### Scenario: Add new command template

**Given** user opens plugin settings
**When** user clicks "Add Command" button
**Then** a new command template editor should appear
**And** user should be able to input: id, name, template, default prompt, default agent
**And** the template should be saved to plugin settings when confirmed

#### Scenario: Edit existing command template

**Given** user has saved command templates
**When** user opens plugin settings
**Then** all command templates should be displayed in a list
**And** user should be able to click "Edit" on any template
**And** changes should be persisted when saved

#### Scenario: Remove command template

**Given** user has saved command templates
**When** user clicks "Remove" on a template
**Then** the template should be removed from settings
**And** associated commands should be unregistered from command palette and context menus

#### Scenario: Reorder command templates

**Given** user has multiple command templates
**When** user uses "Move Up" or "Move Down" buttons
**Then** the template order should change
**And** the order should be reflected in context menus

### Requirement: Validate command template syntax

The plugin MUST validate command templates to ensure they contain valid placeholders and safe commands.

#### Scenario: Accept valid command template

**Given** user inputs template: `copilot -i "<prompt>"`
**When** user saves the template
**Then** the template should be accepted
**And** no validation error should be shown

#### Scenario: Reject unknown placeholders

**Given** user inputs template with unknown placeholder: `copilot <unknown>`
**When** user attempts to save
**Then** validation error should be shown
**And** the template should not be saved
**And** error message should list valid placeholders

#### Scenario: Warn on potentially unsafe commands

**Given** user inputs template containing `rm -rf` or similar dangerous commands
**When** user attempts to save
**Then** a warning should be displayed
**And** user should be required to confirm the template
**And** warning should explain security risks

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

## Relationships

**Depends on**: None (foundational capability)

**Required by**:
- `placeholder-system`: Provides template strings to be processed
- `terminal-launcher`: Provides command to execute
- `context-menu-integration`: Determines which commands appear in menus
