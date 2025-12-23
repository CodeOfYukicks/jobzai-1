import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-24 bg-black relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-8"
        >
          <Sparkles className="w-4 h-4" />
          Start for free today
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6"
          style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}
        >
          Ready to supercharge
          <br />
          your job search?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-xl text-white/80 mb-10 max-w-2xl mx-auto"
        >
          Join thousands of job seekers who are landing more interviews with less effort.
          Get started with 10 free credits.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/signup"
            className="inline-flex items-center justify-center h-14 px-8 text-lg font-semibold text-[#001d3d] bg-white hover:bg-gray-100 rounded-xl transition-colors duration-200 shadow-lg"
          >
            Get started free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center h-14 px-8 text-lg font-semibold text-white hover:text-white/80 transition-colors duration-200"
          >
            Already have an account?
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-sm text-white/60"
        >
          No credit card required • 10 free credits • Cancel anytime
        </motion.p>
      </div>
    </section>
  );
}
