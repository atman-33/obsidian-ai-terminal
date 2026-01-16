# Tasks

## Implementation

- [ ] Modify the `getWorkingDirectory()` method in `placeholder-resolver.ts` to always return the vault root
- [ ] Update existing unit tests in `placeholder-resolver.test.ts` to reflect the new behavior
- [ ] Verify code changes with `npm run build` before committing

## Testing

- [ ] Manually verify that terminal working directory is vault root when executing commands from file explorer context menu
- [ ] Manually verify that terminal working directory is vault root when executing commands from command palette
- [ ] Verify that placeholders (`<path>`, `<dir>`, `<file>`, etc.) correctly resolve file paths

## Documentation

- [ ] Update `README.md` to document working directory behavior
- [ ] Add entry to `CHANGELOG.md` as a Breaking Change if necessary

## Spec Updates

- [ ] Create delta for `terminal-launcher` spec to update working directory requirement
