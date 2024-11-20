import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Send, BarChart, TrendingUp, Loader2 } from 'lucide-react';
import { doc, collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import FloatingCredits from '../components/FloatingCredits';
import PremiumFeatureOverlay from '../components/PremiumFeatureOverlay';

interface DashboardStats {
  credits: number;
  creditsChange: number;
  applicationsSent: number;
  applicationsChange: number;
  responseRate: number;
  responseRateChange: number;
  activeCampaigns: number;
  campaignsChange: number;
}

interface UserData {
  plan?: string;
  credits: number;
}

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    credits: 0,
    creditsChange: 0,
    applicationsSent: 0,
    applicationsChange: 0,
    responseRate: 0,
    responseRateChange: 0,
    activeCampaigns: 0,
    campaignsChange: 0
  });
  const [userData, setUserData] = useState<UserData>({ credits: 0 });
  const [creditDiff, setCreditDiff] = useState(0);
  const [triggerPosition, setTriggerPosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const creditElementRef = useRef<HTMLDivElement>(null);
  const previousCredits = useRef(stats.credits);

  useEffect(() => {
    if (!currentUser) return;

    const fetchStats = async () => {
      try {
        // Get user's campaigns
        const campaignsRef = collection(db, 'users', currentUser.uid, 'campaigns');
        const campaignsQuery = query(campaignsRef);
        const campaignsSnapshot = await getDocs(campaignsQuery);
        
        // Calculate campaign stats
        let totalApplications = 0;
        let totalResponses = 0;
        let activeCampaigns = 0;
        
        campaignsSnapshot.forEach(doc => {
          const campaign = doc.data();
          totalApplications += campaign.emailsSent || 0;
          totalResponses += campaign.responses || 0;
          if (campaign.status === 'active') {
            activeCampaigns++;
          }
        });

        // Calculate response rate
        const responseRate = totalApplications > 0 
          ? (totalResponses / totalApplications) * 100 
          : 0;

        // Subscribe to user document for real-time updates
        const unsubscribeUser = onSnapshot(
          doc(db, 'users', currentUser.uid),
          (doc) => {
            if (doc.exists()) {
              const data = doc.data() as UserData;
              setUserData(data);
              
              // Calculate credit difference for animation
              const diff = (data.credits || 0) - previousCredits.current;
              if (diff !== 0 && creditElementRef.current) {
                const rect = creditElementRef.current.getBoundingClientRect();
                setTriggerPosition({
                  x: rect.left + rect.width / 2,
                  y: rect.top + rect.height / 2
                });
                setCreditDiff(diff);
              }
              previousCredits.current = data.credits || 0;

              // Update all stats
              setStats(prev => ({
                credits: data.credits || 0,
                creditsChange: diff,
                applicationsSent: totalApplications,
                applicationsChange: totalApplications - (prev.applicationsSent || 0),
                responseRate: parseFloat(responseRate.toFixed(1)),
                responseRateChange: responseRate - (prev.responseRate || 0),
                activeCampaigns,
                campaignsChange: activeCampaigns - (prev.activeCampaigns || 0)
              }));
            }
            setIsLoading(false);
          }
        );

        return () => {
          unsubscribeUser();
        };
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [currentUser]);

  const hasPremiumAccess = userData.plan === 'standard' || userData.plan === 'premium';

  const statsConfig = [
    {
      name: 'Credits Remaining',
      value: stats.credits.toString(),
      change: stats.creditsChange > 0 ? `+${stats.creditsChange}` : stats.creditsChange.toString(),
      changeType: stats.creditsChange >= 0 ? 'increase' as const : 'decrease' as const,
      icon: CreditCard,
      ref: creditElementRef
    },
    {
      name: 'Applications Sent',
      value: stats.applicationsSent.toString(),
      change: stats.applicationsChange > 0 ? `+${stats.applicationsChange}` : stats.applicationsChange.toString(),
      changeType: stats.applicationsChange >= 0 ? 'increase' as const : 'decrease' as const,
      icon: Send,
    },
    {
      name: 'Response Rate',
      value: `${stats.responseRate}%`,
      change: `${stats.responseRateChange > 0 ? '+' : ''}${stats.responseRateChange.toFixed(1)}%`,
      changeType: stats.responseRateChange >= 0 ? 'increase' as const : 'decrease' as const,
      icon: BarChart,
    },
    {
      name: 'Active Campaigns',
      value: stats.activeCampaigns.toString(),
      change: stats.campaignsChange > 0 ? `+${stats.campaignsChange}` : stats.campaignsChange.toString(),
      changeType: stats.campaignsChange >= 0 ? 'increase' as const : 'decrease' as const,
      icon: TrendingUp,
    },
  ];

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8D75E6]"></div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header amélioré */}
          <div className="mb-12">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#8D75E6] to-[#A990FF] text-transparent bg-clip-text mb-3">
              Dashboard
            </h1>
            <p className="text-lg text-gray-400">
              Track your job application performance and analytics
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {statsConfig.map((stat, index) => (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white overflow-hidden shadow rounded-lg"
                ref={index === 0 ? creditElementRef : undefined}
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <stat.icon className="h-6 w-6 text-[#4D3E78]" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {stat.name}
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stat.value}
                          </div>
                          {stat.change !== '0' && (
                            <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                              stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {stat.change}
                            </div>
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {!hasPremiumAccess && (
            <PremiumFeatureOverlay
              title="Unlock Advanced Analytics"
              description="Upgrade to Standard or Premium plan to access detailed analytics, response rate tracking, and campaign performance insights."
            />
          )}

          {/* Floating Credits Animation */}
          <FloatingCredits 
            value={creditDiff} 
            triggerPosition={triggerPosition}
          />
        </motion.div>
      </div>
    </AuthLayout>
  );
}
