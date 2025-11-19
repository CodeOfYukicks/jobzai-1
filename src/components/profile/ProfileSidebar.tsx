import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileSidebarProps {
  // Props pour le contenu des onglets (à définir plus tard)
}

const ProfileSidebar = ({}: ProfileSidebarProps) => {
  const [activeTab, setActiveTab] = useState<'tab1' | 'tab2'>('tab1');

  return (
    <aside className="hidden lg:block sticky top-4 w-[350px] h-[calc(100vh-2rem)] flex-shrink-0">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="h-full bg-white dark:bg-gray-50 rounded-lg border border-gray-200/60 dark:border-gray-700/60 shadow-sm overflow-hidden flex flex-col"
      >
        {/* Header avec onglets */}
        <div className="border-b border-gray-200/60 dark:border-gray-700/60">
          <div className="flex">
            <button
              onClick={() => setActiveTab('tab1')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 relative ${
                activeTab === 'tab1'
                  ? 'text-gray-900 dark:text-gray-900'
                  : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-700'
              }`}
              aria-label="Onglet 1"
            >
              <span className="relative z-10">Onglet 1</span>
              {activeTab === 'tab1' && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-gray-900"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('tab2')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 relative ${
                activeTab === 'tab2'
                  ? 'text-gray-900 dark:text-gray-900'
                  : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-700'
              }`}
              aria-label="Onglet 2"
            >
              <span className="relative z-10">Onglet 2</span>
              {activeTab === 'tab2' && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-gray-900"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Contenu de l'onglet actif */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'tab1' && (
              <motion.div
                key="tab1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="p-5"
              >
                <div className="space-y-4">
                  <div className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
                    Contenu de l'onglet 1
                  </div>
                  {/* Placeholder pour le contenu futur */}
                </div>
              </motion.div>
            )}
            {activeTab === 'tab2' && (
              <motion.div
                key="tab2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="p-5"
              >
                <div className="space-y-4">
                  <div className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
                    Contenu de l'onglet 2
                  </div>
                  {/* Placeholder pour le contenu futur */}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </aside>
  );
};

export default ProfileSidebar;

