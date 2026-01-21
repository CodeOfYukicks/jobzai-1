import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export default function FinalCTA() {
  const { t } = useTranslation();

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div
          className="relative overflow-hidden rounded-3xl md:rounded-[40px] py-20 md:py-24 text-center"
          style={{ backgroundColor: '#F5F5F5' }}
        >
          {/* Sticker 3: Handshake - Bottom Right of Final CTA */}
          <img
            src="/images/stickers/3.png"
            alt=""
            className="absolute bottom-0 right-0 w-32 md:w-48 lg:w-64 opacity-10 md:opacity-100 translate-y-1/4 translate-x-1/4 rotate-[-10deg] pointer-events-none"
          />
          <div className="max-w-3xl mx-auto px-6 relative z-10">
            {/* Emotional Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/10 text-gray-700 text-sm font-medium mb-8"
            >
              <Heart className="w-4 h-4" />
              {t('finalCta.badge')}
            </motion.div>

            {/* Emotional Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight"
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}
            >
              {t('finalCta.headline1')}
              <br />
              {t('finalCta.headline2')}
            </motion.h2>

            {/* Reassuring Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-gray-600 mb-10 max-w-xl mx-auto leading-relaxed"
            >
              {t('finalCta.subheadline')}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                to="/signup"
                className="inline-flex items-center justify-center h-12 md:h-14 px-8 text-base md:text-lg font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-full transition-colors duration-200 shadow-lg"
              >
                {t('finalCta.ctaPrimary')}
                <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center h-12 md:h-14 px-8 text-base md:text-lg font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200 rounded-full"
              >
                {t('finalCta.ctaSecondary')}
              </Link>
            </motion.div>

            {/* Soft Reassurance */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-8 text-sm text-gray-500"
            >
              {t('finalCta.reassurance')}
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}
