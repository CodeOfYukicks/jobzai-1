import { motion } from 'framer-motion';

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function ToggleSwitch({
  label,
  checked,
  onChange,
  disabled = false
}: ToggleSwitchProps) {
  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EB7134] focus-visible:ring-offset-1
          ${checked 
            ? 'bg-gradient-to-r from-[#EB7134] to-[#5D4D6B]' 
            : 'bg-gray-200 dark:bg-gray-700'
          }
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`
            pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0
            ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}
          `}
        />
      </button>
    </label>
  );
}
