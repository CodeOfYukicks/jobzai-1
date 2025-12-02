# DEPRECATED - Custom Whiteboard Components

> **Note:** This folder contains the old custom whiteboard implementation that has been replaced by tldraw.
> 
> Date: December 2024
> Replacement: `src/components/interview/TldrawWhiteboard.tsx`

## Why was this deprecated?

The custom whiteboard implementation was replaced with [tldraw](https://tldraw.com/) for the following reasons:

1. **Battle-tested library**: tldraw is a mature, production-ready whiteboard solution
2. **Better UX**: More polished drawing tools, gestures, and interactions
3. **Less maintenance**: No need to maintain custom drawing, pan/zoom, and selection logic
4. **More features**: Export, more shapes, better touch support out of the box

## Files in this folder (no longer in use)

- `Whiteboard.tsx` - Main whiteboard container
- `WhiteboardCanvas.tsx` - Canvas with pan/zoom
- `WhiteboardToolbar.tsx` - Tools sidebar
- `WhiteboardOverlays.tsx` - Overlay components
- `InterviewWhiteboard.tsx` - Integration wrapper
- `objects/` - Sticky notes, text boxes, shapes, connectors, images
- `hooks/` - Pan/zoom, selection, keyboard shortcuts
- `utils/` - Canvas utilities, Firestore sync, geometry

## Related deprecated files

- `src/stores/whiteboardStore.ts` - Zustand store for whiteboard state
- `src/types/whiteboard.ts` - TypeScript types for whiteboard objects

## Keep or delete?

These files are kept for reference. They can be safely deleted if no longer needed.

