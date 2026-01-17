# command-templates Specification Delta

## MODIFIED Requirements

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

## REMOVED Requirements

None. All existing requirements remain valid with modifications noted above.
