import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, Send, TrendingUp, Loader2, RefreshCw, ChevronRight, 
  Download, LayoutGrid, Users, Target, Inbox, Mail, MessageSquare,
  FileText, Calendar, Award, ArrowUpRight, Clock, CheckCircle, 
  AlertCircle, Bell, Zap, Activity, PieChart,
  BriefcaseIcon as Briefcase, Flame, Lightbulb, Edit, PlusCircle,
  TrendingDown, ArrowRight, Building2
} from 'lucide-react';
import { doc, collection, onSnapshot, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import FloatingCredits from '../components/FloatingCredits';
import PremiumFeatureOverlay from '../components/PremiumFeatureOverlay';
import { getCreditHistoryForChart } from '../lib/creditHistory';
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, 
  Tooltip, AreaChart, Area, BarChart, Bar, ComposedChart,
  PieChart as RechartsPieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, RadialBarChart,
  RadialBar, CartesianGrid, FunnelChart, Funnel, LabelList
} from 'recharts';
import { Link } from 'react-router-dom';

// Interview interface
interface Interview {
  id: string;
  date: string;
  time: string;
  type: 'technical' | 'hr' | 'manager' | 'final' | 'other';
  status: 'scheduled' | 'completed' | 'cancelled';
  location?: string;
}

interface DashboardStats {
  credits: number;
  creditsChange: number;
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

// Add new interface for email templates
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  tone?: string;
  language?: string;
  aiGenerated?: boolean;
  liked?: boolean;
  tags?: string[];
  createdAt: any;
  updatedAt: any;
}

// Add new interface for job applications
interface JobApplication {
  id: string;
  companyName: string;
  position: string;
  status: string;
  appliedDate: string;
  interviews?: Interview[];
}

// Enhance dashboard stats with more metrics
interface EnhancedDashboardStats extends DashboardStats {
  // Email template metrics
  totalTemplates: number;
  templatesCreatedThisMonth: number;
  mostUsedTemplateId: string;
  mostUsedTemplateName: string;
  
  // Job application metrics
  totalApplications: number;
  pendingApplications: number;
  interviewScheduled: number;
  successfulApplications: number;
  rejectedApplications: number;
  appliedCount: number;
  interviewCount: number;
  offerCount: number;
  
  // Success metrics
  successRate: number;
  
  // Time metrics
  averageResponseTime: number; // in hours
  
  // Activity metrics
  activitiesThisWeek: number;
  activitiesLastWeek: number;
  activityGrowth: number;
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

// New helper component for tab navigation
const TabButton = ({ 
  active, 
  onClick, 
  icon: Icon, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: any; 
  label: string 
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg
        transition-all duration-200 ${
        active
          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );
};

// New helper component for stat cards
const StatCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  iconColor, 
  iconBg 
}: { 
  title: string; 
  value: string | number; 
  change?: string | number; 
  icon: any; 
  iconColor: string; 
  iconBg: string;
}) => {
  const isPositiveChange = typeof change === 'number' ? change >= 0 : true;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-4">
        <div className={`p-3 ${iconBg} rounded-lg`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
            {change !== undefined && (
              <span className={`text-sm ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
                {typeof change === 'number' 
                  ? (change > 0 ? `+${change}%` : `${change}%`) 
                  : change}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Activity item component
const ActivityItem = ({ 
  icon: Icon, 
  title, 
  description, 
  time, 
  iconColor, 
  iconBg 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  time: string; 
  iconColor: string; 
  iconBg: string;
}) => {
  return (
    <div className="flex gap-3 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
      <div className={`p-2 ${iconBg} rounded-lg self-start mt-0.5`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<EnhancedDashboardStats>({
    credits: 0,
    creditsChange: 0,
    historicalData: [],
    
    // Email template metrics
    totalTemplates: 0,
    templatesCreatedThisMonth: 0,
    mostUsedTemplateId: '',
    mostUsedTemplateName: 'None',
    
    // Job application metrics
    totalApplications: 0,
    pendingApplications: 0,
    interviewScheduled: 0,
    successfulApplications: 0,
    rejectedApplications: 0,
    appliedCount: 0,
    interviewCount: 0,
    offerCount: 0,
    
    // Success metrics
    successRate: 0,
    
    // Time metrics
    averageResponseTime: 0,
    
    // Activity metrics
    activitiesThisWeek: 0,
    activitiesLastWeek: 0,
    activityGrowth: 0
  });
  const [userData, setUserData] = useState<UserData>({ credits: 0 });
  const [creditDiff, setCreditDiff] = useState(0);
  const [triggerPosition, setTriggerPosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const creditElementRef = useRef<HTMLDivElement>(null);
  const previousCredits = useRef(stats.credits);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<Array<{interview: Interview; application: JobApplication}>>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'templates' | 'applications'>('overview');

  const fetchStats = async (isRefresh = false) => {
    try {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      // Get user's email templates
      const templatesRef = collection(db, 'users', currentUser.uid, 'emailTemplates');
      const templatesQuery = query(templatesRef);
      const templatesSnapshot = await getDocs(templatesQuery);
      
      const templatesList: EmailTemplate[] = [];
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      let templatesThisMonth = 0;
      
      templatesSnapshot.forEach(doc => {
        const template = doc.data() as EmailTemplate;
        template.id = doc.id;
        templatesList.push(template);
        
        // Count templates created this month
        if (template.createdAt && new Date(template.createdAt.toDate()) >= firstDayOfMonth) {
          templatesThisMonth++;
        }
      });
      
      setTemplates(templatesList);
      
      // Get user's job applications
      const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
      const applicationsQuery = query(applicationsRef);
      const applicationsSnapshot = await getDocs(applicationsQuery);
      
      const applicationsList: JobApplication[] = [];
      let pendingApps = 0;
      let successfulApps = 0;
      let rejectedApps = 0;
      let appliedCount = 0;
      let interviewCount = 0;
      let offerCount = 0;
      let interviewScheduled = 0;
      
      // Collect upcoming interviews
      const upcomingInterviewsList: Array<{interview: Interview; application: JobApplication}> = [];
      const currentDate = new Date();
      
      applicationsSnapshot.forEach(doc => {
        const application = doc.data() as JobApplication;
        application.id = doc.id;
        applicationsList.push(application);
        
        // Count applications by status
        if (application.status === 'applied') {
          pendingApps++;
          appliedCount++;
        } else if (application.status === 'interview') {
          pendingApps++;
          interviewCount++;
        } else if (application.status === 'offer') {
          successfulApps++;
          offerCount++;
        } else if (application.status === 'rejected') {
          rejectedApps++;
        }
        
        // Collect upcoming interviews
        if (application.interviews && application.interviews.length > 0) {
          application.interviews.forEach(interview => {
            if (interview.status === 'scheduled') {
              const interviewDate = new Date(`${interview.date}T${interview.time || '00:00'}`);
              if (interviewDate >= currentDate) {
                upcomingInterviewsList.push({ interview, application });
                interviewScheduled++;
              }
            }
          });
        }
      });
      
      // Sort upcoming interviews by date
      upcomingInterviewsList.sort((a, b) => {
        const dateA = new Date(`${a.interview.date}T${a.interview.time || '00:00'}`);
        const dateB = new Date(`${b.interview.date}T${b.interview.time || '00:00'}`);
        return dateA.getTime() - dateB.getTime();
      });
      
      setUpcomingInterviews(upcomingInterviewsList.slice(0, 5));
      setApplications(applicationsList);

      // Calculate success rate
      const successRate = applicationsList.length > 0 
        ? (successfulApps / applicationsList.length) * 100 
        : 0;

      // Calculate activity metrics
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      let activitiesThisWeek = 0;
      let activitiesLastWeek = 0;
      
      // Count template activities
      templatesList.forEach(template => {
        if (template.createdAt) {
          const templateDate = new Date(template.createdAt.toDate());
          if (templateDate >= oneWeekAgo) {
            activitiesThisWeek++;
          } else if (templateDate >= twoWeeksAgo && templateDate < oneWeekAgo) {
            activitiesLastWeek++;
          }
        }
      });
      
      // Count application activities
      applicationsList.forEach(application => {
        const appDate = new Date(application.appliedDate);
        if (appDate >= oneWeekAgo) {
          activitiesThisWeek++;
        } else if (appDate >= twoWeeksAgo && appDate < oneWeekAgo) {
          activitiesLastWeek++;
        }
      });
      
      // Calculate activity growth
      const activityGrowth = activitiesLastWeek > 0 
        ? ((activitiesThisWeek - activitiesLastWeek) / activitiesLastWeek) * 100
        : activitiesThisWeek > 0 ? 100 : 0;

      // Charger l'historique des crédits depuis Firestore
      const creditHistoryData = await getCreditHistoryForChart(currentUser.uid, 30);
      
      // Convertir l'historique des crédits au format attendu par historicalData
      let creditHistoryFormatted = creditHistoryData.map(item => ({
        date: item.date,
        value: 0,
        applications: applicationsList.length,
        responses: 0,
        balance: item.value
      }));
      
      // Si l'historique est vide, ajouter au moins le solde actuel
      if (creditHistoryFormatted.length === 0) {
        creditHistoryFormatted = [];
      }

      // Subscribe to user document for real-time updates
      const unsubscribeUser = onSnapshot(
        doc(db, 'users', currentUser.uid),
        async (doc) => {
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
            
            // Toujours recharger l'historique des crédits pour avoir les données les plus récentes
            const freshCreditHistory = await getCreditHistoryForChart(currentUser.uid, 30);
            let updatedCreditHistory = freshCreditHistory.map(item => ({
              date: item.date,
              value: 0,
              applications: applicationsList.length,
              responses: 0,
              balance: item.value,
              change: item.change,
              reason: item.reason
            }));
            
            // Si l'historique est vide après chargement, ajouter le solde actuel
            if (updatedCreditHistory.length === 0) {
              updatedCreditHistory = [{
                date: new Date().toISOString(),
                value: 0,
                applications: applicationsList.length,
                responses: 0,
                balance: data.credits || 0
              }];
            }
            
            // Définir la nouvelle valeur de référence pour les crédits
            previousCredits.current = data.credits || 0;
            
            // Update all stats
            setStats(prev => ({
              ...prev,
              credits: data.credits || 0,
              creditsChange: diff,
              historicalData: updatedCreditHistory,
              
              // Email template metrics
              totalTemplates: templatesList.length,
              templatesCreatedThisMonth: templatesThisMonth,
              mostUsedTemplateId: '',
              mostUsedTemplateName: templatesList.length > 0 ? templatesList[0].name : 'None',
              
              // Job application metrics
              totalApplications: applicationsList.length,
              pendingApplications: pendingApps,
              interviewScheduled,
              successfulApplications: successfulApps,
              rejectedApplications: rejectedApps,
              appliedCount,
              interviewCount,
              offerCount,
              
              // Success metrics
              successRate,
              
              // Time metrics
              averageResponseTime: 24,
              
              // Activity metrics
              activitiesThisWeek,
              activitiesLastWeek,
              activityGrowth
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
    fetchStats(false); // Indiquer que ce n'est pas un refresh
  }, [currentUser]);

  const hasPremiumAccess = userData.plan === 'standard' || userData.plan === 'premium';

  // Prepare application funnel data
  const funnelData = useMemo(() => {
    const maxValue = Math.max(
      stats.appliedCount,
      stats.interviewCount,
      stats.offerCount,
      stats.rejectedApplications
    );
    
    return [
      { name: 'Applied', value: stats.appliedCount, fill: '#8B5CF6' },
      { name: 'Interview', value: stats.interviewCount, fill: '#6366F1' },
      { name: 'Offer', value: stats.offerCount, fill: '#10B981' },
      { name: 'Rejected', value: stats.rejectedApplications, fill: '#EF4444' }
    ].filter(item => item.value > 0);
  }, [stats.appliedCount, stats.interviewCount, stats.offerCount, stats.rejectedApplications]);

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
  // Pour le graphique des crédits, utiliser directement l'historique des crédits
  const balanceData = useMemo(() => {
    // Noms de mois en français
    const monthNames = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    
    // Extraire uniquement les données de balance de l'historique
    const creditData = stats.historicalData
      .filter(item => item.balance !== undefined && item.balance !== null)
      .map(item => ({
        date: item.date,
        value: item.balance,
        change: (item as any).change,
        reason: (item as any).reason
      }));
    
    // Si on n'a pas de données, retourner un tableau vide (sera géré par le graphique)
    if (creditData.length === 0) {
      return [];
    }
    
    // Trier par date (plus ancien en premier)
    creditData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Formater les dates pour le graphique avec heure si nécessaire pour les distinguer
    return creditData.map((item, index) => {
      const date = new Date(item.date);
      // Si plusieurs points le même jour, inclure l'heure
      const hasMultipleSameDay = creditData.filter(c => {
        const cDate = new Date(c.date);
        return cDate.toDateString() === date.toDateString();
      }).length > 1;
      
      let dateLabel: string;
      if (hasMultipleSameDay || creditData.length > 1) {
        // Toujours inclure l'heure si on a plusieurs points
        const day = date.getDate();
        const month = monthNames[date.getMonth()];
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        dateLabel = `${day} ${month}, ${hours}:${minutes}`;
      } else {
        const day = date.getDate();
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        dateLabel = `${day} ${month} ${year}`;
      }
      
      return {
        date: dateLabel,
        dateISO: item.date, // Garder la date ISO pour le tri et le tooltip
        value: item.value,
        change: item.change,
        reason: item.reason
      };
    });
  }, [stats.historicalData]);
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

  // Format data for the pie chart
  const applicationStatusData = [
    { name: 'Pending', value: stats.pendingApplications },
    { name: 'Successful', value: stats.successfulApplications },
    { name: 'Rejected', value: stats.rejectedApplications },
  ];

  const COLORS = ['#8B5CF6', '#10B981', '#EF4444'];

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-purple-600 dark:text-white">
                Dashboard
              </h1>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Track your job applications and progress
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

        {/* Tab Navigation */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex space-x-2 min-w-max">
            <TabButton 
              active={activeTab === 'overview'} 
              onClick={() => setActiveTab('overview')} 
              icon={LayoutGrid} 
              label="Overview" 
            />
            <TabButton 
              active={activeTab === 'templates'} 
              onClick={() => setActiveTab('templates')} 
              icon={FileText} 
              label="Email Templates" 
            />
            <TabButton 
              active={activeTab === 'applications'} 
              onClick={() => setActiveTab('applications')} 
              icon={Briefcase} 
              label="Job Applications" 
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <>
                {/* Quick Stats - Apple Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0 }}
                  >
                    <StatCard 
                      title="Total Applications" 
                      value={stats.totalApplications} 
                      icon={Briefcase} 
                      iconColor="text-purple-600 dark:text-purple-400" 
                      iconBg="bg-purple-100 dark:bg-purple-900/30" 
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <StatCard 
                      title="Pending" 
                      value={stats.pendingApplications} 
                      icon={Clock} 
                      iconColor="text-blue-600 dark:text-blue-400" 
                      iconBg="bg-blue-100 dark:bg-blue-900/30" 
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <StatCard 
                      title="Interviews Scheduled" 
                      value={stats.interviewScheduled} 
                      icon={Calendar} 
                      iconColor="text-indigo-600 dark:text-indigo-400" 
                      iconBg="bg-indigo-100 dark:bg-indigo-900/30" 
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    <StatCard 
                      title="Success Rate" 
                      value={`${stats.successRate.toFixed(1)}%`} 
                      icon={TrendingUp} 
                      iconColor="text-green-600 dark:text-green-400" 
                      iconBg="bg-green-100 dark:bg-green-900/30" 
                    />
                  </motion.div>
                </div>

                {/* Main Dashboard Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {/* Left Column - Credits and Activity */}
                  <div className="col-span-1">
                    {/* Credit Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Available Credits</h3>
                        </div>
                        <span ref={creditElementRef} className="text-2xl font-semibold text-gray-900 dark:text-white">
                          {stats.credits}
                        </span>
                      </div>
                      <div className="h-[150px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={balanceData}>
                            <XAxis 
                              dataKey="date" 
                              tick={{ fontSize: 10 }} 
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  const change = data.change || 0;
                                  const reason = data.reason || 'unknown';
                                  
                                  // Translate reason to English
                                  const reasonLabels: Record<string, string> = {
                                    'campaign': 'Campaign',
                                    'plan_selection': 'Plan Selection',
                                    'subscription': 'Subscription',
                                    'subscription_payment': 'Subscription Payment',
                                    'subscription_renewal': 'Subscription Renewal',
                                    'credit_purchase': 'Credit Purchase',
                                    'purchase': 'Purchase',
                                    'refund': 'Refund',
                                    'initial': 'Initial Balance',
                                    'unknown': 'Unknown'
                                  };
                                  
                                  return (
                                    <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                                      <p className="font-medium text-gray-900 dark:text-white mb-1">
                                        {data.value} credits
                                      </p>
                                      {change !== 0 && (
                                        <p className={`text-sm ${change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                          {change > 0 ? '+' : ''}{change} credits
                                        </p>
                                      )}
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {reasonLabels[reason] || reason}
                                      </p>
                                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        {(() => {
                                          const date = new Date(data.dateISO || data.date);
                                          const monthNames = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
                                          const day = date.getDate();
                                          const month = monthNames[date.getMonth()];
                                          const year = date.getFullYear();
                                          const hours = date.getHours().toString().padStart(2, '0');
                                          const minutes = date.getMinutes().toString().padStart(2, '0');
                                          return `${day} ${month} ${year}, ${hours}:${minutes}`;
                                        })()}
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#8B5CF6" 
                              strokeWidth={2}
                              dot={{ fill: '#8B5CF6', r: 5 }}
                              activeDot={{ fill: '#8B5CF6', r: 7, strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Upcoming Interviews */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Interviews</h3>
                        {upcomingInterviews.length > 0 && (
                          <Link
                            to="/upcoming-interviews"
                            className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium flex items-center gap-1"
                          >
                            View all <ChevronRight className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                      <div className="space-y-3">
                        {upcomingInterviews.length > 0 ? (
                          upcomingInterviews.slice(0, 3).map((item, index) => {
                            const interviewDate = new Date(`${item.interview.date}T${item.interview.time || '00:00'}`);
                            const isToday = interviewDate.toDateString() === new Date().toDateString();
                            const isTomorrow = interviewDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
                            
                            return (
                              <motion.div
                                key={item.interview.id || index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2, delay: index * 0.1 }}
                                className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700/50 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                      {item.application.position}
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                      <Building2 className="h-3 w-3" />
                                      {item.application.companyName}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                                      {interviewDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : interviewDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </p>
                                  </div>
                                </div>
                                {item.interview.type && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                    {item.interview.type}
                                  </span>
                                )}
                              </motion.div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8">
                            <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming interviews</p>
                            <Link
                              to="/applications"
                              className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium mt-2 inline-block"
                            >
                              Schedule one
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm mt-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
                        {stats.activityGrowth > 0 && (
                          <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-xs font-medium">
                            +{stats.activityGrowth.toFixed(0)}% this week
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        {(() => {
                          const activities: Array<{icon: any; title: string; description: string; time: string; iconColor: string; iconBg: string}> = [];
                          
                          // Add recent applications
                          applications.slice(0, 2).forEach(app => {
                            activities.push({
                              icon: Briefcase,
                              title: `Applied to ${app.companyName}`,
                              description: app.position,
                              time: new Date(app.appliedDate).toLocaleDateString(),
                              iconColor: "text-purple-600 dark:text-purple-400",
                              iconBg: "bg-purple-100 dark:bg-purple-900/30"
                            });
                          });
                          
                          // Add recent templates
                          templates.slice(0, 1).forEach(template => {
                            if (template.createdAt) {
                              activities.push({
                                icon: FileText,
                                title: `Created template "${template.name}"`,
                                description: template.subject,
                                time: new Date(template.createdAt.toDate()).toLocaleDateString(),
                                iconColor: "text-blue-600 dark:text-blue-400",
                                iconBg: "bg-blue-100 dark:bg-blue-900/30"
                              });
                            }
                          });
                          
                          return activities.length > 0 ? (
                            activities.map((activity, index) => (
                              <ActivityItem key={index} {...activity} />
                            ))
                          ) : (
                            <div className="text-center py-6">
                              <Inbox className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Middle and Right Columns */}
                  <div className="col-span-1 lg:col-span-2">
                    {/* Applications Overview */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Applications Overview</h3>
                        <Link
                          to="/applications"
                          className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                        >
                          View all <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Application Stats */}
                        <div className="flex flex-col gap-4">
                          <div className="flex justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Total Applications</p>
                              <p className="text-xl font-semibold text-gray-900 dark:text-white">{stats.totalApplications}</p>
                            </div>
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg h-fit">
                              <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                          </div>
                          
                          <div className="flex justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                              <p className="text-xl font-semibold text-gray-900 dark:text-white">{stats.pendingApplications}</p>
                            </div>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg h-fit">
                              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          
                          <div className="flex justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Successful</p>
                              <p className="text-xl font-semibold text-gray-900 dark:text-white">{stats.successfulApplications}</p>
                            </div>
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg h-fit">
                              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Application Pie Chart */}
                        <div className="flex flex-col items-center justify-center w-full">
                          <div className="h-[260px] w-[260px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsPieChart>
                                <Pie
                                  data={applicationStatusData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={80}
                                  outerRadius={120}
                                  paddingAngle={5}
                                  dataKey="value"
                                  label={false}
                                >
                                  {applicationStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </RechartsPieChart>
                            </ResponsiveContainer>
                          </div>
                          {/* Légende centrée sous le graphique */}
                          <div className="flex justify-center gap-6 mt-4">
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[0] }}></span>
                              <span className="text-xs font-medium">Pending</span>
                              <span className="text-xs text-gray-500 ml-1">({stats.pendingApplications})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[1] }}></span>
                              <span className="text-xs font-medium">Successful</span>
                              <span className="text-xs text-gray-500 ml-1">({stats.successfulApplications})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[2] }}></span>
                              <span className="text-xs font-medium">Rejected</span>
                              <span className="text-xs text-gray-500 ml-1">({stats.rejectedApplications})</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Application Funnel */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Application Funnel</h3>
                        <Link
                          to="/applications"
                          className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium flex items-center gap-1"
                        >
                          View details <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                      <div className="h-[280px]">
                        {funnelData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                              data={funnelData}
                              layout="vertical"
                              margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                              <XAxis type="number" axisLine={false} tickLine={false} />
                              <YAxis 
                                dataKey="name" 
                                type="category" 
                                axisLine={false} 
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#6B7280' }}
                              />
                              <Tooltip 
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                                        <p className="font-semibold text-gray-900 dark:text-white mb-1">{data.name}</p>
                                        <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{data.value}</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar 
                                dataKey="value" 
                                radius={[0, 8, 8, 0]}
                                fill={(entry: any) => entry.fill}
                              >
                                {funnelData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                                <LabelList 
                                  dataKey="value" 
                                  position="right" 
                                  style={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }}
                                />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                              <p className="text-sm text-gray-500 dark:text-gray-400">No application data yet</p>
                              <Link
                                to="/applications"
                                className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium mt-2 inline-block"
                              >
                                Start tracking
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </>
            )}

            
            {activeTab === 'templates' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatCard 
                    title="Total Templates" 
                    value={stats.totalTemplates} 
                    icon={FileText} 
                    iconColor="text-blue-600 dark:text-blue-400" 
                    iconBg="bg-blue-100 dark:bg-blue-900/30" 
                  />
                  <StatCard 
                    title="Created This Month" 
                    value={stats.templatesCreatedThisMonth} 
                    icon={PlusCircle} 
                    iconColor="text-green-600 dark:text-green-400" 
                    iconBg="bg-green-100 dark:bg-green-900/30" 
                  />
                  <StatCard 
                    title="AI Generated" 
                    value={templates.filter(t => t.aiGenerated).length} 
                    icon={Zap} 
                    iconColor="text-amber-600 dark:text-amber-400" 
                    iconBg="bg-amber-100 dark:bg-amber-900/30" 
                  />
                  <StatCard 
                    title="Favorited Templates" 
                    value={templates.filter(t => t.liked).length} 
                    icon={Flame} 
                    iconColor="text-red-600 dark:text-red-400" 
                    iconBg="bg-red-100 dark:bg-red-900/30" 
                  />
                </div>

                {/* Template Insights */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Template Insights</h3>
                    <Link
                      to="/email-templates/new"
                      className="flex items-center gap-2 px-3 py-1.5 
                        bg-purple-100 text-purple-700 hover:bg-purple-200
                        dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50
                        rounded-full text-xs font-medium transition-colors duration-200"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span>New Template</span>
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Most Used Templates Chart */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Template Usage Distribution</h4>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: 'Favorited', value: templates.filter(t => t.liked).length },
                              { name: 'Standard', value: templates.filter(t => !t.liked && !t.aiGenerated).length },
                              { name: 'AI Generated', value: templates.filter(t => t.aiGenerated).length }
                            ]}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {/* Template Tags */}
                    <div className="flex flex-col justify-center">
                      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Most Used Template</p>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{stats.mostUsedTemplateName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Most recently used
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Popular Template Tags</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          {/* Extract and count tags from all templates */}
                          {(() => {
                            const tagCount: Record<string, number> = {};
                            templates.forEach(template => {
                              if (template.tags) {
                                template.tags.forEach(tag => {
                                  tagCount[tag] = (tagCount[tag] || 0) + 1;
                                });
                              }
                            });
                            
                            // Convert to array and sort by count
                            const sortedTags = Object.entries(tagCount)
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 10);
                              
                            return sortedTags.length > 0 ? (
                              sortedTags.map(([tag, count]) => (
                                <span 
                                  key={tag}
                                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs
                                    bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                                >
                                  {tag} <span className="ml-1 text-purple-600 dark:text-purple-300">({count})</span>
                                </span>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500 dark:text-gray-400">No tags available</p>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Recent Templates */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Templates</h3>
                  </div>
                  
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {templates.length > 0 ? (
                      templates
                        .sort((a, b) => new Date(b.updatedAt?.toDate?.() || 0).getTime() - new Date(a.updatedAt?.toDate?.() || 0).getTime())
                        .slice(0, 5)
                        .map(template => (
                          <div key={template.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-base font-medium text-gray-900 dark:text-white">
                                    {template.name}
                                  </h4>
                                  {template.aiGenerated && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                      <Zap className="h-3 w-3 mr-1" />
                                      AI
                                    </span>
                                  )}
                                  {template.liked && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                      <Flame className="h-3 w-3 mr-1" />
                                      Favorite
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{template.subject}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                  {template.content.slice(0, 120)}...
                                </p>
                                
                                {template.tags && template.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-3">
                                    {template.tags.map(tag => (
                                      <span 
                                        key={tag}
                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs
                                          bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-col space-y-2">
                                <Link
                                  to={`/templates/${template.id}/edit`}
                                  className="inline-flex items-center justify-center p-2 rounded-lg
                                    text-gray-400 hover:text-gray-500 hover:bg-gray-100
                                    dark:text-gray-500 dark:hover:text-gray-400 dark:hover:bg-gray-700"
                                >
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
                          <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                          No templates yet
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Create your first email template
                        </p>
                        <Link 
                          to="/templates/new" 
                          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <PlusCircle className="h-4 w-4" />
                          <span>Create Template</span>
                        </Link>
                      </div>
                    )}
                  </div>
                  
                  {templates.length > 5 && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
                      <Link
                        to="/templates"
                        className="text-sm text-purple-600 hover:text-purple-700 
                          dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                      >
                        View all {templates.length} templates
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'applications' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatCard 
                    title="Total Applications" 
                    value={stats.totalApplications} 
                    icon={Briefcase} 
                    iconColor="text-purple-600 dark:text-purple-400" 
                    iconBg="bg-purple-100 dark:bg-purple-900/30" 
                  />
                  <StatCard 
                    title="Pending" 
                    value={stats.pendingApplications} 
                    icon={Clock} 
                    iconColor="text-blue-600 dark:text-blue-400" 
                    iconBg="bg-blue-100 dark:bg-blue-900/30" 
                  />
                  <StatCard 
                    title="Successful" 
                    value={stats.successfulApplications} 
                    icon={CheckCircle} 
                    iconColor="text-green-600 dark:text-green-400" 
                    iconBg="bg-green-100 dark:bg-green-900/30" 
                  />
                  <StatCard 
                    title="Rejected" 
                    value={stats.rejectedApplications} 
                    icon={AlertCircle} 
                    iconColor="text-red-600 dark:text-red-400" 
                    iconBg="bg-red-100 dark:bg-red-900/30" 
                  />
                </div>

                {/* Application Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Application Status Distribution */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                    <div className="flex flex-col items-center justify-center w-full">
                      <div className="h-[260px] w-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={applicationStatusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={80}
                              outerRadius={120}
                              paddingAngle={5}
                              dataKey="value"
                              label={false}
                            >
                              {applicationStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Légende centrée sous le graphique */}
                      <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[0] }}></span>
                          <span className="text-xs font-medium">Pending</span>
                          <span className="text-xs text-gray-500 ml-1">({stats.pendingApplications})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[1] }}></span>
                          <span className="text-xs font-medium">Successful</span>
                          <span className="text-xs text-gray-500 ml-1">({stats.successfulApplications})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[2] }}></span>
                          <span className="text-xs font-medium">Rejected</span>
                          <span className="text-xs text-gray-500 ml-1">({stats.rejectedApplications})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Application Timeline */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">Application Timeline</h3>
                      <Link
                        to="/applications"
                        className="flex items-center gap-2 px-3 py-1.5 
                          bg-purple-100 text-purple-700 hover:bg-purple-200
                          dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50
                          rounded-full text-xs font-medium transition-colors duration-200"
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = '/applications?action=new';
                        }}
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>Track New</span>
                      </Link>
                    </div>
                    
                    <div className="space-y-4">
                      {applications.length > 0 ? (
                        applications
                          .sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime())
                          .slice(0, 4)
                          .map((application, index) => {
                            const getStatusColor = (status: string) => {
                              switch (status) {
                                case 'applied': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
                                case 'interview': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
                                case 'offer': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
                                case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
                                default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
                              }
                            };
                            
                            const getStatusIcon = (status: string) => {
                              switch (status) {
                                case 'applied': return <Send className="h-4 w-4" />;
                                case 'interview': return <Calendar className="h-4 w-4" />;
                                case 'offer': return <CheckCircle className="h-4 w-4" />;
                                case 'rejected': return <AlertCircle className="h-4 w-4" />;
                                default: return <Clock className="h-4 w-4" />;
                              }
                            };
                            
                            return (
                              <div key={application.id} className="flex">
                                <div className="mr-4 flex flex-col items-center">
                                  <div className={`p-2 rounded-full ${getStatusColor(application.status)}`}>
                                    {getStatusIcon(application.status)}
                                  </div>
                                  {index < applications.length - 1 && (
                                    <div className="h-full w-0.5 bg-gray-200 dark:bg-gray-700 my-1"></div>
                                  )}
                                </div>
                                <div className="pb-4">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-base font-medium text-gray-900 dark:text-white">{application.position}</h4>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(application.status)}`}>
                                      {application.status}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">{application.companyName}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Applied on {new Date(application.appliedDate).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-sm text-gray-500 dark:text-gray-400">No applications tracked yet</p>
                        </div>
                      )}
                      
                      {applications.length > 4 && (
                        <div className="pt-2">
                          <Link
                            to="/applications"
                            className="text-sm text-purple-600 hover:text-purple-700 
                              dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                          >
                            View all {applications.length} applications
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Application Insights */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Application Insights</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Success Rate Card */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 flex flex-col items-center justify-center">
                      <div className="w-20 h-20 mb-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart 
                            innerRadius="70%" 
                            outerRadius="100%" 
                            data={[{ name: 'Success Rate', value: stats.successfulApplications > 0 
                              ? (stats.successfulApplications / stats.totalApplications) * 100
                              : 0 }]} 
                            startAngle={90} 
                            endAngle={-270}
                          >
                            <RadialBar
                              background
                              dataKey="value"
                              fill="#10B981"
                            />
                          </RadialBarChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        {stats.totalApplications > 0 
                          ? ((stats.successfulApplications / stats.totalApplications) * 100).toFixed(1)
                          : '0.0'}%
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Success Rate</p>
                    </div>
                    
                    {/* Average Response Time */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                        <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        {stats.averageResponseTime} hours
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Average Response Time</p>
                    </div>
                    
                    {/* Most Active Time */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">Activity</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400">This Week</p>
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900 dark:text-white mr-2">{stats.activitiesThisWeek}</p>
                            <div className="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-purple-500" 
                                style={{ width: `${Math.min(stats.activitiesThisWeek / 10 * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Last Week</p>
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900 dark:text-white mr-2">{stats.activitiesLastWeek}</p>
                            <div className="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500" 
                                style={{ width: `${Math.min(stats.activitiesLastWeek / 10 * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Growth</p>
                          <p className={`text-sm font-medium ${stats.activityGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {stats.activityGrowth > 0 ? '+' : ''}{stats.activityGrowth.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Recent Applications */}
                {applications.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Applications</h3>
                      <Link
                        to="/applications"
                        className="text-sm text-purple-600 hover:text-purple-700 
                          dark:text-purple-400 dark:hover:text-purple-300 font-medium flex items-center gap-1"
                      >
                        View all <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Company
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Position
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Applied Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {applications
                            .sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime())
                            .slice(0, 5)
                            .map(application => (
                              <tr key={application.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {application.companyName}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-600 dark:text-gray-300">{application.position}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium 
                                    ${application.status === 'applied' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 
                                      application.status === 'interview' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                                      application.status === 'offer' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}
                                  >
                                    {application.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(application.appliedDate).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {applications.length === 0 && (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
                      <Briefcase className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No applications tracked yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Start tracking your job applications
                    </p>
                    <Link 
                      to="/applications" 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = '/applications?action=new';
                      }}
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span>Track Application</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
}
