import { useEffect } from 'react';
import { useWhiteboardStore } from '../../../stores/whiteboardStore';

export function useKeyboardShortcuts() {
  const {
    undo,
    redo,
    deleteSelected,
    copySelected,
    paste,
    selectAll,
    clearSelection,
    selectedIds,
    tool,
    setTool,
  } = useWhiteboardStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // Delete selected objects
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          deleteSelected();
        }
        return;
      }

      // Copy (Ctrl/Cmd + C)
      if (ctrlOrCmd && e.key === 'c') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          copySelected();
        }
        return;
      }

      // Paste (Ctrl/Cmd + V)
      if (ctrlOrCmd && e.key === 'v') {
        e.preventDefault();
        paste();
        return;
      }

      // Select All (Ctrl/Cmd + A)
      if (ctrlOrCmd && e.key === 'a') {
        e.preventDefault();
        selectAll();
        return;
      }

      // Undo (Ctrl/Cmd + Z)
      if (ctrlOrCmd && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo (Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y)
      if (
        (ctrlOrCmd && e.shiftKey && e.key === 'z') ||
        (ctrlOrCmd && e.key === 'y')
      ) {
        e.preventDefault();
        redo();
        return;
      }

      // Tool shortcuts (only when not in input)
      if (!ctrlOrCmd && !e.altKey) {
        switch (e.key) {
          case 'v':
            setTool('pointer');
            break;
          case 'n':
            setTool('sticky');
            break;
          case 't':
            setTool('text');
            break;
          case 'r':
            setTool('rectangle');
            break;
          case 'c':
            setTool('circle');
            break;
          case 'l':
            setTool('line');
            break;
          case 'a':
            setTool('arrow');
            break;
          case 'i':
            setTool('image');
            break;
          case 'Escape':
            clearSelection();
            setTool('pointer');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    undo,
    redo,
    deleteSelected,
    copySelected,
    paste,
    selectAll,
    clearSelection,
    selectedIds,
    tool,
    setTool,
  ]);
}

