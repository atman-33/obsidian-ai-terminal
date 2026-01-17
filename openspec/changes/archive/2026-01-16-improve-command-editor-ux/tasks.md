# Tasks: Improve Command Editor UX

## Implementation Order

1. [x] **Add vertical layout CSS** ⚡ Quick Win
   - Create CSS rules in `styles.css` for `.ai-terminal-vertical-field` class
   - Rules:
     - Flex column layout
     - Full-width info and control sections
     - Textarea resize: vertical
   - Manual test: verify CSS compiles and loads
   - Estimate: 10 minutes

2. [x] **Apply vertical layout and increase textarea sizes**
   - Modify `CommandEditorModal.onOpen()` in `src/ui/command-editor.ts`
   - Command template field:
     - Add `templateSetting.settingEl.addClass('ai-terminal-vertical-field')`
     - Change `text.inputEl.rows = 3` to `text.inputEl.rows = 4`
   - Default prompt field:
     - Add `promptSetting.settingEl.addClass('ai-terminal-vertical-field')`
     - Change `text.inputEl.rows = 2` to `text.inputEl.rows = 6`
   - Manual test: open editor, verify layout is vertical and textareas are larger
   - Visual test: check on different window sizes and themes
   - Estimate: 15 minutes

3. [x] **Add dirty state tracking**
   - Add private field `isDirty: boolean = false` to `CommandEditorModal`
   - Set `isDirty = true` in all field `onChange` handlers
   - Reset `isDirty = false` after successful save
   - Unit test: verify dirty state changes correctly
   - Estimate: 15 minutes

4. [x] **Implement unsaved changes confirmation dialog**
   - Create helper method `confirmDiscardChanges(): boolean` that shows Obsidian modal
   - Update close button handler to check `isDirty` and call confirmation
   - Override modal `onClose()` to check `isDirty` (handles × button)
   - Add flag to skip confirmation after successful save
   - Manual test scenarios:
     - Close with no changes → immediate close
     - Close with changes → confirmation shown
     - Confirm discard → modal closes
     - Cancel discard → modal stays open
     - Save successfully → no confirmation on close
   - Estimate: 30 minutes

5. [x] **Update documentation**
   - Update CHANGELOG.md with new feature
   - Update README.md if user-facing behavior changes significantly
   - Estimate: 10 minutes

## Validation

- [x] All unit tests pass
- [x] Manual testing checklist completed:
  - [x] Open editor, make no changes, click Cancel → closes immediately
  - [x] Open editor, make no changes, click × → closes immediately
  - [x] Open editor, edit field, click Cancel → confirmation shown
  - [x] Open editor, edit field, click × → confirmation shown
  - [x] Confirmation: "Keep Editing" → modal stays open, changes preserved
  - [x] Confirmation: "Close Anyway" → modal closes, changes discarded
  - [x] Make changes and save → closes without confirmation
  - [x] Command template is in vertical layout with 4 rows
  - [x] Default prompt is in vertical layout with 6 rows
  - [x] Both textareas are full-width (~100% of modal width)
  - [x] Other fields (ID, Name, Default agent, Enabled) remain horizontal
  - [x] Layout works on narrow window widths
  - [x] Layout works on wide window widths
  - [x] Test on light and dark themes
- [x] No console errors or warnings
- [x] Works on all supported platforms (Windows, macOS, Linux)

## Dependencies

- None (self-contained)

## Parallelizable Work

Tasks 1-2 (layout/CSS) and task 3 (dirty state) can be done independently, then merged before task 4.

## Risk Mitigation

- **Risk**: Confirmation dialog might be annoying if triggered too aggressively
  - **Mitigation**: Only show when actual changes detected, not on pristine form
  
- **Risk**: Dirty state might not track all change types
  - **Mitigation**: Carefully add `isDirty = true` to all input handlers (text, textarea, toggle)
  
- **Risk**: User might lose work if they force-close Obsidian during editing
  - **Mitigation**: Document limitation; this is inherent to modal-based editing

- **Risk**: Custom CSS might conflict with Obsidian themes
  - **Mitigation**: Use relative units, avoid hard-coded colors, test with popular themes

- **Risk**: Vertical layout might not work well on very narrow windows
  - **Mitigation**: Test on various window sizes; vertical layout actually helps on narrow windows (avoids 50/50 split)

## Notes

- This is a UX-focused change with minimal technical risk
- No data structure or API changes
- No breaking changes for existing users
- Implementation leverages existing Obsidian Setting API with minimal custom CSS
- Implementation should be straightforward with existing Obsidian Modal API
