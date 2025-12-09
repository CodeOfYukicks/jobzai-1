import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, CreditCard, Loader2, Crown } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { notify } from '@/lib/notify';

interface SubscriptionStepProps {
  onComplete: () => void;
  onBack: () => void;
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 'â‚¬0',
    period: 'month',
    credits: 25,
    features: [
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
    price: 'â‚¬39',
    period: 'month',
    credits: 500,
    features: [
      '500 Credits / month',
      'All Free Features, plus:',
      'Automated Campaigns for targeted job applications',
      'Basic Analytics (open rates, response rates)',
      'AI-Generated Personalized Content',
      'Priority Email Support',
    ],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'â‚¬69',
    period: 'month',
    credits: 999999,
    features: [
      'Unlimited Credits',
      'Premium AI Templates',
      'Advanced Analytics Dashboard',
      'Custom Integration Options',
      'Priority Support 24/7',
      'Team Collaboration Tools',
      'API Access',
    ],
  },
];

export default function SubscriptionStep({ onComplete, onBack }: SubscriptionStepProps) {
  const { currentUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiry: '',
    cvc: '',
    name: '',
  });

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setShowPayment(planId !== 'free');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setIsProcessing(true);
      const selectedPlanData = plans.find(p => p.id === selectedPlan);
      
      if (!selectedPlanData) {
        throw new Error('Invalid plan selected');
      }

      // For paid plans, validate payment details
      if (selectedPlan !== 'free') {
        if (!paymentDetails.cardNumber || !paymentDetails.expiry || !paymentDetails.cvc || !paymentDetails.name) {
          notify.error('Please fill in all payment details');
          return;
        }
        // Here you would integrate with your payment processor (e.g., Stripe)
        // For now, we'll simulate a successful payment
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Update user's subscription in Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        plan: selectedPlan,
        credits: selectedPlanData.credits,
        planSelectedAt: new Date().toISOString(),
      });

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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Choose Your Plan</h2>
        <p className="mt-1 text-sm text-gray-500">
          Select the plan that best fits your job search needs
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-lg border-2 p-6 cursor-pointer transition-all ${
              selectedPlan === plan.id
                ? 'border-[#8D75E6] dark:border-[#7C3AED] bg-[#8D75E6]/5 dark:bg-[#8D75E6]/10'
                : 'border-gray-200 dark:border-gray-700 hover:border-[#8D75E6]/50 dark:hover:border-[#8D75E6]/50'
            }`}
            onClick={() => handlePlanSelect(plan.id)}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#8D75E6] dark:bg-[#7C3AED] text-white">
                  <Crown className="w-3 h-3 mr-1" />
                  Most Popular
                </span>
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-2xl font-bold">{plan.price}</span>
                <span className="text-gray-500">/{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start">
                  <Check className="h-5 w-5 text-[#8D75E6] dark:text-[#A78BFA] shrink-0 mr-2" />
                  <span className="text-sm text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {showPayment && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border rounded-lg p-6 space-y-4"
        >
          <h3 className="text-lg font-medium text-gray-900">Payment Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Card Number</label>
              <div className="mt-1 relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={paymentDetails.cardNumber}
                  onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardNumber: e.target.value }))}
                  placeholder="1234 5678 9012 3456"
                  className="pl-10 w-full border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
              <input
                type="text"
                value={paymentDetails.expiry}
                onChange={(e) => setPaymentDetails(prev => ({ ...prev, expiry: e.target.value }))}
                placeholder="MM/YY"
                className="mt-1 w-full border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">CVC</label>
              <input
                type="text"
                value={paymentDetails.cvc}
                onChange={(e) => setPaymentDetails(prev => ({ ...prev, cvc: e.target.value }))}
                placeholder="123"
                className="mt-1 w-full border-gray-300 rounded-md"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Cardholder Name</label>
              <input
                type="text"
                value={paymentDetails.name}
                onChange={(e) => setPaymentDetails(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
                className="mt-1 w-full border-gray-300 rounded-md"
              />
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isProcessing}
          className="btn-primary px-6 py-2 rounded-lg disabled:opacity-50 flex items-center space-x-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
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