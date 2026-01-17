# Design: Direct Prompt Input and Agent Management

## Overview

This design introduces a new user interaction pattern: **direct prompt input via context menus**. Users can right-click files or selected text, open a dialog, construct prompts with visible context placeholders, select an AI agent, and launch a terminal—all without creating command templates.

Additionally, this change **refactors agent management** from free-text strings to a structured, validated list shared across command templates and direct prompt input.

## Architecture

### Component Structure

```
┌─────────────────────────────────────────────────────┐
│ User Interaction                                    │
│ - Right-click file/selection                        │
│ - Select "AI Terminal: Direct Prompt..."           │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ DirectPromptModal (new)                             │
│ - Display context: <file>, <selection>             │
│ - Agent dropdown (from settings.agents)            │
│ - Prompt textarea (editable)                       │
│ - Execute/Cancel buttons                           │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ CommandExecutor (existing)                          │
│ - Resolve placeholders                             │
│ - Build terminal command                           │
│ - Launch terminal                                  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Settings (modified)                                 │
│ - agents: AgentConfig[]                            │
│ - commands: CommandTemplate[] (use agentId)        │
└─────────────────────────────────────────────────────┘
```

### Data Model Changes

#### New: AgentConfig
```typescript
interface AgentConfig {
  id: string;           // Unique identifier (kebab-case)
  name: string;         // Display name (e.g., "GitHub Copilot")
  command: string;      // Base command template (e.g., "copilot")
  enabled: boolean;     // Show in dropdowns
}
```

#### Modified: CommandTemplate
```typescript
interface CommandTemplate {
  id: string;
  name: string;
  template: string;
  defaultPrompt: string;
  agentId: string;      // CHANGED: Reference to AgentConfig.id (was: defaultAgent: string)
  enabled: boolean;
  order: number;
}
```

#### Modified: AITerminalSettings
```typescript
interface AITerminalSettings {
  agents: AgentConfig[];       // NEW: Managed agent list
  commands: CommandTemplate[];
  terminalType: string;
}
```

### UI Components

#### DirectPromptModal (new)
- **Extends**: Obsidian `Modal`
- **Purpose**: Collect user input for ad-hoc AI terminal launches
- **Layout**:
  ```
  ┌─ AI Terminal: Direct Prompt ──────────────────┐
  │                                                │
  │ Agent:                                         │
  │ ┌────────────────────────────────────────────┐│
  │ │ GitHub Copilot ▼                           ││
  │ └────────────────────────────────────────────┘│
  │                                                │
  │ Context:                                       │
  │ ┌────────────────────────────────────────────┐│
  │ │ <file:/path/to/note.md>                    ││
  │ │ <selection:selected text here...>          ││
  │ └────────────────────────────────────────────┘│
  │                                                │
  │ Prompt:                                        │
  │ ┌────────────────────────────────────────────┐│
  │ │ [User types additional instructions here]  ││
  │ │                                            ││
  │ │                                            ││
  │ └────────────────────────────────────────────┘│
  │                                                │
  │                    [Cancel]  [Execute]         │
  └────────────────────────────────────────────────┘
  ```
- **Behavior**:
  - Context area is **read-only**, showing resolved placeholders
  - Prompt area is **editable** for user input
  - Execute button constructs final command: `<agent.command> -i "<context> <prompt>"`
  - Cancel button closes modal without action

#### AgentListEditor (new)
- **Purpose**: Manage agent list in plugin settings
- **Location**: Settings tab, new section "AI Agents"
- **Features**:
  - Add new agent (id, name, command)
  - Edit existing agents
  - Enable/disable agents
  - Delete agents (with confirmation if used by templates)
  - Reorder agents (affects dropdown order)

#### CommandTemplateEditor (modified)
- **Changes**:
  - Replace `defaultAgent` text input with agent dropdown
  - Dropdown populated from `settings.agents` (enabled only)
  - Show warning if no agents configured

### Placeholder Resolution

**Context Display Strategy**:
- `<file>`: Resolve to absolute path or relative to vault
- `<selection>`: Resolve to selected text (or empty string if none)
- Display format in context area:
  ```
  <file:/path/to/note.md>
  <selection:This is the selected text content>
  ```

**Final Command Construction**:
- Combine context placeholders + user prompt
- Pass to `CommandExecutor` for final resolution
- Example:
  ```
  User context: <file:/notes/readme.md> <selection:function foo()>
  User prompt: Explain this function
  Agent command: copilot
  
  Final: copilot -i "<file:/notes/readme.md> <selection:function foo()> Explain this function"
  ```

### Context Menu Integration

**New Menu Item**: "AI Terminal: Direct Prompt..."
- **Position**: At the top of the "AI Terminal" submenu, before command templates
- **Availability**:
  - File context menu: Always shown
  - Editor context menu: Always shown (selection optional)
- **Icon**: Use `edit` icon (to distinguish from `terminal` used for templates)

### Migration Strategy

**First Load After Update**:
1. Check if `settings.agents` exists
2. If not, create default agents:
   - GitHub Copilot: `{ id: "copilot", name: "GitHub Copilot", command: "copilot", enabled: true }`
   - OpenCode: `{ id: "opencode", name: "OpenCode", command: "opencode", enabled: true }`
3. Migrate existing command templates:
   - For each `template.defaultAgent`:
     - Find matching agent by name (case-insensitive)
     - If found, set `template.agentId = agent.id`
     - If not found, create new agent and use its id
   - Remove `defaultAgent` field
4. Save migrated settings

### Validation Rules

**Agent Validation**:
- `id`: Required, unique, kebab-case, max 50 chars
- `name`: Required, non-empty, max 100 chars
- `command`: Required, non-empty, no shell injection patterns
- At least one agent must exist for direct prompt to work

**Template Validation** (updated):
- `agentId`: Must reference existing agent in `settings.agents`
- Show error if referenced agent doesn't exist or is deleted

### Error Handling

**Missing Agent**:
- Dialog: Disable Execute button, show message "Please configure at least one AI agent in settings"
- Template editor: Show warning "This template references a deleted agent"

**Empty Prompt**:
- Allow execution (context alone may be sufficient)
- Alternative: Show confirmation "No additional prompt provided. Continue?"

**Placeholder Resolution Failure**:
- Show error notice: "Unable to resolve context. Please try again."
- Log details to console for debugging

## Trade-offs

### Decision 1: Context Display Format
**Chosen**: Show placeholders as `<file:...>` and `<selection:...>` in read-only area
**Alternative**: Pre-resolve and show actual values without placeholder syntax
**Reasoning**: Placeholder syntax makes it clear these are automatic, distinguishes from user prompt

### Decision 2: Agent Management Location
**Chosen**: Separate "AI Agents" section in settings, before command templates
**Alternative**: Inline agent creation in direct prompt dialog or template editor
**Reasoning**: Centralized management reduces duplication, clearer separation of concerns

### Decision 3: Migration Approach
**Chosen**: Automatic migration on first load, preserve existing functionality
**Alternative**: Require manual re-configuration of templates
**Reasoning**: Better UX, reduces friction, minimizes breaking changes

### Decision 4: Dialog vs. Input Prompt
**Chosen**: Full modal dialog with multiple fields
**Alternative**: Simple input prompt (like Obsidian's native prompt)
**Reasoning**: Need to show context, select agent, and enter prompt simultaneously

## Implementation Notes

### File Structure
```
src/
├── ui/
│   ├── direct-prompt-modal.ts      // NEW: Main dialog
│   ├── agent-list-editor.ts        // NEW: Settings editor
│   └── command-editor.ts           // MODIFIED: Add agent dropdown
├── settings.ts                     // MODIFIED: Add agents field, migration logic
├── types.ts                        // MODIFIED: Add AgentConfig, update CommandTemplate
└── main.ts                         // MODIFIED: Register direct prompt command
```

### Dependencies
- `context-collector.ts`: Reuse existing context collection
- `placeholder-resolver.ts`: May need extension for new display format
- `command-executor.ts`: No changes needed (already handles placeholders)
- `terminal-launcher.ts`: No changes needed

### Testing Considerations
- **Unit tests**: Agent validation, migration logic, placeholder display format
- **Integration tests**: Dialog → command execution flow
- **Manual tests**: Right-click menu, agent dropdown population, template migration

## Future Enhancements (Out of Scope)
- Prompt templates/snippets for common queries
- Prompt history or favorites
- Multi-agent workflows
- Custom context placeholder definitions
- Agent-specific configuration (e.g., API keys, model selection)
