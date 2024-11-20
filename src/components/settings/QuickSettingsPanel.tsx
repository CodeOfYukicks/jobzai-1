import { motion, AnimatePresence } from 'framer-motion';
import { Settings, CreditCard, X, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuickSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  credits: number;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  onSignOut: () => void;
}

const menuItems = [
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: CreditCard, label: 'Billing', path: '/billing' },
];

export const QuickSettingsPanel = ({ 
  isOpen, 
  onClose, 
  credits, 
  user,
  onSignOut 
}: QuickSettingsPanelProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Quick Settings</h2>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </motion.button>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-[#8D75E6] flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="h-12 w-12 rounded-full" />
                  ) : (
                    <span className="text-lg font-medium text-white">
                      {user.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-b border-gray-100">
              <div className="bg-gradient-to-r from-[#8D75E6]/10 to-transparent rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Credits</span>
                  <span className="text-lg font-bold text-[#8D75E6]">{credits}</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-[#8D75E6] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(credits / 500) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700"
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSignOut}
                className="w-full flex items-center justify-center space-x-2 p-3 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}; 