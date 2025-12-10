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
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-medium text-gray-500 dark:text-white/50">
        Insert:
      </span>
      {MERGE_FIELDS.map((field) => {
        const Icon = field.icon;
        return (
          <button
            key={field.name}
            type="button"
            onClick={() => onInsert(field.name)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
              bg-gray-100 dark:bg-white/[0.06] 
              text-gray-700 dark:text-gray-300
              hover:bg-[#b7e219]/20 hover:text-[#b7e219] dark:hover:text-[#b7e219]
              border border-gray-200 dark:border-white/[0.08]
              hover:border-[#b7e219]
              cursor-pointer transition-all duration-200
              hover:scale-105 active:scale-95"
          >
            <Icon className="w-3 h-3" />
            <span>{field.label}</span>
          </button>
        );
      })}
    </div>
  );
}

