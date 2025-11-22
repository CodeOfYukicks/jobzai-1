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
    <div className="flex items-start gap-4 group">
      <div className="mt-0.5 flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">{label}</div>
        {link ? (
          <a
            href={link}
            target={link.startsWith('http') ? '_blank' : undefined}
            rel={link.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="text-sm text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400 font-medium inline-flex items-center gap-1.5 group/link transition-colors break-all"
          >
            {value}
            <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity text-gray-400" />
          </a>
        ) : (
          <div className="text-sm text-gray-900 dark:text-gray-100 font-medium break-words">{value}</div>
        )}
      </div>
    </div>
  );
};

