# Proposal: Add Direct Prompt Input via Context Menu

## Why

Currently, users can only launch AI terminals using predefined command templates. While command templates are powerful, they require setup and cannot handle ad-hoc, contextual queries. Users often need to:

- Ask quick questions about selected text or files without creating a full command template
- Experiment with different prompts before formalizing them as templates
- Use different AI agents flexibly depending on the context

This creates friction and limits the plugin's utility for spontaneous, exploratory workflows.

## Solution

Add a "Direct Prompt Input" feature that allows users to:

1. **Right-click on files or selected text** and choose "AI Terminal: Direct Prompt..."
2. **See context placeholders** (`<file>`, `<selection>`) displayed in a dialog
3. **Write custom prompts** directly in the dialog alongside the context
4. **Select an AI agent** from a dropdown list
5. **Launch terminal** with the constructed command

Additionally, **refactor agent management** to use a centralized agent list:
- Move from hardcoded `defaultAgent` strings to a managed list
- Allow users to define available agents in plugin settings
- Share agent list across both command templates and direct prompt input

## Goals

- **Lower friction** for ad-hoc AI terminal interactions
- **Preserve context** by showing file paths and selections as editable placeholders
- **Provide flexibility** through agent selection and custom prompt construction
- **Maintain consistency** by using the same agent list for templates and direct input
- **Improve UX** with clear, intuitive dialog design

## Impact

### User Experience
- **New workflow**: Right-click → Direct Prompt → Select agent → Enter prompt → Launch
- **Faster experimentation**: No need to create templates for one-off queries
- **Better discoverability**: Direct prompt option appears alongside command templates

### Technical Changes
- **New capability**: `direct-prompt-input` (dialog UI, agent selection, prompt construction)
- **Modified capability**: `command-templates` (use agent list instead of free-text agent field)
- **Modified capability**: `context-menu-integration` (add "Direct Prompt..." menu item)
- **New settings**: Agent list configuration in plugin settings
- **New UI**: Modal dialog for prompt input with agent dropdown and context display

### Backward Compatibility
- **Breaking change**: Existing command templates with `defaultAgent` strings must be migrated to agent list references
- **Migration**: First-time load will convert existing agent strings into agent list entries
- **Settings schema**: `AITerminalSettings` interface changes to include `agents: AgentConfig[]`

## Scope

### In Scope
- Dialog UI for direct prompt input with agent selection
- Agent list management in settings (add, edit, remove agents)
- Context placeholder display (`<file>`, `<selection>`)
- "Direct Prompt..." option in file and editor context menus
- Migration logic for existing command templates
- Agent dropdown in command template editor

### Out of Scope
- Advanced prompt templates or snippets
- Prompt history or favorites
- Multi-agent chaining or complex workflows
- Custom placeholder definitions beyond existing ones

## Alternatives Considered

### Alternative 1: Extend command templates with "ask on launch" flag
- **Pros**: Reuses existing UI, no new dialog needed
- **Cons**: Still requires creating templates, doesn't solve ad-hoc use case

### Alternative 2: Add command palette command with input prompt
- **Pros**: Simpler implementation, no context menu changes
- **Cons**: Loses right-click context, worse UX for file/selection-based queries

### Alternative 3: Use Obsidian's native prompt dialog
- **Pros**: Consistent with Obsidian UI patterns
- **Cons**: Limited customization, cannot show context placeholders or agent dropdown

## Decision
Proceed with the proposed solution (dialog-based direct prompt input with agent list management) as it provides the best balance of flexibility, UX, and maintainability.

## Dependencies
- Requires `context-menu-integration` capability (already exists)
- Requires `placeholder-system` capability (already exists)
- Requires `command-templates` capability (will be modified)

## Risks
- **Migration risk**: Existing command templates must be migrated correctly to avoid breaking user configurations
- **UX complexity**: Dialog must be intuitive and not overwhelm users with options
- **Agent management**: Need clear validation to prevent duplicate agent names or invalid configurations

## Success Criteria
- Users can launch AI terminals via "Direct Prompt..." from context menus
- Dialog displays file/selection context clearly
- Agent list is configurable and shared across features
- Existing command templates continue to work after migration
- All validation passes (`openspec validate --strict`)
