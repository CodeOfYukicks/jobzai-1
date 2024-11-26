import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Rocket, LineChart, Mail, Target, Coins, Search,
  Bell, Settings, ChevronRight, TrendingUp, Users, LogOut
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserStats } from '../hooks/useUserStats';
import { ThemeToggle } from '../components/ui/theme-toggle';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import type { Activity } from '../types/stats';
import FirebaseImage from '../components/FirebaseImage';
import PageTransition from '../components/PageTransition';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

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
  const [completedCampaigns, setCompletedCampaigns] = useState(0);
  const [emailTemplates, setEmailTemplates] = useState(0);

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

  // Récupérer le nombre de campagnes terminées
  useEffect(() => {
    if (!currentUser?.uid) return;

    const campaignsQuery = query(
      collection(db, `users/${currentUser.uid}/campaigns`),
      where('status', '==', 'completed')
    );

    const unsubscribeCampaigns = onSnapshot(campaignsQuery, (snapshot) => {
      setCompletedCampaigns(snapshot.size);
    });

    return () => {
      unsubscribeCampaigns();
    };
  }, [currentUser]);

  // Récupérer le nombre de templates d'email
  useEffect(() => {
    if (!currentUser?.uid) return;

    const templatesQuery = query(
      collection(db, `users/${currentUser.uid}/emailTemplates`)
    );

    const unsubscribeTemplates = onSnapshot(templatesQuery, (snapshot) => {
      setEmailTemplates(snapshot.size);
    });

    return () => {
      unsubscribeTemplates();
    };
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

  // Fonction de déconnexion
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <PageTransition {...transition} />
      
      <motion.div animate={{ opacity: transition.isOpen ? 0 : 1 }}>
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex items-center justify-between h-20">
              <FirebaseImage 
                path="logo-dark.png"
                alt="Jobz.ai"
                className="h-8 w-auto"
              />

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-gradient-to-r from-[#8D75E5]/10 to-[#8D75E5]/5 px-6 py-3 rounded-2xl">
                  <Coins className="w-5 h-5 text-[#8D75E5]" />
                  <span className="font-semibold text-gray-900 text-lg">{userData?.credits ?? 0}</span>
                  <span className="text-sm text-gray-500">credits</span>
                </div>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-600 hover:text-gray-900 
                    hover:bg-gray-100 transition-all duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-8 py-12">
          <div className="mb-14">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
              {isNewUser 
                ? `Welcome to Jobz.ai, ${firstName}! ✨` 
                : `Welcome back, ${firstName}`
              }
            </h1>
            <p className="text-gray-600 text-lg font-light">
              {isNewUser 
                ? "Let's start your job search journey. Here's what you can do:"
                : "Here's what's happening with your job search today."
              }
            </p>
          </div>

          <div className="flex flex-row gap-4 overflow-x-auto pb-4 mb-14 snap-x snap-mandatory -mx-8 px-8 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:gap-8">
            {[
              { 
                label: 'Completed Campaigns', 
                value: completedCampaigns,
                icon: Rocket, 
                color: '#8D75E5',
                description: 'Finished campaigns'
              },
              { 
                label: 'Response Rate', 
                value: `${stats?.responseRate || '0'}%`, 
                icon: LineChart, 
                color: '#5EBC88',
                description: 'Average success rate'
              },
              { 
                label: 'Templates Created', 
                value: emailTemplates,
                icon: Mail, 
                color: '#F9A3CA',
                description: 'Email templates'
              }
            ].map((stat) => (
              <div key={stat.label} 
                className="flex-shrink-0 w-[80%] snap-center sm:w-auto flex flex-col bg-white p-6 rounded-2xl border border-gray-100
                  hover:border-gray-200 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg" 
                    style={{ backgroundColor: `${stat.color}10` }}>
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <span className="text-sm font-medium text-gray-500">
                    {stat.description}
                  </span>
                </div>

                <div className="mt-auto">
                  <p className="text-3xl font-semibold text-gray-900 mb-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { title: 'Campaigns', desc: 'Create and manage your job applications', icon: Rocket, color: '#8D75E5', path: '/campaigns' },
              { title: 'Analytics', desc: 'Track your application progress', icon: LineChart, color: '#5EBC88', path: '/dashboard' },
              { title: 'Recommendations', desc: 'View your job recommendations', icon: Target, color: '#FBBD74', path: '/recommendations' },
              { title: 'Email Templates', desc: 'Manage your email templates', icon: Mail, color: '#F9A3CA', path: '/email-templates' }
            ].map((card) => (
              <button
                key={card.title}
                onClick={(e) => handleCardClick(e, card)}
                className="relative overflow-hidden group p-8 rounded-3xl bg-white shadow-[0_2px_10px_-3px_rgba(6,6,6,0.1)] 
                  hover:shadow-[0_8px_30px_-5px_rgba(6,6,6,0.1)] transition-all duration-300 text-left border border-gray-100"
              >
                <div className="relative z-10">
                  <div className="p-4 rounded-2xl mb-6 w-fit" 
                    style={{ backgroundColor: `${card.color}15` }}>
                    <card.icon className="w-7 h-7" style={{ color: card.color }} />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                    {card.title}
                  </h2>
                  <p className="text-gray-600">{card.desc}</p>
                </div>

                <div 
                  className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-10 transition-transform duration-300 group-hover:scale-150"
                  style={{ backgroundColor: card.color }}
                />
              </button>
            ))}
          </div>
        </main>
      </motion.div>
    </div>
  );
} 