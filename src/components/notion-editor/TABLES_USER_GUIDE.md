# 📊 Tables User Guide

## Quick Start

### Creating a Table

1. **Open a note** in the Notes section
2. **Type `/`** to open the slash command menu
3. **Type `table`** or scroll to find "Table"
4. **Press Enter** or click to insert
5. A 3x3 table with headers will appear

### Basic Editing

- **Click any cell** to start editing
- **Press Tab** to move to the next cell
- **Press Shift+Tab** to move to the previous cell
- **Type normally** to enter text

## Table Operations

### Adding Rows & Columns

When you click inside a table, a **bubble menu** appears above it with these options:

- **↑ Arrow Up**: Add row before current row
- **↓ Arrow Down**: Add row after current row
- **← Arrow Left**: Add column before current column
- **→ Arrow Right**: Add column after current column

### Deleting Rows & Columns

- **🗑️ Trash (vertical)**: Delete current row
- **🗑️ Trash (horizontal)**: Delete current column

### More Options

Click the **⋮ (three dots)** button to access:

- **Toggle header row**: Make first row a header
- **Toggle header column**: Make first column a header
- **Merge cells**: Combine selected cells
- **Split cell**: Divide a merged cell
- **Delete table**: Remove the entire table

## Column Types

### Changing Column Type

1. Click in any cell of the column
2. In the bubble menu, click the **Type** button (with dropdown arrow)
3. Select a column type from the menu

### Available Types

#### 📝 Text (Default)
- Plain text content
- No special formatting
- Best for: Names, descriptions, notes

#### 🔢 Number
- Numeric values only
- Right-aligned automatically
- Best for: Prices, quantities, scores

#### 📋 Select
- Single choice from a list
- Click to manage options
- Displays as a colored tag
- Best for: Status, category, priority

#### 🏷️ Multi-select
- Multiple choices from a list
- Click to manage options
- Displays as multiple colored tags
- Best for: Tags, skills, categories

#### 📅 Date
- Date picker
- Formatted display (e.g., "Jan 15, 2024")
- Best for: Deadlines, birthdays, events

#### ☑️ Checkbox
- True/false toggle
- Click to check/uncheck
- Best for: Completed status, yes/no

#### 🔗 URL
- Web links
- Validation included
- Opens in new tab
- Best for: Websites, resources, references

## Advanced Features

### Sorting

1. Click inside the table
2. Click **⋮ (three dots)** → **Sort**
3. Choose a column to sort by
4. Click the arrow to toggle ascending/descending
5. Add multiple sorts for complex ordering

**Example**: Sort by "Priority" (ascending), then by "Date" (descending)

### Filtering

1. Click inside the table
2. Click **⋮ (three dots)** → **Filter**
3. Click **Add filter**
4. Choose:
   - **Column**: Which column to filter
   - **Operator**: How to compare (contains, equals, etc.)
   - **Value**: What to compare against
5. Click **Apply**

**Filter Operators by Type**:

- **Text**: Contains, Does not contain, Is, Is not, Is empty, Is not empty
- **Number**: Equals, Not equals, Greater than, Less than, etc.
- **Select**: Is, Is not, Is empty, Is not empty
- **Date**: Is, Before, After, Is empty, Is not empty
- **Checkbox**: Is checked, Is not checked

### Resizing Columns

1. Hover over the border between column headers
2. A blue resize handle appears
3. Click and drag left or right
4. Release to set the new width

## Tips & Tricks

### Keyboard Shortcuts

- **Tab**: Move to next cell
- **Shift+Tab**: Move to previous cell
- **Enter**: Move to cell below (in same column)
- **Escape**: Exit cell editing

### Best Practices

1. **Use Headers**: Toggle header row for clarity
2. **Choose Right Types**: Select appropriate column types for your data
3. **Sort Wisely**: Use multiple sorts for complex data
4. **Filter Smart**: Combine filters for precise results
5. **Resize Columns**: Adjust widths for better readability

### Common Use Cases

#### 📋 Task List
- Columns: Task (Text), Status (Select), Priority (Select), Due Date (Date), Done (Checkbox)
- Sort by: Priority (desc), Due Date (asc)
- Filter: Done = Not checked

#### 👥 Contact List
- Columns: Name (Text), Email (URL), Phone (Text), Category (Multi-select)
- Sort by: Name (asc)
- Filter: Category contains "Client"

#### 💰 Budget Tracker
- Columns: Item (Text), Amount (Number), Date (Date), Category (Select), Paid (Checkbox)
- Sort by: Date (desc)
- Filter: Paid = Checked

#### 📚 Reading List
- Columns: Title (Text), Author (Text), Rating (Number), Status (Select), Notes (Text)
- Sort by: Rating (desc)
- Filter: Status = "Want to Read"

## Troubleshooting

### Table not appearing after /table
- Make sure you're in edit mode
- Try typing `/` again and selecting from the menu
- Refresh the page if needed

### Can't change column type
- Click inside a cell in that column first
- Make sure the bubble menu is visible
- Try clicking the Type button again

### Sorting not working
- Ensure you have data in the column
- Check that the column type is correct
- Try clearing all sorts and starting fresh

### Filters not showing results
- Check your filter conditions
- Verify the column type matches the operator
- Try "Clear all" and create filters again

## Saving & Syncing

- **Auto-save**: Tables save automatically every 2 seconds
- **Manual save**: Changes are saved when you click outside the table
- **Cloud sync**: All data syncs to Firestore
- **Offline**: Changes queue and sync when online

## Mobile Usage

- **Tap** to edit cells
- **Long press** for context menu
- **Pinch** to zoom table
- **Swipe** to scroll horizontally
- All features work on mobile!

## Accessibility

- **Screen readers**: Full support for table navigation
- **Keyboard only**: Complete keyboard navigation
- **High contrast**: Works in dark mode
- **Focus indicators**: Clear visual focus states

## Need Help?

- Check the [Technical Documentation](./TABLE_FEATURE_README.md)
- Review the [Implementation Summary](../../TABLES_IMPLEMENTATION_SUMMARY.md)
- Test in a new note to isolate issues
- Check browser console for errors

---

**Enjoy creating powerful tables in your notes! 🎉**






