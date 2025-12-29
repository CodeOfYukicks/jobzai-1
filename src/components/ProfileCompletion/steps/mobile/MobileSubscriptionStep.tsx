import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, CreditCard } from 'lucide-react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { useAuth } from '../../../../contexts/AuthContext';
import { notify } from '@/lib/notify';
import { recordCreditHistory } from '../../../../lib/creditHistory';
import { redirectToStripeCheckout } from '../../../../services/stripe';

interface MobileSubscriptionStepProps {
    onComplete: () => void;
    profileData?: any;
    onSubmitReady?: (submitFn: () => Promise<void>, isProcessing: boolean) => void;
}

const CoinIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v12M9 9c0-1 1-2 3-2s3 1 3 2-1 2-3 2-3 1-3 2 1 2 3 2 3-1 3-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const plans = [
    {
        id: 'free',
        name: 'Free',
        tagline: 'Free Cubber',
        price: 0,
        credits: 10,
        valueProp: '10 credits/month',
        features: [
            'Basic page access',
            '1 Resume Analysis / month',
        ],
        cta: 'Start Free',
    },
    {
        id: 'standard',
        name: 'Premium',
        tagline: 'Premium Cubber',
        price: 39,
        credits: 250,
        valueProp: '250 credits/month',
        popular: true,
        features: [
            'Everything in Free +',
            '2 Mock Interviews',
            '10 Resume Analyses',
            '2 Outreach Campaigns',
        ],
        cta: 'Get Premium',
    },
    {
        id: 'premium',
        name: 'Pro',
        tagline: 'Pro Cubber',
        price: 79,
        credits: 500,
        valueProp: '500 credits/month',
        features: [
            'Everything in Premium +',
            'AI Interview Coach',
            '5 Mock Interviews',
            '5 Campaigns',
        ],
        cta: 'Go Pro',
    },
];

export default function MobileSubscriptionStep({ onComplete, profileData, onSubmitReady }: MobileSubscriptionStepProps) {
    const { currentUser } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(1); // Start on Premium (most popular)
    const [selectedPlan, setSelectedPlan] = useState('standard');
    const [expandedCard, setExpandedCard] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Swipe handling
    const cardWidth = 300;
    const gap = 16;

    const handleDragEnd = (_: any, info: PanInfo) => {
        const threshold = 50;
        if (info.offset.x > threshold && currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        } else if (info.offset.x < -threshold && currentIndex < plans.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    useEffect(() => {
        setSelectedPlan(plans[currentIndex].id);
    }, [currentIndex]);

    const handleSubmit = async () => {
        if (!currentUser) return;
        setIsProcessing(true);

        try {
            const plan = plans.find(p => p.id === selectedPlan)!;

            if (selectedPlan !== 'free') {
                // Redirect to Stripe
                const userRef = doc(db, 'users', currentUser.uid);
                await updateDoc(userRef, {
                    pendingProfileData: profileData || {},
                    pendingSubscription: {
                        planId: selectedPlan,
                        planName: plan.name,
                        credits: plan.credits,
                    },
                    pendingProfileCompletion: true,
                });

                localStorage.setItem('pendingSubscription', JSON.stringify({
                    planId: selectedPlan,
                    planName: plan.name,
                    credits: plan.credits,
                    userId: currentUser.uid,
                    profileData: profileData || {},
                }));

                await redirectToStripeCheckout({
                    userId: currentUser.uid,
                    planId: selectedPlan,
                    planName: plan.name,
                    price: plan.price.toString(),
                    credits: plan.credits,
                    type: 'plan',
                    customerEmail: currentUser.email || undefined,
                });
                return;
            }

            // Free plan - update directly
            const userRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userRef);
            const currentCredits = userSnap.data()?.credits || 0;
            const creditChange = plan.credits - currentCredits;

            await updateDoc(userRef, {
                plan: selectedPlan,
                credits: plan.credits,
                planSelectedAt: new Date().toISOString(),
            });

            if (creditChange !== 0) {
                await recordCreditHistory(currentUser.uid, plan.credits, creditChange, 'subscription', selectedPlan);
            }

            notify.success('Welcome to Cubbbe!');
            onComplete();
        } catch (error) {
            console.error('Subscription error:', error);
            notify.error('Something went wrong');
        } finally {
            setIsProcessing(false);
        }
    };

    // Notify parent that submit function is ready
    useEffect(() => {
        if (onSubmitReady) {
            onSubmitReady(handleSubmit, isProcessing);
        }
    }, [isProcessing, selectedPlan]);

    return (
        <div className="space-y-6">
            {/* Question */}
            <h1 className="text-[28px] font-semibold text-gray-900 dark:text-white leading-tight text-center">
                Choose your plan
            </h1>



            {/* Horizontal Swipe Cards - Centered */}
            <div
                ref={containerRef}
                className="relative overflow-visible pt-4"
                style={{ height: expandedCard ? 'auto' : '380px' }}
            >
                <motion.div
                    className="flex gap-4 justify-center"
                    drag="x"
                    dragConstraints={{ left: -((plans.length - 1) * (cardWidth + gap)), right: 0 }}
                    dragElastic={0.1}
                    onDragEnd={handleDragEnd}
                    style={{
                        width: `${plans.length * (cardWidth + gap)}px`,
                        marginLeft: `calc(50% - ${cardWidth / 2}px)`,
                    }}
                    animate={{ x: -currentIndex * (cardWidth + gap) }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    {plans.map((plan, index) => {
                        const isActive = index === currentIndex;
                        const isExpanded = expandedCard === plan.id;

                        return (
                            <motion.div
                                key={plan.id}
                                className={`
                  flex-shrink-0 rounded-2xl p-5 relative
                  ${isActive
                                        ? 'bg-white dark:bg-white/[0.08] shadow-lg dark:shadow-none border-2 border-[#635bff]/30'
                                        : 'bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 opacity-60'
                                    }
                `}
                                style={{ width: cardWidth }}
                                animate={{ scale: isActive ? 1 : 0.95 }}
                                onClick={() => {
                                    if (index !== currentIndex) {
                                        setCurrentIndex(index);
                                    }
                                }}
                            >
                                {/* Popular badge - on top edge of card */}
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                                        <span className="px-3 py-1 text-[10px] font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full uppercase tracking-wider whitespace-nowrap">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                {/* Selected indicator */}
                                {isActive && (
                                    <div className="absolute top-4 right-4">
                                        <div className="w-6 h-6 rounded-full bg-[#635bff] flex items-center justify-center">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                )}

                                {/* Plan name */}
                                <h3 className="text-[18px] font-bold text-gray-900 dark:text-white mb-1">
                                    {plan.tagline}
                                </h3>

                                {/* Price */}
                                <div className="flex items-baseline gap-1 mb-3">
                                    <span className="text-[36px] font-black text-gray-900 dark:text-white">
                                        €{plan.price}
                                    </span>
                                    <span className="text-[14px] text-gray-500 dark:text-white/50">
                                        {plan.price === 0 ? '/forever' : '/mo'}
                                    </span>
                                </div>

                                {/* Credits badge */}
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#635bff]/10 rounded-full mb-4">
                                    <CoinIcon className="w-4 h-4 text-[#635bff]" />
                                    <span className="text-[13px] font-semibold text-[#635bff]">{plan.valueProp}</span>
                                </div>

                                {/* Features - expandable */}
                                <AnimatePresence>
                                    {(isExpanded || !expandedCard) && (
                                        <motion.div
                                            initial={isExpanded ? { height: 0, opacity: 0 } : false}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="space-y-2"
                                        >
                                            {plan.features.slice(0, isExpanded ? plan.features.length : 3).map((feature, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-[13px] text-gray-600 dark:text-white/60">
                                                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                    <span>{feature}</span>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Expand/collapse button */}
                                {plan.features.length > 3 && isActive && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedCard(isExpanded ? null : plan.id);
                                        }}
                                        className="mt-3 flex items-center gap-1 text-[12px] text-[#635bff] font-medium"
                                    >
                                        {isExpanded ? (
                                            <>
                                                <ChevronUp className="w-3.5 h-3.5" />
                                                <span>Show less</span>
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="w-3.5 h-3.5" />
                                                <span>See all features</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>

            {/* Pagination dots */}
            <div className="flex justify-center gap-2">
                {plans.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex
                            ? 'bg-[#635bff]'
                            : 'bg-gray-300 dark:bg-white/20'
                            }`}
                    />
                ))}
            </div>

            {/* Payment info for paid plans */}
            {selectedPlan !== 'free' && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-white/[0.04] rounded-xl text-[13px] text-gray-500 dark:text-white/50">
                    <CreditCard className="w-4 h-4" />
                    <span>Secure payment via Stripe</span>
                </div>
            )}
        </div>
    );
}
