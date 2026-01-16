# terminal-launcher Specification

## Purpose
TBD - created by archiving change add-ai-terminal-launcher. Update Purpose after archive.
## Requirements
### Requirement: Launch external terminal with command

The plugin MUST be able to launch Windows Terminal with a specified command on Windows platform.

#### Scenario: Launch Windows Terminal on Windows

**Given** the plugin is running on Windows
**And** Windows Terminal is installed
**When** user executes a command template
**Then** Windows Terminal should open in a new window
**And** the resolved command should execute in PowerShell
**And** the working directory should be set to the file's directory or vault root

### Requirement: Handle terminal launch failures gracefully

The plugin MUST handle failures when launching terminals and provide user-friendly error messages.

#### Scenario: Terminal executable not found

**Given** Windows Terminal is not installed
**When** attempting to launch terminal
**Then** an error notice should be displayed to the user
**And** the error message should indicate that Windows Terminal was not found
**And** the error message should suggest installing Windows Terminal

#### Scenario: Permission denied when launching terminal

**Given** insufficient permissions to execute terminal command
**When** attempting to launch terminal
**Then** an error notice should be displayed
**And** the error message should indicate permission issue
**And** the command should not be retried automatically

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

### Requirement: Support detached terminal processes

Terminal processes MUST run independently from the Obsidian process.

#### Scenario: Terminal remains open after Obsidian closes

**Given** a terminal has been launched by the plugin
**When** Obsidian is closed
**Then** the terminal session should continue running
**And** any running commands in the terminal should not be interrupted

#### Scenario: Plugin does not track terminal sessions

**Given** a terminal has been launched
**When** the terminal is open
**Then** the plugin should not maintain any connection to the terminal process
**And** the plugin should not attempt to capture terminal output

