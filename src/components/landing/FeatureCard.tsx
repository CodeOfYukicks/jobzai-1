import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeatureCardProps {
  title: string;
  subtitle: string;
  description: string;
  image?: string;
  imagePlaceholder?: ReactNode;
  ctaText: string;
  ctaLink: string;
  accentColor?: string;
  index: number;
  isReversed?: boolean;
}

export default function FeatureCard({
  title,
  subtitle,
  description,
  image,
  imagePlaceholder,
  ctaText,
  ctaLink,
  accentColor = '#4D3E78',
  index,
  isReversed = false,
}: FeatureCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [100, 0, 0, -100]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.95, 1, 1, 0.95]);

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y, scale }}
      className="py-16 lg:py-24"
    >
      <div className={`max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${isReversed ? 'lg:grid-flow-dense' : ''}`}>
        {/* Content */}
        <div className={`${isReversed ? 'lg:col-start-2' : ''}`}>
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block text-sm font-semibold uppercase tracking-wider mb-4"
            style={{ color: accentColor }}
          >
            {subtitle}
          </motion.span>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight"
          >
            {title}
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 mb-8 leading-relaxed"
          >
            {description}
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Link
              to={ctaLink}
              className="inline-flex items-center text-lg font-semibold transition-colors duration-200 group"
              style={{ color: accentColor }}
            >
              {ctaText}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Visual */}
        <motion.div
          initial={{ opacity: 0, x: isReversed ? -50 : 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className={`relative ${isReversed ? 'lg:col-start-1' : ''}`}
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white border border-gray-100">
            {image ? (
              <img 
                src={image} 
                alt={title}
                className="w-full h-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : imagePlaceholder ? (
              imagePlaceholder
            ) : (
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-gray-400 text-center p-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-300"></div>
                  <span>Feature Preview</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Decorative element */}
          <div 
            className="absolute -inset-4 -z-10 rounded-3xl opacity-20 blur-2xl"
            style={{ background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}10)` }}
          ></div>
        </motion.div>
      </div>
    </motion.div>
  );
}
