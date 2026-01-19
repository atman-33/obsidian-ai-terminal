# Tasks: Improve Modal Button Placement

## Overview

Implement sticky header with inline buttons for edit modals (Command Editor and Agent Editor).

## Prerequisites

- [ ] Review [command-template-editor-ux spec](../../specs/command-template-editor-ux/spec.md)
- [ ] Understand current modal implementations
  - [src/ui/command-editor.ts](src/ui/command-editor.ts) - CommandEditorModal
  - [src/ui/agent-list-editor.ts](src/ui/agent-list-editor.ts) - AgentEditorModal

## Implementation Tasks

### 1. Update TypeScript Implementation

#### 1.1 CommandEditorModal

**File**: [src/ui/command-editor.ts](src/ui/command-editor.ts)

- [ ] Create header container instead of standalone title
  - Create `<div class="ai-terminal-modal-header">`
  - Move `<h2>` title into header container
  - Create button container within header
- [ ] Move Cancel and Save button creation to header
  - Move button creation code from bottom to header
  - Keep all event handlers and logic unchanged
- [ ] Remove bottom button container
  - Delete `modal-button-container` div creation at the bottom
  - Ensure no orphaned button-related code remains

#### 1.2 AgentEditorModal

**File**: [src/ui/agent-list-editor.ts](src/ui/agent-list-editor.ts)

- [ ] Create header container instead of standalone title
  - Create `<div class="ai-terminal-modal-header">`
  - Move `<h2>` title into header container
  - Create button container within header
- [ ] Move Cancel and Save button creation to header
  - Move button creation code from bottom to header
  - Keep all event handlers and logic unchanged
- [ ] Remove bottom button container
  - Delete `modal-button-container` div creation at the bottom
  - Ensure no orphaned button-related code remains

### 2. Add CSS Styles

**File**: [styles.css](styles.css)

- [ ] Add sticky header styles
  - `.ai-terminal-modal-header` with flexbox layout
  - `position: sticky; top: 0;` for scroll behavior
  - Background color using CSS variables
  - Border and padding for visual separation
  - Z-index to ensure proper layering
- [ ] Add header button container styles
  - `.ai-terminal-header-buttons` with flex layout
  - Gap between buttons
  - Alignment settings

### 3. Testing

- [ ] Manual Testing - CommandEditorModal
  - [ ] Open Edit Command Template modal
  - [ ] Verify buttons appear next to title
  - [ ] Enter long template and prompt text
  - [ ] Scroll down and verify header stays at top
  - [ ] Test Save button functionality
  - [ ] Test Cancel button functionality
  - [ ] Test unsaved changes warning dialog
  - [ ] Test with different Obsidian themes
- [ ] Manual Testing - AgentEditorModal
  - [ ] Open Edit Agent modal
  - [ ] Verify buttons appear next to title
  - [ ] Test Save button functionality
  - [ ] Test Cancel button functionality
  - [ ] Test validation (duplicate name, empty name)
  - [ ] Test with different Obsidian themes
- [ ] Existing Tests
  - [ ] Run existing test suite to ensure no regressions
  - [ ] Verify all modal-related tests pass

## Verification

- [ ] Visual inspection confirms buttons are in header (both modals)
- [ ] Scrolling behavior keeps buttons visible (CommandEditorModal)
- [ ] No functional regressions in save/cancel/validation
- [ ] Consistent appearance across themes
- [ ] UI pattern is identical between both modals

## Documentation

- [ ] Update CHANGELOG.md with improvement description
- [ ] No user-facing documentation changes needed (UX improvement is self-explanatory)

## Success Criteria

- ✅ Buttons appear next to modal title (both modals)
- ✅ Header remains fixed when scrolling (CommandEditorModal)
- ✅ All existing functionality works correctly
- ✅ Visual appearance matches Obsidian design language
- ✅ Consistent UI pattern across both modals
