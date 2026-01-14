# Design Document: AI Terminal Launcher

## Architecture Overview

The AI Terminal Launcher is composed of four main subsystems that work together to provide flexible terminal launching with AI agent integration:

```
┌─────────────────────────────────────────────────────────────┐
│                        Obsidian UI                          │
│  (Command Palette, File Context Menu, Editor Context Menu)  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  Command Orchestrator                        │
│  - Collect context (file, selection, vault)                 │
│  - Select command template                                   │
│  - Invoke placeholder resolver                               │
│  - Pass to terminal launcher                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
│  Command     │ │ Placeholder  │ │   Terminal       │
│  Template    │ │ Resolver     │ │   Launcher       │
│  Manager     │ │              │ │                  │
└──────────────┘ └──────────────┘ └──────────────────┘
                                    │
                      ┌─────────────┼─────────────┐
                      ▼             ▼             ▼
                ┌──────────┐  ┌──────────┐  ┌──────────┐
                │ Windows  │  │   WSL    │  │  System  │
                │ Terminal │  │ Terminal │  │ Default  │
                └──────────┘  └──────────┘  └──────────┘
```

## Component Design

### 1. Command Template Manager

**Purpose**: Store and manage user-defined command templates.

**Data Structure**:
```typescript
interface CommandTemplate {
  id: string;               // Unique identifier (kebab-case)
  name: string;             // Display name for UI
  template: string;         // Command template with placeholders
  defaultPrompt?: string;   // Default prompt if <prompt> placeholder exists
  defaultAgent?: string;    // Default agent if <agent> placeholder exists
  enabled: boolean;         // Whether command is active
}

interface PluginSettings {
  terminalType: 'windows-terminal' | 'wsl' | 'system';
  wslDistribution: string;  // e.g., "Ubuntu", "Debian"
  commands: CommandTemplate[];
}
```

**Operations**:
- Add/remove/update command templates
- Load/save settings via Obsidian's `loadData()`/`saveData()`
- Validate template syntax (ensure placeholders are valid)

**Design Decisions**:
- Use array of commands instead of map for easier ordering in UI
- Each command has unique ID for stable command registration
- Default values stored directly in template for simplicity

### 2. Placeholder Resolver

**Purpose**: Replace placeholders in command templates with actual values based on context.

**Supported Placeholders**:
| Placeholder | Description | Example |
|-------------|-------------|---------|
| `<file>` | Filename only | `readme.md` |
| `<path>` | Absolute file path | `/home/user/vault/notes/readme.md` |
| `<relative-path>` | Vault-relative path | `notes/readme.md` |
| `<dir>` | Directory path | `/home/user/vault/notes` |
| `<vault>` | Vault root path | `/home/user/vault` |
| `<selection>` | Selected text (if any) | `function example() {...}` |
| `<prompt>` | Prompt text | `Fix issues in readme.md` |
| `<agent>` | Agent name | `noctis` |

**Resolution Strategy**:
```typescript
interface ExecutionContext {
  file?: TFile;              // Current file (if available)
  selection?: string;        // Selected text (if available)
  vault: Vault;              // Always available
  prompt?: string;           // Override default prompt
  agent?: string;            // Override default agent
}

function resolvePlaceholders(
  template: string,
  context: ExecutionContext,
  defaults: { prompt?: string; agent?: string }
): string {
  // 1. Replace file-related placeholders
  // 2. Replace context placeholders (selection, vault)
  // 3. Replace user input placeholders (prompt, agent) with defaults if not provided
  // 4. Escape shell special characters in all values
  // 5. Return final command string
}
```

**Design Decisions**:
- Always escape placeholder values to prevent command injection
- Use empty string for unavailable placeholders (e.g., `<selection>` when no selection)
- Use default values from template config when `<prompt>`/`<agent>` not explicitly provided
- Fail gracefully if required placeholders cannot be resolved (show error notice)

### 3. Terminal Launcher

**Purpose**: Launch external terminal with the resolved command.

**Platform-Specific Strategies**:

#### Windows Terminal (Native Windows)
```typescript
function launchWindowsTerminal(command: string, workingDir: string): void {
  const args = ['--title', 'AI Terminal', '-d', workingDir];
  spawn('wt.exe', [...args, command], { detached: true });
}
```

#### WSL Terminal (Windows → WSL)
```typescript
function launchWSLTerminal(
  command: string,
  workingDir: string,
  distribution: string
): void {
  // Convert Windows path to WSL path
  const wslPath = convertToWSLPath(workingDir);
  const wslCommand = `cd ${wslPath} && ${command}`;
  spawn('wsl.exe', ['-d', distribution, '--', 'bash', '-c', wslCommand], {
    detached: true
  });
}

function convertToWSLPath(windowsPath: string): string {
  // C:\Users\... → /mnt/c/Users/...
  const match = windowsPath.match(/^([A-Z]):\\/);
  if (match) {
    const drive = match[1].toLowerCase();
    const restPath = windowsPath.substring(3).replace(/\\/g, '/');
    return `/mnt/${drive}/${restPath}`;
  }
  return windowsPath; // Fallback
}
```

#### System Default (Linux, macOS)
```typescript
function launchSystemTerminal(command: string, workingDir: string): void {
  // Linux: Try common terminals
  const terminals = ['gnome-terminal', 'konsole', 'xterm'];
  for (const term of terminals) {
    try {
      spawn(term, ['--working-directory', workingDir, '-e', command], {
        detached: true
      });
      return;
    } catch {
      continue; // Try next terminal
    }
  }
  
  // macOS: Use Terminal.app with AppleScript
  const script = `
    tell application "Terminal"
      do script "cd ${workingDir} && ${command}"
      activate
    end tell
  `;
  spawn('osascript', ['-e', script], { detached: true });
}
```

**Error Handling**:
- Validate that terminal executable exists before launching
- Show user-friendly error messages via Obsidian Notice
- Provide fallback options if primary terminal fails

**Design Decisions**:
- Use `detached: true` to prevent terminal from closing when Obsidian closes
- No session tracking (fire-and-forget model)
- Working directory always set to file's directory (or vault root if no file context)

### 4. Context Menu Integration

**Purpose**: Add command templates to file and editor context menus.

**Implementation**:
```typescript
// File context menu (File Explorer)
this.registerEvent(
  this.app.workspace.on('file-menu', (menu, file) => {
    this.settings.commands
      .filter(cmd => cmd.enabled)
      .forEach(cmd => {
        menu.addItem(item => {
          item.setTitle(cmd.name)
             .setIcon('terminal')
             .onClick(() => this.executeCommand(cmd, { file }));
        });
      });
  })
);

// Editor context menu
this.registerEvent(
  this.app.workspace.on('editor-menu', (menu, editor, view) => {
    const selection = editor.getSelection();
    this.settings.commands
      .filter(cmd => cmd.enabled)
      .forEach(cmd => {
        menu.addItem(item => {
          item.setTitle(cmd.name)
             .setIcon('terminal')
             .onClick(() => this.executeCommand(cmd, {
               file: view.file,
               selection
             }));
        });
      });
  })
);
```

**Command Palette Integration**:
```typescript
this.settings.commands
  .filter(cmd => cmd.enabled)
  .forEach(cmd => {
    this.addCommand({
      id: `ai-terminal-${cmd.id}`,
      name: `AI Terminal: ${cmd.name}`,
      callback: () => this.executeCommand(cmd, {
        file: this.app.workspace.getActiveFile() ?? undefined
      })
    });
  });
```

**Design Decisions**:
- Dynamic command registration based on settings
- Re-register commands when settings change
- Use consistent icon ('terminal') for all commands
- Prefix command IDs with `ai-terminal-` to avoid conflicts

## File Structure

```
src/
  main.ts                    # Plugin entry point
  settings.ts                # Settings interface and tab
  commands/
    command-manager.ts       # Command template management
    command-executor.ts      # Command execution orchestration
  terminal/
    terminal-launcher.ts     # Cross-platform terminal launching
    platform-strategy.ts     # Platform-specific strategies
    path-converter.ts        # Windows ↔ WSL path conversion
  placeholders/
    placeholder-resolver.ts  # Placeholder parsing and substitution
    context-collector.ts     # Collect execution context
  ui/
    settings-tab.ts          # Settings UI
    command-editor.ts        # Command template editor modal
```

## Security Considerations

### Command Injection Prevention
- **Sanitize all placeholder values** using shell-escape library
- **Validate command templates** on save (reject dangerous patterns)
- **Use `spawn()` with argument arrays** instead of shell strings where possible

### Path Traversal Prevention
- **Validate all file paths** are within vault or explicitly allowed directories
- **Reject relative paths** that escape vault root (e.g., `../../etc/passwd`)

### User Education
- Document security best practices in README
- Warn users about risks of custom command templates
- Recommend using only trusted command templates

## Performance Considerations

- **Command registration**: Register all commands once on load, re-register on settings change only
- **Placeholder resolution**: Cache file path conversions (especially WSL path translation)
- **Terminal launching**: Use `detached: true` and don't wait for process exit
- **Settings save**: Debounce settings saves when editing command templates

## Testing Strategy

### Unit Tests
- Placeholder resolver with various contexts
- Path converter (Windows ↔ WSL)
- Command template validation

### Integration Tests
- Terminal launching on each platform (manual testing)
- Context menu integration
- Settings persistence

### Edge Cases
- Empty/missing file contexts
- Invalid placeholder syntax
- Missing external CLI tools
- Permission errors when launching terminals

## Future Enhancements (Out of Scope)

- Terminal output capture and display in Obsidian
- Session management and history
- Built-in AI agent (no external CLI required)
- Custom terminal themes
- Mobile platform support
