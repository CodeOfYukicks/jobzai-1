import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Send, TrendingUp, Loader2, RefreshCw, ChevronRight, Download, LayoutGrid, Users, Target, Inbox, Mail, MessageSquare } from 'lucide-react';
import { doc, collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import FloatingCredits from '../components/FloatingCredits';
import PremiumFeatureOverlay from '../components/PremiumFeatureOverlay';
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, 
  Tooltip, AreaChart, Area, BarChart, Bar, ComposedChart
} from 'recharts';
import { Link } from 'react-router-dom';

interface CampaignData {
  id?: string;
  title: string;
  launchDate: string;
  candidatesReached: number;
  responses: number;
  status: 'active' | 'completed' | 'paused' | 'pending' | 'failed';
  emailsSent?: number;
  jobTitle?: string;
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
  candidatesChange: number;
  conversionRate: number;
  conversionRateChange: number;
  historicalData: {
    date: string;
    value: number;
    applications: number;
    responses: number;
    balance: number;
  }[];
}

interface UserData {
  plan?: string;
  credits: number;
}

interface ChartDataPoint {
  date: string;
  value: number;
}

interface CashFlowDataPoint {
  date: string;
  balance: number;
  inflow: number;
  outflow: number;
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'completed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'pending':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
}

const formatChartData = (data: any[], key: string): ChartDataPoint[] => {
  return data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
    value: key === 'balance' ? item.balance : item[key]
  }));
};

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
    candidatesChange: 0,
    conversionRate: 0,
    conversionRateChange: 0,
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

  const recentCampaigns = useMemo(() => {
    return campaigns
      .sort((a, b) => new Date(b.launchDate).getTime() - new Date(a.launchDate).getTime())
      .slice(0, 3);
  }, [campaigns]);

  const fetchStats = async (isRefresh = false) => {
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

      // Calculate previous values to track changes
      const prevTotalCandidates = stats.totalCandidates || 0;
      const prevConversionRate = stats.conversionRate || 0;
      
      // Calculate response rate
      const responseRate = totalApplications > 0 
        ? (totalResponses / totalApplications) * 100 
        : 0;
        
      // Calculate conversion rate safely to avoid infinity values
      const conversionRate = totalCandidatesCount > 0 
        ? (totalResponses / totalCandidatesCount) * 100 
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
            const creditChanged = diff !== 0;
            
            if (diff !== 0 && creditElementRef.current) {
              const rect = creditElementRef.current.getBoundingClientRect();
              setTriggerPosition({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
              });
              setCreditDiff(diff);
            }
            
            // Update all stats
            setStats(prev => {
              // Gérer l'historique des données différemment
              let updatedHistoricalData = [...prev.historicalData];
              
              // Ajout d'un nouveau point à l'historique dans ces cas:
              // 1. Si c'est le premier chargement et qu'il n'y a pas de données
              // 2. Si les crédits ont changé (même pendant un refresh)
              if (updatedHistoricalData.length === 0 || creditChanged) {
                // Ajouter un nouveau point de donnée
                updatedHistoricalData.push({
                  date: new Date().toISOString(),
                  value: responseRate,
                  applications: totalApplications,
                  responses: totalResponses,
                  balance: data.credits || 0
                });
              } else if (isRefresh) {
                // Lors d'un refresh sans changement de crédit, mettre à jour uniquement 
                // les valeurs autres que la balance dans le dernier point
                const lastIndex = updatedHistoricalData.length - 1;
                updatedHistoricalData[lastIndex] = {
                  ...updatedHistoricalData[lastIndex],
                  value: responseRate,
                  applications: totalApplications,
                  responses: totalResponses
                  // Ne pas modifier la balance puisqu'elle n'a pas changé
                };
              }
              
              // Définir la nouvelle valeur de référence pour les crédits
              previousCredits.current = data.credits || 0;
              
              return {
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
                candidatesChange: totalCandidatesCount - (prev.totalCandidates || 0),
                conversionRate: conversionRate,
                conversionRateChange: conversionRate - (prev.conversionRate || 0),
                historicalData: updatedHistoricalData
              };
            });
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
    fetchStats(false); // Indiquer que ce n'est pas un refresh
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
      change: stats.candidatesChange,
      historicalData: stats.historicalData
    },
    {
      name: 'Conversion Rate',
      value: `${stats.conversionRate.toFixed(1)}%`,
      change: stats.conversionRateChange,
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
      // Mettre à jour les données en indiquant que c'est un refresh
      await fetchStats(true);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Formatez les données pour les graphiques
  const balanceData = formatChartData(stats.historicalData, 'balance');
  const applicationsData = formatChartData(stats.historicalData, 'applications');
  const performanceData = formatChartData(stats.historicalData, 'responses');

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
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-purple-600">
                Dashboard
              </h1>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Campaign performance overview
              </p>
            </div>
            <button
              onClick={refreshDashboard}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl 
                bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                border border-gray-200 dark:border-gray-700
                transition-all duration-200 shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 text-gray-600 dark:text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Refresh
              </span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <LayoutGrid className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Campaigns
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalCampaigns}
                  </p>
                  <span className="text-sm text-green-500">
                    {stats.campaignsChange > 0 ? `+${stats.campaignsChange}%` : `${stats.campaignsChange}%`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BarChart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Average Response Rate
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(stats.averageResponseRate || 0).toFixed(1)}%
                  </p>
                  <span className={`text-sm ${(stats.responseRateChange || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stats.responseRateChange > 0 ? `+${(stats.responseRateChange || 0).toFixed(1)}%` : `${(stats.responseRateChange || 0).toFixed(1)}%`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Candidates
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalCandidates}
                  </p>
                  <span className="text-sm text-green-500">
                    {stats.candidatesChange > 0 ? `+${stats.candidatesChange}%` : `${stats.candidatesChange}%`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Target className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Conversion Rate
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Number.isFinite(stats.conversionRate) ? (stats.conversionRate || 0).toFixed(1) + '%' : '0.0%'}
                  </p>
                  <span className={`text-sm ${(stats.conversionRateChange || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stats.conversionRateChange > 0 ? `+${(stats.conversionRateChange || 0).toFixed(1)}%` : `${(stats.conversionRateChange || 0).toFixed(1)}%`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section - Updated to match screenshot */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Available Balance Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Available balance</h3>
              <span className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.credits} credits
              </span>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={balanceData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    dot={{ fill: '#8B5CF6', r: 4 }}
                    activeDot={{ fill: '#8B5CF6', r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Applications Sent Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Applications Sent</h3>
              <span className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.applicationsSent}
              </span>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={applicationsData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Campaign Performance Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 col-span-1 lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Campaign Performance</h3>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={performanceData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: '#10B981', r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Campaigns Section - Updated to match screenshot */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Campaigns
            </h2>
            <Link
              to="/campaigns"
              className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 
                dark:text-purple-400 dark:hover:text-purple-300 font-medium"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {recentCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentCampaigns.map(campaign => (
                <div key={campaign.id || campaign.title} 
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 
                    dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 
                    transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {campaign.title}
                      </h3>
                      {campaign.jobTitle && (
                        <p className="text-sm text-gray-500">{campaign.jobTitle}</p>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {campaign.emailsSent || campaign.candidatesReached || 0} sent
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {campaign.responses || 0} responses
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
                <Inbox className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No campaigns yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Create your first campaign to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
