import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, CreditCard, Mail, Check } from 'lucide-react';
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
      <div className="max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* En-tête avec résumé */}
          <div className="bg-purple-50/50 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Standard Plan</h2>
                <p className="text-sm text-gray-500">Next billing date: {nextBillingDate.toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl">
                  <Mail className="h-5 w-5 text-[#4D3E78]" />
                  <span className="font-medium">{userPlanData?.credits || 0} credits</span>
                </div>
                <div className="text-xl font-bold">
                  €39<span className="text-sm font-normal text-gray-500">/month</span>
                </div>
              </div>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`
                  relative p-6 rounded-xl border transition-all
                  ${plan.id === userPlanData?.plan 
                    ? 'bg-[#4D3E78] text-white border-[#4D3E78]' 
                    : 'bg-white border-gray-200 hover:border-[#4D3E78]/30'
                  }
                `}
              >
                {plan.mostPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#4D3E78] text-white text-xs font-medium px-4 py-1 rounded-full shadow-sm">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                    <p className={`text-sm ${plan.id === userPlanData?.plan ? 'text-white/80' : 'text-gray-500'}`}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="text-3xl font-bold">
                    {plan.price}<span className="text-base font-normal">/{plan.period}</span>
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className={`h-5 w-5 flex-shrink-0 ${
                          plan.id === userPlanData?.plan ? 'text-white' : 'text-[#4D3E78]'
                        }`} />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => plan.id !== userPlanData?.plan && handleUpgrade(plan)}
                    className={`
                      w-full py-3 rounded-xl font-medium transition-colors
                      ${plan.id === userPlanData?.plan
                        ? 'bg-white text-[#4D3E78]'
                        : 'bg-[#4D3E78] text-white hover:bg-[#4D3E78]/90'
                      }
                    `}
                  >
                    {plan.id === userPlanData?.plan ? 'Current Plan' : 'Upgrade'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Credits Packages */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Need More Credits?</h2>
                <p className="text-sm text-gray-500">Purchase additional credits anytime</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {creditPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`
                    relative p-6 rounded-xl text-center
                    ${pkg.popular 
                      ? 'bg-purple-50/50 border-2 border-[#4D3E78]' 
                      : 'bg-white border border-gray-200'
                    }
                  `}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 right-4">
                      <span className="bg-[#4D3E78] text-white text-xs px-3 py-1 rounded-full">
                        Best Value
                      </span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="text-4xl font-bold text-gray-900">{pkg.amount}</div>
                    <div className="text-gray-500">credits</div>
                    <div className="text-2xl font-bold text-gray-900">{pkg.price}</div>
                    <button
                      onClick={() => handleBuyCredits(pkg)}
                      className="w-full py-2.5 rounded-xl font-medium bg-[#4D3E78] text-white 
                        hover:bg-[#4D3E78]/90 transition-colors"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Payment Methods</h2>
              <button 
                onClick={() => navigate('/add-payment')}
                className="text-[#4D3E78] hover:text-[#4D3E78]/80 text-sm font-medium flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add New Card
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-white rounded-md flex items-center justify-center border border-gray-200">
                    <CreditCard className="h-5 w-5 text-[#4D3E78]" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">•••• •••• •••• 4242</div>
                    <div className="text-sm text-gray-500">Expires 12/24</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-purple-100 text-[#4D3E78] text-xs font-medium rounded-full">
                    Default
                  </span>
                  <button className="text-[#4D3E78] opacity-0 group-hover:opacity-100 transition-opacity">
                    Update
                  </button>
                </div>
              </div>

              {/* Ajouter une carte - visible seulement si pas de carte */}
              {false && (
                <div className="mt-4 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                      <Plus className="h-6 w-6 text-[#4D3E78]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Add a new card</p>
                      <p className="text-sm text-gray-500">Add a card to start using our services</p>
                    </div>
                    <button className="mt-2 px-4 py-2 bg-[#4D3E78] text-white rounded-lg text-sm font-medium hover:bg-[#4D3E78]/90 transition-colors">
                      Add Payment Method
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AuthLayout>
  );
}
