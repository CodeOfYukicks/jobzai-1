import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Mail, MessageCircle, HelpCircle } from 'lucide-react';
import Footer from '../components/Footer';

const faqs = [
    {
        question: "Who is Cubbbe for?",
        answer: "Cubbbe is designed for anyone actively looking for a job or planning a career move. Whether you're a student, a seasoned professional, or switching industries, our AI helps you articulate your value and apply faster."
    },
    {
        question: "How does the AI actually work?",
        answer: "Our AI analyzes your profile and the specific job description you're interested in. It then identifies gaps, suggests relevant keywords, and helps you tailor your CV and cover letter to match what recruiters (and ATS algorithms) are looking for."
    },
    {
        question: "Is my personal data safe?",
        answer: "Yes. Your data is yours. We use industry-standard encryption to protect your documents and personal information. We do not sell your data to third parties, and we only use it to provide you with our services."
    },
    {
        question: "Can Cubbbe write my cover letter for me?",
        answer: "Absolutely. Cubbbe can generate a personalized, high-quality cover letter in seconds based on your CV and the job you're applying to. We always recommend reviewing and adding your personal touch before sending."
    },
    {
        question: "Does it work for spontaneous applications?",
        answer: "Yes. You can use Cubbbe to optimize your CV and generate outreach messages for companies you admire, even if they don't have an open position listed. It's a great way to tap into the hidden job market."
    },
    {
        question: "How accurate is the AI?",
        answer: "Our models are highly accurate and trained on successful job applications. However, AI is a tool to assist you, not replace you. We always encourage you to review the output to ensure it perfectly reflects your voice and experience."
    },
    {
        question: "Is there a free trial?",
        answer: "Yes, you can try Cubbbe for free. Our free tier gives you access to basic features so you can see the value before committing. To unlock unlimited AI optimizations and premium templates, you can upgrade to a paid plan."
    },
    {
        question: "Can I cancel my subscription at any time?",
        answer: "Yes, transparency is key for us. You can cancel your subscription instantly from your account settings. You'll keep access to premium features until the end of your current billing cycle."
    },
    {
        question: "What if I need help?",
        answer: "We're here for you. You can reach our support team directly through the app or by email. We pride ourselves on being responsive and helpful—no bots, just real humans ready to assist."
    },
    {
        question: "How does the AI Mock Interview work?",
        answer: "Our AI simulates a real interview environment tailored to the specific job description you're applying for. It asks relevant questions, listens to your answers, and provides instant feedback on your delivery and content."
    },
    {
        question: "Can I practice for specific industries?",
        answer: "Yes. You can customize the simulation for any role—from technical coding rounds to behavioral HR interviews. Cubbbe adapts the questions to match the specific context of the job."
    },
    {
        question: "What can I track on my Dashboard?",
        answer: "Your Dashboard is your command center. Track all active applications, monitor their status, and view analytics on your performance. It helps you stay organized and focused on what matters."
    },
    {
        question: "Can I organize applications by stage?",
        answer: "Absolutely. Use our Kanban-style board to drag and drop applications across stages like \"To Apply,\" \"Interviewing,\" and \"Offer,\" giving you a clear visual of your pipeline."
    },
    {
        question: "What can the AI Assistant do?",
        answer: "Think of it as your 24/7 career coach. It can rewrite CV bullet points, draft networking emails, research companies, and provide salary negotiation tips—all tailored to your specific profile."
    },
    {
        question: "Is the advice personalized?",
        answer: "Yes. The Assistant understands your unique background, skills, and goals. It doesn't give generic advice; it gives advice that works for you."
    }
];

const FAQPage = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="bg-white dark:bg-[#0a0a0a] min-h-screen pb-12 transition-colors duration-300">
            <section
                className="relative pt-24 pb-16 md:pt-28 md:pb-20 lg:pt-32 lg:pb-24 overflow-hidden mx-3 md:mx-4 lg:mx-6 mt-3 rounded-[24px] md:rounded-[32px]"
                style={{
                    backgroundColor: '#004B23', // Deep green base
                    boxShadow: 'inset 0 0 80px rgba(0,0,0,0.2), 0 4px 30px rgba(0,0,0,0.1)'
                }}
            >
                {/* Subtle noise texture overlay (optional, using CSS pattern if available or just gradient) */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>

                {/* Decorative Stickers */}
                <img
                    src="/images/stickers/6.png"
                    alt=""
                    className="absolute top-96 left-[-20px] md:left-10 w-24 md:w-32 lg:w-40 rotate-[-12deg] opacity-80 md:opacity-100 pointer-events-none z-0"
                />
                <img
                    src="/images/stickers/7.png"
                    alt=""
                    className="absolute top-20 right-[-20px] md:right-10 w-28 md:w-36 lg:w-44 rotate-[15deg] opacity-80 md:opacity-100 pointer-events-none z-0"
                />
                <img
                    src="/images/stickers/8.png"
                    alt=""
                    className="absolute bottom-1/4 left-[-10px] md:left-12 w-32 md:w-40 lg:w-52 rotate-[5deg] opacity-80 md:opacity-100 pointer-events-none z-0"
                />
                <img
                    src="/images/stickers/9.png"
                    alt=""
                    className="absolute bottom-32 right-[-10px] md:right-12 w-24 md:w-32 lg:w-40 rotate-[-8deg] opacity-80 md:opacity-100 pointer-events-none z-0"
                />

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 z-10">

                    {/* Header Section */}
                    <div className="text-center mb-24">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="text-4xl md:text-5xl font-bold tracking-tight text-white font-space-grotesk mb-6 drop-shadow-sm"
                        >
                            Frequently Asked Questions
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                            className="text-lg text-white/80 max-w-2xl mx-auto font-light leading-relaxed"
                        >
                            If you can't find an answer that you're looking for, feel free to drop us a line.
                        </motion.p>

                        {/* Action Buttons - Refined Pill Style */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                            className="flex flex-wrap justify-center gap-3 mt-10"
                        >
                            {[
                                { icon: MessageCircle, text: "About the company", action: () => { } },
                                { icon: Mail, text: "Contact support", href: "mailto:hello@cubbbe.com" },
                                { icon: HelpCircle, text: "Visit help center", action: () => { } }
                            ].map((btn, i) => (
                                btn.href ? (
                                    <a
                                        key={i}
                                        href={btn.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-md"
                                    >
                                        <btn.icon size={15} strokeWidth={1.5} className="group-hover:scale-110 transition-transform duration-300" />
                                        <span>{btn.text}</span>
                                    </a>
                                ) : (
                                    <button
                                        key={i}
                                        onClick={btn.action}
                                        className="group flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-md"
                                    >
                                        <btn.icon size={15} strokeWidth={1.5} className="group-hover:scale-110 transition-transform duration-300" />
                                        <span>{btn.text}</span>
                                    </button>
                                )
                            ))}
                        </motion.div>
                    </div>

                    {/* Accordion Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                        className="space-y-6" // Increased spacing
                    >
                        {faqs.map((faq, index) => {
                            const isOpen = openIndex === index;
                            return (
                                <motion.div
                                    key={index}
                                    initial={false}
                                    animate={{
                                        backgroundColor: isOpen ? 'rgba(0, 114, 0, 0.2)' : 'rgba(0, 56, 26, 0.4)',
                                        borderColor: isOpen ? 'rgba(158, 240, 26, 0.5)' : 'rgba(255, 255, 255, 0.05)',
                                        boxShadow: isOpen ? '0 10px 30px -10px rgba(0, 0, 0, 0.3)' : '0 0 0 0 rgba(0,0,0,0)'
                                    }}
                                    transition={{ duration: 0.3 }}
                                    className={`group rounded-2xl border backdrop-blur-md overflow-hidden relative`}
                                >
                                    {/* Glow effect on open */}
                                    {isOpen && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#9EF01A]/10 to-transparent opacity-50 pointer-events-none" />
                                    )}

                                    <button
                                        onClick={() => toggleAccordion(index)}
                                        className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none relative z-10"
                                    >
                                        <span className={`text-lg font-medium transition-colors duration-300 ${isOpen ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>
                                            {faq.question}
                                        </span>
                                        <span
                                            className={`transform transition-all duration-300 flex items-center justify-center w-8 h-8 rounded-full ${isOpen ? 'bg-[#9EF01A]/20 text-[#9EF01A] rotate-180' : 'bg-white/5 text-white/50 group-hover:bg-white/10 group-hover:text-white'}`}
                                        >
                                            <ChevronDown size={18} strokeWidth={2} />
                                        </span>
                                    </button>

                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                            >
                                                <div className="px-6 pb-6 relative z-10">
                                                    <p className="text-white/70 leading-relaxed max-w-3xl text-[15px] font-light">
                                                        {faq.answer}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </section>

            <div className="mt-12">
                <Footer />
            </div>
        </div>
    );
};

export default FAQPage;
