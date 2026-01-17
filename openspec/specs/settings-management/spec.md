# settings-management Specification

## Purpose
TBD - created by archiving change enhance-direct-prompt-ux. Update Purpose after archive.
## Requirements
### Requirement: Reset all settings to defaults

The plugin MUST provide a mechanism to reset all configuration to factory defaults.

#### Scenario: Display reset button in settings

**Given** user opens plugin settings

**When** user scrolls to bottom of settings page

**Then** "Reset All Settings" button should be visible

**And** button should have warning styling (red or similar)

**And** button should be clearly separated from other settings

#### Scenario: Confirm before resetting

**Given** user clicks "Reset All Settings" button

**When** confirmation dialog appears

**Then** dialog should clearly warn about data loss

**And** dialog should list what will be reset:
- All AI agents (restored to default Copilot and OpenCode)
- All command templates (restored to default 2 templates)
- All preferences (terminal type, prompt persistence, etc.)

**And** dialog should show "Cancel" and "Reset" buttons

**And** "Reset" button should have warning styling

#### Scenario: Reset settings on confirmation

**Given** user clicks "Reset All Settings"

**And** user clicks "Reset" in confirmation dialog

**When** reset operation completes

**Then** all settings should be restored to `DEFAULT_SETTINGS` values

**And** settings should be immediately saved to disk

**And** settings UI should refresh to show default values

**And** success notice should be displayed

#### Scenario: Cancel reset operation

**Given** user clicks "Reset All Settings"

**When** user clicks "Cancel" in confirmation dialog

**Then** no settings should be changed

**And** dialog should close

**And** settings UI should remain unchanged

#### Scenario: Reset persists across restarts

**Given** user has reset settings

**When** Obsidian is restarted

**Then** default settings should still be active

**And** no custom agents or commands should be present

