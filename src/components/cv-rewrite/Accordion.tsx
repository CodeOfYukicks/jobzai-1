import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, GripVertical } from 'lucide-react';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  dragHandleProps?: any;
}

export default function Accordion({ title, children, defaultOpen = false, dragHandleProps }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-[#1A1A1D] shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      <div 
        className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-[#26262B] cursor-pointer select-none group"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Drag Handle (if provided) */}
        {dragHandleProps && (
          <div 
            {...dragHandleProps}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        <span className="flex-1 font-semibold text-sm text-gray-900 dark:text-gray-100">{title}</span>
        
        <div className="p-1 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors">
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-100 dark:border-gray-800"
          >
            <div className="p-4 bg-gray-50/30 dark:bg-[#1A1A1D]/50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

