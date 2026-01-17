import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function DevicesSection() {
    return (
        <section className="py-12 md:py-16 bg-white overflow-hidden">
            <div className="max-w-6xl mx-auto px-4 md:px-6">
                {/* Header */}
                <div className="text-center mb-0 relative z-10">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-4"
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                        Cubbbe works seamlessly across<br className="hidden md:block" /> all your devices
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-500 text-base md:text-lg max-w-xl mx-auto mb-6"
                    >
                        Launch campaigns during your commute or prep for interviews from your couch. Whether you're on your <strong className="text-gray-900">phone or laptop</strong>, your progress syncs instantly—so you never miss an opportunity.
                    </motion.p>

                    {/* CTA Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        <Link
                            to="/signup"
                            className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors shadow-lg"
                        >
                            Sign up for free
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
