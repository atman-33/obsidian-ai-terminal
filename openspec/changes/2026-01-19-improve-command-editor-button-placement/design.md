# Design: Improve Modal Button Placement

## Architecture Overview

This change modifies only the UI layer of edit modals (CommandEditorModal and AgentEditorModal) without affecting business logic or data flow.

```
┌─────────────────────────────────────────────┐
│ CommandEditorModal                          │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Sticky Header                           │ │
│ │ ┌──────────────┬────────────────────┐   │ │
│ │ │ Title (h2)   │ [Cancel] [Save]    │   │ │  ← NEW: Sticky header
│ │ └──────────────┴────────────────────┘   │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Scrollable Content                      │ │
│ │ - Name field                            │ │
│ │ - Command template (textarea)           │ │
│ │ - Default prompt (textarea)             │ │
│ │ - Agent dropdown                        │ │
│ │ - Enabled toggle                        │ │
│ │ - Placeholder reference                 │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ (Bottom buttons removed)                    │  ← REMOVED
└─────────────────────────────────────────────┘
```

### AgentEditorModal Layout

```
┌─────────────────────────────────────────────┐
│ AgentEditorModal                            │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Sticky Header                           │ │
│ │ ┌──────────────┬────────────────────┐   │ │
│ │ │ Title (h2)   │ [Cancel] [Save]    │   │ │  ← NEW: Sticky header
│ │ └──────────────┴────────────────────┘   │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Scrollable Content                      │ │
│ │ - Agent name field                      │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ (Bottom buttons removed)                    │  ← REMOVED
└─────────────────────────────────────────────┘
```

## Component Structure

### Header Layout

```html
<div class="ai-terminal-modal-header">
  <h2>Edit Command Template</h2>
  <div class="ai-terminal-header-buttons">
    <button>Cancel</button>
    <button class="mod-cta">Save</button>
  </div>
</div>
```

### CSS Architecture

```css
/* Sticky Header Container */
.ai-terminal-modal-header {
  position: sticky;
  top: 0;
  z-index: 1;
  
  /* Layout */
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  /* Visual */
  background-color: var(--background-primary);
  border-bottom: 1px solid var(--background-modifier-border);
  padding-bottom: 16px;
  margin-bottom: 16px;
}

/* Button Container */
.ai-terminal-header-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}
```

## Implementation Details

### 1. Header Creation (TypeScript)

**Location**: [src/ui/command-editor.ts](src/ui/command-editor.ts) - `onOpen()` method

**Before**:
```typescript
onOpen() {
  const {contentEl} = this;
  contentEl.empty();
  contentEl.createEl("h2", {text: this.isEdit ? "Edit Command Template" : "New Command Template"});
  
  // ... form fields ...
  
  // Buttons at bottom
  const buttonContainer = contentEl.createDiv({cls: "modal-button-container"});
  const cancelButton = buttonContainer.createEl("button", {text: "Cancel"});
  const saveButton = buttonContainer.createEl("button", {text: "Save", cls: "mod-cta"});
}
```

**After**:
```typescript
onOpen() {
  const {contentEl} = this;
  contentEl.empty();
  
  // Create sticky header with title and buttons
  const headerEl = contentEl.createDiv({cls: "ai-terminal-modal-header"});
  headerEl.createEl("h2", {text: this.isEdit ? "Edit Command Template" : "New Command Template"});
  
  const buttonContainer = headerEl.createDiv({cls: "ai-terminal-header-buttons"});
  const cancelButton = buttonContainer.createEl("button", {text: "Cancel"});
  cancelButton.addEventListener("click", () => {
    void this.handleCloseRequest();
  });
  
  const saveButton = buttonContainer.createEl("button", {text: "Save", cls: "mod-cta"});
  saveButton.addEventListener("click", () => {
    void this.save();
  });
  
  // ... form fields (unchanged) ...
  
  // Bottom button container REMOVED
}
```

### 2. AgentEditorModal Implementation

**Location**: [src/ui/agent-list-editor.ts](src/ui/agent-list-editor.ts) - `AgentEditorModal.onOpen()` method

**Before**:
```typescript
onOpen() {
  const {contentEl} = this;
  contentEl.empty();
  contentEl.createEl("h2", {text: this.isEdit ? "Edit agent" : "New agent"});
  
  // ... form field ...
  
  // Buttons at bottom
  const buttonContainer = contentEl.createDiv({cls: "modal-button-container"});
  const cancelButton = buttonContainer.createEl("button", {text: "Cancel"});
  const saveButton = buttonContainer.createEl("button", {text: "Save", cls: "mod-cta"});
}
```

**After**:
```typescript
onOpen() {
  const {contentEl} = this;
  contentEl.empty();
  
  // Create sticky header with title and buttons
  const headerEl = contentEl.createDiv({cls: "ai-terminal-modal-header"});
  headerEl.createEl("h2", {text: this.isEdit ? "Edit agent" : "New agent"});
  
  const buttonContainer = headerEl.createDiv({cls: "ai-terminal-header-buttons"});
  const cancelButton = buttonContainer.createEl("button", {text: "Cancel"});
  cancelButton.addEventListener("click", () => this.close());
  
  const saveButton = buttonContainer.createEl("button", {text: "Save", cls: "mod-cta"});
  saveButton.addEventListener("click", () => {
    void this.save();
  });
  
  // ... form field (unchanged) ...
  
  // Bottom button container REMOVED
}
```

### 3. Event Handlers

**No changes required** - event handlers remain the same:

**CommandEditorModal**:
- `cancelButton.addEventListener("click", ...)` → calls `handleCloseRequest()`
- `saveButton.addEventListener("click", ...)` → calls `save()`

**AgentEditorModal**:
- `cancelButton.addEventListener("click", ...)` → calls `close()`
- `saveButton.addEventListener("click", ...)` → calls `save()`

### 4. CSS Specifications

#### Header Container

| Property | Value | Purpose |
|----------|-------|---------|
| `position` | `sticky` | Keep header visible when scrolling |
| `top` | `0` | Stick to top of modal |
| `z-index` | `1` | Appear above scrolling content |
| `display` | `flex` | Enable flexbox layout |
| `justify-content` | `space-between` | Push title left, buttons right |
| `align-items` | `center` | Vertical alignment |
| `background-color` | `var(--background-primary)` | Match modal background |
| `border-bottom` | `1px solid var(--background-modifier-border)` | Visual separation |
| `padding-bottom` | `16px` | Space before content |
| `margin-bottom` | `16px` | Space before form fields |

#### Button Container

| Property | Value | Purpose |
|----------|-------|---------|
| `display` | `flex` | Horizontal button layout |
| `gap` | `8px` | Space between buttons |
| `align-items` | `center` | Vertical alignment |

### 5. Z-Index Layering

```
Modal backdrop:          z-index: auto
Modal content:           z-index: auto
Sticky header:           z-index: 1
Scrollable content:      z-index: auto
```

The header's `z-index: 1` ensures it stays on top of scrolling content.

## Data Flow

**No changes** - this is purely a presentational change:

```
User Input → Form Fields → isDirty flag → save() or handleCloseRequest()
                                        ↓
                                   onSave callback
                                        ↓
                                   Settings saved
```

## Edge Cases

### 1. Very Long Titles

- Title text wraps naturally or truncates based on available space
- Button container has fixed width and remains visible

### 2. Modal Resize

- Flexbox layout adjusts automatically
- Sticky positioning remains functional

### 3. Theme Compatibility

- Use CSS variables for colors: `--background-primary`, `--background-modifier-border`
- No hard-coded colors to ensure theme compatibility

## Accessibility

- Button focus order maintained (Cancel → Save)
- Keyboard navigation (Tab, Enter) works unchanged
- Screen readers announce buttons correctly

## Browser Compatibility

- **Sticky positioning**: Supported in Chromium 56+ (Obsidian uses modern Electron)
- **Flexbox**: Fully supported
- **CSS Variables**: Fully supported

## Performance Impact

**Negligible** - only DOM structure change:
- One additional `<div>` wrapper
- No JavaScript logic changes
- No additional event listeners

## Testing Strategy

### Manual Testing Checklist

1. **Visual Verification (Both Modals)**
   - [ ] Buttons appear next to title
   - [ ] Proper spacing and alignment
   - [ ] Consistent with Obsidian design
   - [ ] Identical UI pattern between modals

2. **Scroll Behavior (CommandEditorModal)**
   - [ ] Header stays at top when scrolling
   - [ ] No visual glitches during scroll
   - [ ] Background color covers content

3. **Functional Testing (CommandEditorModal)**
   - [ ] Cancel button closes modal
   - [ ] Save button validates and saves
   - [ ] Unsaved changes warning works
   - [ ] All form fields work correctly

4. **Functional Testing (AgentEditorModal)**
   - [ ] Cancel button closes modal
   - [ ] Save button validates and saves
   - [ ] Validation works (duplicate names, empty names)
   - [ ] Agent name field works correctly

5. **Theme Compatibility (Both Modals)**
   - [ ] Test with light theme
   - [ ] Test with dark theme
   - [ ] Test with custom themes

### Automated Testing

- Existing unit tests should pass without modification
- No new test coverage needed (UI-only change)

## Rollback Plan

If issues arise, revert by:
1. Moving button creation back to bottom
2. Removing sticky header styles
3. Restoring `modal-button-container` at bottom

## Future Enhancements

This pattern could be applied to other modals:
- DirectPromptModal
- ConfirmationModal (inside both editors)
- Other custom modals added in the future

However, these are out of scope for this change.

## References

- [command-template-editor-ux spec](../../specs/command-template-editor-ux/spec.md)
- [Obsidian API - Modal](https://docs.obsidian.md/Plugins/User+interface/Modals)
- [CSS Sticky Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/position#sticky)
