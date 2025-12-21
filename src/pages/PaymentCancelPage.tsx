import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, ArrowLeft } from 'lucide-react';

export default function PaymentCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#333234] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="mb-8"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <X className="h-8 w-8 text-orange-500" />
          </div>
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Payment cancelled
        </h1>

        {/* Description */}
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Your payment was cancelled. No charges were made to your account.
        </p>

        {/* Button */}
        <button
          onClick={() => navigate('/billing')}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 
            bg-[#635bff] text-white font-medium rounded-lg
            hover:brightness-110 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Billing
        </button>
      </motion.div>
    </div>
  );
}
