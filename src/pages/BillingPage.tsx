import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import PricingCard from '../components/PricingCard';

interface UserPlanData {
  plan: string;
  credits: number;
  planSelectedAt: string;
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '€0',
    period: 'month',
    description: 'Perfect for trying out the basics of Jobz.ai',
    features: [
      '25 Credits / month',
      'Access to Basic Job Application Templates',
      'AI-Powered Cover Letter Assistance',
      'Application Tracking Dashboard',
      'Standard Email Support',
    ],
    cta: 'Current Plan',
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '€39',
    period: 'month',
    description: 'Ideal for regular job seekers who need more credits.',
    features: [
      '500 Credits / month',
      'All Free Features, plus:',
      'Automated Campaigns for targeted job applications',
      'Basic Analytics (open rates, response rates)',
      'AI-Generated Personalized Content',
      'Priority Email Support',
    ],
    cta: 'Upgrade Now',
    mostPopular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '€69',
    period: 'month',
    description: 'Designed for power users needing high-volume applications.',
    features: [
      'Unlimited Credits',
      'Premium AI Templates',
      'Advanced Analytics Dashboard',
      'Custom Integration Options',
      'Priority Support 24/7',
      'Team Collaboration Tools',
      'API Access',
    ],
    cta: 'Upgrade Now',
    isDark: true,
  },
];

const creditPackages = [
  { id: 'small', amount: 100, price: '€19', popular: false },
  { id: 'medium', amount: 250, price: '€39', popular: true },
  { id: 'large', amount: 500, price: '€69', popular: false },
];

export default function BillingPage() {
  const navigate = useNavigate();
  const creditsRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  const [userPlanData, setUserPlanData] = useState<UserPlanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = onSnapshot(
        doc(db, 'users', currentUser.uid),
        (doc) => {
          if (doc.exists()) {
            const data = doc.data() as UserPlanData;
            setUserPlanData(data);
          }
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
    }
  }, [currentUser]);

  const currentPlan = plans.find(plan => plan.id === userPlanData?.plan) || plans[0];

  const handleUpgrade = (plan: typeof plans[0]) => {
    navigate('/payment', {
      state: {
        type: 'plan',
        plan: {
          id: plan.id,
          name: plan.name,
          price: plan.price,
          period: plan.period,
          features: plan.features,
        },
      },
    });
  };

  const handleBuyCredits = (pkg: typeof creditPackages[0]) => {
    navigate('/payment', {
      state: {
        type: 'credits',
        package: {
          id: pkg.id,
          amount: pkg.amount,
          price: pkg.price,
        },
      },
    });
  };

  const scrollToCredits = () => {
    creditsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8D75E6]"></div>
        </div>
      </AuthLayout>
    );
  }

  // Calculate next billing date
  const nextBillingDate = userPlanData?.planSelectedAt 
    ? new Date(new Date(userPlanData.planSelectedAt).setMonth(new Date(userPlanData.planSelectedAt).getMonth() + 1))
    : new Date(new Date().setMonth(new Date().getMonth() + 1));

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* Current Plan Overview */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Current Plan</h2>
                <p className="mt-1 text-gray-500">
                  You are currently on the {currentPlan.name} plan
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">
                  {currentPlan.price}
                  <span className="text-lg text-gray-500">/{currentPlan.period}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Next billing date: {nextBillingDate.toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-600">
                  {userPlanData?.credits || 0} credits remaining
                </span>
              </div>
              <button
                onClick={scrollToCredits}
                className="flex items-center text-[#6956A8] hover:text-[#6956A8]/80 font-medium"
              >
                <Plus className="w-4 h-4 mr-1" />
                Buy Credits
              </button>
            </div>
          </div>

          {/* Available Plans */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Available Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <div 
                  key={plan.id} 
                  onClick={() => plan.id !== userPlanData?.plan && handleUpgrade(plan)}
                  className={plan.id === userPlanData?.plan ? 'cursor-default' : 'cursor-pointer'}
                >
                  <PricingCard 
                    {...plan} 
                    cta={plan.id === userPlanData?.plan ? 'Current Plan' : plan.cta}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Credit Packages */}
          <div ref={creditsRef}>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Buy Additional Credits</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {creditPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`relative bg-white shadow-lg rounded-lg p-6 text-center ${
                    pkg.popular ? 'ring-2 ring-[#4D3E78]' : ''
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-[#4D3E78] text-white text-xs font-medium px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {pkg.amount}
                  </div>
                  <div className="text-gray-500 mb-4">credits</div>
                  <div className="text-2xl font-bold text-gray-900 mb-6">
                    {pkg.price}
                  </div>
                  <button
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      pkg.popular
                        ? 'bg-gray-900 text-white hover:bg-gray-800'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                    onClick={() => handleBuyCredits(pkg)}
                  >
                    Buy Now
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Methods</h2>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <div className="font-medium">•••• •••• •••• 4242</div>
                  <div className="text-sm text-gray-500">Expires 12/24</div>
                </div>
              </div>
              <button className="text-[#6956A8] hover:text-[#6956A8]/80 font-medium">
                Update
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AuthLayout>
  );
}