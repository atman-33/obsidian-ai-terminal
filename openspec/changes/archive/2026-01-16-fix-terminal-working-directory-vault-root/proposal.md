# fix-terminal-working-directory-vault-root

## Summary
Always fix the terminal working directory to the vault root, enabling work from the vault's top level rather than the file's directory.

## Problem
Currently, when launching AI Terminal from a file context, the working directory is set to the file's parent directory. This makes it difficult to access other files and directories within the vault using relative paths.

Users want to fix the working directory to the vault root so they can launch AI agents with visibility across the entire vault.

## Goal
- Always set the working directory to the vault root regardless of file context presence
- File paths continue to be passed as placeholders in commands, so agents can still recognize target files
- Do not change the existing placeholder system (`<path>`, `<dir>`, `<file>`, etc.)

## Impact
- **Breaking**: Existing workflows that expected the file directory may change
- **Benefit**: Easy access to the entire vault, enabling multi-file operations
- **Mitigation**: Document the change clearly and explain that the file directory is still accessible via the `<dir>` placeholder

## Affected Specs
- `terminal-launcher`: Modify working directory setting requirement

## Non-Goals
- Making working directory configurable via settings (future enhancement)
- Changes to the placeholder system
- Support for other platforms (macOS, Linux)

## Acceptance Criteria
- [ ] Working directory is vault root even when launched from file context
- [ ] Working directory is vault root when launched from command palette
- [ ] Existing tests are updated and pass
- [ ] `terminal-launcher` spec is updated
