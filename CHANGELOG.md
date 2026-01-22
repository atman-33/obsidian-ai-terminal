# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-01-22

### Changed
- Stable release of UUID-based agent identification (v1.2.0)
- No functional changes from v1.2.0

## [1.2.0] - 2026-01-22

### Changed
- **BREAKING**: Agents are now identified by UUIDs instead of names. Existing name-based settings will reset to defaults on upgrade; please reconfigure agents and command templates.
- Agent renaming no longer updates command templates because references are UUID-based.
- UUID-based settings are preserved on future updates once reconfigured.

## [1.1.4] - 2026-01-19

### Changed
- Move command/agent editor Save and Cancel buttons into a sticky header for easier access

## [1.1.3] - 2026-01-18

### Added
- Enhanced shell type resolution for better command execution compatibility
- Improved placeholder escaping for PowerShell and Bash shells

### Fixed
- Better handling of shell-specific escaping scenarios for secure command execution

## [1.1.2] - 2026-01-18

### Fixed
- Improved plugin initialization error handling and recovery
- Enhanced validation for command template configurations
- Better error messages for agent setup failures

## [1.1.1] - 2026-01-17

## [1.1.0] - 2026-01-17

### Added
- **Direct Prompt Feature**: Execute ad-hoc commands with a dedicated modal dialog
- **Agent Management**: Centralized configuration for AI agents in settings
- `<agent>` placeholder integration with the new agent list
- User-facing improvements: Helper text, placeholders, and tooltips in UI
- **Direct Prompt UX**: Optional prompt persistence and clickable placeholder insertion
- **Settings Reset**: Restore all settings to defaults with confirmation

### Changed
- **BREAKING**: Terminal working directory is now always set to vault root instead of the file's directory
  - This enables easier access to all vault files using relative paths
  - File directory remains accessible via the `<dir>` placeholder
  - Existing workflows that relied on file directory as working directory may need adjustment
- **BREAKING**: Command templates now use `agentName` referencing the central agent list, replacing free-form agent definitions
- Command editor now warns about unsaved changes and uses a vertical layout for multi-line fields

## [1.0.0] - 2026-01-16

### Added
- Customizable command templates with dynamic placeholder support
- Context-aware execution from command palette, file context menu, and editor context menu
- Windows Terminal launcher with PowerShell support
- Placeholder system supporting file paths, vault root, selection, and custom prompts
- Base64 encoding for secure command execution
- Settings UI for managing command templates
- Default templates for GitHub Copilot CLI and OpenCode integration
- Command template editor with validation
- Support for `<file>`, `<path>`, `<relative-path>`, `<dir>`, `<vault>`, `<selection>`, `<prompt>`, `<agent>` placeholders

### Security
- PowerShell command injection prevention via Base64 encoding
- Secure placeholder value sanitization
- Shell argument escaping for file paths

[Unreleased]: https://github.com/atman-33/obsidian-ai-terminal/compare/1.3.0...HEAD
[1.3.0]: https://github.com/atman-33/obsidian-ai-terminal/compare/1.2.0...1.3.0
[1.2.0]: https://github.com/atman-33/obsidian-ai-terminal/compare/1.1.4...1.2.0
[1.1.4]: https://github.com/atman-33/obsidian-ai-terminal/compare/1.1.3...1.1.4
[1.1.3]: https://github.com/atman-33/obsidian-ai-terminal/compare/1.1.2...1.1.3
[1.1.2]: https://github.com/atman-33/obsidian-ai-terminal/compare/1.1.1...1.1.2
[1.1.1]: https://github.com/atman-33/obsidian-ai-terminal/releases/tag/1.1.1
[1.1.0]: https://github.com/atman-33/obsidian-ai-terminal/releases/tag/1.1.0
[1.0.0]: https://github.com/atman-33/obsidian-ai-terminal/releases/tag/1.0.0
