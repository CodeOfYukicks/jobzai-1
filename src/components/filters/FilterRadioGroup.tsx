interface FilterRadioGroupProps {
    name: string;
    options: Array<{ value: string; label: string; count?: number }>;
    value: string;
    onChange: (value: string) => void;
}

export function FilterRadioGroup({ name, options, value, onChange }: FilterRadioGroupProps) {
    return (
        <div className="space-y-2">
            {options.map((option) => (
                <label
                    key={option.value}
                    className="flex items-center group cursor-pointer py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                    <div className="relative flex items-center">
                        <input
                            type="radio"
                            name={name}
                            className="peer sr-only"
                            checked={value === option.value}
                            onChange={() => onChange(option.value)}
                        />
                        <div className={`
              w-4 h-4 border-2 rounded-full transition-all duration-200 flex items-center justify-center
              ${value === option.value
                                ? 'bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                                : 'border-gray-300 dark:border-gray-600 group-hover:border-indigo-400 dark:group-hover:border-indigo-400'
                            }
            `}>
                            <div className={`w-1.5 h-1.5 rounded-full bg-white transition-opacity duration-200 ${value === option.value ? 'opacity-100' : 'opacity-0'}`} />
                        </div>
                    </div>
                    <span className={`ml-3 text-sm transition-colors flex-1 ${value === option.value ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                        {option.label}
                    </span>
                    {option.count !== undefined && (
                        <span className="ml-auto text-xs font-medium text-gray-400 dark:text-gray-500">
                            {option.count}
                        </span>
                    )}
                </label>
            ))}
        </div>
    );
}
