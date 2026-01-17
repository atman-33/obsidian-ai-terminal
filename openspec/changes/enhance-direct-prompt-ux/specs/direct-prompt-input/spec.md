# direct-prompt-input Enhancements

**Change**: enhance-direct-prompt-ux  
**Related Specs**: direct-prompt-input

## ADDED Requirements

### Requirement: Remember last prompt text

The plugin MUST provide an option to persist the last-used prompt text and restore it when the Direct Prompt dialog is opened again.

#### Scenario: Enable prompt persistence

**Given** user opens plugin settings

**When** user navigates to "Direct Prompt" section

**Then** "Remember last prompt" toggle setting should be visible

**And** toggle should default to OFF (disabled)

**And** toggle state should be saved when changed

#### Scenario: Restore saved prompt on dialog open

**Given** "Remember last prompt" setting is enabled

**And** user previously executed a prompt with text "Review this code"

**When** user opens Direct Prompt dialog

**Then** prompt textarea should be pre-filled with "Review this code"

**And** cursor should be positioned at end of text

#### Scenario: Save prompt after execution

**Given** "Remember last prompt" setting is enabled

**When** user enters prompt text "Fix the bug" and clicks Execute

**Then** prompt text should be saved to plugin settings

**And** saved text should persist across Obsidian restarts

#### Scenario: Do not save when setting disabled

**Given** "Remember last prompt" setting is disabled

**When** user enters prompt text and executes

**Then** prompt text should NOT be saved

**And** next dialog open should show empty textarea

### Requirement: Insert placeholder resolved values

The plugin MUST allow users to insert resolved placeholder values directly into the prompt text by clicking placeholder names in the description.

#### Scenario: Display clickable placeholder links

**Given** user opens Direct Prompt dialog

**When** prompt setting description is rendered

**Then** description should show "Available placeholders:" followed by clickable links

**And** each placeholder name (`<file>`, `<path>`, `<relative-path>`, `<dir>`, `<vault>`, `<selection>`) should be styled as clickable link

**And** links should have distinct visual appearance (color, underline) from regular text

#### Scenario: Insert file path at cursor position

**Given** user has file "Notes/daily/2026-01-17.md" open

**And** user has cursor positioned in middle of prompt text "Check "

**When** user clicks `<file>` placeholder link

**Then** resolved file name "2026-01-17.md" should be inserted at cursor position

**And** resulting text should be "Check 2026-01-17.md"

**And** cursor should be positioned after inserted text

#### Scenario: Insert at end when no cursor focus

**Given** user has not clicked in prompt textarea

**And** prompt text is "Review"

**When** user clicks `<path>` placeholder link

**Then** resolved path should be inserted at end of text with preceding space

**And** resulting text should be "Review /path/to/file.md"

#### Scenario: Insert selection text

**Given** user has text "function foo() { return 42; }" selected in editor

**And** prompt text is empty

**When** user clicks `<selection>` placeholder link

**Then** selected text should be inserted into prompt textarea

**And** resulting text should be "function foo() { return 42; }"

#### Scenario: Insert vault path

**Given** user's vault is located at "/home/user/Documents/MyVault"

**And** cursor is at start of prompt

**When** user clicks `<vault>` placeholder link

**Then** vault path should be inserted

**And** resulting text should start with "/home/user/Documents/MyVault"

#### Scenario: Handle unavailable placeholder gracefully

**Given** no text is selected in editor

**When** user clicks `<selection>` placeholder link

**Then** empty string or placeholder message should be inserted

**And** no error should be shown to user

## MODIFIED Requirements

None - all existing requirements remain unchanged.

## REMOVED Requirements

None.
