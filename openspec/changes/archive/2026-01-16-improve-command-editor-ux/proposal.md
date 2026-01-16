# Proposal: Improve Command Editor UX

## Status
- **ID**: improve-command-editor-ux
- **Created**: 2026-01-16
- **State**: draft

## Problem Statement

The Command Editor modal (CommandEditorModal) currently has two significant UX issues that impact usability:

1. **No unsaved changes warning**: When a user edits a command template and clicks the × button (close) or Cancel button, any changes are silently discarded without warning. This can lead to accidental data loss when users forget to save or mistakenly think closing will save their changes.

2. **Constrained textarea layout**: The "Command template" and "Default prompt" fields use horizontal layout (label left, input right), which limits the textarea width to ~50% of available space. This is insufficient for viewing and editing longer commands and prompts, forcing users to scroll horizontally or work within a cramped area.

## Why

Users expect modern applications to protect them from accidental data loss. The silent discard behavior violates user expectations and can cause frustration when carefully crafted prompts or command templates are lost. Additionally, the constrained horizontal layout creates unnecessary friction in the editing workflow, particularly for users who write detailed prompts or complex command templates. Vertical layout with full-width textareas is a well-established UX pattern for multi-line text input. These improvements align with Obsidian's focus on user-friendly, considerate UX patterns.

## What Changes

This change will modify:
- **`src/ui/command-editor.ts`**: Add dirty state tracking and confirmation dialog logic to `CommandEditorModal`
- **`styles.css`**: Add new CSS class `.ai-terminal-vertical-field` for vertical field layout
- **`CHANGELOG.md`** and **`README.md`**: Document new UX improvements
- **`command-template-editor-ux` spec** (new): Document the updated UX requirements for command template editor

## Proposed Solution

### 1. Unsaved Changes Warning

Implement change tracking and confirmation dialog:
- Track whether the form has been modified since opening (dirty state)
- When user attempts to close the modal (× button or Cancel):
  - If no changes: close immediately
  - If changes detected: show confirmation dialog
    - Message: "You have unsaved changes. Are you sure you want to close without saving?"
    - Buttons: "Close Anyway" (destructive action) and "Keep Editing" (default)
- Clicking "Save" button: clear dirty state and close normally

### 2. Vertical Layout for Multi-line Textareas

Convert "Command template" and "Default prompt" fields to vertical layout (label/description above, input below) with full-width textareas:

**Implementation approach**:
- Add custom CSS class `ai-terminal-vertical-field` to these Setting elements
- CSS will override default horizontal layout to stack vertically
- Increase textarea heights:
  - Command template: 3 → 4 rows (minor increase for consistency)
  - Default prompt: 2 → 6 rows (significant increase for comfort)
- Keep other fields (ID, Name, Default agent, Enabled) in standard horizontal layout

**Benefits**:
- Input width increases from ~50% to ~100% of available space
- Users can view and edit longer content without horizontal scrolling
- Modern, familiar form pattern for multi-line inputs
- Mixed layout (horizontal for short inputs, vertical for long) is intuitive and space-efficient

## Impact Assessment

### User Experience
- **Positive**: Prevents accidental data loss, improves editing experience for longer prompts
- **Negative**: Adds one extra click when intentionally discarding changes (minor)

### Technical Complexity
- **Unsaved changes warning**: Low-Medium complexity
  - Add dirty state tracking
  - Implement confirmation dialog
  - Hook into close events
- **Larger textarea**: Low complexity
  - Single property change

### Breaking Changes
None. This is purely a UX enhancement with no API or data structure changes.

### Testing Considerations
- Manual testing of modal close scenarios:
  - Close without changes
  - Close with unsaved changes → cancel
  - Close with unsaved changes → confirm discard
  - Save successfully (should not show warning)
- Visual regression testing for layout changes:
  - Verify vertical layout renders correctly on different window sizes
  - Confirm textareas are full-width
  - Check that horizontal-layout fields (ID, Name, etc.) remain unchanged
  - Test on different Obsidian themes (light/dark)

## Alternatives Considered

### For Unsaved Changes Warning:
1. **Auto-save on close**: Automatically save changes when modal closes
   - Rejected: Could save incomplete or invalid data unintentionally
   
2. **Disable close buttons when dirty**: Prevent closing entirely until saved
   - Rejected: Too restrictive, users may legitimately want to discard changes

3. **Show warning only on × button, not Cancel**: Distinguish between explicit cancel and accidental close
   - Considered: Could be confusing since Cancel doesn't actually cancel when changes exist

### For Textarea Layout:
1. **Simple row increase only**: Just increase rows without layout change
   - Rejected: Doesn't address fundamental width constraint
   
2. **Resizable textarea**: Allow users to manually resize
   - Rejected: Adds complexity and state management for minimal benefit
   
3. **Full-screen editor**: Open a separate larger editor modal
   - Rejected: Over-engineered for the problem
   
4. **All fields vertical**: Convert all fields to vertical layout
   - Rejected: Wastes space for short single-line inputs (ID, Name, Default agent)

## Open Questions

1. Should the confirmation dialog offer a third "Save and Close" option?
   - Lean towards NO: adds complexity and "Save" button is already visible
   
2. Should we persist dirty state across multiple close attempts?
   - YES: dirty state should persist until saved or explicitly discarded

3. Should command template textarea height be increased?
   - YES: Minor increase to 4 rows for visual consistency and comfort

## Dependencies

- Obsidian API: Modal class for close event handling
- Current implementation: CommandEditorModal in `src/ui/command-editor.ts`

## Related Specs

- `command-templates`: Core spec for command template management
  - Will add new requirements for UX improvements
