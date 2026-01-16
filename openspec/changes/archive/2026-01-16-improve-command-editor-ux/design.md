# Design: Improve Command Editor UX

## Architecture Overview

This change focuses on enhancing the user experience of the Command Editor modal through two independent but complementary improvements: unsaved changes protection and vertical layout for multi-line text inputs with increased dimensions.

## Components Affected

### CommandEditorModal (`src/ui/command-editor.ts`)

Single component requiring modifications:
- Add dirty state tracking
- Implement confirmation dialog logic
- Adjust textarea dimensions

No new components or files required.

## Detailed Design

### 1. Dirty State Tracking

**Approach**: Simple boolean flag that tracks whether any input has been modified since modal opened.

```typescript
private isDirty: boolean = false;
private skipConfirmation: boolean = false; // Flag to skip after successful save
```

**Change Detection**:
- Set `isDirty = true` in all `.onChange()` handlers:
  - `id` (text input)
  - `name` (text input)
  - `template` (textarea)
  - `defaultPrompt` (textarea)
  - `defaultAgent` (text input)
  - `enabled` (toggle)

**State Reset**:
- After successful save: `this.skipConfirmation = true` before `this.close()`
- This prevents confirmation when user explicitly saved

### 2. Unsaved Changes Confirmation

**Integration Points**:

1. **Cancel Button Handler** (existing):
   ```typescript
   cancelButton.addEventListener("click", () => {
     if (this.shouldWarnAboutUnsavedChanges()) {
       this.showConfirmationDialog(() => this.close());
     } else {
       this.close();
     }
   });
   ```

2. **Modal Close Event** (× button):
   ```typescript
   // Override onClose to intercept × button
   onClose() {
     if (this.shouldWarnAboutUnsavedChanges()) {
       // Prevent default close behavior
       // Show confirmation, then call super.onClose() if confirmed
     } else {
       super.onClose();
     }
   }
   ```

**Confirmation Dialog Design**:

Using Obsidian's Modal API for consistency with app UX:

```typescript
private showConfirmationDialog(onConfirm: () => void): void {
  const modal = new ConfirmationModal(
    this.app,
    "Unsaved changes",
    "You have unsaved changes. Are you sure you want to close without saving?",
    "Close anyway",
    () => {
      this.skipConfirmation = true;
      onConfirm();
    }
  );
  modal.open();
}
```

**Note**: May need to create a simple `ConfirmationModal` helper class if not already available in the codebase. This is a standard pattern in Obsidian plugins.

### 3. Vertical Layout for Multi-line Textareas

**Approach**: Use CSS to override Obsidian's default horizontal Setting layout for specific fields.

**Target Fields**:
- Command template
- Default prompt

**Keep Horizontal** (unchanged):
- Command ID (text input)
- Display name (text input)  
- Default agent (text input)
- Enabled (toggle)

**Implementation**:

```typescript
// Command template field with vertical layout
const templateSetting = new Setting(contentEl)
  .setName("Command template")
  .setDesc("Command with placeholders (e.g., copilot -i <prompt>)")
  .addTextArea(text => {
    text
      .setPlaceholder('copilot -i <prompt>')
      .setValue(this.command.template || "")
      .onChange(value => {
        this.isDirty = true;  // Track changes
        this.command.template = value;
      });
    text.inputEl.rows = 4;  // Increased from 3
  });
templateSettings.settingEl.addClass('ai-terminal-vertical-field');

// Default Prompt field with vertical layout
const promptSetting = new Setting(contentEl)
  .setName("Default prompt (optional)")
  .setDesc("Default value for <prompt> placeholder")
  .addTextArea(text => {
    text
      .setPlaceholder("Fix issues in <file>")
      .setValue(this.command.defaultPrompt || "")
      .onChange(value => {
        this.isDirty = true;  // Track changes
        this.command.defaultPrompt = value;
      });
    text.inputEl.rows = 6;  // Increased from 2
  });
promptSetting.settingEl.addClass('ai-terminal-vertical-field');
```

**CSS Implementation** (`styles.css`):

```css
/* Vertical layout for long-form text inputs */
.ai-terminal-vertical-field {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.ai-terminal-vertical-field .setting-item-info {
  width: 100%;
  margin-bottom: 8px;
  padding-right: 0;
}

.ai-terminal-vertical-field .setting-item-control {
  width: 100%;
  margin-left: 0;
}

.ai-terminal-vertical-field textarea {
  width: 100%;
  resize: vertical;  /* Allow users to resize if needed */
}
```

**Benefits**:
- Input width: ~50% → ~100% of available modal width
- Command template: 3 rows → 4 rows (33% height increase)
- Default prompt: 2 rows → 6 rows (200% height increase)
- No horizontal scrolling needed for typical content
- Maintains Obsidian's native styling and theme compatibility

## Technical Considerations

### Obsidian Modal API Limitations

**Challenge**: Obsidian's `Modal.onClose()` is called when modal closes, which may be too late to prevent closure.

**Solution Strategy**:
1. First attempt: Override `onClose()` to show confirmation
2. If that doesn't prevent closure: Intercept close button/× click events directly
3. Fallback: Use `containerEl` event listeners to capture close action earlier in the event chain

**Research Required**: Test Obsidian Modal close behavior to determine best interception point.

### State Management

**Dirty State Initialization**:
- `isDirty` starts as `false` when modal opens
- Important: Editing a field then reverting to original value still marks as dirty (acceptable trade-off for simplicity)

**Skip Confirmation Flag**:
- Used to bypass warning after successful save
- Reset when modal opens
- Prevents double-confirmation if user saves, then immediately closes

### Edge Cases

1. **Rapid clicking**: User clicks Save then immediately clicks ×
   - Handled by `skipConfirmation` flag
   
2. **Validation failure during save**: User clicks Save, validation fails, then closes
   - `skipConfirmation` is NOT set (save didn't complete)
   - Confirmation will still show (desired behavior)

3. **User makes change, reverts change, closes**: 
   - Will still show confirmation (acceptable: we don't track field-level changes)
   - Alternative: Deep equality check (rejected as over-engineering)

4. **Narrow window width**: Modal becomes too narrow for comfortable editing
   - Vertical layout actually helps here (avoids 50/50 split)
   - CSS `resize: vertical` allows user adjustment if needed

5. **Theme compatibility**: Custom CSS might conflict with themes
   - Mitigation: Use relative units and avoid hard-coded colors
   - Test with popular themes (default, minimal, things)

## Testing Strategy

### Unit Tests (if feasible with Obsidian API mocking)

- Dirty state transitions
- Confirmation dialog triggering logic

### Manual Testing Checklist

See `tasks.md` for comprehensive manual test scenarios.

### Visual Testing

- Screenshot comparison: before/after textarea size change
- Verify modal layout doesn't break on different screen sizes
- Test on mobile (if plugin supports mobile)

## Performance Impact

Negligible:
- Dirty state tracking: single boolean flag, no performance concern
- Confirmation dialog: only shown when user attempts to close
- CSS layout change: no runtime impact, applied at render time
- Slightly larger textareas: minimal memory increase

## Accessibility Considerations

- Confirmation dialog must be keyboard-navigable
- Default focus should be on "Keep Editing" (safe option)
- "Close Anyway" should be styled as destructive/warning action
- Screen reader: ensure dialog message is announced

## Future Enhancements (Out of Scope)

1. **Field-level change tracking**: Track exactly which fields changed
   - Benefit: Could show "X fields modified" in confirmation
   - Cost: Significant complexity increase
   
2. **Undo/Redo in modal**: Allow reverting changes within session
   - Benefit: Better editing experience
   - Cost: Requires command pattern implementation
   
3. **Auto-save draft**: Persist incomplete edits
   - Benefit: Recover from accidental Obsidian crashes
   - Cost: Needs temporary storage and cleanup logic

4. **Syntax highlighting**: Highlight placeholders in command template
   - Benefit: Easier to identify valid placeholders
   - Cost: Requires custom textarea implementation or CodeMirror integration

5. **Auto-expanding textarea**: Grow/shrink based on content
   - Benefit: Always shows full content without scrolling
   - Cost: More complex CSS/JS, potential layout shifts

## Security/Privacy Considerations

None. This change only affects UI behavior, no data handling or security implications.

## Rollback Plan

If issues arise after deployment:
1. Revert textarea rows back to 2
2. Disable confirmation dialog by setting `skipConfirmation = true` globally
3. Full revert: Restore `command-editor.ts` from previous commit

All changes are localized to one file, making rollback straightforward.
