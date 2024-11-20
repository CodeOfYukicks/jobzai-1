import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Rocket, LineChart, Mail, Target, Coins, Search,
  Bell, Settings, ChevronRight, TrendingUp, Users
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserStats } from '../hooks/useUserStats';
import { ThemeToggle } from '../components/ui/theme-toggle';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import type { Activity } from '../types/stats';
import FirebaseImage from '../components/FirebaseImage';
import PageTransition from '../components/PageTransition';

export default function HubPage() {
  const { currentUser, userData } = useAuth();
  const { stats, loading: statsLoading } = useUserStats();
  const [credits, setCredits] = useState<number | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const firstName = userData?.name?.split(' ')[0] || 'there';
  const navigate = useNavigate();
  const isNewUser = new Date(userData?.createdAt || '').getTime() > Date.now() - 24 * 60 * 60 * 1000;
  const [transition, setTransition] = useState({
    isOpen: false,
    color: '',
    path: '',
    clickPosition: null as { x: number; y: number } | null
  });

  const handleCardClick = (e: React.MouseEvent, card: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const clickPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };

    const colorMap = {
      'bg-violet-50': '#f5f3ff',
      'bg-blue-50': '#eff6ff',
      'bg-emerald-50': '#ecfdf5',
      'bg-amber-50': '#fff7ed'
    };

    setTransition({
      isOpen: true,
      color: colorMap[card.bgColor as keyof typeof colorMap] || '#ffffff',
      path: card.path,
      clickPosition
    });

    const isMobile = window.innerWidth <= 768;
    setTimeout(() => {
      navigate(card.path);
    }, isMobile ? 700 : 900);
  };

  // Récupérer les activités récentes
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, `users/${currentUser.uid}/activities`),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newActivities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as Activity[];
      setActivities(newActivities);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Cartes principales dynamiques
  const mainCards = [
    {
      title: 'Campaigns',
      description: 'Create and manage your job applications',
      icon: Rocket,
      stats: { 
        value: !statsLoading && stats ? stats.activeCampaigns.toString() : '-',
        label: 'Active',
        trend: null
      },
      bgColor: 'bg-violet-50',
      iconColor: 'text-violet-600',
      path: '/campaigns'
    },
    {
      title: 'Analytics Dashboard',
      description: 'Track your application progress',
      icon: LineChart,
      stats: { 
        value: !statsLoading && stats ? `${stats.responseRate}%` : '-',
        label: 'Success Rate',
        trend: null
      },
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      path: '/dashboard'
    },
    {
      title: 'Recommendations',
      description: 'View your job recommendations',
      icon: Target,
      stats: { 
        value: !statsLoading && stats ? stats.newMatches.toString() : '-',
        label: 'New Matches',
        trend: null
      },
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      path: '/recommendations'
    },
    {
      title: 'Email Templates',
      description: 'Manage your email templates',
      icon: Mail,
      stats: { 
        value: !statsLoading && stats ? stats.templates.toString() : '-',
        label: 'Templates',
        trend: null
      },
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      path: '/email-templates'
    }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageTransition
        isOpen={transition.isOpen}
        color={transition.color}
        clickPosition={transition.clickPosition}
        onAnimationComplete={() => {
          setTransition(prev => ({
            ...prev,
            isOpen: false,
            clickPosition: null
          }));
        }}
      />
      
      <motion.div
        animate={{
          opacity: transition.isOpen ? 0 : 1
        }}
        transition={{ 
          duration: 0.2,
          ease: "easeOut"
        }}
      >
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex-shrink-0">
                <FirebaseImage 
                  path="logo-dark.png"
                  alt="Jobz.ai"
                  className="h-6 sm:h-8 w-auto"
                />
              </div>

              <div className="hidden md:block flex-1 max-w-lg mx-4 lg:mx-8">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Search anything..."
                    className="w-full pl-12 pr-4 py-2 bg-gray-50 rounded-xl border border-gray-200
                      focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </form>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl">
                  <Coins className="w-5 h-5 text-violet-500" />
                  <span className="font-medium text-gray-700">
                    {userData?.credits ?? 0}
                  </span>
                  <span className="text-sm text-gray-500">credits</span>
                </div>
                
                <button className="relative p-2 hover:bg-gray-50 rounded-lg">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-violet-500 rounded-full" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {isNewUser ? `Welcome to Jobz.ai, ${firstName}!` : `Welcome back, ${firstName}`}
            </h1>
            <p className="text-gray-600">
              {isNewUser 
                ? "Let's start your job search journey. Here's what you can do:"
                : "Here's what's happening with your job search today."
              }
            </p>
          </div>

          <div className="flex flex-row justify-between sm:grid sm:grid-cols-3 gap-2 sm:gap-6 mb-8">
            {[
              { 
                label: 'Active Campaigns', 
                value: '0', 
                icon: Rocket 
              },
              { 
                label: 'Response Rate', 
                value: '0%', 
                icon: LineChart 
              },
              { 
                label: 'New Matches', 
                value: '0', 
                icon: Users 
              }
            ].map((stat) => (
              <div 
                key={stat.label} 
                className="flex-1 bg-white p-3 sm:p-6 rounded-xl border border-gray-100"
              >
                <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
                  <stat.icon className="w-5 h-5 sm:w-8 sm:h-8 text-violet-500" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-base text-gray-600">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {mainCards.map((card) => (
              <button
                key={card.title}
                onClick={(e) => handleCardClick(e, card)}
                className={`${card.bgColor} p-6 rounded-xl hover:scale-[1.02] 
                  transition-all duration-300 text-left`}
              >
                <card.icon className={`w-8 h-8 ${card.iconColor} mb-4`} />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {card.title}
                </h2>
                <p className="text-gray-600">{card.description}</p>
              </button>
            ))}
          </div>
        </main>
      </motion.div>
    </div>
  );
} 