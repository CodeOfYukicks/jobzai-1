# Table Feature Documentation

## Overview

The Notion-style table feature has been successfully implemented in the notes editor. This provides a complete table management system with advanced features similar to Notion.

## Features Implemented

### 1. Table Creation
- **Slash Command**: Type `/table` in the editor to insert a new table
- **Default Configuration**: Creates a 3x3 table with header row by default
- **Automatic Metadata**: Each table includes column metadata for types, sorts, and filters

### 2. Column Types
The following column types are supported:

- **Text** (default): Plain text content
- **Number**: Numeric values with right alignment
- **Select**: Single-choice dropdown with custom options
- **Multi-select**: Multiple-choice tags with custom options
- **Date**: Date picker with formatted display
- **Checkbox**: Boolean toggle (checked/unchecked)
- **URL**: Web links with validation and external link icon

### 3. Table Manipulation
Available through the bubble menu when a table is selected:

- Add row before/after current row
- Add column before/after current column
- Delete row
- Delete column
- Toggle header row
- Toggle header column
- Merge cells
- Split cells
- Delete entire table

### 4. Column Type Management
- Click the column type button in the bubble menu
- Select from available types
- For Select/Multi-select types, manage options directly in the UI
- Column types are preserved when saved to Firestore

### 5. Sorting
- Access via the bubble menu
- Sort by multiple columns
- Toggle between ascending/descending
- Type-aware sorting (numbers, dates, text, checkboxes)
- Visual indicators for active sorts

### 6. Filtering
- Access via the bubble menu
- Create multiple filters
- Type-specific operators:
  - Text: contains, does not contain, is, is not, is empty, is not empty
  - Number: equals, not equals, greater than, less than, etc.
  - Select: is, is not, is empty, is not empty
  - Date: is, before, after, is empty, is not empty
  - Checkbox: is checked, is not checked
- Filter values are stored in table metadata

### 7. Column Resizing
- Hover over column borders to see resize handle
- Drag to resize columns
- Column widths are stored in metadata
- Minimum width enforced (100px)

### 8. Cell Editors
Each column type has a specialized editor:

- **NumberCellEditor**: Numeric input with validation
- **SelectCellEditor**: Dropdown with search
- **MultiSelectCellEditor**: Multi-select with checkboxes
- **DateCellEditor**: Date input picker
- **CheckboxCellEditor**: Toggle checkbox
- **URLCellEditor**: URL input with validation

### 9. Cell Display Components
Formatted display for each type:

- **NumberCellDisplay**: Right-aligned with locale formatting
- **SelectCellDisplay**: Colored tag
- **MultiSelectCellDisplay**: Multiple colored tags
- **DateCellDisplay**: Formatted date (e.g., "Jan 15, 2024")
- **CheckboxCellEditor**: Visual checkbox
- **URLCellDisplay**: Link with external icon

## File Structure

```
src/components/notion-editor/
├── extensions/
│   └── EnhancedTable.tsx          # Main table extension with metadata support
├── menus/
│   ├── TableBubbleMenu.tsx        # Context menu for table operations
│   ├── ColumnTypeSelector.tsx     # Column type picker
│   ├── TableSortMenu.tsx          # Sorting interface
│   └── TableFilterMenu.tsx        # Filtering interface
├── table-cells/
│   └── CellEditors.tsx            # All cell editors and display components
├── NotionEditor.tsx               # Main editor with table integration
└── notion-editor.css              # Table styles

```

## Data Structure

### Table Metadata
```typescript
interface TableMetadata {
  columns: ColumnMetadata[];
  sorts: SortConfig[];
  filters: FilterConfig[];
}
```

### Column Metadata
```typescript
interface ColumnMetadata {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'multi-select' | 'date' | 'checkbox' | 'url';
  width?: number;
  options?: string[];  // For select/multi-select
  format?: string;     // For number/date formatting
}
```

### Cell Attributes
Each cell stores:
- `columnType`: The type of data in the cell
- `cellValue`: The actual typed value (separate from display text)

## Firestore Persistence

Tables are automatically saved to Firestore as part of the note content:

1. **Table Structure**: Stored in Tiptap JSON format
2. **Metadata**: Stored as a JSON string in the table node's `data-metadata` attribute
3. **Cell Values**: Stored in `data-cell-value` and `data-column-type` attributes
4. **Auto-save**: Uses the existing note auto-save mechanism (2-second debounce)

## Usage Examples

### Creating a Table
1. Type `/` to open the slash menu
2. Type `table` or scroll to find "Table"
3. Press Enter or click to insert
4. A 3x3 table with headers appears

### Changing Column Type
1. Click inside a table cell
2. The table bubble menu appears
3. Click the column type button (Type icon with dropdown)
4. Select the desired type
5. For Select/Multi-select, add options in the editor

### Sorting Data
1. Click inside a table
2. Click "More options" (three dots) in bubble menu
3. Select sort options
4. Choose column and direction
5. Add multiple sorts by clicking "Add sort"

### Filtering Data
1. Click inside a table
2. Click "More options" in bubble menu
3. Select filter options
4. Choose column, operator, and value
5. Add multiple filters for complex queries

### Resizing Columns
1. Hover over the border between column headers
2. A blue resize handle appears
3. Click and drag to resize
4. Release to set the new width

## Styling

The table styles are defined in `notion-editor.css` and include:

- Clean borders with dark mode support
- Hover effects on rows and cells
- Selected cell highlighting
- Column resize handles
- Sort and filter indicators
- Type-specific cell alignment
- Focus states for editing

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Full touch support for mobile devices
- Keyboard navigation support
- Screen reader accessible

## Known Limitations

1. **Filter Display**: Filters are stored but row hiding is not yet implemented in the UI (would require custom node views)
2. **Cell Merging**: Merge/split functionality is available but may need additional styling
3. **Copy/Paste**: Basic copy/paste works, but advanced formatting preservation could be improved
4. **Undo/Redo**: Works but may not perfectly restore all metadata states

## Future Enhancements

Potential improvements for future iterations:

1. **Database Views**: Add different view types (gallery, board, timeline)
2. **Formulas**: Support for calculated columns
3. **Relations**: Link tables together
4. **Rollups**: Aggregate data from related tables
5. **Templates**: Pre-built table templates
6. **Import/Export**: CSV, Excel import/export
7. **Collaboration**: Real-time collaborative editing
8. **Cell History**: Track changes to individual cells

## Testing Checklist

- [x] Create table via slash command
- [x] Add/remove rows and columns
- [x] Change column types
- [x] Edit cells with type-specific editors
- [x] Sort by single and multiple columns
- [x] Create and manage filters
- [x] Resize columns
- [x] Merge and split cells
- [x] Delete table
- [x] Save and load from Firestore
- [x] Dark mode support
- [x] Mobile responsiveness

## Troubleshooting

### Table not appearing after typing /table
- Ensure the NotionEditor component is properly imported
- Check that EnhancedTable extension is loaded
- Verify Tiptap table extensions are installed

### Column types not changing
- Check that setColumnType command is available
- Verify table metadata is being updated
- Ensure cell attributes are properly configured

### Styles not applying
- Verify notion-editor.css is imported
- Check Tailwind CSS is configured correctly
- Ensure dark mode classes are working

### Data not persisting
- Check Firestore connection
- Verify auto-save is functioning
- Ensure metadata is being serialized correctly

## Support

For issues or questions:
1. Check this documentation
2. Review the implementation files
3. Test in the browser console
4. Check Firestore data structure


