import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, LineChart, Mail, Target, Coins, Search,
  Bell, Settings, ChevronRight, TrendingUp, Users, LogOut, 
  Calendar, FileText, Briefcase, Sparkles
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserStats } from '../hooks/useUserStats';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import type { Activity } from '../types/stats';
import FirebaseImage from '../components/FirebaseImage';
import PageTransition from '../components/PageTransition';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

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
  const [activeInterviews, setActiveInterviews] = useState(0);
  const [logoUrl, setLogoUrl] = useState<string>('');

  // Charger le logo depuis Firebase Storage
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const storage = getStorage();
        const logoRef = ref(storage, 'images/logo-only.png');
        const url = await getDownloadURL(logoRef);
        setLogoUrl(url);
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    };

    loadLogo();
  }, []);

  const handleCardClick = (e: React.MouseEvent, card: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const clickPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };

    const colorMap = {
      'purple': '#8D75E5',
      'green': '#5EBC88',
      'orange': '#FBBD74',
      'pink': '#F9A3CA',
      'blue': '#60A5FA'
    };

    setTransition({
      isOpen: true,
      color: colorMap[card.colorName as keyof typeof colorMap] || '#ffffff',
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

  // Récupérer le nombre d'entretiens actifs
  useEffect(() => {
    if (!currentUser?.uid) return;

    const interviewsQuery = query(
      collection(db, `users/${currentUser.uid}/interviews`),
      where('status', '==', 'scheduled')
    );

    const unsubscribeInterviews = onSnapshot(interviewsQuery, (snapshot) => {
      setActiveInterviews(snapshot.size);
    });

    return () => {
      unsubscribeInterviews();
    };
  }, [currentUser]);

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

  // Cartes des statistiques clés
  const keyStats = [
    { 
      label: 'Completed Campaigns', 
      value: completedCampaigns,
      icon: Rocket, 
      colorName: 'purple',
      color: '#8D75E5',
      description: 'Finished campaigns'
    },
    { 
      label: 'Response Rate', 
      value: `${stats?.responseRate || '0'}%`, 
      icon: LineChart, 
      colorName: 'green',
      color: '#5EBC88',
      description: 'Average success rate'
    },
    { 
      label: 'Templates Created', 
      value: emailTemplates,
      icon: Mail, 
      colorName: 'pink',
      color: '#F9A3CA',
      description: 'Email templates'
    }
  ];

  // Cartes principales des fonctionnalités
  const mainFeatures = [
    { 
      title: 'Campaigns', 
      desc: 'Create and manage your job applications', 
      icon: Rocket, 
      colorName: 'purple',
      color: '#8D75E5', 
      path: '/campaigns',
      stats: { value: stats?.activeCampaigns || '0', label: 'Active Campaigns' }
    },
    { 
      title: 'Analytics', 
      desc: 'Track your application progress', 
      icon: LineChart, 
      colorName: 'green',
      color: '#5EBC88', 
      path: '/dashboard',
      stats: { value: `${stats?.responseRate || '0'}%`, label: 'Success Rate' }
    },
    { 
      title: 'Application Tracking', 
      desc: 'Monitor and manage your job applications', 
      icon: Calendar, 
      colorName: 'blue',
      color: '#60A5FA', 
      path: '/applications',
      stats: { value: activeInterviews.toString(), label: 'Active' }
    },
    { 
      title: 'Recommendations', 
      desc: 'Discover jobs matched to your profile', 
      icon: Target, 
      colorName: 'orange',
      color: '#FBBD74', 
      path: '/recommendations',
      stats: { value: stats?.newMatches?.toString() || '0', label: 'New Matches' }
    }
  ];

  // Cartes secondaires des outils
  const secondaryTools = [
    { 
      title: 'Email Templates', 
      desc: 'Create and manage your email templates', 
      icon: Mail, 
      colorName: 'pink',
      color: '#F9A3CA', 
      path: '/email-templates' 
    },
    { 
      title: 'CV Analysis', 
      desc: 'Get insights and improve your CV', 
      icon: FileText, 
      colorName: 'purple',
      color: '#8D75E5', 
      path: '/cv-analysis' 
    },
    { 
      title: 'Interview Prep', 
      desc: 'Practice with AI interview simulations', 
      icon: Briefcase, 
      colorName: 'green',
      color: '#5EBC88', 
      path: '/upcoming-interviews' 
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <PageTransition 
        {...transition} 
        onAnimationComplete={() => {}} 
      />
      
      <motion.div 
        animate={{ opacity: transition.isOpen ? 0 : 1 }}
        className="h-full"
      >
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 lg:h-20">
              <div className="w-1/3"></div>
              
              <div className="flex items-center justify-center w-1/3">
                <Link 
                  to="/"
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-8 w-auto" />
                  ) : (
                    <div className="h-8 w-8 bg-gray-100 animate-pulse rounded-full" />
                  )}
                </Link>
              </div>

              <div className="flex items-center justify-end gap-4 w-1/3">
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#8D75E5]/10 to-[#8D75E5]/5 px-4 py-2 rounded-full"
                >
                  <Coins className="w-4 h-4 text-[#8D75E5]" />
                  <span className="font-medium text-gray-900">{userData?.credits ?? 0}</span>
                  <span className="text-xs text-gray-500">credits</span>
                </motion.div>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:text-gray-900 
                    hover:bg-gray-100 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-10"
          >
            <div className="flex flex-col">
              <motion.h1 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 via-[#8D75E5]/90 to-gray-800 bg-clip-text text-transparent"
              >
                {isNewUser 
                  ? `Welcome to Jobz.ai, ${firstName}! ✨` 
                  : `Welcome back, ${firstName}`
                }
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-gray-600 text-base md:text-lg"
              >
                {isNewUser 
                  ? "Let's start your job search journey. Here's what you can do:"
                  : "Here's what's happening with your job search today."
                }
              </motion.p>
            </div>
          </motion.div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-10">
            {keyStats.map((stat, index) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white p-5 rounded-xl border border-gray-100 hover:border-gray-200 
                  hover:shadow-sm transition-all duration-300 flex flex-col h-full"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg" 
                    style={{ backgroundColor: `${stat.color}15` }}>
                    <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <span className="text-sm font-medium text-gray-500">
                    {stat.description}
                  </span>
                </div>

                <div className="mt-auto">
                  <motion.p 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    className="text-2xl md:text-3xl font-semibold text-gray-900 mb-1"
                  >
                    {stat.value}
                  </motion.p>
                  <p className="text-sm text-gray-500">
                    {stat.label}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Main Feature Cards */}
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-xl md:text-2xl font-semibold text-gray-900 mb-4"
          >
            Job Search Dashboard
          </motion.h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
            {mainFeatures.map((feature, index) => (
              <motion.button
                key={feature.title}
                onClick={(e) => handleCardClick(e, feature)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                whileHover={{ y: -5 }}
                className="relative overflow-hidden group p-5 rounded-xl bg-white shadow-sm 
                  hover:shadow-md transition-all duration-300 text-left border border-gray-100 flex flex-col h-full"
              >
                <div className="relative z-10 h-full flex flex-col">
                  <div className="p-3 rounded-xl mb-4 w-fit" 
                    style={{ backgroundColor: `${feature.color}15` }}>
                    <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
                  </div>
                  
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h2>
                  
                  <p className="text-gray-600 text-sm mb-4">
                    {feature.desc}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-medium text-gray-900">
                          {feature.stats.value}
                        </p>
                        <p className="text-xs text-gray-500">
                          {feature.stats.label}
                        </p>
                      </div>
                      
                      <motion.div 
                        whileHover={{ x: 5 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center text-gray-500 group-hover:text-gray-900"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </motion.div>
                    </div>
                  </div>
                </div>

                <motion.div 
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  whileHover={{ scale: 1.5, opacity: 0.8 }}
                  className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full opacity-10"
                  style={{ backgroundColor: feature.color }}
                />
              </motion.button>
            ))}
          </div>
          
          {/* Secondary Tools */}
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-xl md:text-2xl font-semibold text-gray-900 mb-4"
          >
            Helpful Tools
          </motion.h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {secondaryTools.map((tool, index) => (
              <motion.button
                key={tool.title}
                onClick={(e) => handleCardClick(e, tool)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="relative overflow-hidden group p-5 rounded-xl bg-white 
                  hover:shadow-sm transition-all duration-300 text-left border border-gray-100 flex h-full"
              >
                <div className="relative z-10 flex items-center gap-4">
                  <div className="p-3 rounded-xl" 
                    style={{ backgroundColor: `${tool.color}15` }}>
                    <tool.icon className="w-5 h-5" style={{ color: tool.color }} />
                  </div>
                  
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">
                      {tool.title}
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      {tool.desc}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </main>
      </motion.div>
    </div>
  );
} 