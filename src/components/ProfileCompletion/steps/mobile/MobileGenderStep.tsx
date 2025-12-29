import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MobileGenderStepProps {
    value: string;
    onDataChange: (data: { gender: 'male' | 'female' | 'prefer-not-to-say' }) => void;
}

const genderOptions = [
    { id: 'male', label: 'Male' },
    { id: 'female', label: 'Female' },
    { id: 'prefer-not-to-say', label: 'Prefer not to say' },
] as const;

export default function MobileGenderStep({ value, onDataChange }: MobileGenderStepProps) {
    const [selected, setSelected] = useState(value || '');

    useEffect(() => {
        setSelected(value);
    }, [value]);

    const handleSelect = (id: string) => {
        setSelected(id);
        onDataChange({ gender: id as 'male' | 'female' | 'prefer-not-to-say' });
    };

    return (
        <div className="space-y-8">
            {/* Question */}
            <h1 className="text-[28px] font-semibold text-gray-900 dark:text-white leading-tight">
                How do you identify?
            </h1>

            {/* iOS-style Segmented Control */}
            <div className="bg-gray-100 dark:bg-white/[0.06] rounded-xl p-1">
                <div className="grid grid-cols-3 gap-1">
                    {genderOptions.map((option) => {
                        const isSelected = selected === option.id;
                        return (
                            <button
                                key={option.id}
                                onClick={() => handleSelect(option.id)}
                                className={`
                  relative py-3 px-2 rounded-lg text-[13px] font-medium
                  transition-all duration-200
                  ${isSelected
                                        ? 'text-gray-900 dark:text-white'
                                        : 'text-gray-500 dark:text-white/50'
                                    }
                `}
                            >
                                {/* Selected background */}
                                {isSelected && (
                                    <motion.div
                                        layoutId="gender-selected"
                                        className="absolute inset-0 bg-white dark:bg-white/[0.12] rounded-lg shadow-sm"
                                        transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                                    />
                                )}
                                <span className="relative z-10">{option.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
