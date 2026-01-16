# terminal-launcher Spec Delta

## MODIFIED Requirements

### Requirement: Set working directory for terminal session

The plugin MUST always set the working directory for launched terminal sessions to the vault root directory, regardless of execution context.

#### Scenario: Launch from file context

**Given** user executes command from a file in the file explorer  
**When** terminal is launched  
**Then** the working directory should be set to the vault root directory  
**And** file placeholders (`<path>`, `<dir>`, `<file>`) should still resolve to the file's actual paths

#### Scenario: Launch without file context

**Given** user executes command from command palette without active file  
**When** terminal is launched  
**Then** the working directory should be set to the vault root directory

#### Scenario: Working directory consistency

**Given** multiple terminal launches in the same vault  
**When** terminals are launched from different file contexts  
**Then** all terminals should have the same working directory (vault root)  
**And** file-specific paths should be passed via command placeholders, not via working directory

## Rationale

By always using the vault root as the working directory, users gain:
- Consistent terminal environment regardless of how the command was triggered
- Easy access to all files and directories within the vault using relative paths
- Ability to work with multiple files across different directories without navigation
- Predictable behavior for scripting and automation workflows

File-specific information is still available through placeholders (`<path>`, `<dir>`, `<file>`, `<relative-path>`), allowing AI agents to focus on the intended file while having full vault access.
