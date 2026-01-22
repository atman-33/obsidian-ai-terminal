# Agent UUID Migration - Design

## Architecture Decision

### Current State

```typescript
interface AgentConfig {
  name: string;        // Used as identifier AND display name
  enabled: boolean;
}

interface CommandTemplate {
  id: string;          // UUID
  name: string;
  agentName: string;   // References AgentConfig by name
  // ... other fields
}

interface AITerminalSettings {
  agents: AgentConfig[];
  commands: CommandTemplate[];
  lastUsedDirectPromptAgent?: string;  // References AgentConfig by name
}
```

**Reference Management:**
- Agent lookup: `agents.find(a => a.name === agentName)`
- Agent rename: Must update all `CommandTemplate.agentName` fields via `renameAgent()`
- Agent delete: Must check all command templates for references

### Target State

```typescript
interface AgentConfig {
  id: string;          // UUID v4 - stable identifier
  name: string;        // Display name, user-editable
  enabled: boolean;
}

interface CommandTemplate {
  id: string;          // UUID
  name: string;
  agentId: string;     // References AgentConfig.id (UUID)
  // ... other fields
}

interface AITerminalSettings {
  agents: AgentConfig[];
  commands: CommandTemplate[];
  lastUsedDirectPromptAgentId?: string;  // References AgentConfig.id (UUID)
}
```

**Reference Management:**
- Agent lookup: `agents.find(a => a.id === agentId)`
- Agent rename: Direct property update, no cascading changes needed
- Agent delete: Check command templates by UUID, relationships remain stable

## Data Loading Strategy

### Structure-Based Validation

Settings validation uses **structure-based detection** instead of version numbers:
- Check if agents have `id` property (UUID)
- Check if commands have `agentId` property (UUID)
- If UUID structure exists → use settings
- If UUID structure missing → reset to defaults
- Version number is updated but not used for validation

### Loading Logic

```typescript
export function loadSettings(
  settings: Partial<AITerminalSettings>
): { settings: AITerminalSettings; wasReset: boolean } {
  // Check if settings have UUID-based structure
  const hasUUIDStructure = 
    settings.agents &&
    settings.agents.length > 0 &&
    settings.agents.every(a => a.id && typeof a.id === 'string') &&
    settings.commands &&
    settings.commands.length > 0 &&
    settings.commands.every(c => c.agentId && typeof c.agentId === 'string');

  // No UUID structure → reset to defaults
  if (!hasUUIDStructure) {
    console.warn('Legacy settings detected (pre-UUID structure). Resetting to defaults.');
    return { 
      settings: { ...DEFAULT_SETTINGS }, 
      wasReset: true 
    };
  }

  // Validate complete data structure
  const hasValidAgents = settings.agents.every(a => 
    a.id && a.name !== undefined && a.enabled !== undefined
  );
  const hasValidCommands = settings.commands.every(c =>
    c.id && c.agentId && c.name && c.template
  );

  if (!hasValidAgents || !hasValidCommands) {
    console.warn('Invalid settings structure detected. Resetting to defaults.');
    return { 
      settings: { ...DEFAULT_SETTINGS }, 
      wasReset: true 
    };
  }

  // Settings have UUID structure and are valid → use them
  return {
    settings: {
      ...DEFAULT_SETTINGS,
      ...settings,
      settingsVersion: SETTINGS_VERSION  // Update version for consistency
    },
    wasReset: false
  };
}
```

### User Notification

When settings are reset, display a notice:

```typescript
import { Notice } from 'obsidian';

const { settings, wasReset } = loadSettings(rawSettings);

if (wasReset) {
  new Notice(
    'AI Terminal: Settings were reset to defaults due to UUID migration. ' +
    'Please reconfigure your agents and commands.',
    10000  // 10 second display
  );
}

this.settings = settings;
```

### How This Works

```
Old settings (name-based):
  - agents: [{ name: "X", enabled: true }]  ← No "id" property
  - commands: [{ agentName: "X" }]          ← No "agentId" property
  → Detected as legacy → Reset

New settings (UUID-based):
  - agents: [{ id: "uuid", name: "X", enabled: true }]  ← Has "id"
  - commands: [{ agentId: "uuid" }]                     ← Has "agentId"
  → Detected as UUID-based → Keep settings

Future updates:
  - Already has UUID structure → Keep settings ✅
  - New fields can be added without breaking
```

## UUID Generation

Use existing `generateUUID()` utility from [src/utils/uuid.ts](../../src/utils/uuid.ts).

```typescript
import { generateUUID } from './utils/uuid';

const agent: AgentConfig = {
  id: generateUUID(),  // Generates RFC4122 v4 UUID
  name: 'Build',
  enabled: true
};
```

## Impact Analysis

### Files Requiring Changes

**Core Data Models** (3 files):
- [src/types.ts](../../src/types.ts) - Interface definitions

**Settings & Migration** (1 file):
- [src/settings.ts](../../src/settings.ts) - Default data, migration logic

**Agent Management UI** (1 file):
- [src/ui/agent-list-editor.ts](../../src/ui/agent-list-editor.ts) - CRUD operations, validation

**Command Management** (2 files):
- [src/ui/command-editor.ts](../../src/ui/command-editor.ts) - Agent selection UI
- [src/commands/command-manager.ts](../../src/commands/command-manager.ts) - Validation

**Command Execution** (1 file):
- [src/commands/command-executor.ts](../../src/commands/command-executor.ts) - Agent lookup

**Direct Prompt Feature** (2 files):
- [src/ui/direct-prompt-modal.ts](../../src/ui/direct-prompt-modal.ts) - Agent selection
- [src/ui/direct-prompt-utils.ts](../../src/ui/direct-prompt-utils.ts) - Command creation

**Tests** (3 files):
- [src/settings.test.ts](../../src/settings.test.ts) - Migration tests
- [src/integration/command-flow.test.ts](../../src/integration/command-flow.test.ts) - Integration tests
- New tests for UUID-based validation

**Total: 13 files**

### Reference Patterns

**Before:**
```typescript
// Find agent
const agent = agents.find(a => a.name === agentName);

// Update command
command.agentName = newAgentName;

// Rename agent (complex)
async renameAgent(oldName: string, newName: string) {
  // 1. Update agent name
  const agent = agents.find(a => a.name === oldName);
  agent.name = newName;
  
  // 2. Update all command templates
  commands.forEach(cmd => {
    if (cmd.agentName === oldName) {
      cmd.agentName = newName;
    }
  });
  
  await saveSettings();
}
```

**After:**
```typescript
// Find agent
const agent = agents.find(a => a.id === agentId);

// Update command
command.agentId = newAgentId;

// Rename agent (simple)
async renameAgent(agentId: string, newName: string) {
  // 1. Update agent name only
  const agent = agents.find(a => a.id === agentId);
  agent.name = newName;
  
  // No need to update command templates!
  await saveSettings();
}
```

## Validation Changes

### Agent Name Uniqueness

**Before:** Critical validation
```typescript
// Duplicate names prevented
const isDuplicate = existingAgents.some(a => 
  a.name === newName && a !== currentAgent
);
if (isDuplicate) {
  return "Agent name must be unique";
}
```

**After:** Warning only
```typescript
// Duplicate names allowed (informational warning)
const isDuplicate = existingAgents.some(a => 
  a.name === newName && a.id !== currentAgent.id
);
if (isDuplicate) {
  // Optional: Show non-blocking warning
  console.warn(`Agent name "${newName}" is used by multiple agents`);
}
```

### Agent Reference Validation

**Before:**
```typescript
validateTemplate(template: string, agentName?: string): void {
  if (!agentName) {
    throw new Error("Agent name is required");
  }
  const agentExists = this.plugin.settings.agents.some(
    agent => agent.name === agentName
  );
  if (!agentExists) {
    throw new Error(`Agent "${agentName}" not found`);
  }
}
```

**After:**
```typescript
validateTemplate(template: string, agentId?: string): void {
  if (!agentId) {
    throw new Error("Agent ID is required");
  }
  const agentExists = this.plugin.settings.agents.some(
    agent => agent.id === agentId
  );
  if (!agentExists) {
    throw new Error(`Agent with ID "${agentId}" not found`);
  }
}
```

## Testing Strategy

### Unit Tests

1. **UUID Generation**
   - Test UUIDs are valid v4 format
   - Test UUIDs are unique across agents

2. **Settings Reset Logic**
   - Test version mismatch triggers reset
   - Test invalid data structure triggers reset
   - Test valid settings are loaded correctly
   - Test user notification on reset

3. **Validation**
   - Test duplicate names are allowed
   - Test agent deletion uses UUID matching
   - Test command validation uses UUID

### Integration Tests

1. **Agent Rename**
   - Rename agent
   - Verify command templates still reference correct agent
   - Verify no cascade updates occurred

2. **Agent Delete**
   - Create agent and command template
   - Delete agent
   - Verify orphaned commands detected correctly

3. **Settings Reset Flow**
   - Load settings with old version
   - Verify reset to defaults
   - Verify user notification displayed
   - Save and reload
   - Verify persistence

## Performance Considerations

### Settings Load Performance

- **Version check**: O(1) constant time
- **Data validation**: O(n + m) where n = agents, m = commands
- **Reset to defaults**: O(1) - just copy default object
- **Typical scale**: <100 agents, <200 commands → negligible impact

### Runtime Performance

**Before (name-based):**
- Agent lookup: O(n) string comparison
- Agent rename: O(m) where m = number of command templates

**After (UUID-based):**
- Agent lookup: O(n) string comparison (same)
- Agent rename: O(1) - no cascade updates

Net impact: **Improved** (eliminates cascade update cost)

## Rollback Plan

If critical issues are discovered:

1. **Code rollback**: Git revert to previous commit
2. **User impact**: Minimal - user can reconfigure settings
3. **Settings version**: Revert version number to allow re-upgrade later

**Prevention:**
- Thorough testing before deployment
- Clear documentation in CHANGELOG about breaking change
- Backup reminder in upgrade notes
