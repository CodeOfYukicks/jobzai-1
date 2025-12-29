import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Clock, Calendar, GraduationCap, Check } from 'lucide-react';

interface MobileContractTypeStepProps {
    value: string;
    onDataChange: (data: { contractType: 'full-time' | 'part-time' | 'contract' | 'internship' }) => void;
}

const contractTypes = [
    { id: 'full-time', label: 'Full Time', icon: Briefcase },
    { id: 'part-time', label: 'Part Time', icon: Clock },
    { id: 'contract', label: 'Contract', icon: Calendar },
    { id: 'internship', label: 'Internship', icon: GraduationCap },
] as const;

export default function MobileContractTypeStep({ value, onDataChange }: MobileContractTypeStepProps) {
    const [selected, setSelected] = useState(value || '');

    useEffect(() => {
        setSelected(value);
    }, [value]);

    const handleSelect = (id: string) => {
        setSelected(id);
        onDataChange({ contractType: id as any });
    };

    return (
        <div className="space-y-8">
            {/* Question */}
            <h1 className="text-[28px] font-semibold text-gray-900 dark:text-white leading-tight">
                What type of work?
            </h1>

            {/* Compact 2x2 Grid */}
            <div className="grid grid-cols-2 gap-3">
                {contractTypes.map(({ id, label, icon: Icon }) => {
                    const isSelected = selected === id;
                    return (
                        <motion.button
                            key={id}
                            onClick={() => handleSelect(id)}
                            whileTap={{ scale: 0.97 }}
                            className={`
                relative flex flex-col items-center justify-center p-5 rounded-xl
                transition-all duration-200
                ${isSelected
                                    ? 'bg-gray-100 dark:bg-white/[0.08]'
                                    : 'bg-gray-50 dark:bg-white/[0.03] hover:bg-gray-100 dark:hover:bg-white/[0.06]'
                                }
              `}
                        >
                            {/* Checkmark for selected */}
                            {isSelected && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="absolute top-3 right-3"
                                >
                                    <div className="w-5 h-5 bg-[#635bff] rounded-full flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                    </div>
                                </motion.div>
                            )}

                            {/* Icon */}
                            <Icon className={`w-6 h-6 mb-2 ${isSelected
                                    ? 'text-gray-700 dark:text-white'
                                    : 'text-gray-400 dark:text-white/40'
                                }`} />

                            {/* Label */}
                            <span className={`text-[14px] font-medium ${isSelected
                                    ? 'text-gray-900 dark:text-white'
                                    : 'text-gray-600 dark:text-white/60'
                                }`}>
                                {label}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
