import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Device mockup images - using placeholder paths that will be replaced with Firebase images
const deviceMockups = {
    iphone: '/images/device-iphone.png',
    ipad: '/images/device-ipad.png',
    macbook: '/images/device-macbook.png',
};

export default function DevicesSection() {
    return (
        <section className="py-16 md:py-20 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                {/* Header */}
                <div className="text-center mb-12 md:mb-16">
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
                        className="text-gray-500 text-base md:text-lg max-w-xl mx-auto mb-8"
                    >
                        Whether you're on web, iPad, or iOS - <strong className="text-gray-900">start on one device, pick up on another</strong>. Your data syncs instantly, so you're always up to date.
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

                {/* Devices Display */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="relative flex items-end justify-center gap-6 md:gap-10 lg:gap-16 px-4"
                >
                    {/* iPhone - Left (tall, narrow) */}
                    <div className="relative w-20 md:w-28 lg:w-36 flex-shrink-0 self-end">
                        <div className="border-2 border-gray-900 rounded-[16px] md:rounded-[24px] lg:rounded-[32px] shadow-2xl overflow-hidden">
                            <div className="bg-white overflow-hidden aspect-[9/19]">
                                {/* Placeholder for iPhone screenshot */}
                                <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                                    <div className="text-center p-2">
                                        <div className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 rounded-lg bg-gray-200 flex items-center justify-center">
                                            <svg className="w-3 h-3 md:w-4 md:h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="5" y="2" width="14" height="20" rx="2" />
                                            </svg>
                                        </div>
                                        <p className="text-[6px] md:text-[8px] text-gray-400">iOS</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* iPad/Web - Center (largest, main focus) */}
                    <div className="relative w-72 md:w-[420px] lg:w-[560px] flex-shrink-0">
                        <div className="border-2 border-gray-900 rounded-lg md:rounded-xl lg:rounded-2xl shadow-2xl overflow-hidden">
                            <div className="bg-white overflow-hidden aspect-[4/3]">
                                {/* Placeholder for iPad/Desktop screenshot */}
                                <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                                    <div className="text-center p-4">
                                        <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 rounded-2xl bg-gray-200 flex items-center justify-center">
                                            <svg className="w-6 h-6 md:w-8 md:h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="2" y="3" width="20" height="14" rx="2" />
                                                <line x1="8" y1="21" x2="16" y2="21" />
                                                <line x1="12" y1="17" x2="12" y2="21" />
                                            </svg>
                                        </div>
                                        <p className="text-xs md:text-sm text-gray-400">Web App</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Subtle reflection/shadow */}
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-4 bg-gradient-to-t from-transparent to-black/5 blur-xl" />
                    </div>

                    {/* iPad - Right (medium size, tablet portrait) */}
                    <div className="relative w-32 md:w-44 lg:w-56 flex-shrink-0 self-end">
                        <div className="border-2 border-gray-900 rounded-lg md:rounded-xl lg:rounded-2xl shadow-2xl overflow-hidden">
                            <div className="bg-white overflow-hidden aspect-[3/4]">
                                {/* Placeholder for iPad screenshot */}
                                <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                                    <div className="text-center p-3">
                                        <div className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 rounded-xl bg-gray-200 flex items-center justify-center">
                                            <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="4" y="2" width="16" height="20" rx="2" />
                                            </svg>
                                        </div>
                                        <p className="text-[8px] md:text-[10px] text-gray-400">iPad</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
