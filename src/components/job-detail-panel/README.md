# JobDetailPanel - Premium Job Application Slide-Over

A beautifully crafted, Apple/Notion-inspired slide-over panel for displaying job application details.

## Features

- 🎨 **Premium Design**: Apple-inspired spacing, blur effects, and smooth animations
- 📱 **Responsive Layout**: Two-column layout that adapts to screen sizes
- 🔄 **Smooth Transitions**: HeadlessUI Dialog with slide-in animations
- ✏️ **Inline Editing**: Edit job details directly in the panel
- 📊 **Multiple Views**: Tabs for Overview, Interviews, and Activity timeline
- 🎯 **Status Management**: Easy status updates with dropdown selector
- 📈 **Quick Stats**: At-a-glance metrics and key information

## Installation

Ensure you have the required dependencies:

```bash
npm install @headlessui/react date-fns lucide-react framer-motion
```

## Usage

### Basic Example

```tsx
import { useState } from 'react';
import { JobDetailPanel } from './components/job-detail-panel';
import { JobApplication } from './types/job';

function MyComponent() {
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleJobClick = (job: JobApplication) => {
    setSelectedJob(job);
    setIsPanelOpen(true);
  };

  const handleUpdate = async (updates: Partial<JobApplication>) => {
    // Your update logic here (e.g., Firestore update)
    console.log('Updating job:', updates);
  };

  const handleDelete = async () => {
    // Your delete logic here
    console.log('Deleting job');
  };

  return (
    <>
      {/* Your job cards or kanban board */}
      <div onClick={() => handleJobClick(someJob)}>
        Job Card
      </div>

      {/* The slide-over panel */}
      <JobDetailPanel
        job={selectedJob}
        open={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </>
  );
}
```

### With Firestore Integration

```tsx
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

const handleUpdate = async (updates: Partial<JobApplication>) => {
  if (!selectedJob) return;
  
  try {
    const jobRef = doc(db, 'users', userId, 'applications', selectedJob.id);
    await updateDoc(jobRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    toast.success('Job updated successfully');
  } catch (error) {
    console.error('Error updating job:', error);
    toast.error('Failed to update job');
  }
};

const handleDelete = async () => {
  if (!selectedJob) return;
  
  try {
    const jobRef = doc(db, 'users', userId, 'applications', selectedJob.id);
    await deleteDoc(jobRef);
    toast.success('Job deleted successfully');
  } catch (error) {
    console.error('Error deleting job:', error);
    toast.error('Failed to delete job');
  }
};
```

## Props

### JobDetailPanel

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `job` | `JobApplication \| null` | Yes | The job application to display |
| `open` | `boolean` | Yes | Controls panel visibility |
| `onClose` | `() => void` | Yes | Callback when panel is closed |
| `onUpdate` | `(updates: Partial<JobApplication>) => Promise<void>` | No | Callback for updating job |
| `onDelete` | `() => Promise<void>` | No | Callback for deleting job |

## Component Structure

```
JobDetailPanel/
├── JobDetailPanel.tsx      # Main panel component
├── StatusBadge.tsx         # Status selector with dropdown
├── PropertyRow.tsx         # Property display row with icon
├── SectionCard.tsx         # Content section container
├── TimelineItem.tsx        # Activity timeline item
├── InterviewCard.tsx       # Interview detail card
├── index.ts                # Export barrel
└── README.md               # This file
```

## Design Principles

### Spacing
- Uses generous Apple-style spacing (px-8, py-6, gap-6)
- Consistent padding throughout sections
- Airy layouts for improved readability

### Colors & Shadows
- Subtle backdrop blur for overlay (`backdrop-blur-md`)
- Soft shadows for depth (`shadow-2xl`, `shadow-sm`)
- Gray-50 cards with rounded corners
- Status-specific color coding

### Typography
- Clear hierarchy with font weights (semibold for headings)
- Tracking adjustments for polish (`tracking-tight`)
- Consistent text sizes (text-sm, text-base)

### Interactions
- Smooth transitions on all interactive elements
- Hover states with color/shadow changes
- Active states with scale effects
- Disabled states with opacity

## Customization

### Custom Status Colors

Edit the `statusConfig` in `JobDetailPanel.tsx`:

```tsx
const statusConfig = {
  applied: { 
    icon: Circle, 
    color: 'text-blue-500', 
    bg: 'bg-blue-50', 
    border: 'border-blue-200' 
  },
  // Add your custom statuses...
};
```

### Custom Interview Types

Edit `interviewTypeConfig` in `InterviewCard.tsx`:

```tsx
const interviewTypeConfig = {
  technical: { label: 'Technical', color: 'bg-blue-100 text-blue-700' },
  // Add your custom types...
};
```

## Best Practices

1. **Performance**: The panel only renders when `open` is true
2. **Accessibility**: Uses HeadlessUI for proper ARIA attributes
3. **TypeScript**: Fully typed for safety and autocomplete
4. **Mobile**: Responsive design adapts to smaller screens
5. **Loading States**: Shows loading indicator during save operations

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT

