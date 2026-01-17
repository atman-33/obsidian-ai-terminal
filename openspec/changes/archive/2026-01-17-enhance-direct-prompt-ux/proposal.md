# Proposal: Enhance Direct Prompt UX

## Summary
Enhance Direct Prompt user experience with three improvements:
1. Settings reset functionality - allow users to restore default configuration
2. Prompt persistence - optionally remember last-used prompt text
3. Placeholder value insertion - clickable placeholders that insert resolved values

## Background
Current Direct Prompt modal provides basic functionality but lacks convenience features that would improve user workflow. Users must manually re-enter prompts, cannot easily insert context values, and have no way to reset settings without reinstalling the plugin.

## Goals
- Provide settings reset mechanism for troubleshooting and fresh starts
- Reduce repetitive typing by remembering recent prompts
- Streamline placeholder usage with direct value insertion

## Non-Goals
- Full prompt history or template library (future consideration)
- Advanced text editing features (syntax highlighting, autocomplete)
- Placeholder preview or validation

## Success Criteria
- Users can reset all settings to defaults with one button click
- Users can opt-in to prompt persistence and see last prompt on dialog open
- Users can click placeholder text to insert actual resolved values at cursor position

## Impact
- **User Experience**: Significantly improved workflow efficiency
- **Code Complexity**: Minimal - extends existing settings and modal logic
- **Testing**: Unit tests for settings reset, integration tests for modal interaction
- **Documentation**: Update user guide with new features

## Alternatives Considered
### Settings Reset
- **Alternative A**: Reset individual setting categories (agents only, commands only, etc.)
  - **Rejected**: Adds UI complexity for edge case usage
  
### Prompt Persistence
- **Alternative A**: Always persist prompts without opt-in
  - **Rejected**: Privacy concern - some users may not want prompts saved
- **Alternative B**: Full prompt history with dropdown
  - **Rejected**: Scope creep - keep initial implementation simple

### Placeholder Insertion
- **Alternative A**: Insert placeholder syntax (`<file>`) instead of resolved values
  - **Rejected**: Less useful - users already see placeholder syntax in description
- **Alternative B**: Separate button row for each placeholder
  - **Rejected**: Takes more vertical space, less elegant than inline links

## Rollout Plan
1. Implement settings reset with confirmation dialog
2. Add prompt persistence setting and storage logic
3. Implement clickable placeholder links with value resolution
4. Update tests
5. Update user documentation
6. Release as minor version update

## Open Questions
None - all design decisions confirmed with user.
