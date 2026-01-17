# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Direct Prompt Feature**: Execute ad-hoc commands with a dedicated modal dialog
- **Agent Management**: Centralized configuration for AI agents in settings
- `<agent>` placeholder integration with the new agent list
- User-facing improvements: Helper text, placeholders, and tooltips in UI

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

[1.0.0]: https://github.com/atman-33/obsidian-ai-terminal/releases/tag/1.0.0
