# Bug Fix: BubbleMenu Import Error

## Issue
```
TableBubbleMenu.tsx:1 Uncaught SyntaxError: The requested module '/node_modules/.vite/deps/@tiptap_react.js?v=5aa3d38b' does not provide an export named 'BubbleMenu'
```

## Root Cause
The `BubbleMenu` component was being imported from `@tiptap/react`, but it's actually exported from `@tiptap/extension-bubble-menu`.

## Solution

### 1. Fixed Import in TableBubbleMenu.tsx

**Before:**
```typescript
import { BubbleMenu, Editor } from '@tiptap/react';
```

**After:**
```typescript
import { BubbleMenu } from '@tiptap/extension-bubble-menu';
import { Editor } from '@tiptap/react';
```

### 2. Added BubbleMenu Extension to NotionEditor.tsx

**Added import:**
```typescript
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
```

**Added to extensions array:**
```typescript
extensions: [
  StarterKit,
  Placeholder.configure({...}),
  BubbleMenuExtension,  // Added this
  MentionEmbed,
  EnhancedTable.configure({...}),
  // ... rest of extensions
]
```

## Files Modified
1. `src/components/notion-editor/menus/TableBubbleMenu.tsx` - Fixed import
2. `src/components/notion-editor/NotionEditor.tsx` - Added extension and import

## Verification
- ✅ No linting errors
- ✅ Correct import from `@tiptap/extension-bubble-menu`
- ✅ BubbleMenuExtension added to editor extensions
- ✅ Package already installed in package.json (`@tiptap/extension-bubble-menu": "^3.11.1"`)

## Status
🟢 **FIXED** - The BubbleMenu import error has been resolved.






