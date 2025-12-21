import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, onSnapshot, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  CreditCard, Plus, Check, Download, Calendar, TrendingUp,
  Zap, FileText, Target, Activity, Loader2
} from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { getCreditHistory, type CreditHistoryEntry } from '../lib/creditHistory';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { redirectToStripeCheckout } from '../services/stripe';
import { toast } from 'react-hot-toast';
import { generateInvoicePDF } from '../lib/invoiceGenerator';

interface UserPlanData {
  plan: string;
  credits: number;
  planSelectedAt: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
}

interface BillingInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  planName: string;
  type: 'plan' | 'credits';
  status: 'paid' | 'pending' | 'failed';
  invoiceUrl: string | null;
  invoicePdfUrl: string | null;
  createdAt: Date;
}

// Minimalist coin icon component
const CoinIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 6v12M9 9c0-1 1-2 3-2s3 1 3 2-1 2-3 2-3 1-3 2 1 2 3 2 3-1 3-2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Plans matching landing page
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

const creditPackages = [
  { id: 'small', amount: 100, price: '19', popular: false },
  { id: 'medium', amount: 250, price: '39', popular: true },
  { id: 'large', amount: 500, price: '69', popular: false },
];

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [processingPackageId, setProcessingPackageId] = useState<string | null>(null);
  const [isBiMonthly, setIsBiMonthly] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      async (doc) => {
        if (doc.exists()) {
          const data = doc.data() as UserPlanData;
          setUserPlanData(data);

          const history = await getCreditHistory(currentUser.uid, 100);
          setCreditHistory(history);

          const currentPlan = plans.find(p => p.id === data.plan) || plans[0];
          const currentCredits = data.credits || 0;

          const planStartDate = data.planSelectedAt
            ? new Date(data.planSelectedAt)
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

          const daysSinceStart = Math.max(1, Math.floor((Date.now() - planStartDate.getTime()) / (1000 * 60 * 60 * 24)));

          const cycleHistory = history.filter(entry => {
            const entryDate = entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp);
            return entryDate >= planStartDate;
          });

          const creditsUsed = cycleHistory
            .filter(entry => entry.change < 0)
            .reduce((sum, entry) => sum + Math.abs(entry.change), 0);

          const planCredits = currentPlan.creditsValue;
          const usagePercentage = planCredits > 0
            ? Math.min(100, (creditsUsed / planCredits) * 100)
            : 0;

          const averagePerDay = daysSinceStart > 0
            ? creditsUsed / daysSinceStart
            : 0;

          setUsageStats({
            creditsUsed,
            creditsRemaining: currentCredits,
            usagePercentage: Math.max(0, Math.min(100, usagePercentage)),
            averagePerDay: Math.round(averagePerDay * 10) / 10,
          });

          const usageData = history
            .filter(h => h.change < 0)
            .slice(0, 30)
            .reverse()
            .map((entry) => ({
              date: entry.timestamp instanceof Date
                ? entry.timestamp.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
                : new Date(entry.timestamp).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
              credits: Math.abs(entry.change),
            }));

          setCreditUsage(usageData);

          // Fetch invoices from subcollection
          const invoicesRef = collection(db, 'users', currentUser.uid, 'invoices');
          const invoicesQuery = query(invoicesRef, orderBy('createdAt', 'desc'));
          const invoicesSnapshot = await getDocs(invoicesQuery);

          const fetchedInvoices: BillingInvoice[] = invoicesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              invoiceNumber: data.invoiceNumber || `INV-${doc.id.slice(0, 8).toUpperCase()}`,
              amount: data.amount || 0,
              currency: data.currency || 'eur',
              planName: data.planName || data.plan || 'Unknown',
              type: data.type || 'plan',
              status: data.status || 'paid',
              invoiceUrl: data.invoiceUrl || null,
              invoicePdfUrl: data.invoicePdfUrl || null,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            };
          });

          setInvoices(fetchedInvoices);
        }
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const currentPlan = plans.find(plan => plan.id === userPlanData?.plan) || plans[0];

  // Calculate next billing date - should always be in the future
  const getNextBillingDate = () => {
    const now = new Date();
    let billingDate: Date;

    if (userPlanData?.planSelectedAt) {
      billingDate = new Date(userPlanData.planSelectedAt);
      // Keep adding months until we get a future date
      while (billingDate <= now) {
        billingDate.setMonth(billingDate.getMonth() + 1);
      }
    } else {
      // Default to 1 month from now
      billingDate = new Date();
      billingDate.setMonth(billingDate.getMonth() + 1);
    }

    return billingDate;
  };

  const nextBillingDate = getNextBillingDate();

  const handleUpgrade = async (plan: typeof plans[0]) => {
    if (!currentUser) {
      toast.error('Please sign in to continue');
      navigate('/login');
      return;
    }

    if (isProcessing) return;

    setIsProcessing(true);
    setProcessingPlanId(plan.id);
    toast.loading('Preparing checkout...', { id: 'checkout' });

    try {
      const price = isBiMonthly ? plan.price.biMonthly : plan.price.monthly;
      await redirectToStripeCheckout({
        userId: currentUser.uid,
        planId: plan.id,
        planName: plan.name,
        price: price.toString(),
        credits: plan.creditsValue,
        type: 'plan',
        customerEmail: currentUser.email || undefined,
      });
      toast.success('Redirecting to payment...', { id: 'checkout' });
    } catch (error: any) {
      console.error('Error initiating checkout:', error);
      toast.error(error.message || 'Failed to initiate payment.', { id: 'checkout' });
      setIsProcessing(false);
      setProcessingPlanId(null);
    }
  };

  const handleBuyCredits = async (pkg: typeof creditPackages[0]) => {
    if (!currentUser) {
      toast.error('Please sign in to continue');
      navigate('/login');
      return;
    }

    if (isProcessing) return;

    setIsProcessing(true);
    setProcessingPackageId(pkg.id);
    toast.loading('Preparing checkout...', { id: 'checkout' });

    try {
      await redirectToStripeCheckout({
        userId: currentUser.uid,
        planId: pkg.id,
        planName: `${pkg.amount} Credits`,
        price: pkg.price,
        credits: pkg.amount,
        type: 'credits',
        customerEmail: currentUser.email || undefined,
      });
      toast.success('Redirecting to payment...', { id: 'checkout' });
    } catch (error: any) {
      console.error('Error initiating checkout:', error);
      toast.error(error.message || 'Failed to initiate payment.', { id: 'checkout' });
      setIsProcessing(false);
      setProcessingPackageId(null);
    }
  };

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-[#635bff]" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="py-8 space-y-10">
        {/* Current Plan Summary - Minimal card */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-gray-200 dark:border-[#3d3c3e]">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-[#2b2a2c] flex items-center justify-center text-gray-700 dark:text-gray-300">
                {currentPlan.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{currentPlan.name} Cubber</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Current plan</p>
              </div>
            </div>
            {currentPlan.id !== 'free' && (
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>Next billing: {nextBillingDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">Credits</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{userPlanData?.credits || 0}</div>
            </div>
            <div className="h-10 w-px bg-gray-200 dark:bg-[#3d3c3e]"></div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">Monthly</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">€{currentPlan.price.monthly}</div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Minimal cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-[#2b2a2c] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Usage</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{usageStats.usagePercentage.toFixed(0)}%</div>
            <div className="w-full bg-gray-200 dark:bg-[#3d3c3e] rounded-full h-1.5 mt-3">
              <div
                className="bg-[#635bff] h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${usageStats.usagePercentage}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-[#2b2a2c] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Used</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{usageStats.creditsUsed}</div>
            <div className="text-sm text-gray-500 mt-1">this month</div>
          </div>

          <div className="bg-gray-50 dark:bg-[#2b2a2c] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Remaining</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{usageStats.creditsRemaining}</div>
            <div className="text-sm text-gray-500 mt-1">available</div>
          </div>

          <div className="bg-gray-50 dark:bg-[#2b2a2c] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Daily Avg</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{usageStats.averagePerDay}</div>
            <div className="text-sm text-gray-500 mt-1">per day</div>
          </div>
        </div>

        {/* Chart */}
        {creditUsage.length > 0 && (
          <div className="bg-gray-50 dark:bg-[#2b2a2c] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Credit Usage</h2>
            <p className="text-sm text-gray-500 mb-6">Last 30 days</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={creditUsage}>
                <defs>
                  <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#635bff" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#635bff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="credits"
                  stroke="#635bff"
                  fillOpacity={1}
                  fill="url(#colorCredits)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Plans Section */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
              Choose your plan
            </h2>

            {/* Toggle */}
            <div className="flex items-center justify-center">
              <div className="inline-flex items-center bg-gray-100 dark:bg-[#2b2a2c] p-1 rounded-full">
                <button
                  onClick={() => setIsBiMonthly(false)}
                  className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all duration-200 ${!isBiMonthly
                    ? 'bg-white dark:bg-[#3d3c3e] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                >
                  Pay monthly
                </button>
                <button
                  onClick={() => setIsBiMonthly(true)}
                  className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all duration-200 flex items-center gap-2 ${isBiMonthly
                    ? 'bg-white dark:bg-[#3d3c3e] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                >
                  <span>Pay every 2 months</span>
                  <span className="text-[#635bff] font-medium">save ~10%</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Cards - Notion style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan, index) => {
              const isCurrentPlan = plan.id === userPlanData?.plan;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`
                    bg-gray-50 dark:bg-[#2b2a2c] rounded-xl p-6 relative transition-all duration-300
                    ${isCurrentPlan
                      ? 'ring-2 ring-[#635bff]'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-750'
                    }
                  `}
                  style={{ display: 'grid', gridTemplateRows: 'auto auto auto 1fr auto' }}
                >
                  {plan.popular && !isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[11px] font-bold rounded-full uppercase tracking-wider">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 rounded-full bg-[#635bff] flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-white dark:bg-[#3d3c3e] shadow-sm border border-gray-100 dark:border-[#3d3c3e] text-gray-700 dark:text-gray-300">
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
                      <span className="text-sm font-medium text-gray-500">
                        {plan.price.monthly === 0 ? '/forever' : isBiMonthly ? '/2 months' : '/month'}
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-[#635bff]/10 text-[#635bff]">
                      <CoinIcon className="w-4 h-4" />
                      <span>{plan.credits}/month</span>
                    </div>
                  </div>

                  {/* Features list */}
                  <div className="space-y-3 mb-6">
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

                  {/* CTA Button */}
                  <button
                    onClick={() => !isCurrentPlan && plan.id !== 'free' && handleUpgrade(plan)}
                    disabled={isCurrentPlan || (isProcessing && processingPlanId === plan.id)}
                    className={`
                      w-full py-3 rounded-xl text-sm font-bold transition-all
                      ${isCurrentPlan
                        ? 'bg-white dark:bg-[#3d3c3e] text-gray-500 cursor-default border border-gray-200 dark:border-[#3d3c3e]'
                        : isProcessing && processingPlanId === plan.id
                          ? 'bg-[#635bff] text-white opacity-75 cursor-wait'
                          : plan.popular
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                            : plan.name === 'Pro'
                              ? 'bg-[#635bff] text-white hover:brightness-110'
                              : 'bg-white dark:bg-[#3d3c3e] text-gray-900 dark:text-white border border-gray-200 dark:border-[#3d3c3e] hover:bg-gray-50 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    {isCurrentPlan ? (
                      'Current Plan'
                    ) : isProcessing && processingPlanId === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      plan.cta
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Credit Packages */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Need More Credits?</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Purchase additional credits anytime. Credits never expire.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {creditPackages.map((pkg) => (
              <div
                key={pkg.id}
                className={`
                  bg-gray-50 dark:bg-[#2b2a2c] rounded-xl p-6 text-center relative transition-all
                  ${pkg.popular ? 'ring-2 ring-[#635bff]' : ''}
                `}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-[#635bff] text-white text-[11px] font-bold rounded-full">
                      Best Value
                    </span>
                  </div>
                )}

                <div className="text-4xl font-black text-gray-900 dark:text-white mb-1">
                  {pkg.amount}
                </div>
                <div className="text-sm text-gray-500 mb-4">credits</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">€{pkg.price}</div>
                <div className="text-sm text-gray-500 mb-6">
                  €{(parseFloat(pkg.price) / pkg.amount * 100).toFixed(2)} per 100
                </div>
                <button
                  onClick={() => handleBuyCredits(pkg)}
                  disabled={isProcessing && processingPackageId === pkg.id}
                  className="w-full py-3 rounded-xl text-sm font-bold bg-[#635bff] text-white hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing && processingPackageId === pkg.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Buy Now'
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods - Minimal */}
        <div className="border-t border-gray-200 dark:border-[#3d3c3e] pt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Methods</h2>
              <p className="text-sm text-gray-500">Manage your billing</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#635bff] hover:bg-[#635bff]/5 rounded-lg transition-colors">
              <Plus className="h-4 w-4" />
              Add Card
            </button>
          </div>

          <div className="bg-gray-50 dark:bg-[#2b2a2c] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-white dark:bg-[#3d3c3e] rounded-lg flex items-center justify-center border border-gray-200 dark:border-[#3d3c3e]">
                  <CreditCard className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">•••• •••• •••• 4242</div>
                  <div className="text-sm text-gray-500">Expires 12/24</div>
                </div>
              </div>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-[#635bff]/10 text-[#635bff]">
                Default
              </span>
            </div>
          </div>
        </div>

        {/* Billing History - Minimal */}
        <div className="border-t border-gray-200 dark:border-[#3d3c3e] pt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Billing History</h2>
          <p className="text-sm text-gray-500 mb-6">View and download invoices</p>

          {invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#2b2a2c] rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#3d3c3e] flex items-center justify-center">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {invoice.planName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {invoice.invoiceNumber} • {invoice.createdAt.toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {invoice.currency === 'eur' ? '€' : '$'}{invoice.amount.toFixed(2)}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${invoice.status === 'paid'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        : invoice.status === 'failed'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                        }`}>
                        {invoice.status}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        generateInvoicePDF(
                          {
                            invoiceNumber: invoice.invoiceNumber,
                            date: invoice.createdAt,
                            planName: invoice.planName,
                            amount: invoice.amount,
                            currency: invoice.currency,
                            status: invoice.status,
                          },
                          currentUser?.email || 'customer@email.com',
                          userPlanData?.fullName || (userPlanData?.firstName && userPlanData?.lastName
                            ? `${userPlanData.firstName} ${userPlanData.lastName}`
                            : userPlanData?.firstName) || currentUser?.displayName || undefined
                        );
                        toast.success('Invoice downloaded!');
                      }}
                      className="p-2 text-gray-400 hover:text-[#635bff] hover:bg-[#635bff]/10 rounded-lg transition-colors"
                      title="Download Invoice PDF"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-[#2b2a2c] rounded-xl">
              <FileText className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No billing history yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Invoices will appear here after your first payment</p>
            </div>
          )}
        </div>
      </div>
    </AuthLayout >
  );
}
