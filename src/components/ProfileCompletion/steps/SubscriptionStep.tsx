import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, CreditCard, Loader2 } from 'lucide-react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { notify } from '@/lib/notify';
import { recordCreditHistory } from '../../../lib/creditHistory';
import { redirectToStripeCheckout } from '../../../services/stripe';

interface SubscriptionStepProps {
  onComplete: () => void;
  onBack: () => void;
  profileData?: any;
}

// Minimalist coin icon component
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
    price: { monthly: 0, biMonthly: 0 },
    credits: '10 credits',
    creditsValue: 10,
    description: 'Start your job search journey with essential tools',
    features: [
      'Access to Job Board',
      'Application Tracking',
      'Calendar Follow-up View',
      'Full Interview Prep',
      '1 Resume Analysis / month',
      '4 Resume Templates',
    ],
    cta: 'Start Free',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'standard',
    name: 'Premium',
    price: { monthly: 39, biMonthly: 75 },
    credits: '250 credits',
    creditsValue: 250,
    description: 'Supercharge your applications with AI power',
    features: [
      'Personalized Job Board',
      'Track Applications + Outreach',
      '2 Mock Interviews / month',
      '10 Resume Analyses / month',
      'Premium Resume Templates',
      '2 Campaigns (200 contacts)',
    ],
    cta: 'Get Premium',
    popular: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'premium',
    name: 'Pro',
    price: { monthly: 79, biMonthly: 139 },
    credits: '500 credits',
    creditsValue: 500,
    description: 'The ultimate toolkit for ambitious professionals',
    features: [
      'AI Interview Coaching',
      '5 Mock Interviews / month',
      '20 Resume Analyses / month',
      'Premium Resume Templates',
      '5 Campaigns (500 contacts)',
      'Priority Support 24/7',
    ],
    cta: 'Go Pro',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function SubscriptionStep({ onComplete, onBack, profileData }: SubscriptionStepProps) {
  const { currentUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBiMonthly, setIsBiMonthly] = useState(false);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentUser) return;

    try {
      setIsProcessing(true);
      const selectedPlanData = plans.find(p => p.id === selectedPlan);

      if (!selectedPlanData) {
        throw new Error('Invalid plan selected');
      }

      // For paid plans, redirect to Stripe Checkout
      if (selectedPlan !== 'free') {
        try {
          const userRef = doc(db, 'users', currentUser.uid);

          await updateDoc(userRef, {
            pendingProfileData: profileData || {},
            pendingSubscription: {
              planId: selectedPlan,
              planName: selectedPlanData.name,
              credits: selectedPlanData.creditsValue,
            },
            pendingProfileCompletion: true,
          });

          localStorage.setItem('pendingSubscription', JSON.stringify({
            planId: selectedPlan,
            planName: selectedPlanData.name,
            credits: selectedPlanData.creditsValue,
            userId: currentUser.uid,
            profileData: profileData || {},
          }));

          const price = isBiMonthly ? selectedPlanData.price.biMonthly : selectedPlanData.price.monthly;
          await redirectToStripeCheckout({
            userId: currentUser.uid,
            planId: selectedPlan,
            planName: selectedPlanData.name,
            price: price.toString(),
            credits: selectedPlanData.creditsValue,
            type: 'plan',
            customerEmail: currentUser.email || undefined,
          });

          return;
        } catch (error: any) {
          console.error('Error redirecting to Stripe Checkout:', error);
          notify.error(error.message || 'Failed to initiate payment. Please try again.');
          setIsProcessing(false);
          return;
        }
      }

      // For free plan, update directly
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      const currentCredits = userSnap.data()?.credits || 0;
      const creditChange = selectedPlanData.creditsValue - currentCredits;

      await updateDoc(userRef, {
        plan: selectedPlan,
        credits: selectedPlanData.creditsValue,
        planSelectedAt: new Date().toISOString(),
      });

      if (creditChange !== 0) {
        await recordCreditHistory(
          currentUser.uid,
          selectedPlanData.creditsValue,
          creditChange,
          'subscription',
          selectedPlan
        );
      }

      notify.success('Subscription updated successfully!');
      onComplete();
    } catch (error) {
      console.error('Error processing subscription:', error);
      notify.error('Failed to process subscription');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
          Choose your plan
        </h2>

        {/* Toggle */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-full">
            <button
              onClick={() => setIsBiMonthly(false)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all duration-200 ${!isBiMonthly
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              Pay monthly
            </button>
            <button
              onClick={() => setIsBiMonthly(true)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all duration-200 flex items-center gap-2 ${isBiMonthly
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              <span>Pay every 2 months</span>
              <span className="text-[#635bff] font-medium">save ~10%</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards - Notion style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {plans.map((plan, index) => {
          const isSelected = selectedPlan === plan.id;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              onClick={() => handlePlanSelect(plan.id)}
              className={`
                bg-gray-50 dark:bg-gray-800 rounded-xl p-6 relative transition-all duration-300 cursor-pointer
                ${isSelected
                  ? 'ring-2 ring-[#635bff] bg-white dark:bg-gray-750'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-750'
                }
              `}
              style={{ display: 'grid', gridTemplateRows: 'auto auto auto auto 1fr' }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[11px] font-bold rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                {plan.icon}
              </div>

              {/* Title + Description */}
              <div className="mb-4">
                <h3 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">
                  {plan.name} Cubber
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {plan.description}
                </p>
              </div>

              {/* Price + Credits */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-black text-gray-900 dark:text-white">
                    €{isBiMonthly ? plan.price.biMonthly : plan.price.monthly}
                  </span>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {plan.price.monthly === 0 ? '/forever' : isBiMonthly ? '/2 months' : '/month'}
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-[#635bff]/10 text-[#635bff]">
                  <CoinIcon className="w-4 h-4" />
                  <span>{plan.credits}/month</span>
                </div>
              </div>

              {/* Select indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 rounded-full bg-[#635bff] flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              {/* Features list */}
              <div className="space-y-3">
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">
                  {index === 0 ? 'Includes:' : `Everything in ${plans[index - 1].name} +`}
                </p>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-[13px] leading-tight text-gray-600 dark:text-gray-400">
                      <span className="mt-0.5 flex-shrink-0 text-green-500">
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Payment Info for Paid Plans */}
      {selectedPlan !== 'free' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-8 bg-gray-50 dark:bg-gray-800/50"
        >
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Secure Payment</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You'll be redirected to Stripe Checkout to complete your subscription securely.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isProcessing}
          className="px-8 py-2 bg-[#635bff] text-white rounded-lg font-medium
            disabled:opacity-50 disabled:cursor-not-allowed 
            hover:brightness-110 transition-all duration-200
            shadow-md hover:shadow-lg
            flex items-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <span>{selectedPlan === 'free' ? 'Continue with Free Plan' : 'Subscribe & Continue'}</span>
          )}
        </button>
      </div>
    </div>
  );
}
