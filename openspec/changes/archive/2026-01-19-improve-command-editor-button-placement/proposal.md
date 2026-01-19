# Proposal: Improve Modal Button Placement

## Overview

Move Cancel and Save buttons in edit modals (Edit Command Template and Edit Agent) to the top of the dialog (next to the title) and make them sticky when scrolling to prevent users from forgetting to save their changes.

## Problem Statement

Currently, the Cancel and Save buttons are located at the bottom of edit modals (Edit Command Template and Edit Agent). This creates usability issues:

1. **Hidden buttons during editing**: When editing long templates or default prompts, users need to scroll down to reach the buttons
2. **Save forgetting risk**: Users may close the modal without saving because the buttons are not visible
3. **Poor workflow**: Users must scroll down after each edit to save or cancel
4. **Inconsistent UI**: Both modals should follow the same pattern for better user experience

## Proposed Solution

Relocate the Cancel and Save buttons to the header area of the modal:

1. **Position**: Place buttons to the right of the "Edit Command Template" title
2. **Sticky header**: Use CSS `position: sticky` to keep the header (including buttons) fixed at the top when scrolling
3. **Remove bottom buttons**: Only show buttons in the header (not at the bottom)

## Benefits

1. **Better visibility**: Buttons are always visible during editing
2. **Reduced save forgetting**: Clear visual reminder to save changes
3. **Improved workflow**: Save or cancel without scrolling
4. **Consistent UX**: Common pattern in modern applications

## Scope

### In Scope
- Modify `CommandEditorModal` class in [src/ui/command-editor.ts](src/ui/command-editor.ts)
- Modify `AgentEditorModal` class in [src/ui/agent-list-editor.ts](src/ui/agent-list-editor.ts)
- Add new CSS styles for sticky header with inline buttons
- Ensure unsaved changes confirmation still works correctly
- Maintain UI consistency across both modals

### Out of Scope
- Other modals (DirectPromptModal, ConfirmationModal, etc.) - can be addressed in future changes if needed
- Mobile-specific optimizations
- Additional modal improvements

## Technical Approach

1. Create a header container with flex layout (title + buttons)
2. Apply sticky positioning to the header
3. Remove the bottom button container
4. Update CSS to handle background, borders, and z-index properly

## Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Visual conflicts with Obsidian themes | Medium | Test with multiple themes; use CSS variables |
| Mobile layout issues | Low | This plugin is desktop-only (`isDesktopOnly: true`) |
| Sticky positioning not working in old browsers | Low | Obsidian uses Electron with modern Chromium |

## Success Criteria

1. Cancel and Save buttons appear next to the title in both modals
2. Buttons remain visible when scrolling through long forms
3. All existing functionality (save, cancel, unsaved changes warning) works correctly
4. Visual appearance is consistent with Obsidian's design language
5. Both modals follow the same UI pattern for consistency

## Related Specifications

- [command-template-editor-ux](../../specs/command-template-editor-ux/spec.md)
