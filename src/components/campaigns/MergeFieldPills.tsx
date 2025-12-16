import { User, Building2, Briefcase, MapPin } from 'lucide-react';

interface MergeFieldPillsProps {
  onInsert: (field: string) => void;
}

interface MergeField {
  name: string;
  label: string;
  icon: typeof User;
}

const MERGE_FIELDS: MergeField[] = [
  { name: '{{firstName}}', label: 'First', icon: User },
  { name: '{{lastName}}', label: 'Last', icon: User },
  { name: '{{company}}', label: 'Company', icon: Building2 },
  { name: '{{position}}', label: 'Position', icon: Briefcase },
  { name: '{{location}}', label: 'Location', icon: MapPin },
];

export default function MergeFieldPills({ onInsert }: MergeFieldPillsProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[10px] font-medium text-gray-400 dark:text-white/40 uppercase tracking-wider mr-1">
        Insert
      </span>
      {MERGE_FIELDS.map((field) => {
        const Icon = field.icon;
        return (
          <button
            key={field.name}
            type="button"
            onClick={() => onInsert(field.name)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium
              bg-gray-100 dark:bg-white/[0.05] 
              text-gray-600 dark:text-gray-400
              hover:bg-gray-200/80 dark:hover:bg-white/[0.08]
              hover:text-gray-700 dark:hover:text-gray-300
              border border-gray-200/80 dark:border-white/[0.06]
              cursor-pointer transition-all duration-150
              active:scale-95"
          >
            <Icon className="w-2.5 h-2.5" />
            <span>{field.label}</span>
          </button>
        );
      })}
    </div>
  );
}
