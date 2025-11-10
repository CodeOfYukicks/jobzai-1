import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, CreditCard, Loader2, Crown, Gift, Zap, Sparkles, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';
import { recordCreditHistory } from '../../../lib/creditHistory';
import { redirectToStripeCheckout } from '../../../services/stripe';

interface SubscriptionStepProps {
  onComplete: () => void;
  onBack: () => void;
  profileData?: any; // Profile data to save before redirecting to Stripe
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    period: 'month',
    credits: 25,
    description: 'Perfect for trying out the basics',
    icon: Gift,
    color: 'gray',
    mainFeatures: [
      '25 Credits / month',
      'Basic Job Application Templates',
      'AI-Powered Cover Letter',
      'Application Tracking',
    ],
    allFeatures: [
      '25 Credits / month',
      'Access to Basic Job Application Templates',
      'AI-Powered Cover Letter Assistance',
      'Application Tracking Dashboard',
      'Standard Email Support',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '39',
    period: 'month',
    credits: 500,
    description: 'Ideal for regular job seekers',
    icon: Zap,
    color: 'purple',
    mostPopular: true,
    mainFeatures: [
      '500 Credits / month',
      'All Free Features',
      'Automated Campaigns',
      'Basic Analytics',
    ],
    allFeatures: [
      '500 Credits / month',
      'All Free Features',
      'Automated Campaigns for targeted job applications',
      'Basic Analytics (open rates, response rates)',
      'AI-Generated Personalized Content',
      'Priority Email Support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '69',
    period: 'month',
    credits: 999999,
    description: 'For power users and teams',
    icon: Crown,
    color: 'indigo',
    mainFeatures: [
      'Unlimited Credits',
      'All Standard Features',
      'Advanced Analytics',
      'Priority Support 24/7',
    ],
    allFeatures: [
      'Unlimited Credits',
      'All Standard Features',
      'Premium AI Templates Library',
      'Advanced Analytics Dashboard',
      'Custom Integration Options',
      'Priority Support 24/7',
      'Team Collaboration Tools',
      'API Access',
    ],
  },
];

export default function SubscriptionStep({ onComplete, onBack, profileData }: SubscriptionStepProps) {
  const { currentUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

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
          // Store profile data in Firestore BEFORE redirecting to Stripe
          // This ensures we can retrieve it after payment, even if sessionStorage is lost
          const userRef = doc(db, 'users', currentUser.uid);
          
          console.log('💾 Storing profile data in Firestore before Stripe redirect:', {
            hasProfileData: !!profileData,
            profileDataKeys: profileData ? Object.keys(profileData) : [],
            planId: selectedPlan,
            credits: selectedPlanData.credits
          });
          
          await updateDoc(userRef, {
            pendingProfileData: profileData || {},
            pendingSubscription: {
              planId: selectedPlan,
              planName: selectedPlanData.name,
              credits: selectedPlanData.credits,
            },
            pendingProfileCompletion: true,
          });

          // Verify the data was stored
          const verifyDoc = await getDoc(userRef);
          const verifyData = verifyDoc.data();
          console.log('✅ Verified data stored in Firestore:', {
            hasPendingProfileData: !!verifyData?.pendingProfileData,
            hasPendingSubscription: !!verifyData?.pendingSubscription,
            pendingProfileCompletion: verifyData?.pendingProfileCompletion
          });

          // Also store in localStorage as backup
          localStorage.setItem('pendingSubscription', JSON.stringify({
            planId: selectedPlan,
            planName: selectedPlanData.name,
            credits: selectedPlanData.credits,
            userId: currentUser.uid,
            profileData: profileData || {},
          }));

          // Redirect to Stripe Checkout
          await redirectToStripeCheckout({
            userId: currentUser.uid,
            planId: selectedPlan,
            planName: selectedPlanData.name,
            price: selectedPlanData.price,
            credits: selectedPlanData.credits,
            type: 'plan',
            customerEmail: currentUser.email || undefined,
          });
          
          // The redirect will happen, so we don't need to continue
          return;
        } catch (error: any) {
          console.error('Error redirecting to Stripe Checkout:', error);
          toast.error(error.message || 'Failed to initiate payment. Please try again.');
          setIsProcessing(false);
          return;
        }
      }

      // For free plan, update directly
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      const currentCredits = userSnap.data()?.credits || 0;
      const creditChange = selectedPlanData.credits - currentCredits;

      // Update user's subscription in Firestore
      await updateDoc(userRef, {
        plan: selectedPlan,
        credits: selectedPlanData.credits,
        planSelectedAt: new Date().toISOString(),
      });

      // Enregistrer l'historique des crédits
      if (creditChange !== 0) {
        await recordCreditHistory(
          currentUser.uid,
          selectedPlanData.credits,
          creditChange,
          'subscription',
          selectedPlan
        );
      }

      toast.success('Subscription updated successfully!');
      onComplete();
    } catch (error) {
      console.error('Error processing subscription:', error);
      toast.error('Failed to process subscription');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full -mx-4 sm:-mx-6 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Choose Your Plan
        </h2>
        <p className="text-base text-gray-500 dark:text-gray-400">
          Select the plan that best fits your job search needs
        </p>
      </div>

      {/* Plans Grid - Vertical on mobile, horizontal on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {plans.map((plan, index) => {
          const Icon = plan.icon;
          const isSelected = selectedPlan === plan.id;
          const isExpanded = expandedPlan === plan.id;
          const featuresToShow = isExpanded ? plan.allFeatures : plan.mainFeatures;
          
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className={`
                relative rounded-2xl border-2 transition-all duration-300 flex flex-col cursor-pointer
                ${isSelected 
                  ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white border-transparent shadow-2xl scale-[1.02]' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-xl dark:shadow-lg'
                }
              `}
              onClick={() => handlePlanSelect(plan.id)}
            >
              {plan.mostPopular && !isSelected && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-purple-600 to-indigo-600 
                    text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-6 sm:p-8 flex flex-col h-full">
                {/* Icon and Title */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-xl ${
                    isSelected 
                      ? 'bg-white/20 backdrop-blur-sm' 
                      : plan.color === 'purple' 
                        ? 'bg-purple-100 dark:bg-purple-900/30'
                        : plan.color === 'indigo'
                        ? 'bg-indigo-100 dark:bg-indigo-900/30'
                        : 'bg-gray-100 dark:bg-gray-900/30'
                  }`}>
                    <Icon className={`h-6 w-6 ${
                      isSelected 
                        ? 'text-white' 
                        : plan.color === 'purple'
                          ? 'text-purple-600 dark:text-purple-400'
                          : plan.color === 'indigo'
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-600 dark:text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    <p className={`text-sm mt-1 ${
                      isSelected ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {plan.description}
                    </p>
                  </div>
                </div>

                {/* Price Section */}
                <div className="py-6 border-t border-b mb-6"
                  style={isSelected ? { borderColor: 'rgba(255,255,255,0.2)' } : {}}
                >
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className={`text-5xl font-bold ${
                      isSelected ? 'text-white' : 'text-gray-900 dark:text-white'
                    }`}>
                      €{plan.price}
                    </span>
                    <span className={`text-xl ${
                      isSelected ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      /{plan.period}
                    </span>
                  </div>
                  <div className={`text-base font-medium ${
                    isSelected ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {plan.credits === 999999 ? 'Unlimited' : `${plan.credits.toLocaleString()} credits`}
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-3 flex-grow mb-4">
                  {featuresToShow.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        isSelected 
                          ? 'text-white' 
                          : 'text-purple-600 dark:text-purple-400'
                      }`} />
                      <span className={`text-base leading-relaxed ${
                        isSelected 
                          ? 'text-white/90' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Expand/Collapse Button */}
                {plan.allFeatures.length > plan.mainFeatures.length && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedPlan(isExpanded ? null : plan.id);
                    }}
                    className={`mt-auto flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isSelected
                        ? 'text-white/80 hover:bg-white/10'
                        : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                    }`}
                  >
                    {isExpanded ? (
                      <>
                        <span>Show Less</span>
                        <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <span>Show All Features</span>
                        <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
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
          className="border border-purple-200 dark:border-purple-800 rounded-2xl p-6 sm:p-8 space-y-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20
            shadow-lg dark:shadow-xl mb-8"
        >
          <div className="flex items-start gap-3">
            <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Secure Payment</h3>
              <p className="text-base text-gray-600 dark:text-gray-300">
                You'll be redirected to Stripe Checkout, our secure payment processor, to complete your subscription. 
                Your payment information is handled securely and never stored on our servers.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="px-6 py-3 text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium
            transition-colors duration-200"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isProcessing}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold text-base
            disabled:opacity-50 disabled:cursor-not-allowed 
            hover:from-purple-700 hover:to-indigo-700 transition-all duration-200
            shadow-lg dark:shadow-xl hover:shadow-2xl
            flex items-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>{selectedPlan === 'free' ? 'Continue with Free Plan' : 'Subscribe & Continue'}</span>
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
