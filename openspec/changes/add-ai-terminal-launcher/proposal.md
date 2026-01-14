# Proposal: Add AI Terminal Launcher

## Overview

Add comprehensive AI terminal launcher functionality to the Obsidian plugin, enabling users to launch external terminal sessions with AI agents (GitHub Copilot CLI or OpenCode) directly from Obsidian with customizable command templates and context-aware placeholders.

## Problem Statement

Users working within Obsidian need to frequently switch to external terminals to interact with AI coding assistants (GitHub Copilot CLI, OpenCode). This context switching is disruptive and requires manual navigation to the correct directory and file paths. Additionally, users want to:

- Launch AI agents with specific prompts based on the current file or selection
- Use different AI agents with custom arguments
- Support both Windows and WSL environments
- Customize commands for different workflows (e.g., "fix issues", "review code", "analyze")

## Proposed Solution

Implement a flexible command template system that allows users to:

1. **Define custom command templates** with placeholders for dynamic content (file paths, prompts, agents)
2. **Launch terminals** from multiple contexts (command palette, file context menu, editor context menu)
3. **Support cross-platform terminal launching** (Windows Terminal, WSL, system default)
4. **Replace placeholders** automatically based on execution context (current file, selection, vault root)

### Key Features

#### 1. Command Template System
Users can configure multiple command presets in settings:
```typescript
{
  id: "copilot-interactive",
  name: "Copilot - Interactive",
  template: "copilot -i \"<prompt>\"",
  defaultPrompt: "Fix issues in <file>"
}
```

#### 2. Placeholder Support
Available placeholders for dynamic substitution:
- `<file>`: Filename only (e.g., `readme.md`)
- `<path>`: Absolute file path
- `<relative-path>`: Path relative to vault root
- `<dir>`: Directory path of the file
- `<vault>`: Vault root path
- `<selection>`: Selected text (when launched from editor)
- `<prompt>`: Prompt text (uses default if not specified)
- `<agent>`: Agent name (uses default if not specified)

#### 3. Multiple Launch Contexts
- **Command Palette**: Access all configured commands
- **File Context Menu**: Right-click on files in the file explorer
- **Editor Context Menu**: Right-click in the editor (with selection support)

#### 4. Cross-Platform Terminal Support
- Windows Terminal (native Windows)
- WSL (Windows Subsystem for Linux) with path translation
- System default terminal (Linux, macOS)

## Goals

1. Enable seamless AI agent interaction from within Obsidian
2. Provide flexible, user-customizable command templates
3. Support both GitHub Copilot CLI and OpenCode with custom arguments
4. Handle cross-platform terminal launching (Windows, WSL, Linux, macOS)
5. Minimize context switching for users

## Non-Goals

1. Embedding terminal UI within Obsidian (launches external terminals only)
2. Direct AI agent integration (relies on externally installed CLI tools)
3. Session management or terminal output capture
4. Git integration or version control features
5. Mobile platform support (desktop only: `isDesktopOnly: true`)

## Success Criteria

- [ ] Users can define custom command templates in settings
- [ ] Placeholders are correctly replaced based on context
- [ ] Terminals launch successfully on Windows, WSL, and Linux
- [ ] Commands are accessible from command palette and context menus
- [ ] WSL path translation works correctly (Windows paths → WSL paths)
- [ ] Default values are used when placeholders cannot be resolved

## Affected Capabilities

This change introduces four new capabilities:

1. **terminal-launcher**: Core terminal launching functionality
2. **command-templates**: Command template management and storage
3. **placeholder-system**: Placeholder parsing and substitution
4. **context-menu-integration**: File and editor context menu integration

## Dependencies

- Requires Node.js `child_process` module for terminal launching
- Requires `obsidian` API for context menu and command registration
- External dependencies: GitHub Copilot CLI or OpenCode (user-installed)

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Platform-specific terminal commands fail | High | Provide clear error messages and fallback options |
| Path translation errors (Windows ↔ WSL) | Medium | Comprehensive path testing, validation in settings |
| External CLI tools not installed | Medium | Validate tool availability, show helpful setup messages |
| Command injection via placeholders | High | Sanitize all placeholder values, escape shell arguments |

## Timeline Estimate

- Design and spec validation: 1 day
- Core terminal launcher implementation: 2-3 days
- Command template system: 2 days
- Placeholder system: 1-2 days
- Context menu integration: 1-2 days
- Testing (cross-platform): 2-3 days
- **Total**: ~10-12 days

## Open Questions

None (all clarifications resolved during pre-proposal discussion).

## References

- GitHub Copilot CLI documentation: https://docs.github.com/en/copilot/using-github-copilot/using-github-copilot-in-the-command-line
- OpenCode GitHub repository: https://github.com/code-yeongyu/opencode
- Obsidian Plugin API: https://docs.obsidian.md/
