# Proposal: Add AI Terminal Launcher

## Why

Users need to invoke AI CLI tools while working in Obsidian, but switching to external terminals and manually managing paths and prompts breaks flow and wastes time. This proposal makes those workflows accessible directly from Obsidian with context-aware commands.

## What Changes

- Add a command template system with placeholder substitution for file, selection, prompt, and agent context.
- Expose commands via the command palette and file/editor context menus.
- Launch external terminal sessions (Windows Terminal MVP) with safe command encoding.
- Introduce new capabilities: terminal launcher, command templates, placeholder system, and context menu integration.

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

#### 4. Terminal Support (MVP)
- Windows Terminal only (PowerShell)
- Future: WSL, Linux, macOS support

## Goals

1. Enable seamless AI agent interaction from within Obsidian
2. Provide flexible, user-customizable command templates
3. Support both GitHub Copilot CLI and OpenCode with custom arguments
4. Handle Windows Terminal launching with PowerShell (MVP)
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
- [ ] Windows Terminal launches successfully with PowerShell
- [ ] Commands are accessible from command palette and context menus
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
| Windows Terminal not installed | High | Provide clear error messages with installation guidance |
| PowerShell command escaping issues | Medium | Use Base64 encoding for commands to avoid escaping problems |
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
