import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, Plus, Check } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';

interface UserPlanData {
  plan: string;
  credits: number;
  planSelectedAt: string;
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    period: 'month',
    description: 'Perfect for trying out the basics of Jobz.ai',
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
    price: '39',
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
    mostPopular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '69',
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
  },
];

const creditPackages = [
  { id: 'small', amount: 100, price: '19', popular: false },
  { id: 'medium', amount: 250, price: '39', popular: true },
  { id: 'large', amount: 500, price: '69', popular: false },
];

// Ajout d'une fonction helper pour déterminer l'action du bouton
const getButtonAction = (planId: string, currentPlanId: string | undefined) => {
  const planHierarchy = { premium: 3, standard: 2, free: 1 };
  const currentLevel = currentPlanId ? planHierarchy[currentPlanId as keyof typeof planHierarchy] : 1;
  const targetLevel = planHierarchy[planId as keyof typeof planHierarchy];

  if (planId === currentPlanId) return 'Current Plan';
  return targetLevel > currentLevel ? 'Upgrade' : 'Downgrade';
};

export default function BillingPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [userPlanData, setUserPlanData] = useState<UserPlanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (doc) => {
        if (doc.exists()) {
          setUserPlanData(doc.data() as UserPlanData);
        }
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const currentPlan = plans.find(plan => plan.id === userPlanData?.plan) || plans[0];
  const nextBillingDate = userPlanData?.planSelectedAt 
    ? new Date(new Date(userPlanData.planSelectedAt).setMonth(new Date(userPlanData.planSelectedAt).getMonth() + 1))
    : new Date(new Date().setMonth(new Date().getMonth() + 1));

  const handleUpgrade = (plan: typeof plans[0]) => {
    navigate('/payment', { state: { type: 'plan', plan } });
  };

  const handleBuyCredits = (pkg: typeof creditPackages[0]) => {
    navigate('/payment', { state: { type: 'credits', package: pkg } });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header avec résumé */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border 
          border-gray-200/50 dark:border-gray-700/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentPlan.name} Plan
              </h1>
              <p className="text-sm text-gray-500">
                Next billing date: {nextBillingDate.toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 
                rounded-lg border border-purple-100 dark:border-purple-800/20">
                <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="font-medium text-purple-900 dark:text-purple-100">
                  {userPlanData?.credits || 0} credits
                </span>
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                €{currentPlan.price}
                <span className="text-sm font-normal text-gray-500">/month</span>
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
                  ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white border-transparent' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-200'
                }
              `}
            >
              {plan.mostPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-indigo-600 
                    text-white text-xs font-medium px-4 py-1 rounded-full shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className={plan.id === userPlanData?.plan 
                    ? 'text-white/80' 
                    : 'text-gray-500 dark:text-gray-400'}>
                    {plan.description}
                  </p>
                </div>

                <div className="text-3xl font-bold">
                  €{plan.price}<span className="text-base font-normal">/{plan.period}</span>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className={`h-5 w-5 flex-shrink-0 
                        ${plan.id === userPlanData?.plan 
                          ? 'text-white' 
                          : 'text-purple-600 dark:text-purple-400'}`} 
                      />
                      <span className={plan.id === userPlanData?.plan 
                        ? 'text-white/90' 
                        : 'text-gray-600 dark:text-gray-300'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => plan.id !== userPlanData?.plan && handleUpgrade(plan)}
                  className={`
                    w-full py-3 rounded-lg font-medium transition-all
                    ${plan.id === userPlanData?.plan
                      ? 'bg-white text-purple-600 hover:bg-gray-50'
                      : getButtonAction(plan.id, userPlanData?.plan) === 'Upgrade'
                        ? 'bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-600/90 dark:hover:bg-purple-600'
                        : 'bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-600/90 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {getButtonAction(plan.id, userPlanData?.plan)}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Credits Packages */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border 
          border-gray-200/50 dark:border-gray-700/30 p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Need More Credits?
            </h2>
            <p className="text-sm text-gray-500">
              Purchase additional credits anytime
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {creditPackages.map((pkg) => (
              <div
                key={pkg.id}
                className={`
                  relative p-6 rounded-xl text-center transition-all
                  ${pkg.popular 
                    ? 'border-2 border-purple-600 dark:border-purple-400' 
                    : 'border border-gray-200 dark:border-gray-700'
                  }
                  bg-white dark:bg-gray-800
                `}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-gradient-to-r from-purple-600 to-indigo-600 
                      text-white text-xs px-3 py-1 rounded-full shadow-lg">
                      Best Value
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="text-4xl font-bold text-gray-900 dark:text-white">
                    {pkg.amount}
                  </div>
                  <div className="text-gray-500">credits</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    €{pkg.price}
                  </div>
                  <button
                    onClick={() => handleBuyCredits(pkg)}
                    className="w-full py-2.5 rounded-lg font-medium
                      bg-purple-600 text-white hover:bg-purple-700 
                      dark:bg-purple-600/90 dark:hover:bg-purple-600
                      transition-all"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border 
          border-gray-200/50 dark:border-gray-700/30">
          <div className="flex items-center justify-between p-6 border-b 
            border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Payment Methods
            </h2>
            <button 
              onClick={() => navigate('/add-payment')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                text-purple-600 hover:text-purple-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add New Card
            </button>
          </div>

          <div className="p-6">
            <div className="group p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl 
              hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-white dark:bg-gray-800 rounded-lg 
                    flex items-center justify-center border border-gray-200 dark:border-gray-700">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      •••• •••• •••• 4242
                    </div>
                    <div className="text-sm text-gray-500">
                      Expires 12/24
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full
                    bg-purple-100 dark:bg-purple-900/20 
                    text-purple-600 dark:text-purple-400">
                    Default
                  </span>
                  <button className="text-purple-600 opacity-0 group-hover:opacity-100 
                    transition-opacity">
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
