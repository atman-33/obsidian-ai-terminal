# Implementation Tasks

## Phase 1: Settings Reset Functionality
- [x] Add "Reset All Settings" button to settings tab (bottom of page)
- [x] Implement confirmation dialog before reset
- [x] Create reset logic that restores `DEFAULT_SETTINGS` values
- [x] Update `AITerminalSettingTab.display()` to render reset button
- [x] Add unit tests for reset functionality
- [ ] Manual test: verify all settings restored including agents, commands, and UI preferences

## Phase 2: Prompt Persistence
- [x] Add `rememberLastPrompt` boolean field to `AITerminalSettings` interface
- [x] Add toggle setting in settings tab under "Direct Prompt" section
- [x] Add `lastSavedPrompt` string field to `AITerminalSettings` 
- [x] Update `DEFAULT_SETTINGS` to include new fields (default: `rememberLastPrompt: false`, `lastSavedPrompt: ""`)
- [x] Modify `DirectPromptModal.onOpen()` to load saved prompt when enabled
- [x] Modify `DirectPromptModal.executePrompt()` to save prompt text when enabled
- [x] Add unit tests for prompt save/load logic
- [ ] Manual test: toggle setting on/off and verify prompt persistence behavior

## Phase 3: Placeholder Value Insertion
- [x] Modify placeholder description text in `DirectPromptModal.onOpen()` to render clickable links
- [x] Store reference to prompt textarea element in modal for cursor access
- [x] Implement click handlers for each placeholder link
- [x] Implement `insertAtCursor()` helper function
- [x] Resolve placeholder values using existing `ContextCollector` logic
- [x] Handle cursor position edge cases (no focus, end of text)
- [x] Add CSS for placeholder link styling (maintain readability)
- [x] Add unit tests for value resolution and insertion logic
- [ ] Manual test: click each placeholder and verify correct value inserted at cursor

## Phase 4: Testing & Documentation
- [x] Run full test suite and verify no regressions
- [x] Update README.md with new feature descriptions
- [x] Update CHANGELOG.md
- [ ] Test on both desktop and mobile (if applicable)
- [x] Create release notes

## Validation Checkpoints
- After Phase 1: Settings reset works, confirmation dialog appears, defaults restored
- After Phase 2: Prompt persistence toggle works, last prompt appears when enabled
- After Phase 3: Clicking placeholders inserts resolved values at cursor position
- After Phase 4: All tests pass, documentation updated

## Dependencies
- Phase 2 and 3 can proceed in parallel after Phase 1 is complete
- Phase 4 requires all previous phases complete
