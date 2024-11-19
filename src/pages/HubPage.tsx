import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, LineChart, Mail, Target, Coins } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/ui/theme-toggle';
import FirebaseImage from '../components/FirebaseImage';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import AnimatedGridPattern from '../components/ui/animated-grid-pattern';
import { useTheme } from 'next-themes';

const menuItems = [
  {
    title: 'Campaigns',
    icon: Rocket,
    description: 'Create and manage your job applications',
    href: '/campaigns',
    bgColor: 'bg-[#F4F1FF]'
  },
  {
    title: 'Dashboard',
    icon: LineChart,
    description: 'Track your application progress',
    href: '/dashboard',
    bgColor: 'bg-[#EEE9FF]'
  },
  {
    title: 'Email Templates',
    icon: Mail,
    description: 'Manage your email templates',
    href: '/email-templates',
    bgColor: 'bg-[#F4F1FF]'
  },
  {
    title: 'Smart Matching',
    icon: Target,
    description: 'View your job recommendations',
    href: '/recommendations',
    bgColor: 'bg-[#EEE9FF]'
  }
];

export default function HubPage() {
  const { currentUser } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const firstName = currentUser?.displayName?.split(' ')[0] || 'there';
  const profilePicture = currentUser?.photoURL;

  // Récupérer les crédits de l'utilisateur
  useEffect(() => {
    const fetchCredits = async () => {
      if (currentUser?.uid) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setCredits(userDoc.data().credits || 0);
        }
      }
    };

    fetchCredits();
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-white relative">
      {/* AnimatedGridPattern avec couleurs ajustées */}
      <AnimatedGridPattern 
        width={40} 
        height={40} 
        x={0}
        y={0}
        className="absolute inset-0 h-full w-full fill-[#8D75E6]/[0.03] stroke-[#8D75E6]/[0.03]"
        strokeDasharray="4 4"
        numSquares={40}
        maxOpacity={0.3}
        duration={3}
        repeatDelay={0.3}
      />

      {/* Contenu existant */}
      <div className="relative z-10">
        {/* Header avec Logo et Credits */}
        <div className="flex justify-between items-center p-6 relative">
          {/* Credits */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#F4F1FF] text-[#8D75E6] px-4 py-2 rounded-full shadow-sm">
              <Coins className="w-4 h-4" />
              <span className="font-medium">
                {credits !== null ? credits : '...'}
              </span>
              <span className="text-sm text-[#8D75E6]/80">credits</span>
            </div>
            <ThemeToggle />
          </div>

          {/* Logo centré */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <FirebaseImage 
              path="images/logo-dark.png"
              alt="Jobz.ai"
              className="h-6 w-auto md:h-12"
            />
          </div>

          <div className="w-[100px]"></div>
        </div>

        {/* Photo de profil */}
        <div className="flex justify-center mt-8 mb-2">
          {profilePicture ? (
            <img 
              src={profilePicture}
              alt="Profile"
              className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-800 shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#4D3E78] text-white flex items-center justify-center text-2xl font-bold border-4 border-white dark:border-gray-800 shadow-lg">
              {firstName[0]}
            </div>
          )}
        </div>

        <main className="container mx-auto px-6 py-8">
          {/* Welcome Section avec conteneur stylisé */}
          <div className="text-center mb-8">
            <div className="max-w-2xl mx-auto backdrop-blur-sm bg-[#F4F1FF] rounded-3xl p-8 shadow-xl">
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold text-gray-900 mb-2"
              >
                Welcome back, {firstName}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-600 mb-8"
              >
                What would you like to do today?
              </motion.p>

              {/* Stats avec séparateurs */}
              <div className="flex justify-center items-center gap-8">
                <div className="text-center">
                  <span className="block text-3xl font-bold text-gray-900">12</span>
                  <span className="text-sm text-gray-600">Active Campaigns</span>
                </div>
                <div className="h-12 w-px bg-gray-200"></div>
                <div className="text-center">
                  <span className="block text-3xl font-bold text-gray-900">85%</span>
                  <span className="text-sm text-gray-600">Response Rate</span>
                </div>
                <div className="h-12 w-px bg-gray-200"></div>
                <div className="text-center">
                  <span className="block text-3xl font-bold text-gray-900">24</span>
                  <span className="text-sm text-gray-600">New Matches</span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Grid avec navigation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link 
                  to={item.href}
                  className={`
                    block rounded-2xl p-8
                    ${item.bgColor}
                    transition-all duration-300
                    hover:shadow-lg hover:-translate-y-1
                  `}
                >
                  <item.icon className="w-8 h-8 text-[#8D75E6] mb-4" />
                  <h2 className="text-2xl font-semibold text-[#8D75E6] mb-2">
                    {item.title}
                  </h2>
                  <p className="text-gray-600">
                    {item.description}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {/* Liste des activités récentes à implémenter */}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 