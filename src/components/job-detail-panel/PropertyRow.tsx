import { LucideIcon, ExternalLink } from 'lucide-react';

interface PropertyRowProps {
  icon: LucideIcon;
  label: string;
  value: string;
  link?: string;
  isEditing?: boolean;
}

export const PropertyRow = ({ icon: Icon, label, value, link, isEditing }: PropertyRowProps) => {
  return (
    <div className="flex items-start gap-3 group">
      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
        <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
        {link ? (
          <a
            href={link}
            target={link.startsWith('http') ? '_blank' : undefined}
            rel={link.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium inline-flex items-center gap-1.5 group/link"
          >
            {value}
            <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
          </a>
        ) : (
          <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{value}</div>
        )}
      </div>
    </div>
  );
};

