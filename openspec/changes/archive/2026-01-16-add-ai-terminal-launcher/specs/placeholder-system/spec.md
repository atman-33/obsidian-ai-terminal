# Specification: Placeholder System

## ADDED Requirements

### Requirement: Replace file-related placeholders

The plugin MUST replace file-related placeholders with actual file information from execution context.

#### Scenario: Replace `<file>` with filename

**Given** command template contains `<file>` placeholder
**And** user executes command on file `notes/readme.md`
**When** placeholder resolution occurs
**Then** `<file>` should be replaced with `readme.md`

#### Scenario: Replace `<path>` with absolute path

**Given** command template contains `<path>` placeholder
**And** user executes command on file at `/home/user/vault/notes/readme.md`
**When** placeholder resolution occurs
**Then** `<path>` should be replaced with `/home/user/vault/notes/readme.md`

#### Scenario: Replace `<relative-path>` with vault-relative path

**Given** command template contains `<relative-path>` placeholder
**And** vault root is `/home/user/vault`
**And** user executes command on file at `/home/user/vault/notes/readme.md`
**When** placeholder resolution occurs
**Then** `<relative-path>` should be replaced with `notes/readme.md`

#### Scenario: Replace `<dir>` with directory path

**Given** command template contains `<dir>` placeholder
**And** user executes command on file at `/home/user/vault/notes/readme.md`
**When** placeholder resolution occurs
**Then** `<dir>` should be replaced with `/home/user/vault/notes`

#### Scenario: Replace `<vault>` with vault root path

**Given** command template contains `<vault>` placeholder
**And** vault root is `/home/user/vault`
**When** placeholder resolution occurs
**Then** `<vault>` should be replaced with `/home/user/vault`

### Requirement: Replace context-specific placeholders

The plugin MUST replace placeholders that depend on execution context (selection, prompt, agent).

#### Scenario: Replace `<selection>` with selected text

**Given** command template contains `<selection>` placeholder
**And** user has selected text "function example() { return 42; }"
**When** executing command from editor
**Then** `<selection>` should be replaced with the selected text

#### Scenario: Handle missing selection

**Given** command template contains `<selection>` placeholder
**And** no text is selected
**When** placeholder resolution occurs
**Then** `<selection>` should be replaced with empty string

#### Scenario: Replace `<prompt>` with default prompt

**Given** command template contains `<prompt>` placeholder
**And** template has default prompt "Fix issues in <file>"
**And** user executes command on file `readme.md`
**When** placeholder resolution occurs
**Then** `<prompt>` should be replaced with "Fix issues in readme.md"
**And** `<file>` within the prompt should also be resolved

#### Scenario: Replace `<agent>` with default agent

**Given** command template contains `<agent>` placeholder
**And** template has default agent "noctis"
**When** placeholder resolution occurs
**Then** `<agent>` should be replaced with "noctis"

### Requirement: Escape shell special characters

The plugin MUST escape shell special characters in placeholder values to prevent command injection.

#### Scenario: Escape filename with spaces

**Given** filename contains spaces "my document.md"
**And** command template uses `<file>`
**When** placeholder resolution occurs
**Then** filename should be escaped as `"my document.md"` or `my\ document.md`

#### Scenario: Escape filename with special characters

**Given** filename contains special characters `test;rm -rf.md`
**And** command template uses `<file>`
**When** placeholder resolution occurs
**Then** special characters should be escaped to prevent command injection

#### Scenario: Escape selection with quotes

**Given** selected text contains double quotes `const msg = "hello"`
**And** command template uses `<selection>`
**When** placeholder resolution occurs
**Then** quotes should be properly escaped

### Requirement: Handle unavailable placeholders gracefully

The plugin MUST handle cases where placeholder values are unavailable.

#### Scenario: Command executed without file context

**Given** command template contains `<file>` placeholder
**And** user executes command from command palette without active file
**When** placeholder resolution occurs
**Then** `<file>` should be replaced with empty string
**Or** command execution should be cancelled with error message

#### Scenario: Required placeholder unavailable

**Given** command template requires `<file>` placeholder (e.g., "Fix <file>")
**And** no file context is available
**When** attempting to execute command
**Then** error notice should be shown: "This command requires an active file"
**And** command should not execute

### Requirement: Resolve nested placeholders

The plugin MUST support nested placeholder resolution (placeholders within default values).

#### Scenario: Placeholder in default prompt

**Given** command template has default prompt "Analyze <file> in <dir>"
**And** `<prompt>` appears in command template
**And** current file is `notes/readme.md` in `/home/user/vault/notes`
**When** resolving `<prompt>` placeholder
**Then** the result should be "Analyze readme.md in /home/user/vault/notes"

### Requirement: Provide placeholder documentation

The plugin MUST provide clear documentation of available placeholders in settings UI.

#### Scenario: Display placeholder reference in settings

**Given** user opens command template editor
**When** viewing the settings interface
**Then** a reference section should list all available placeholders
**And** each placeholder should have a description and example

## Relationships

**Depends on**:
- `command-templates`: Receives template strings to process

**Required by**:
- `terminal-launcher`: Provides fully resolved command string
- `context-menu-integration`: Provides context for placeholder resolution
