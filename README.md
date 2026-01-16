# Obsidian AI Terminal

Launch external terminal sessions with AI agents (GitHub Copilot CLI or OpenCode) directly from Obsidian. Execute custom commands with context-aware placeholders from the command palette or context menus.

## Features

- **Customizable Command Templates**: Define multiple command presets with placeholders for dynamic content
- **Context-Aware Execution**: Launch terminals with file paths, selections, and custom prompts automatically inserted
- **Multiple Access Points**: Execute commands from the command palette, file context menu, or editor context menu
- **Windows Terminal Support**: Launch PowerShell sessions in Windows Terminal (MVP)
- **Flexible Placeholder System**: Use file paths, vault root, selection, and custom prompts in your commands

## Installation

### Requirements

- Obsidian Desktop (Windows only for MVP)
- Windows Terminal installed ([Download](https://aka.ms/terminal))
- AI CLI tools (optional, user-installed):
  - [GitHub Copilot CLI](https://docs.github.com/en/copilot/using-github-copilot/using-github-copilot-in-the-command-line)
  - [OpenCode](https://github.com/code-yeongyu/opencode)

### 🧪 Install via BRAT

1. Install the [BRAT plugin](https://github.com/TfTHacker/obsidian42-brat) from the Community Plugins browser
2. In Obsidian settings, go to **Community Plugins → BRAT → Add Beta Plugin**
3. Paste this repo URL:
   ```
   https://github.com/atman-33/obsidian-ai-terminal
   ```
4. BRAT will download the latest release and keep it auto-updated
5. Enable **AI Terminal** from the plugin list

### 💻 Manual Installation

1. Download the latest release files from [GitHub Releases](https://github.com/atman-33/obsidian-ai-terminal/releases):
   - `main.js`
   - `manifest.json`
   - `styles.css`
2. Create plugin folder and place the files in:
   ```
   <VaultFolder>/.obsidian/plugins/ai-terminal/
   ```
3. Enable the plugin in **Obsidian Settings → Community Plugins**

## Configuration

### Command Templates

Configure command templates in Settings → AI Terminal:

1. **Add Command**: Click "Add Command" to create a new template
2. **Edit Properties**:
   - **ID**: Unique identifier (lowercase, hyphens only)
   - **Name**: Display name in menus
   - **Command Template**: Shell command with placeholders
   - **Default Prompt**: Default text for `<prompt>` placeholder
   - **Default Agent**: Default value for `<agent>` placeholder
   - **Enabled**: Toggle to show/hide in menus
3. **Save**: Changes persist immediately

### Available Placeholders

Use these placeholders in command templates - they're replaced automatically based on context:

| Placeholder | Description | Example |
|------------|-------------|---------|
| `<file>` | Filename only | `readme.md` |
| `<path>` | Absolute file path | `C:\Users\...\readme.md` |
| `<relative-path>` | Path relative to vault root | `docs/readme.md` |
| `<dir>` | Directory containing the file | `C:\Users\...\docs` |
| `<vault>` | Vault root directory | `C:\Users\...\MyVault` |
| `<selection>` | Selected text (editor only) | User's selected text |
| `<prompt>` | Prompt text | From default or input |
| `<agent>` | Agent name | From default or input |

**Note**: Unavailable placeholders are replaced with empty strings.

### Example Templates

**GitHub Copilot CLI - Interactive Mode**:
```
copilot -i "<prompt>"
```
Default prompt: `Fix issues in <file>`

**OpenCode - Code Review**:
```
opencode -a <agent> -p "Review this code: <selection>"
```
Default agent: `gpt-4`

**Custom Script with File Context**:
```
python analyze.py --file "<path>" --vault "<vault>"
```

## Usage

### From Command Palette

1. Press `Ctrl+P` (or `Cmd+P` on Mac)
2. Type "AI Terminal:"
3. Select a command from the list
4. Windows Terminal launches with the command

### From File Context Menu

1. Right-click a file in the file explorer
2. Hover over "AI Terminal"
3. Select a command
4. Terminal launches with file context

### From Editor Context Menu

1. Right-click in the editor (optionally select text first)
2. Hover over "AI Terminal"
3. Select a command
4. Terminal launches with file and selection context

## Security Best Practices

### Command Injection Prevention

- All placeholder values are Base64-encoded before execution
- PowerShell commands use `-EncodedCommand` for safety
- Never disable escaping or modify the launcher code

### Safe Command Templates

✅ **Safe**:
```
copilot -i "<prompt>"
python script.py --file "<path>"
```

⚠️ **Dangerous** (avoid shell metacharacters in templates):
```
rm -rf <dir>  # Deletion commands
cat <file> | sh  # Piping to shell
eval "<prompt>"  # Arbitrary code execution
```

### Trust Your Templates

- Only add command templates you understand
- Review templates before enabling
- Be cautious with templates from untrusted sources

## Troubleshooting

### Windows Terminal Doesn't Launch

**Symptoms**: Error message "Windows Terminal not found" or "Cannot find wt.exe"

**Solutions**:
1. Install Windows Terminal: https://aka.ms/terminal
2. Ensure `wt.exe` is in your PATH
3. Try running `wt.exe` from Command Prompt to verify installation

### Commands Don't Appear in Menus

**Symptoms**: AI Terminal submenu is empty or commands are missing

**Solutions**:
1. Check Settings → AI Terminal → ensure commands are **Enabled**
2. Reload Obsidian after changing settings
3. Verify command IDs are unique

### Placeholders Not Replaced

**Symptoms**: Command contains literal `<file>` or `<path>` text

**Solutions**:
1. Ensure you're launching from correct context (file/editor menus for file placeholders)
2. Check that file is saved (unsaved files may not have paths)
3. Review placeholder spelling (case-sensitive)

### Special Characters in Filenames

**Symptoms**: Commands fail with files containing spaces, quotes, or special characters

**Solutions**:
- Plugin uses Base64 encoding to handle special characters automatically
- If issues persist, check AI CLI tool compatibility with file paths

### AI CLI Tool Not Found

**Symptoms**: Terminal launches but shows "command not found" error

**Solutions**:
1. Install the AI CLI tool:
   - GitHub Copilot CLI: `npm install -g @githubnext/github-copilot-cli`
   - OpenCode: Follow [installation instructions](https://github.com/code-yeongyu/opencode)
2. Ensure the tool is in your PATH
3. Test the tool in a regular terminal first

### Permission Errors

**Symptoms**: "Access denied" or permission-related errors

**Solutions**:
1. Run Obsidian as administrator (last resort)
2. Check file/folder permissions in vault
3. Verify Windows Terminal has necessary permissions

## Platform Support

### Current Support (MVP)

- ✅ Windows 10/11 with Windows Terminal
- ✅ PowerShell 5.1+ or PowerShell Core 7+

### Future Roadmap

- WSL (Windows Subsystem for Linux) support
- Linux native terminal support
- macOS Terminal.app support
- Custom terminal preferences per command

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Development mode (watch for changes)
npm run dev

# Production build
npm run build
```

### Project Structure

```
src/
  main.ts                    # Plugin entry point
  settings.ts                # Settings UI and storage
  types.ts                   # TypeScript interfaces
  commands/
    command-manager.ts       # Command template management
    command-executor.ts      # Command execution orchestration
  placeholders/
    context-collector.ts     # Context gathering
    placeholder-resolver.ts  # Placeholder substitution
  terminal/
    terminal-launcher.ts     # Terminal launching
    path-converter.ts        # Path utilities
  ui/
    command-editor.ts        # Command template editor modal
```

### Testing

```bash
# Run tests
npm test

# Run linter
npm run lint
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Follow existing code style
4. Add tests for new features
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- Report issues: [GitHub Issues](https://github.com/atman-33/obsidian-ai-terminal/issues)
- Documentation: This README
- Obsidian API: https://docs.obsidian.md

## Acknowledgments

- Inspired by GitHub Copilot CLI and OpenCode
- Built with Obsidian Plugin API
- Thanks to the Obsidian community for feedback and testing

