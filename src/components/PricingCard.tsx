import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  mostPopular?: boolean;
  isDark?: boolean;
  noBorder?: boolean;
}

export default function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  href,
  mostPopular,
  isDark,
  noBorder,
}: PricingCardProps) {
  const handleClick = () => {
    window.location.href = href;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={cn(
        "rounded-2xl p-6 h-[520px]",
        isDark ? "bg-[#4D3E78] text-white" : "bg-white",
        mostPopular && !noBorder ? "ring-2 ring-[#4D3E78]" : "",
        "transition-all hover:scale-105 relative"
      )}
    >
      {mostPopular && (
        <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
          <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-semibold bg-[#4D3E78] text-white">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {name}
        </h3>
        <div className="mt-3 flex items-baseline">
          <span className={`text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {price}
          </span>
          <span className={`text-lg ml-1 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
            /month
          </span>
        </div>
        <p className={`mt-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
          {description}
        </p>
      </div>

      <ul className="space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start">
            <Check className={`h-5 w-5 flex-shrink-0 ${isDark ? 'text-white' : 'text-[#4D3E78]'} mr-2`} />
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleClick}
        className={`absolute bottom-6 left-6 right-6 py-3 px-4 rounded-lg font-bold text-center transition-colors ${
          isDark
            ? 'bg-white text-[#4D3E78] hover:bg-gray-100'
            : mostPopular
            ? 'bg-[#4D3E78] text-white hover:bg-[#4D3E78]/90'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
      >
        {cta}
      </button>
    </motion.div>
  );
}