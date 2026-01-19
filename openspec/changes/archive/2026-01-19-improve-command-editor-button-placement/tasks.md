# Tasks: Improve Modal Button Placement

## Overview

Implement sticky header with inline buttons for edit modals (Command Editor and Agent Editor).

## Prerequisites

- [x] Review [command-template-editor-ux spec](../../specs/command-template-editor-ux/spec.md)
- [x] Understand current modal implementations
  - [src/ui/command-editor.ts](src/ui/command-editor.ts) - CommandEditorModal
  - [src/ui/agent-list-editor.ts](src/ui/agent-list-editor.ts) - AgentEditorModal

## Implementation Tasks

### 1. Update TypeScript Implementation

#### 1.1 CommandEditorModal

**File**: [src/ui/command-editor.ts](src/ui/command-editor.ts)

- [x] Create header container instead of standalone title
  - Create `<div class="ai-terminal-modal-header">`
  - Move `<h2>` title into header container
  - Create button container within header
- [x] Move Cancel and Save button creation to header
  - Move button creation code from bottom to header
  - Keep all event handlers and logic unchanged
- [x] Remove bottom button container
  - Delete `modal-button-container` div creation at the bottom
  - Ensure no orphaned button-related code remains

#### 1.2 AgentEditorModal

**File**: [src/ui/agent-list-editor.ts](src/ui/agent-list-editor.ts)

- [x] Create header container instead of standalone title
  - Create `<div class="ai-terminal-modal-header">`
  - Move `<h2>` title into header container
  - Create button container within header
- [x] Move Cancel and Save button creation to header
  - Move button creation code from bottom to header
  - Keep all event handlers and logic unchanged
- [x] Remove bottom button container
  - Delete `modal-button-container` div creation at the bottom
  - Ensure no orphaned button-related code remains

### 2. Add CSS Styles

**File**: [styles.css](styles.css)

- [x] Add sticky header styles
  - `.ai-terminal-modal-header` with flexbox layout
  - `position: sticky; top: 0;` for scroll behavior
  - Background color using CSS variables
  - Border and padding for visual separation
  - Z-index to ensure proper layering
- [x] Add header button container styles
  - `.ai-terminal-header-buttons` with flex layout
  - Gap between buttons
  - Alignment settings

### 3. Testing

- [x] Manual Testing - CommandEditorModal
  - [x] Open Edit Command Template modal
  - [x] Verify buttons appear next to title
  - [x] Enter long template and prompt text
  - [x] Scroll down and verify header stays at top
  - [x] Test Save button functionality
  - [x] Test Cancel button functionality
  - [x] Test unsaved changes warning dialog
  - [x] Test with different Obsidian themes
- [x] Manual Testing - AgentEditorModal
  - [x] Open Edit Agent modal
  - [x] Verify buttons appear next to title
  - [x] Test Save button functionality
  - [x] Test Cancel button functionality
  - [x] Test validation (duplicate name, empty name)
  - [x] Test with different Obsidian themes
- [x] Existing Tests
  - [x] Run existing test suite to ensure no regressions
  - [x] Verify all modal-related tests pass

## Verification

- [x] Visual inspection confirms buttons are in header (both modals)
- [x] Scrolling behavior keeps buttons visible (CommandEditorModal)
- [x] No functional regressions in save/cancel/validation
- [x] Consistent appearance across themes
- [x] UI pattern is identical between both modals

## Documentation

- [x] Update CHANGELOG.md with improvement description
- [x] No user-facing documentation changes needed (UX improvement is self-explanatory)

## Success Criteria

- ✅ Buttons appear next to modal title (both modals)
- ✅ Header remains fixed when scrolling (CommandEditorModal)
- ✅ All existing functionality works correctly
- ✅ Visual appearance matches Obsidian design language
- ✅ Consistent UI pattern across both modals
