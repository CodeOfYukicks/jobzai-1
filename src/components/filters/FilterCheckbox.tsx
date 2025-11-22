interface FilterCheckboxProps {
    label: string;
    checked: boolean;
    onChange: () => void;
    count?: number;
}

export function FilterCheckbox({ label, checked, onChange, count }: FilterCheckboxProps) {
    return (
        <label className="flex items-center group cursor-pointer py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="relative flex items-center">
                <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={checked}
                    onChange={onChange}
                />
                <div className={`
          w-4 h-4 border-2 rounded-[4px] transition-all duration-200 flex items-center justify-center
          ${checked
                        ? 'bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                        : 'border-gray-300 dark:border-gray-600 group-hover:border-indigo-400 dark:group-hover:border-indigo-400'
                    }
        `}>
                    <svg
                        className={`w-3 h-3 text-white transition-opacity duration-200 ${checked ? 'opacity-100' : 'opacity-0'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            </div>
            <span className={`ml-3 text-sm transition-colors flex-1 ${checked ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                {label}
            </span>
            {count !== undefined && (
                <span className="ml-auto text-xs font-medium text-gray-400 dark:text-gray-500">
                    {count}
                </span>
            )}
        </label>
    );
}
