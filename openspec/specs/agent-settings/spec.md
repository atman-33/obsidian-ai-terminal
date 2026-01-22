# Agent Settings Specification

## Overview

This specification defines the UUID-based agent identification system.

---

## Requirements

### REQ-1: AgentConfig Data Model

The `AgentConfig` interface MUST use UUID-based identification.

#### Scenario: Agent has UUID identifier

**Given** an agent is created or loaded

**Then** the agent MUST have an `id` property of type `string`

**And** the `id` MUST be a valid UUID v4 format (e.g., `"550e8400-e29b-41d4-a716-446655440000"`)

**And** the `id` MUST be immutable after creation

**And** the agent MUST have a `name` property for display purposes

**And** the `name` MUST be mutable (user can edit)

#### Scenario: Validate UUID format

**Given** an agent configuration is loaded

**When** the `id` field is validated

**Then** the system MUST verify the ID matches UUID v4 format using regex:
```
^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$
```

**And** invalid UUIDs MUST trigger migration to generate new UUIDs

#### Scenario: Multiple agents can have same name

**Given** multiple agents exist in settings

**When** two or more agents have identical names

**Then** the system MUST allow this configuration

**And** each agent MUST still have unique UUID

**And** UI MAY display informational warning about duplicate names

---

### REQ-2: CommandTemplate Agent Reference

Command templates MUST reference agents using UUID instead of name.

#### Scenario: Command references agent by UUID

**Given** a command template is created or loaded

**Then** the template MUST have an `agentId` property of type `string`

**And** the `agentId` MUST contain a valid UUID referencing an `AgentConfig.id`

**And** the template MUST NOT have an `agentName` property (deprecated)

#### Scenario: Validate agent reference exists

**Given** a command template with `agentId`

**When** the template is validated

**Then** the system MUST verify an agent with matching `id` exists in `settings.agents`

**And** if no matching agent found, validation MUST fail with error

**And** error message SHOULD indicate the agent UUID that was not found

#### Scenario: Display agent name in UI

**Given** a command template with `agentId`

**When** displayed in settings UI

**Then** the UI MUST look up the agent by UUID

**And** the UI MUST display the agent's `name` property

**And** if agent not found, UI MUST display "[Missing Agent]" or similar warning

---

### REQ-3: Last Used Agent Tracking

Direct Prompt feature MUST track last used agent by UUID.

#### Scenario: Remember last used agent by UUID

**Given** user executes Direct Prompt with an agent

**When** the prompt is submitted

**Then** the system MUST save the agent's UUID to `settings.lastUsedDirectPromptAgentId`

**And** the system MUST NOT save the agent's name

#### Scenario: Restore last used agent on open

**Given** `settings.lastUsedDirectPromptAgentId` contains a UUID

**When** user opens Direct Prompt modal

**Then** the system MUST find agent by UUID in `settings.agents`

**And** if found, the agent MUST be pre-selected in dropdown

**And** if not found, the first enabled agent MUST be selected as fallback

---

### REQ-4: Settings Structure Validation

Settings MUST use structure-based validation to detect UUID-based format.

#### Scenario: Detect legacy settings without UUID structure

**Given** settings are loaded from disk

**When** agents lack `id` property OR commands lack `agentId` property

**Then** the system MUST reset settings to `DEFAULT_SETTINGS`

**And** the system MUST return `wasReset: true`

**And** the system MUST display a notice to the user:
```
"AI Terminal: Settings were reset to defaults due to UUID migration. 
Please reconfigure your agents and commands."
```

**And** notice MUST be visible for at least 10 seconds

**And** the system MUST log: "Legacy settings detected (pre-UUID structure). Resetting to defaults."

#### Scenario: Load UUID-based settings

**Given** settings are loaded from disk

**When** all agents have valid `id` properties (UUID format)

**And** all commands have valid `agentId` properties (UUID format)

**And** all other required properties exist

**Then** the system MUST keep the existing settings

**And** the system MUST update `settingsVersion` to current `SETTINGS_VERSION`

**And** the system MUST return `wasReset: false`

**And** the system MUST NOT display any reset notice

#### Scenario: Detect invalid data structure

**Given** settings have UUID structure (agents have `id`, commands have `agentId`)

**When** any agent lacks `name` or `enabled` properties

**OR** any command lacks `id`, `name`, or `template` properties

**Then** the system MUST reset settings to `DEFAULT_SETTINGS`

**And** the system MUST return `wasReset: true`

**And** the system MUST log a warning about invalid data structure

**And** the system MUST notify the user of the reset

#### Scenario: First-time installation

**Given** no settings file exists

**When** plugin is loaded for the first time

**Then** the system MUST create settings from `DEFAULT_SETTINGS`

**And** `settingsVersion` MUST be set to current `SETTINGS_VERSION`

**And** default agents MUST have predefined stable UUIDs

**And** default commands MUST reference agents by UUID

**And** the system MUST return `wasReset: false`

#### Scenario: Settings persist across plugin reloads

**Given** user has UUID-based settings

**When** plugin is reloaded or Obsidian is restarted

**Then** settings MUST be loaded without reset

**And** all agents and commands MUST remain unchanged

#### Scenario: Future plugin updates preserve settings

**Given** user has UUID-based settings

**When** plugin is updated to a new version

**And** new version may have different `SETTINGS_VERSION` number

**Then** settings MUST be preserved (not reset)

**And** only `settingsVersion` field MUST be updated

**And** the system MUST return `wasReset: false`

---

### REQ-5: Agent Rename Operations

Agent renaming MUST NOT require updating command templates.

#### Scenario: Rename agent without cascade

**Given** an agent exists with UUID and name

**And** multiple command templates reference this agent by UUID

**When** user renames the agent

**Then** the system MUST update only the agent's `name` property

**And** the system MUST NOT update any command templates

**And** the agent's `id` MUST remain unchanged

**And** all command template references MUST remain valid

#### Scenario: Display updated name immediately

**Given** user has renamed an agent

**When** settings UI is refreshed

**Then** command templates using this agent MUST display the new name

**And** dropdown selections MUST show the new name

**And** all UI references MUST use the updated name

---

### REQ-6: Agent Deletion

Agent deletion MUST use UUID matching.

#### Scenario: Delete agent by UUID

**Given** an agent exists with a UUID

**When** user deletes the agent

**Then** the system MUST remove the agent matching by `id` (not `name`)

**And** the system MUST check for command templates with matching `agentId`

**And** if templates reference the agent, deletion MUST be blocked with warning

**And** warning MUST list affected command templates by name

#### Scenario: Orphaned command detection

**Given** command templates exist with `agentId` references

**When** an agent is somehow deleted (e.g., manual settings file edit)

**Then** the system MUST detect orphaned templates on load

**And** orphaned templates MUST display "[Missing Agent]" in UI

**And** user MUST be able to reassign orphaned templates to valid agents

---

### REQ-7: Default Agents

Default agents MUST have stable UUIDs across installations.

#### Scenario: Default agents have predefined UUIDs

**Given** plugin is installed for the first time

**When** default settings are created

**Then** each default agent MUST have a hardcoded UUID

**And** default agent UUIDs MUST be consistent across all installations

**Example UUIDs:**
- Build agent: `"00000000-0000-4000-8000-000000000001"`
- Agent agent: `"00000000-0000-4000-8000-000000000002"`

#### Scenario: Default commands reference default agents by UUID

**Given** plugin is installed for the first time

**When** default command templates are created

**Then** each command MUST reference default agents by their predefined UUIDs

**And** agent name changes MUST NOT break default command references

---

### REQ-8: Agent Validation

Agent validation MUST use UUID-based uniqueness.

#### Scenario: Allow duplicate agent names

**Given** user is creating or editing an agent

**When** the agent name matches an existing agent's name

**And** the agent UUIDs are different

**Then** validation MUST succeed (allow save)

**And** UI MAY show informational warning about duplicate name

#### Scenario: Prevent empty agent names

**Given** user is creating or editing an agent

**When** the agent name is empty or whitespace-only

**Then** validation MUST fail

**And** error message MUST indicate "Agent name is required"

#### Scenario: Validate UUID uniqueness

**Given** agent configuration is loaded or created

**When** two agents have identical `id` values

**Then** the system MUST detect the collision

**And** the system MUST regenerate UUID for the duplicate

**And** a warning MUST be logged

---

## Data Model Changes

### Before (Name-based)

```typescript
interface AgentConfig {
  name: string;        // Used as identifier
  enabled: boolean;
}

interface CommandTemplate {
  id: string;
  name: string;
  agentName: string;   // References AgentConfig by name
  // ...
}

interface AITerminalSettings {
  agents: AgentConfig[];
  commands: CommandTemplate[];
  lastUsedDirectPromptAgent?: string;  // Name reference
}
```

### After (UUID-based)

```typescript
interface AgentConfig {
  id: string;          // UUID v4 identifier
  name: string;        // Display name (mutable)
  enabled: boolean;
}

interface CommandTemplate {
  id: string;
  name: string;
  agentId: string;     // References AgentConfig.id (UUID)
  // ...
}

interface AITerminalSettings {
  agents: AgentConfig[];
  commands: CommandTemplate[];
  lastUsedDirectPromptAgentId?: string;  // UUID reference
}
```

---

## Affected Components

### Core Files

- [src/types.ts](../../src/types.ts) - Data model definitions
- [src/settings.ts](../../src/settings.ts) - Default data, migration logic

### UI Components

- [src/ui/agent-list-editor.ts](../../src/ui/agent-list-editor.ts) - Agent CRUD
- [src/ui/command-editor.ts](../../src/ui/command-editor.ts) - Agent selection
- [src/ui/direct-prompt-modal.ts](../../src/ui/direct-prompt-modal.ts) - Direct Prompt

### Business Logic

- [src/commands/command-manager.ts](../../src/commands/command-manager.ts) - Validation
- [src/commands/command-executor.ts](../../src/commands/command-executor.ts) - Execution

---

## Settings Management

### Settings Version

Settings version MUST be incremented for tracking:

```typescript
const SETTINGS_VERSION = 3;  // Increment from 2
```

**Note**: Version number is updated in settings but NOT used for validation logic. Structure presence determines behavior.

### Structure-Based Validation Strategy

Validation checks **data structure** instead of version numbers:

1. **Check UUID structure**:
   - Do agents have `id` property?
   - Do commands have `agentId` property?

2. **If structure present**: Keep settings (regardless of version)
3. **If structure missing**: Reset to defaults

### Loading Logic

```typescript
export function loadSettings(
  settings: Partial<AITerminalSettings>
): { settings: AITerminalSettings; wasReset: boolean } {
  // Check for UUID structure
  const hasUUIDStructure = 
    settings.agents?.every(a => a.id) &&
    settings.commands?.every(c => c.agentId);
  
  if (!hasUUIDStructure) {
    return { settings: DEFAULT_SETTINGS, wasReset: true };
  }
  
  // Validate complete structure
  const isValid = validateStructure(settings);
  if (!isValid) {
    return { settings: DEFAULT_SETTINGS, wasReset: true };
  }
  
  // Keep settings, update version for consistency
  return {
    settings: { 
      ...DEFAULT_SETTINGS, 
      ...settings,
      settingsVersion: SETTINGS_VERSION 
    },
    wasReset: false
  };
}
```

### Default Settings

Default agents MUST have stable, predefined UUIDs:

```typescript
const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Build",
    enabled: true
  },
  {
    id: "00000000-0000-4000-8000-000000000002", 
    name: "Agent",
    enabled: true
  }
];
```

### How It Works

```
Legacy settings (name-based):
  No "id" in agents, no "agentId" in commands
  → Reset to defaults ❌

UUID settings (current or future):
  Has "id" in agents, has "agentId" in commands
  → Keep settings ✅
  
Future plugin updates:
  Already has UUID structure
  → Always keep settings ✅
```

---

## Examples

### Creating Agent with UUID

```typescript
import { generateUUID } from './utils/uuid';

const newAgent: AgentConfig = {
  id: generateUUID(),  // "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
  name: "Custom Agent",
  enabled: true
};
```

### Looking Up Agent by UUID

```typescript
// Before (name-based)
const agent = settings.agents.find(a => a.name === agentName);

// After (UUID-based)
const agent = settings.agents.find(a => a.id === agentId);
```

### Renaming Agent

```typescript
// Before (cascade update required)
async renameAgent(oldName: string, newName: string) {
  const agent = agents.find(a => a.name === oldName);
  agent.name = newName;
  
  // Must update all references
  commands.forEach(cmd => {
    if (cmd.agentName === oldName) {
      cmd.agentName = newName;
    }
  });
  await save();
}

// After (no cascade needed)
async renameAgent(agentId: string, newName: string) {
  const agent = agents.find(a => a.id === agentId);
  agent.name = newName;
  await save();
  // Command templates automatically see new name via UUID lookup
}
```

---

## Testing Requirements

Structure validation testing MUST cover:
- [ ] Settings without UUID structure trigger reset
- [ ] Settings with UUID structure are preserved
- [ ] Invalid data structure triggers reset
- [ ] User notification displays on reset
- [ ] First-time installation creates default settings
- [ ] Default agents have stable UUIDs
- [ ] Settings persist across plugin reloads
- [ ] Future plugin updates preserve UUID-based settings

Validation testing MUST cover:
- [ ] Duplicate agent names are allowed
- [ ] Empty agent names are rejected
- [ ] UUID uniqueness is enforced
- [ ] Agent references validated by UUID
- [ ] Missing agent references detected

Functional testing MUST cover:
- [ ] Agent rename doesn't break command templates
- [ ] Agent deletion checks UUID-based references
- [ ] UI displays agent names correctly
- [ ] Settings persist and reload correctly
