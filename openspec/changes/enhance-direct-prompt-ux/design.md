# Design Document: Enhance Direct Prompt UX

## Overview
This change adds three quality-of-life improvements to the Direct Prompt feature without introducing new architectural patterns or external dependencies.

## Architecture Decisions

### 1. Settings Reset Implementation

**Decision**: Implement reset as synchronous operation with immediate UI refresh

**Rationale**:
- Settings object is small (< 1KB typically)
- No complex cleanup or async operations needed
- Immediate feedback better UX than loading states

**Implementation**:
```typescript
async resetToDefaults() {
  const confirmed = await showConfirmationDialog();
  if (!confirmed) return;
  
  this.plugin.settings = {...DEFAULT_SETTINGS};
  await this.plugin.saveSettings();
  this.display(); // Refresh UI
}
```

**Trade-offs**:
- ✅ Simple, predictable behavior
- ✅ No partial state issues
- ⚠️ Destroys all user data (acceptable - this is intended behavior)

### 2. Prompt Persistence Storage

**Decision**: Store last prompt as plain string field in settings object

**Alternatives Considered**:
- **A**: Store full prompt history array
  - ❌ Rejected: Privacy concerns, storage bloat, scope creep
- **B**: Store in separate file
  - ❌ Rejected: Adds complexity, no benefit for single string

**Implementation**:
```typescript
interface AITerminalSettings {
  // ... existing fields
  rememberLastPrompt: boolean;
  lastSavedPrompt: string;
}
```

**Trade-offs**:
- ✅ Consistent with existing settings pattern
- ✅ Automatic save/load via plugin settings API
- ✅ Opt-in protects privacy
- ⚠️ No encryption (acceptable - prompts are not sensitive by default)

### 3. Placeholder Value Insertion

**Decision**: Use inline click handlers with direct DOM manipulation for cursor insertion

**Rationale**:
- Obsidian Settings API doesn't provide rich text components
- Textarea cursor position must be handled via DOM APIs
- Click handlers are simple and performant

**Implementation Approach**:
```typescript
// Render clickable placeholders
const placeholders = ['file', 'path', 'relative-path', 'dir', 'vault', 'selection'];
const desc = promptSetting.descEl;
desc.setText('Available placeholders: ');

placeholders.forEach((ph, idx) => {
  const link = desc.createEl('a', {
    text: `<${ph}>`,
    cls: 'ai-terminal-placeholder-link'
  });
  link.addEventListener('click', (e) => {
    e.preventDefault();
    this.insertPlaceholderValue(ph);
  });
  if (idx < placeholders.length - 1) {
    desc.appendText(', ');
  }
});

// Insert at cursor position
insertPlaceholderValue(placeholder: string) {
  const textarea = this.promptTextarea;
  const value = this.contextCollector.resolvePlaceholder(placeholder);
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  
  // Insert at cursor or end
  const insertPos = start >= 0 ? start : text.length;
  textarea.value = text.slice(0, insertPos) + value + text.slice(end);
  textarea.selectionStart = textarea.selectionEnd = insertPos + value.length;
  textarea.focus();
}
```

**Alternatives Considered**:
- **A**: Use React/custom component library
  - ❌ Rejected: Overkill, introduces dependency
- **B**: Insert placeholder syntax instead of values
  - ❌ Rejected: Less useful (user already sees syntax in description)
- **C**: Show dropdown with placeholder values
  - ❌ Rejected: More clicks, blocks view of textarea

**Trade-offs**:
- ✅ Zero dependencies
- ✅ Immediate feedback
- ✅ Works with existing ContextCollector
- ⚠️ Requires storing textarea ref (minor coupling)

## Data Flow

### Settings Reset
```
User clicks "Reset" button
  → Confirmation dialog shown
  → User confirms
  → Settings object replaced with DEFAULT_SETTINGS
  → saveSettings() called
  → UI refreshed via display()
  → Success notice shown
```

### Prompt Persistence
```
Dialog Open (if rememberLastPrompt = true):
  settings.lastSavedPrompt → textarea.value

Dialog Execute (if rememberLastPrompt = true):
  textarea.value → settings.lastSavedPrompt → saveSettings()
```

### Placeholder Insertion
```
User clicks placeholder link
  → Event prevented
  → ContextCollector.resolvePlaceholder(name) called
  → Resolved value inserted at textarea cursor position
  → Cursor moved to end of inserted text
  → Textarea focused
```

## Component Interactions

```
DirectPromptModal
  ├─ uses → ContextCollector (existing)
  │   └─ resolves placeholder values
  ├─ reads → AITerminalSettings
  │   ├─ rememberLastPrompt (new)
  │   └─ lastSavedPrompt (new)
  └─ writes → AITerminalSettings.lastSavedPrompt

AITerminalSettingTab
  ├─ reads/writes → AITerminalSettings
  └─ provides → resetToDefaults() method (new)
```

## Security Considerations

### Prompt Persistence
- **Risk**: Saved prompts may contain sensitive file paths or text
- **Mitigation**: Opt-in only, clear documentation
- **Note**: Obsidian vault data is not encrypted by default

### Settings Reset
- **Risk**: Accidental data loss
- **Mitigation**: Confirmation dialog with explicit warning

### Placeholder Resolution
- **Risk**: Exposing file system paths
- **Mitigation**: Same paths already visible in context menu and file explorer
- **Note**: Plugin already has file system access

## Testing Strategy

### Unit Tests
- Settings reset logic (default restoration)
- Prompt save/load with toggle on/off
- Placeholder value resolution
- Cursor position calculation

### Integration Tests
- Full dialog workflow with prompt persistence
- Placeholder click → value insertion
- Settings reset → UI refresh

### Manual Tests
- Test on Windows and Linux (different path formats)
- Test with no file open (placeholder edge cases)
- Test with very long prompts (>1000 chars)
- Test reset confirmation dialog

## Performance Considerations

- **Settings reset**: O(1) - simple object assignment
- **Prompt load**: O(1) - direct field access
- **Placeholder resolution**: O(1) - existing ContextCollector logic
- **Cursor insertion**: O(n) where n = textarea length (native DOM operation)

No performance concerns expected.

## Rollback Plan

If issues arise post-release:
1. Settings reset: Disable button via feature flag
2. Prompt persistence: Default toggle to OFF in next release
3. Placeholder insertion: Hide links, revert to plain text description

All features are additive - no breaking changes.

## Future Enhancements (Out of Scope)

- Full prompt history with search
- Placeholder preview on hover
- Custom placeholder definitions
- Import/export settings
- Per-command default prompts
