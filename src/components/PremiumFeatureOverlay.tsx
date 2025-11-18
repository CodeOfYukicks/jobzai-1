import { motion } from 'framer-motion';
import { Crown, Lock, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface PremiumFeatureOverlayProps {
  title: string;
  description: string;
}

export default function PremiumFeatureOverlay({ title, description }: PremiumFeatureOverlayProps) {
  const navigate = useNavigate();

  return (
    <div className="absolute inset-0 grid place-items-center backdrop-blur-sm bg-white/30 z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white/95 p-8 rounded-xl shadow-xl max-w-md mx-4 text-center space-y-4"
      >
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
        
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[hsl(var(--primary))]/10 mb-4">
          <Crown className="w-8 h-8 text-[hsl(var(--primary))]" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <p className="text-gray-600">{description}</p>
        <div className="pt-4">
          <Link
            to="/select-plan"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-[hsl(var(--primary))] text-white font-semibold hover:bg-[#7B65D4] transition-colors"
          >
            <Lock className="w-4 h-4 mr-2" />
            Upgrade to Premium
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
