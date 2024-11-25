import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Send, BarChart, TrendingUp, Loader2, RefreshCw, ChevronRight, Download } from 'lucide-react';
import { doc, collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import FloatingCredits from '../components/FloatingCredits';
import PremiumFeatureOverlay from '../components/PremiumFeatureOverlay';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface CampaignData {
  title: string;
  launchDate: string;
  candidatesReached: number;
  responses: number;
  status: 'active' | 'completed';
}

interface DashboardStats {
  credits: number;
  creditsChange: number;
  applicationsSent: number;
  applicationsChange: number;
  responseRate: number;
  responseRateChange: number;
  activeCampaigns: number;
  campaignsChange: number;
  totalCampaigns: number;
  averageResponseRate: number;
  totalCandidates: number;
  conversionRate: number;
  historicalData: {
    date: string;
    value: number;
  }[];
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
    campaignsChange: 0,
    totalCampaigns: 0,
    averageResponseRate: 0,
    totalCandidates: 0,
    conversionRate: 0,
    historicalData: []
  });
  const [userData, setUserData] = useState<UserData>({ credits: 0 });
  const [creditDiff, setCreditDiff] = useState(0);
  const [triggerPosition, setTriggerPosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const creditElementRef = useRef<HTMLDivElement>(null);
  const previousCredits = useRef(stats.credits);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      // Get user's campaigns
      const campaignsRef = collection(db, 'users', currentUser?.uid || '', 'campaigns');
      const campaignsQuery = query(campaignsRef);
      const campaignsSnapshot = await getDocs(campaignsQuery);
      
      // Calculate campaign stats
      let totalApplications = 0;
      let totalResponses = 0;
      let activeCampaigns = 0;
      let totalCandidatesCount = 0;
      
      const campaignsList: CampaignData[] = [];
      
      campaignsSnapshot.forEach(doc => {
        const campaign = doc.data() as CampaignData;
        campaignsList.push(campaign);
        totalApplications += campaign.candidatesReached || 0;
        totalResponses += campaign.responses || 0;
        totalCandidatesCount += campaign.candidatesReached || 0;
        if (campaign.status === 'active') {
          activeCampaigns++;
        }
      });

      setCampaigns(campaignsList);

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
              ...prev,
              credits: data.credits || 0,
              creditsChange: diff,
              applicationsSent: totalApplications,
              applicationsChange: totalApplications - (prev.applicationsSent || 0),
              responseRate: parseFloat(responseRate.toFixed(1)),
              responseRateChange: responseRate - (prev.responseRate || 0),
              activeCampaigns,
              campaignsChange: activeCampaigns - (prev.activeCampaigns || 0),
              totalCampaigns: campaignsList.length,
              averageResponseRate: responseRate,
              totalCandidates: totalCandidatesCount,
              conversionRate: totalResponses > 0 ? (totalResponses / totalCandidatesCount) * 100 : 0,
              historicalData: [...prev.historicalData, { date: new Date().toISOString(), value: responseRate }]
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

  useEffect(() => {
    if (!currentUser) return;
    fetchStats();
  }, [currentUser]);

  const hasPremiumAccess = userData.plan === 'standard' || userData.plan === 'premium';

  const overviewMetrics = [
    {
      name: 'Total Campaigns',
      value: stats.totalCampaigns,
      change: stats.campaignsChange,
      historicalData: stats.historicalData
    },
    {
      name: 'Average Response Rate',
      value: `${stats.averageResponseRate.toFixed(1)}%`,
      change: stats.responseRateChange,
      historicalData: stats.historicalData
    },
    {
      name: 'Total Candidates',
      value: stats.totalCandidates,
      change: 0, // Calculer le changement si nécessaire
      historicalData: stats.historicalData
    },
    {
      name: 'Conversion Rate',
      value: `${stats.conversionRate.toFixed(1)}%`,
      change: 0, // Calculer le changement si nécessaire
      historicalData: stats.historicalData
    }
  ];

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

  const refreshDashboard = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/refresh-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.uid })
      });
      // Mettre à jour les données
      await fetchStats();
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

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
          {/* Header avec bouton refresh */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-500">Campaign performance overview</p>
            </div>
            <button
              onClick={refreshDashboard}
              className="flex items-center px-4 py-2 rounded-lg bg-white shadow"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Overview Section avec Sparklines */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {overviewMetrics.map((metric) => (
              <div key={metric.name} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm text-gray-500">{metric.name}</h3>
                <div className="mt-2 flex items-baseline">
                  <p className="text-2xl font-semibold">{metric.value}</p>
                  <span className={`ml-2 text-sm ${metric.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </span>
                </div>
                <div className="h-16 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metric.historicalData}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Campaigns Section */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Recent Campaigns</h2>
                <button className="text-purple-600 hover:text-purple-700 text-sm flex items-center">
                  View all <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* ... table content ... */}
              </table>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* ... analytics charts ... */}
          </div>

          {/* Suggestions Section */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
            {/* ... suggestions content ... */}
          </div>
        </motion.div>
      </div>
    </AuthLayout>
  );
}
