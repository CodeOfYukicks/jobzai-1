# JobDetailPanel - Quick Start Guide

## 🚀 Get Running in 60 Seconds

### Step 1: Add Demo Route (10 seconds)

```tsx
// In your App.tsx or router config
import JobDetailPanelDemo from './components/job-detail-panel/demo';

<Route path="/demo/job-panel" element={<JobDetailPanelDemo />} />
```

### Step 2: Start Dev Server (5 seconds)

```bash
npm run dev
```

### Step 3: Visit Demo (5 seconds)

```
http://localhost:5173/demo/job-panel
```

### Step 4: Click Any Job Card (40 seconds)

✨ **Watch the magic happen!**

---

## 📝 Basic Usage

### Import

```tsx
import { JobDetailPanel } from './components/job-detail-panel';
import { JobApplication } from './types/job';
```

### State

```tsx
const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
const [isPanelOpen, setIsPanelOpen] = useState(false);
```

### Handlers

```tsx
// Open panel
const handleJobClick = (job: JobApplication) => {
  setSelectedJob(job);
  setIsPanelOpen(true);
};

// Update job
const handleUpdate = async (updates: Partial<JobApplication>) => {
  const jobRef = doc(db, 'users', userId, 'applications', selectedJob.id);
  await updateDoc(jobRef, { ...updates, updatedAt: new Date().toISOString() });
  toast.success('Updated!');
};

// Delete job
const handleDelete = async () => {
  const jobRef = doc(db, 'users', userId, 'applications', selectedJob.id);
  await deleteDoc(jobRef);
  toast.success('Deleted!');
  setIsPanelOpen(false);
};
```

### JSX

```tsx
<JobDetailPanel
  job={selectedJob}
  open={isPanelOpen}
  onClose={() => setIsPanelOpen(false)}
  onUpdate={handleUpdate}
  onDelete={handleDelete}
/>
```

---

## 🎯 Integration Points

### CalendarView.tsx
```tsx
// Replace EventModal with JobDetailPanel
const handleSelectEvent = (event) => {
  setSelectedJob(event.resource.application || event.resource);
  setIsPanelOpen(true);
};
```

### Kanban Board
```tsx
// On card click
<JobCard onClick={() => handleJobClick(job)} />
```

### Search Results
```tsx
// On result click
<SearchResult onClick={() => handleJobClick(job)} />
```

---

## 🎨 Quick Customization

### Colors
```tsx
// Find and replace in JobDetailPanel.tsx
'blue' → 'purple'    // Your brand color
'gray' → 'slate'     // Your neutral
```

### Width
```tsx
// In JobDetailPanel.tsx, Dialog.Panel className
max-w-6xl → max-w-5xl  // Narrower
max-w-6xl → max-w-7xl  // Wider
```

### Animation
```tsx
// In Transition.Child
duration-500 → duration-300  // Faster
duration-500 → duration-700  // Slower
```

---

## ⚡ Props Reference

```tsx
interface JobDetailPanelProps {
  job: JobApplication | null;           // Job to display
  open: boolean;                         // Show/hide panel
  onClose: () => void;                   // Close handler
  onUpdate?: (updates) => Promise<void>; // Update handler (optional)
  onDelete?: () => Promise<void>;        // Delete handler (optional)
}
```

---

## 🎯 Component Structure

```
JobDetailPanel
├── Header (sticky)
│   ├── Job title + company
│   ├── Quick actions (edit, delete, link)
│   ├── Status badge
│   └── Tabs (overview, interviews, activity)
│
├── Left Column (70%)
│   ├── Job Description
│   ├── Notes
│   ├── Contact Info
│   ├── Interviews (tab)
│   └── Activity Timeline (tab)
│
└── Right Column (30%)
    ├── Status Card
    ├── Key Details
    ├── Quick Stats
    └── Metadata
```

---

## 🔑 Key Features

- ✅ Slide-in from right (smooth 500ms animation)
- ✅ Backdrop blur effect
- ✅ Sticky header with actions
- ✅ Status selector dropdown
- ✅ Inline edit mode
- ✅ Three content tabs
- ✅ Interview cards
- ✅ Activity timeline
- ✅ Quick stats sidebar
- ✅ Fully responsive
- ✅ Keyboard accessible
- ✅ TypeScript typed

---

## 📦 Files Created

```
src/components/job-detail-panel/
├── JobDetailPanel.tsx       # Main component
├── StatusBadge.tsx          # Status dropdown
├── PropertyRow.tsx          # Property display
├── SectionCard.tsx          # Section wrapper
├── TimelineItem.tsx         # Timeline item
├── InterviewCard.tsx        # Interview card
├── index.ts                 # Exports
├── demo.tsx                 # Demo page
├── example-usage.tsx        # Examples
├── README.md                # Full docs
├── FEATURES.md              # Feature showcase
└── QUICK_START.md           # This file
```

---

## 🎓 Learn More

- **Full Documentation**: `README.md`
- **Feature Showcase**: `FEATURES.md`
- **Integration Examples**: `example-usage.tsx`
- **Implementation Guide**: `/IMPLEMENTATION_GUIDE.md`
- **Project Summary**: `/JOB_DETAIL_PANEL_SUMMARY.md`

---

## ✅ Checklist

- [ ] Demo works at `/demo/job-panel`
- [ ] Imported component into your view
- [ ] Added state management
- [ ] Created update handler
- [ ] Created delete handler
- [ ] Tested with real data
- [ ] Customized colors/branding
- [ ] Tested on mobile
- [ ] Tested keyboard navigation

---

## 🆘 Need Help?

**Panel doesn't open?**
```tsx
// Check that open prop is true
console.log('isPanelOpen:', isPanelOpen);
```

**Dates not showing?**
```tsx
// Dates must be ISO strings
appliedDate: new Date().toISOString()
```

**Styling broken?**
```tsx
// Check TailwindCSS config includes backdrop-blur
```

**TypeScript errors?**
```tsx
// Check imports from './types/job'
import { JobApplication } from './types/job';
```

---

## 🎉 You're Ready!

That's it! You now have a premium job detail panel ready to use.

**Start with the demo, then integrate into your views.**

Happy coding! ✨

---

## 💡 Pro Tip

Use **CMD/CTRL + K** in your IDE to quickly search for files:
- Type "JobDetailPanel" to find the main component
- Type "demo" to see the demo with sample data
- Type "example" to see integration patterns

---

*Need the full picture? Check `/IMPLEMENTATION_GUIDE.md`*

