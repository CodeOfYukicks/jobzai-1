# Task: Fix Interview Notes Drag and Interaction Issues

## Status
- [x] Fix drag issue: Single click triggers drag (should only drag on move) <!-- id: 0 -->
- [x] Fix double click issue: Double click to edit note not working <!-- id: 1 -->

## Notes
- Modified `handleDragStart` to delay `isDragging` state until actual movement occurs (handled in `handleDrag`).
- Added `onDrag` handler to `Draggable` component.
- Replaced manual double-click detection with native `onDoubleClick` event handler on the note content div.
- **Update**: Reverted to manual timestamp-based double-click detection for better reliability with `react-draggable`.
- **Update**: Implemented distance-based drag detection (threshold > 5px) to prevent accidental drag state on clicks.
- **Refinement**: Increased drag threshold to 10px.
- **Refinement**: Switched to `onMouseDownCapture` with `e.detail === 2` to intercept double-clicks before `react-draggable` swallows them.
- **Final Fix**: Implemented fully controlled drag (updating state on drag) and manual double-click detection in `handleDragStop` (bypassing event listeners entirely).
