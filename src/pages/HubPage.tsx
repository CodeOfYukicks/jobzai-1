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

export default function HubPage() {
  const { currentUser, userData } = useAuth();
  const { stats, loading: statsLoading } = useUserStats();
  const [credits, setCredits] = useState<number | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const firstName = userData?.name?.split(' ')[0] || 'there';
  const navigate = useNavigate();
  const isNewUser = new Date(userData?.createdAt || '').getTime() > Date.now() - 24 * 60 * 60 * 1000;

  console.log('userData:', userData);

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
      bgGradient: 'from-violet-50 to-violet-100/50',
      accentColor: 'text-violet-600',
      link: '/campaigns'
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
      bgGradient: 'from-blue-50 to-blue-100/50',
      accentColor: 'text-blue-600',
      link: '/dashboard'
    },
    {
      title: 'Smart Matching',
      description: 'View your job recommendations',
      icon: Target,
      stats: { 
        value: !statsLoading && stats ? stats.newMatches.toString() : '-',
        label: 'New Matches',
        trend: null
      },
      bgGradient: 'from-emerald-50 to-emerald-100/50',
      accentColor: 'text-emerald-600',
      link: '/recommendations'
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
      bgGradient: 'from-amber-50 to-amber-100/50',
      accentColor: 'text-amber-600',
      link: '/email-templates'
    }
  ];

  // Stats pour le header
  const headerStats = !statsLoading && stats ? [
    { 
      label: 'Active Campaigns', 
      value: stats.activeCampaigns.toString(), 
      trend: null,
      icon: Rocket 
    },
    { 
      label: 'Response Rate', 
      value: `${stats.responseRate}%`, 
      trend: null,
      icon: TrendingUp 
    },
    { 
      label: 'New Matches', 
      value: stats.newMatches.toString(), 
      trend: null,
      icon: Users 
    }
  ] : [];

  // Gérer la soumission de la recherche
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Gérer la touche Entrée
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
          {[
            {
              title: 'Campaigns',
              description: 'Create and manage your job applications',
              icon: Rocket,
              bgColor: 'bg-violet-50',
              iconColor: 'text-violet-600',
              path: '/campaigns'
            },
            {
              title: 'Analytics Dashboard',
              description: 'Track your application progress',
              icon: LineChart,
              bgColor: 'bg-blue-50',
              iconColor: 'text-blue-600',
              path: '/dashboard'
            },
            {
              title: 'Smart Matching',
              description: 'View your job recommendations',
              icon: Target,
              bgColor: 'bg-emerald-50',
              iconColor: 'text-emerald-600',
              path: '/smart-matching'
            },
            {
              title: 'Email Templates',
              description: 'Manage your email templates',
              icon: Mail,
              bgColor: 'bg-amber-50',
              iconColor: 'text-amber-600',
              path: '/email-templates'
            }
          ].map((card) => (
            <Link
              key={card.title}
              to={card.path}
              className={`${card.bgColor} p-6 rounded-xl hover:scale-[1.02] transition-transform
                cursor-pointer group`}
            >
              <card.icon className={`w-8 h-8 ${card.iconColor} mb-4 
                group-hover:scale-110 transition-transform`} />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {card.title}
              </h2>
              <p className="text-gray-600">{card.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
} 