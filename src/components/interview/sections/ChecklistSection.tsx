import { memo } from 'react';
import { Check, ChevronDown, ArrowRight } from 'lucide-react';
import { ChecklistItem } from '../../../types/interview';

interface ChecklistSectionProps {
  checklist: ChecklistItem[];
  showAllChecklistItems: boolean;
  newTaskText: string;
  setTab: (tab: 'overview' | 'questions' | 'skills' | 'resources' | 'chat') => void;
  setShowAllChecklistItems: (show: boolean) => void;
  setNewTaskText: (text: string) => void;
  toggleChecklistItem: (id: string) => void;
  addChecklistItem: () => void;
  deleteChecklistItem: (id: string) => void;
  updateChecklistItemText: (id: string, text: string) => void;
}

const ChecklistSection = memo(function ChecklistSection({
  checklist,
  showAllChecklistItems,
  newTaskText,
  setTab,
  setShowAllChecklistItems,
  setNewTaskText,
  toggleChecklistItem,
  addChecklistItem,
  deleteChecklistItem,
  updateChecklistItemText,
}: ChecklistSectionProps) {
  return (
    <article className="group relative overflow-hidden rounded-[14px] bg-[rgba(255,255,255,0.92)] px-6 py-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] ring-1 ring-black/5 backdrop-blur-sm transition-all duration-200 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:bg-neutral-900/70 dark:ring-white/5">
      <header className="mb-5">
        <h2 className="mb-1 text-xl font-semibold text-neutral-900 dark:text-white">Preparation Checklist</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {checklist.filter((c) => c.completed).length}/{checklist.length} tasks completed
        </p>
      </header>
      
      {/* Add Task Input */}
      <div className="mb-5 flex items-center gap-2.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Add a new task..."
            className="w-full rounded-[10px] border border-black/[0.06] bg-white/80 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-white/5 dark:text-neutral-50 dark:placeholder:text-neutral-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') addChecklistItem();
            }}
          />
        </div>
        <button
          type="button"
          onClick={addChecklistItem}
          className="inline-flex items-center justify-center rounded-[10px] bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-purple-700 transition-colors"
        >
          Add
        </button>
      </div>
      
      {/* Checklist Items */}
      <div className="space-y-2">
        {(showAllChecklistItems ? checklist : checklist.slice(0, 5)).map((item) => (
          <div
            key={item.id}
            className={[
              'flex items-center rounded-[10px] px-3 py-2.5 text-sm transition-all border',
              item.priority 
                ? 'border-purple-200/50 bg-purple-50/60 dark:border-purple-800/50 dark:bg-purple-900/20'
                : item.completed
                  ? 'border-black/[0.04] bg-neutral-50/60 dark:border-white/5 dark:bg-neutral-900/40'
                  : 'border-black/[0.04] bg-white/60 dark:border-white/5 dark:bg-white/5 hover:bg-white/90 dark:hover:bg-white/10',
            ].join(' ')}
          >
            <button 
              type="button"
              onClick={() => toggleChecklistItem(item.id)}
              className={[
                'mr-3 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[6px] border-2 transition-all',
                item.completed 
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-neutral-300 dark:border-neutral-600 hover:border-purple-500 dark:hover:border-purple-500',
              ].join(' ')}
            >
              {item.completed && <Check className="h-3 w-3" />}
            </button>
            <input
              value={item.task}
              onChange={(e) => updateChecklistItemText(item.id, e.target.value)}
              className={[
                'flex-1 bg-transparent text-sm outline-none',
                item.completed 
                  ? 'text-neutral-500 line-through dark:text-neutral-400'
                  : 'text-neutral-800 dark:text-neutral-100',
              ].join(' ')}
            />
            <div className="ml-2 flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setTab(item.section)} 
                className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] font-medium text-neutral-700 hover:bg-black/[0.08] dark:bg-white/10 dark:text-neutral-200 dark:hover:bg-white/20 transition-colors"
              >
                Go
              </button>
              <button
                type="button"
                onClick={() => deleteChecklistItem(item.id)}
                className="rounded-full bg-red-50/80 px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {checklist.length > 5 && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setShowAllChecklistItems(!showAllChecklistItems)}
              className="inline-flex items-center justify-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700 dark:text-purple-300 dark:hover:text-purple-200 transition-colors"
            >
              {showAllChecklistItems ? (
                <>
                  <ChevronDown className="h-3 w-3 rotate-180" />
                  Show less
                </>
              ) : (
                <>
                  View all {checklist.length} tasks
                  <ArrowRight className="h-3 w-3" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </article>
  );
});

export default ChecklistSection;

