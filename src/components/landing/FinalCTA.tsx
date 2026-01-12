import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-20 md:py-24 relative overflow-hidden" style={{ backgroundColor: '#220041' }}>
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        {/* Emotional Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-8"
        >
          <Heart className="w-4 h-4" />
          You've done enough
        </motion.div>

        {/* Emotional Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight"
          style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}
        >
          It's time to stop
          <br />
          struggling alone.
        </motion.h2>

        {/* Reassuring Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-white/70 mb-10 max-w-xl mx-auto leading-relaxed"
        >
          The right job is out there. Let us help you reach it—without the exhausting grind that got you here.
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
            className="inline-flex items-center justify-center h-12 md:h-14 px-8 text-base md:text-lg font-semibold text-[#001d3d] bg-white hover:bg-gray-100 rounded-xl transition-colors duration-200 shadow-lg"
          >
            Start your free trial
            <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center h-12 md:h-14 px-8 text-base md:text-lg font-medium text-white/80 hover:text-white transition-colors duration-200"
          >
            Sign in
          </Link>
        </motion.div>

        {/* Soft Reassurance */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-sm text-white/50"
        >
          No commitment. No pressure. Just progress.
        </motion.p>
      </div>
    </section>
  );
}
