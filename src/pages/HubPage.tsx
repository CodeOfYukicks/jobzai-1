import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Coins, ChevronRight, LogOut, 
  Calendar, Briefcase, LayoutGrid, ScrollText, FileSearch,
  Clock, Mic, FileEdit, User, Lightbulb, LayoutDashboard
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserStats } from '../hooks/useUserStats';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import type { Activity } from '../types/stats';
import PageTransition from '../components/PageTransition';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import EditableWidgetGrid from '../components/hub/EditableWidgetGrid';

// Navigation groups matching sidebar structure
const navigationGroups = {
  apply: [
    { name: 'Job Board', desc: 'Browse and search job listings', href: '/jobs', icon: LayoutGrid, color: '#635BFF' },
    { name: 'Campaigns', desc: 'Manage your job search campaigns', href: '/campaigns', icon: ScrollText, color: '#8B5CF6' },
    { name: 'Resume Lab', desc: 'Analyze and optimize your CV', href: '/cv-analysis', icon: FileSearch, color: '#EC4899' },
  ],
  track: [
    { name: 'Application Tracking', desc: 'Monitor your job applications', href: '/applications', icon: Briefcase, color: '#F59E0B' },
    { name: 'Calendar', desc: 'View your schedule and interviews', href: '/calendar', icon: Calendar, color: '#10B981' },
  ],
  prepare: [
    { name: 'Interview Hub', desc: 'Prepare for upcoming interviews', href: '/upcoming-interviews', icon: Clock, color: '#3B82F6' },
    { name: 'Mock Interview', desc: 'Practice with AI simulations', href: '/mock-interview', icon: Mic, color: '#EF4444' },
    { name: 'Document Manager', desc: 'Manage your resumes and documents', href: '/resume-builder', icon: FileEdit, color: '#14B8A6' },
  ],
  improve: [
    { name: 'Professional Profile', desc: 'Build your professional identity', href: '/professional-profile', icon: User, color: '#8B5CF6' },
    { name: 'Recommendations', desc: 'Get personalized job suggestions', href: '/recommendations', icon: Lightbulb, color: '#F59E0B' },
    { name: 'Dashboard', desc: 'View analytics and insights', href: '/dashboard', icon: LayoutDashboard, color: '#10B981' },
  ],
};

export default function HubPage() {
  const { currentUser, userData } = useAuth();
  const { stats } = useUserStats();
  const [activities, setActivities] = useState<Activity[]>([]);
  const firstName = userData?.name?.split(' ')[0] || 'there';
  const navigate = useNavigate();
  const isNewUser = new Date(userData?.createdAt || '').getTime() > Date.now() - 24 * 60 * 60 * 1000;
  const [transition, setTransition] = useState({
    isOpen: false,
    color: '',
    path: '',
    clickPosition: null as { x: number; y: number } | null
  });
  const [totalApplications, setTotalApplications] = useState(0);
  const [activeInterviews, setActiveInterviews] = useState(0);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [successRate, setSuccessRate] = useState(0);

  // Load logo
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

  const handleCardClick = (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };

    setTransition({
      isOpen: true,
      color: item.color || '#635BFF',
      path: item.href,
      clickPosition
    });

    const isMobile = window.innerWidth <= 768;
    setTimeout(() => {
      navigate(item.href);
    }, isMobile ? 700 : 900);
  };

  // Fetch activities
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

  // Fetch applications and success rate
  useEffect(() => {
    if (!currentUser?.uid) return;
    const applicationsQuery = query(
      collection(db, `users/${currentUser.uid}/jobApplications`)
    );
    const unsubscribe = onSnapshot(applicationsQuery, (snapshot) => {
      const applications = snapshot.docs.map(doc => doc.data());
      const total = applications.length;
      const successful = applications.filter(app => app.status === 'offer').length;
      setTotalApplications(total);
      const rate = total > 0 ? (successful / total) * 100 : 0;
      setSuccessRate(rate);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Fetch interviews
  useEffect(() => {
    if (!currentUser?.uid) return;
    const interviewsQuery = query(
      collection(db, `users/${currentUser.uid}/interviews`),
      where('status', '==', 'scheduled')
    );
    const unsubscribe = onSnapshot(interviewsQuery, (snapshot) => {
      setActiveInterviews(snapshot.size);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Navigation card component with hover color effect
  const NavCard = ({ item, index, delay = 0 }: { item: any; index: number; delay?: number }) => (
    <motion.button
      onClick={(e) => handleCardClick(e, item)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay + index * 0.05 }}
      className="group relative overflow-hidden p-4 rounded-2xl bg-white dark:bg-gray-800 
        border border-gray-200 dark:border-gray-700
        hover:border-transparent dark:hover:border-transparent
        transition-all duration-300 text-left w-full"
      style={{
        ['--hover-color' as any]: item.color,
      }}
    >
      {/* Hover background */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
        style={{ backgroundColor: item.color }}
      />
      
      <div className="relative z-10 flex items-center gap-3">
        {/* Icon */}
        <div 
          className="p-2.5 rounded-xl transition-all duration-300
            bg-gray-100 dark:bg-gray-700 group-hover:bg-white/20"
        >
          <item.icon 
            className="w-5 h-5 transition-colors duration-300 text-gray-600 dark:text-gray-300 group-hover:text-white" 
          />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-white transition-colors duration-300 truncate">
            {item.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-white/70 transition-colors duration-300 truncate">
            {item.desc}
          </p>
        </div>
        
        {/* Arrow */}
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-all duration-300 
          opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
      </div>
    </motion.button>
  );

  // Section header component
  const SectionHeader = ({ title, delay = 0 }: { title: string; delay?: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="mb-3"
    >
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
        {title}
      </h2>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <PageTransition 
        {...transition} 
        onAnimationComplete={() => {}} 
      />
      
      <motion.div 
        animate={{ opacity: transition.isOpen ? 0 : 1 }}
        className="h-full"
      >
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 lg:h-20">
              <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-10 w-auto" />
                  ) : (
                  <div className="h-10 w-10 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-full" />
                  )}
                </Link>

              <div className="flex items-center gap-4">
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#635BFF]/10 to-[#635BFF]/5 dark:from-[#635BFF]/20 dark:to-[#635BFF]/10 px-4 py-2 rounded-full"
                >
                  <Coins className="w-4 h-4 text-[#635BFF]" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">{userData?.credits ?? 0}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">credits</span>
                </motion.div>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 dark:text-gray-400 
                    hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          {/* Welcome */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {isNewUser ? `Welcome to Jobz.ai, ${firstName}!` : `Welcome back, ${firstName}`}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {isNewUser ? "Let's start your job search journey." : "Here's what's happening today."}
            </p>
          </motion.div>

          {/* Editable Widgets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative mb-8 pt-8"
          >
            <EditableWidgetGrid />
          </motion.div>
          
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-[#FF8C42] rounded-2xl p-4 relative overflow-hidden"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">Applications</div>
              <div className="text-3xl font-black text-white">{totalApplications}</div>
              <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 text-white/20" />
              </motion.div>
          
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#14B8A6] rounded-2xl p-4 relative overflow-hidden"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">Success Rate</div>
              <div className="text-3xl font-black text-white">{successRate.toFixed(0)}%</div>
              <LineChart className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 text-white/20" />
            </motion.div>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-[#EC4899] rounded-2xl p-4 relative overflow-hidden"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">Interviews</div>
              <div className="text-3xl font-black text-white">{activeInterviews}</div>
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 text-white/20" />
            </motion.div>
                  </div>
                  
          {/* Navigation Grid - organized like sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* APPLY Section */}
                      <div>
                <SectionHeader title="Apply" delay={0.3} />
                <div className="space-y-2">
                  {navigationGroups.apply.map((item, index) => (
                    <NavCard key={item.name} item={item} index={index} delay={0.3} />
                  ))}
                </div>
                      </div>
                      
              {/* TRACK Section */}
              <div>
                <SectionHeader title="Track" delay={0.4} />
                <div className="space-y-2">
                  {navigationGroups.track.map((item, index) => (
                    <NavCard key={item.name} item={item} index={index} delay={0.4} />
                  ))}
                    </div>
                  </div>
                </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* PREPARE Section */}
              <div>
                <SectionHeader title="Prepare" delay={0.35} />
                <div className="space-y-2">
                  {navigationGroups.prepare.map((item, index) => (
                    <NavCard key={item.name} item={item} index={index} delay={0.35} />
            ))}
          </div>
                  </div>
                  
              {/* IMPROVE Section */}
                  <div>
                <SectionHeader title="Improve" delay={0.45} />
                <div className="space-y-2">
                  {navigationGroups.improve.map((item, index) => (
                    <NavCard key={item.name} item={item} index={index} delay={0.45} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </motion.div>
    </div>
  );
} 
