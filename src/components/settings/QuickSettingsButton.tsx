import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';

interface QuickSettingsButtonProps {
  onClick: () => void;
  hasUpdates?: boolean;
}

export const QuickSettingsButton = ({ onClick, hasUpdates }: QuickSettingsButtonProps) => {
  return (
    <motion.button
      onClick={onClick}
      className="fixed right-4 bottom-20 md:bottom-4 z-40 bg-white rounded-full p-3 shadow-lg"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {hasUpdates && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-[hsl(var(--primary))] rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" }}
        />
      )}
      <Settings className="w-6 h-6 text-gray-700" />
    </motion.button>
  );
}; 