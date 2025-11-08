import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, onSnapshot, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  CreditCard, Plus, Check, Download, Calendar, TrendingUp, 
  Zap, BarChart3, Users, FileText, Mail, Target, Sparkles,
  ArrowRight, Crown, Gift, AlertCircle, Clock, Activity,
  PieChart, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { getCreditHistory, type CreditHistoryEntry } from '../lib/creditHistory';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface UserPlanData {
  plan: string;
  credits: number;
  planSelectedAt: string;
}

interface BillingInvoice {
  id: string;
  date: string;
  amount: number;
  plan: string;
  status: 'paid' | 'pending' | 'failed';
  invoiceUrl?: string;
}

// Plans optimisés basés sur les features réelles de l'application
const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    period: 'month',
    credits: 25,
    description: 'Perfect for trying out the basics of Jobz.ai',
    icon: Gift,
    color: 'gray',
    features: [
      { text: '25 Credits / month', included: true },
      { text: 'Basic Job Application Templates', included: true },
      { text: 'AI-Powered Cover Letter Assistance', included: true },
      { text: 'Application Tracking Dashboard', included: true },
      { text: 'Standard Email Support', included: true },
      { text: 'CV Analysis (Limited)', included: true },
      { text: 'Interview Prep (Basic)', included: true },
      { text: 'Advanced Analytics', included: false },
      { text: 'Automated Campaigns', included: false },
      { text: 'Priority Support', included: false },
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '39',
    period: 'month',
    credits: 500,
    description: 'Ideal for regular job seekers who need more credits and features.',
    icon: Zap,
    color: 'purple',
    mostPopular: true,
    features: [
      { text: '500 Credits / month', included: true, highlight: true },
      { text: 'All Free Features', included: true },
      { text: 'Automated Campaigns for targeted job applications', included: true },
      { text: 'Basic Analytics (open rates, response rates)', included: true },
      { text: 'AI-Generated Personalized Content', included: true },
      { text: 'Advanced Email Templates', included: true },
      { text: 'Priority Email Support', included: true },
      { text: 'CV Analysis (Unlimited)', included: true },
      { text: 'Interview Prep (Advanced)', included: true },
      { text: 'Job Recommendations', included: true },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '69',
    period: 'month',
    credits: 999999,
    description: 'Designed for power users needing high-volume applications and advanced features.',
    icon: Crown,
    color: 'indigo',
    features: [
      { text: 'Unlimited Credits', included: true, highlight: true },
      { text: 'All Standard Features', included: true },
      { text: 'Premium AI Templates Library', included: true },
      { text: 'Advanced Analytics Dashboard', included: true },
      { text: 'Custom Integration Options', included: true },
      { text: 'Priority Support 24/7', included: true },
      { text: 'Team Collaboration Tools', included: true },
      { text: 'API Access', included: true },
      { text: 'White-label Options', included: true },
      { text: 'Dedicated Account Manager', included: true },
    ],
  },
];

const creditPackages = [
  { id: 'small', amount: 100, price: '19', popular: false, savings: 0 },
  { id: 'medium', amount: 250, price: '39', popular: true, savings: 10 },
  { id: 'large', amount: 500, price: '69', popular: false, savings: 15 },
];

// Helper function pour déterminer l'action du bouton
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
  const [creditHistory, setCreditHistory] = useState<CreditHistoryEntry[]>([]);
  const [creditUsage, setCreditUsage] = useState<Array<{ date: string; credits: number }>>([]);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [usageStats, setUsageStats] = useState({
    creditsUsed: 0,
    creditsRemaining: 0,
    usagePercentage: 0,
    averagePerDay: 0,
  });

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      async (doc) => {
        if (doc.exists()) {
          const data = doc.data() as UserPlanData;
          setUserPlanData(data);
          
          // Charger l'historique des crédits
          const history = await getCreditHistory(currentUser.uid, 30);
          setCreditHistory(history);
          
          // Calculer les statistiques d'usage
          const currentPlan = plans.find(p => p.id === data.plan) || plans[0];
          const creditsUsed = currentPlan.credits - (data.credits || 0);
          const usagePercentage = currentPlan.credits > 0 
            ? (creditsUsed / currentPlan.credits) * 100 
            : 0;
          
          // Calculer la moyenne par jour (basé sur le mois écoulé)
          const daysSinceStart = data.planSelectedAt 
            ? Math.max(1, Math.floor((Date.now() - new Date(data.planSelectedAt).getTime()) / (1000 * 60 * 60 * 24)))
            : 30;
          const averagePerDay = creditsUsed / daysSinceStart;
          
          setUsageStats({
            creditsUsed,
            creditsRemaining: data.credits || 0,
            usagePercentage: Math.min(100, usagePercentage),
            averagePerDay: Math.round(averagePerDay * 10) / 10,
          });
          
          // Préparer les données pour le graphique
          const usageData = history
            .filter(h => h.change < 0) // Seulement les déductions
            .slice(0, 30)
            .reverse()
            .map((entry, index) => ({
              date: entry.timestamp instanceof Date 
                ? entry.timestamp.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
                : new Date(entry.timestamp).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
              credits: Math.abs(entry.change),
            }));
          
          setCreditUsage(usageData);
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
      <AuthLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header avec résumé du plan actuel */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <currentPlan.icon className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{currentPlan.name} Plan</h1>
                  <p className="text-purple-100 text-sm">Active subscription</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-purple-100">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Next billing: {nextBillingDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-sm text-purple-100">Current Credits</div>
                <div className="text-3xl font-bold">{userPlanData?.credits || 0}</div>
              </div>
              <div className="h-12 w-px bg-white/20"></div>
              <div className="text-right">
                <div className="text-sm text-purple-100">Monthly Price</div>
                <div className="text-3xl font-bold">€{currentPlan.price}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Statistiques d'usage */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/30 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs font-medium text-gray-500">Usage</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {usageStats.usagePercentage.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div 
                className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${usageStats.usagePercentage}%` }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/30 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-medium text-gray-500">Used</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {usageStats.creditsUsed}
            </div>
            <div className="text-sm text-gray-500 mt-1">credits this month</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/30 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs font-medium text-gray-500">Remaining</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {usageStats.creditsRemaining}
            </div>
            <div className="text-sm text-gray-500 mt-1">credits available</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/30 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-xs font-medium text-gray-500">Daily Avg</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {usageStats.averagePerDay}
            </div>
            <div className="text-sm text-gray-500 mt-1">credits per day</div>
          </motion.div>
        </div>

        {/* Graphique d'usage des crédits */}
        {creditUsage.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/30 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Credit Usage</h2>
                <p className="text-sm text-gray-500">Last 30 days activity</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={creditUsage}>
                <defs>
                  <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#6B7280' }}
                  className="text-xs"
                />
                <YAxis 
                  tick={{ fill: '#6B7280' }}
                  className="text-xs"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="credits" 
                  stroke="#8B5CF6" 
                  fillOpacity={1}
                  fill="url(#colorCredits)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Plans Grid */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Choose Your Plan
            </h2>
            <p className="text-gray-500">
              Select the plan that best fits your job search needs
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              const isCurrentPlan = plan.id === userPlanData?.plan;
              const buttonAction = getButtonAction(plan.id, userPlanData?.plan);
              
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`
                    relative p-8 rounded-2xl border-2 transition-all duration-300 flex flex-col h-full
                    ${isCurrentPlan 
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white border-transparent shadow-2xl scale-105' 
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-xl'
                    }
                  `}
                >
                  {plan.mostPopular && !isCurrentPlan && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-purple-600 to-indigo-600 
                        text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col h-full space-y-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-3 rounded-xl ${
                            isCurrentPlan 
                              ? 'bg-white/20 backdrop-blur-sm' 
                              : plan.color === 'purple' 
                                ? 'bg-purple-100 dark:bg-purple-900/30'
                                : plan.color === 'indigo'
                                ? 'bg-indigo-100 dark:bg-indigo-900/30'
                                : 'bg-gray-100 dark:bg-gray-900/30'
                          }`}>
                            <Icon className={`h-6 w-6 ${
                              isCurrentPlan 
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
                            {isCurrentPlan && (
                              <span className="text-xs text-purple-100 bg-white/20 px-2 py-0.5 rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                        </div>
                        <p className={`text-sm mt-2 ${
                          isCurrentPlan ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {plan.description}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-4xl font-bold ${
                          isCurrentPlan ? 'text-white' : 'text-gray-900 dark:text-white'
                        }`}>
                          €{plan.price}
                        </span>
                        <span className={`text-base ${
                          isCurrentPlan ? 'text-white/70' : 'text-gray-500'
                        }`}>
                          /{plan.period}
                        </span>
                      </div>
                      <div className={`text-sm mt-1 ${
                        isCurrentPlan ? 'text-white/70' : 'text-gray-500'
                      }`}>
                        {plan.credits === 999999 ? 'Unlimited' : `${plan.credits.toLocaleString()} credits`}
                      </div>
                    </div>

                    <ul className="space-y-3 flex-grow">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          {feature.included ? (
                            <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                              isCurrentPlan 
                                ? 'text-white' 
                                : 'text-purple-600 dark:text-purple-400'
                            }`} />
                          ) : (
                            <div className={`h-5 w-5 flex-shrink-0 mt-0.5 rounded-full border-2 ${
                              isCurrentPlan 
                                ? 'border-white/30' 
                                : 'border-gray-300 dark:border-gray-600'
                            }`} />
                          )}
                          <span className={`text-sm ${
                            feature.highlight 
                              ? 'font-semibold' 
                              : ''
                          } ${
                            isCurrentPlan 
                              ? feature.included ? 'text-white/90' : 'text-white/50 line-through' 
                              : feature.included ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600 line-through'
                          }`}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => !isCurrentPlan && handleUpgrade(plan)}
                      disabled={isCurrentPlan}
                      className={`
                        w-full py-3.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 mt-auto
                        ${isCurrentPlan
                          ? 'bg-white text-purple-600 hover:bg-gray-50 cursor-default'
                          : buttonAction === 'Upgrade'
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                            : 'bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-600/90 dark:hover:bg-gray-600'
                        }
                      `}
                    >
                      {isCurrentPlan ? (
                        <>
                          <Check className="h-5 w-5" />
                          Current Plan
                        </>
                      ) : (
                        <>
                          {buttonAction}
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Credits Packages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/30 p-8"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Need More Credits?
            </h2>
            <p className="text-gray-500">
              Purchase additional credits anytime. Credits never expire.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {creditPackages.map((pkg) => (
              <motion.div
                key={pkg.id}
                whileHover={{ scale: 1.02 }}
                className={`
                  relative p-6 rounded-xl text-center transition-all border-2
                  ${pkg.popular 
                    ? 'border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }
                `}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-gradient-to-r from-purple-600 to-indigo-600 
                      text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                      Best Value
                    </span>
                  </div>
                )}

                {pkg.savings > 0 && (
                  <div className="absolute -top-3 left-4">
                    <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                      Save {pkg.savings}%
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="text-5xl font-bold text-gray-900 dark:text-white">
                    {pkg.amount.toLocaleString()}
                  </div>
                  <div className="text-gray-500 text-sm">credits</div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      €{pkg.price}
                    </div>
                    <div className="text-sm text-gray-500">
                      €{(parseFloat(pkg.price) / pkg.amount * 100).toFixed(2)} per 100 credits
                    </div>
                  </div>
                  <button
                    onClick={() => handleBuyCredits(pkg)}
                    className="w-full py-3 rounded-xl font-semibold
                      bg-gradient-to-r from-purple-600 to-indigo-600 text-white 
                      hover:from-purple-700 hover:to-indigo-700 
                      dark:bg-purple-600/90 dark:hover:bg-purple-600
                      transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Buy Now
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/30"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Payment Methods
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Manage your payment methods and billing information
              </p>
            </div>
            <button 
              onClick={() => navigate('/add-payment')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                text-purple-600 hover:text-purple-700 dark:text-purple-400 
                dark:hover:text-purple-300 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add New Card
            </button>
          </div>

          <div className="p-6">
            <div className="group p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl 
              hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-10 bg-white dark:bg-gray-800 rounded-lg 
                    flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-sm">
                    <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      •••• •••• •••• 4242
                    </div>
                    <div className="text-sm text-gray-500">
                      Expires 12/24
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 text-xs font-medium rounded-full
                    bg-purple-100 dark:bg-purple-900/20 
                    text-purple-600 dark:text-purple-400">
                    Default
                  </span>
                  <button className="text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 
                    transition-opacity text-sm font-medium">
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Billing History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/30"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Billing History
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                View and download your invoices
              </p>
            </div>
          </div>

          <div className="p-6">
            {invoices.length > 0 ? (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {invoice.plan} Plan - {invoice.date}
                        </div>
                        <div className="text-sm text-gray-500">
                          Invoice #{invoice.id}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          €{invoice.amount.toFixed(2)}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                          invoice.status === 'paid' 
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                            : invoice.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {invoice.status}
                        </div>
                      </div>
                      <button className="p-2 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                        <Download className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No billing history yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Your invoices will appear here once you make a purchase
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AuthLayout>
  );
}
