# Tasks

## Implementation

- [x] Modify the `getWorkingDirectory()` method in `placeholder-resolver.ts` to always return the vault root
- [x] Update existing unit tests in `placeholder-resolver.test.ts` to reflect the new behavior
- [x] Verify code changes with `npm run build` before committing

## Testing

- [x] Manually verify that terminal working directory is vault root when executing commands from file explorer context menu
- [x] Manually verify that terminal working directory is vault root when executing commands from command palette
- [x] Verify that placeholders (`<path>`, `<dir>`, `<file>`, etc.) correctly resolve file paths

## Documentation

- [x] Update `README.md` to document working directory behavior
- [x] Add entry to `CHANGELOG.md` as a Breaking Change if necessary

## Spec Updates

- [x] Create delta for `terminal-launcher` spec to update working directory requirement
