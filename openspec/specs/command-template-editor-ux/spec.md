# command-template-editor-ux Specification

## Purpose
TBD - created by archiving change improve-command-editor-ux. Update Purpose after archive.
## Requirements
### Requirement: Warn users before discarding unsaved changes

The command template editor MUST warn users before discarding unsaved changes to prevent accidental data loss.

#### Scenario: Display confirmation when closing with unsaved changes

**Given** user has opened the command template editor
**And** user has modified one or more fields (name, template, prompt, agent, enabled status)
**When** user attempts to close the modal via × button or Cancel button
**Then** a confirmation dialog MUST be displayed
**And** dialog message MUST warn "You have unsaved changes. Are you sure you want to close without saving?"
**And** dialog MUST provide two options: "Close Anyway" and "Keep Editing"
**And** "Keep Editing" MUST be the default/focused option

#### Scenario: Close without confirmation when no changes made

**Given** user has opened the command template editor
**And** user has NOT modified any fields
**When** user clicks Cancel or × button
**Then** the modal MUST close immediately
**And** NO confirmation dialog MUST be shown

#### Scenario: Discard changes when confirmed

**Given** user has unsaved changes
**And** confirmation dialog is displayed
**When** user clicks "Close Anyway"
**Then** the modal MUST close
**And** all changes MUST be discarded
**And** original template data MUST remain unchanged

#### Scenario: Keep editing when canceling discard

**Given** user has unsaved changes
**And** confirmation dialog is displayed
**When** user clicks "Keep Editing" or closes the confirmation dialog
**Then** the confirmation dialog MUST close
**And** the editor modal MUST remain open
**And** all field values MUST be preserved

#### Scenario: No confirmation after successful save

**Given** user has made changes to a template
**When** user clicks "Save" button
**And** template is saved successfully
**And** user immediately closes the modal
**Then** NO confirmation dialog MUST be shown
**And** modal MUST close immediately

### Requirement: Provide comfortable input areas for template editing

The command template editor MUST use vertical layout (label/description above, input below) for multi-line text fields to maximize input area width and usability.

#### Scenario: Command template uses vertical layout with full width

**Given** user opens the command template editor (new or edit mode)
**When** user views the "Command template" field
**Then** the field label and description MUST appear above the textarea (not beside it)
**And** the textarea MUST span the full available width of the modal (~100% width)
**And** the textarea MUST display at least 4 rows of text
**And** the textarea SHOULD allow vertical resizing if user needs more space

#### Scenario: Default prompt uses vertical layout with full width

**Given** user opens the command template editor
**When** user views the "Default prompt (optional)" field
**Then** the field label and description MUST appear above the textarea (not beside it)
**And** the textarea MUST span the full available width of the modal (~100% width)
**And** the textarea MUST display at least 6 rows of text
**And** the textarea SHOULD allow vertical resizing if user needs more space
**And** user SHOULD be able to view and edit multi-line prompts without requiring scrolling for typical use cases (up to ~6 lines)

#### Scenario: Short input fields remain in horizontal layout

**Given** user opens the command template editor
**When** user views short input fields (Command ID, Display name, Default agent, Enabled)
**Then** these fields MUST remain in horizontal layout (label left, input right)
**And** this layout provides efficient use of space for single-line inputs

#### Scenario: Layout adapts to window size

**Given** user opens the command template editor
**When** modal is displayed on different window sizes (narrow to wide)
**Then** vertical layout fields (Command template, Default prompt) MUST remain readable and usable
**And** full-width textareas MUST adapt to available modal width
**And** layout MUST not break or overlap on narrow windows

---

### Requirement: Edit buttons in sticky header

The editor modal MUST provide consistent access to primary action buttons (Save, Cancel) regardless of scroll position.

#### Scenario: Buttons located in header

**Given** user opens the command template editor
**When** the modal appears
**Then** the Save and Cancel buttons MUST be located in the modal header
**And** buttons MUST be positioned to the right of the modal title

#### Scenario: Header remains visible while scrolling

**Given** user has a command template with long content requiring scrolling
**When** user scrolls down the modal content
**Then** the header containing the title and buttons MUST remain fixed (sticky) at the top
**And** buttons MUST remain clickable at all times

