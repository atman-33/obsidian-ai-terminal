# Specification: Terminal Launcher

## ADDED Requirements

### Requirement: Launch external terminal with command

The plugin MUST be able to launch external terminal applications with a specified command on supported platforms (Windows, WSL, Linux, macOS).

#### Scenario: Launch Windows Terminal on Windows

**Given** the plugin is running on Windows
**And** Windows Terminal is installed
**When** user executes a command template
**Then** Windows Terminal should open in a new window
**And** the resolved command should execute in the terminal
**And** the working directory should be set to the file's directory or vault root

#### Scenario: Launch WSL terminal from Windows

**Given** the plugin is running on Windows
**And** WSL is installed with a configured distribution
**When** user executes a command template with WSL terminal type
**Then** a new WSL terminal session should start
**And** the Windows file path should be converted to WSL path format
**And** the resolved command should execute in the WSL environment

#### Scenario: Launch system terminal on Linux

**Given** the plugin is running on Linux
**And** a terminal emulator is installed (gnome-terminal, konsole, or xterm)
**When** user executes a command template
**Then** the system terminal should open in a new window
**And** the resolved command should execute in the terminal
**And** the working directory should be set correctly

#### Scenario: Launch Terminal.app on macOS

**Given** the plugin is running on macOS
**When** user executes a command template
**Then** Terminal.app should open with a new tab or window
**And** the resolved command should execute
**And** the working directory should be set correctly

### Requirement: Convert Windows paths to WSL paths

When launching WSL terminal from Windows, the plugin MUST convert Windows-style paths to WSL-style paths.

#### Scenario: Convert Windows drive letter to WSL mount point

**Given** a Windows file path `C:\Users\username\vault\notes\file.md`
**When** launching WSL terminal
**Then** the path should be converted to `/mnt/c/Users/username/vault/notes/file.md`
**And** backslashes should be replaced with forward slashes

#### Scenario: Handle different drive letters

**Given** a Windows file path on D: drive `D:\Projects\vault\readme.md`
**When** launching WSL terminal
**Then** the path should be converted to `/mnt/d/Projects/vault/readme.md`

### Requirement: Handle terminal launch failures gracefully

The plugin MUST handle failures when launching terminals and provide user-friendly error messages.

#### Scenario: Terminal executable not found

**Given** the configured terminal is not installed
**When** attempting to launch terminal
**Then** an error notice should be displayed to the user
**And** the error message should indicate which terminal was not found
**And** the error message should suggest installation steps

#### Scenario: Permission denied when launching terminal

**Given** insufficient permissions to execute terminal command
**When** attempting to launch terminal
**Then** an error notice should be displayed
**And** the error message should indicate permission issue
**And** the command should not be retried automatically

### Requirement: Set working directory for terminal session

The plugin MUST set the working directory for launched terminal sessions based on execution context.

#### Scenario: Launch from file context

**Given** user executes command from a file in the file explorer
**When** terminal is launched
**Then** the working directory should be set to the file's parent directory

#### Scenario: Launch without file context

**Given** user executes command from command palette without active file
**When** terminal is launched
**Then** the working directory should be set to the vault root directory

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

## Relationships

**Depends on**:
- `command-templates`: Requires resolved command string to execute
- `placeholder-system`: Requires working directory and command to be determined from context

**Required by**:
- `context-menu-integration`: Uses terminal launcher to execute commands
