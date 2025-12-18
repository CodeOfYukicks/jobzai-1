import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, FileText, BarChart3, MessageSquare, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import FirebaseImage from '../FirebaseImage';

// Savings calculator data - tools replaced by Jobz.ai with their market prices
const savingsTools = [
  { id: 'jobsearch', name: 'AI Job Search', price: 35 }, // LinkedIn Premium, Indeed Resume
  { id: 'autoapply', name: 'Auto-Apply AI', price: 59 }, // Lemlist, Apollo, LazyApply
  { id: 'resume', name: 'AI Resume Builder', price: 19 }, // Resume.io, Kickresume
  { id: 'tracking', name: 'Application Tracker', price: 15 }, // Huntr, Teal
  { id: 'calendar', name: 'Smart Scheduling', price: 12 }, // Calendly, Cal.com
  { id: 'interview', name: 'Interview Coach AI', price: 25 }, // Big Interview, Interviewing.io
  { id: 'mock', name: 'AI Mock Interviews', price: 35 }, // Pramp, InterviewBuddy
  { id: 'cover', name: 'Cover Letter AI', price: 15 }, // CoverDoc, Kickresume
  { id: 'insights', name: 'Career Insights', price: 19 }, // JobScan, Careerflow
];

// Campaign features data with interactive content
const campaignFeatures = [
  {
    id: 'handoff',
    title: 'Hand off repetitive applications',
    description: 'What used to take days now takes minutes. Set your target criteria and watch AI handle the outreach while you focus on what matters.',
    videoPath: 'images/feature-handoff.mp4',
  },
  {
    id: 'personalized',
    title: 'Personalized at scale',
    description: 'Each application is uniquely tailored to the company culture, job requirements, and your experience. No more generic cover letters.',
    videoPath: 'images/feature-personalized.mp4',
  },
  {
    id: 'tracking',
    title: 'Track everything automatically',
    description: 'Real-time updates on application status, opens, replies, and interview requests. Never lose track of an opportunity again.',
    videoPath: 'images/feature-tracking.mp4',
  },
];

// Hero Feature Card - AI Campaigns with interactive items
function HeroFeatureCard() {
  const [activeFeature, setActiveFeature] = useState(campaignFeatures[0].id);
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});
  const [loadingVideos, setLoadingVideos] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const activeFeatureData = campaignFeatures.find(f => f.id === activeFeature);

  // Load video URLs from Firebase Storage
  useEffect(() => {
    const loadVideos = async () => {
      const storage = getStorage();
      const urls: Record<string, string> = {};
      
      for (const feature of campaignFeatures) {
        try {
          const videoRef = ref(storage, feature.videoPath);
          const url = await getDownloadURL(videoRef);
          urls[feature.id] = url;
        } catch {
          // Video not uploaded yet, will show placeholder
          console.log(`Video not found: ${feature.videoPath}`);
        }
      }
      
      setVideoUrls(urls);
      setLoadingVideos(false);
    };

    loadVideos();
  }, []);

  // Reset video when active feature changes
  useEffect(() => {
    if (videoRef.current && videoUrls[activeFeature]) {
      videoRef.current.load();
      videoRef.current.play();
    }
  }, [activeFeature, videoUrls]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[45%_55%]">
        {/* Left Content */}
        <div className="p-6 lg:p-8 flex flex-col">
          {/* Label + Badge */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium text-gray-500">AI Campaigns</span>
            <span className="px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
              New
            </span>
          </div>

          {/* Title */}
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            You set the target.<br />
            AI does the outreach.
          </h2>

          {/* CTA Button */}
          <Link
            to="/signup"
            className="inline-flex items-center justify-center w-9 h-9 bg-gray-900 hover:bg-gray-800 text-white rounded-full transition-colors mb-6"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>

          {/* Interactive Feature List */}
          <div className="mt-auto -ml-2">
            {campaignFeatures.map((feature, index) => (
              <div key={feature.id}>
                {/* Separator */}
                {index > 0 && <div className="h-px bg-gray-100 ml-2" />}
                
                {/* Clickable Item */}
                <button
                  onClick={() => setActiveFeature(feature.id)}
                  className={`w-full text-left py-3 transition-all duration-200 ${
                    activeFeature === feature.id ? 'pl-4 border-l-2 border-gray-900' : 'pl-2 border-l-2 border-transparent hover:pl-3'
                  }`}
                >
                  <h4 className={`font-semibold transition-colors ${
                    activeFeature === feature.id ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                  }`}>
                    {feature.title}
                  </h4>
                  
                  {/* Expandable Description */}
                  <AnimatePresence>
                    {activeFeature === feature.id && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm text-gray-500 mt-2 overflow-hidden"
                      >
                        {feature.description}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Preview - Changes based on active feature */}
        <div className="relative bg-gradient-to-br from-emerald-50 to-emerald-100 min-h-[450px] lg:min-h-[520px]">
          {/* Decorative stripe - like Notion's wavy pattern */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-b from-teal-300/40 via-emerald-400/30 to-teal-300/40" 
               style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 30 Q15 20 30 30 T60 30\' fill=\'none\' stroke=\'%2310b981\' stroke-width=\'2\' opacity=\'0.3\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat-y' }} />
          
          {/* Dynamic Preview Content */}
          <div className="absolute top-6 bottom-6 left-10 right-0 bg-white rounded-l-xl shadow-lg overflow-hidden">
            {/* Browser Chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#fafafa] border-b border-gray-100">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
              </div>
            </div>
            
            {/* Preview Content - Video or Placeholder */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="h-[calc(100%-41px)]"
              >
                {loadingVideos ? (
                  <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  </div>
                ) : videoUrls[activeFeature] ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  >
                    <source src={videoUrls[activeFeature]} type="video/mp4" />
                  </video>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100 flex items-center justify-center">
                        <span className="text-2xl">??</span>
                      </div>
                      <p className="text-sm text-gray-400">
                        {activeFeatureData?.title}
                      </p>
                      <p className="text-xs text-gray-300 mt-1">
                        Video coming soon
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Secondary Card - CV Rewrite
function SecondaryFeatureCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[45%_55%]">
        {/* Left Content */}
        <div className="p-6 lg:p-8 flex flex-col">
          {/* Label + Badge */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium text-gray-500">CV Rewrite</span>
            <span className="px-2.5 py-1 text-xs font-semibold bg-orange-100 text-orange-700 rounded-full">
              New update
            </span>
          </div>

          {/* Title */}
          <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 leading-tight">
            Transform your CV<br />
            with AI precision.
          </h3>

          {/* CTA Button */}
          <Link
            to="/signup"
            className="inline-flex items-center justify-center w-9 h-9 bg-gray-900 hover:bg-gray-800 text-white rounded-full transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Right Preview */}
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 min-h-[320px] lg:min-h-[380px]">
          {/* Decorative stripe */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-b from-blue-200/50 via-indigo-300/30 to-blue-200/50" />
          
          {/* Mockup */}
          <div className="absolute top-6 bottom-6 left-8 right-0 bg-white rounded-l-xl shadow-lg overflow-hidden">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                  <FileText className="w-3 h-3 text-blue-600" />
                </div>
                <div className="h-2 w-20 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full bg-gray-100 rounded"></div>
                <div className="h-2 w-4/5 bg-gray-100 rounded"></div>
                <div className="h-2 w-3/5 bg-gray-100 rounded"></div>
                <div className="h-2 w-full bg-blue-100 rounded mt-3"></div>
                <div className="h-2 w-4/5 bg-blue-50 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Grid Feature Card Component
interface GridCardProps {
  label: string;
  title: string;
  icon: React.ElementType;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  href: string;
  delay?: number;
}

function GridFeatureCard({ label, title, icon: Icon, accentColor, accentBg, accentBorder, href, delay = 0 }: GridCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm group"
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-sm font-medium text-gray-500">{label}</span>
          <Link
            to={href}
            className="inline-flex items-center justify-center w-10 h-10 bg-gray-900 hover:bg-gray-800 text-white rounded-full transition-all opacity-0 group-hover:opacity-100"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
      </div>

      {/* Preview Zone */}
      <div className={`relative h-48 ${accentBg}`}>
        {/* Accent border at top */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${accentBorder}`} />
        
        {/* Mini Mockup */}
        <div className="absolute inset-4 top-5 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-6 h-6 rounded-md ${accentBg} flex items-center justify-center`}>
                <Icon className={`w-3 h-3 ${accentColor}`} />
              </div>
              <div className="h-2 w-20 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-full bg-gray-100 rounded"></div>
              <div className="h-2 w-4/5 bg-gray-100 rounded"></div>
              <div className="h-2 w-3/5 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Savings Calculator Component
function SavingsCalculator() {
  const [selectedTools, setSelectedTools] = useState<string[]>(['jobsearch', 'autoapply', 'resume', 'tracking', 'interview']);

  const toggleTool = (toolId: string) => {
    setSelectedTools(prev => 
      prev.includes(toolId) 
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  const monthlySavings = savingsTools
    .filter(tool => selectedTools.includes(tool.id))
    .reduce((sum, tool) => sum + tool.price, 0);

  const annualSavings = monthlySavings * 12;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      className="py-12 lg:py-16"
    >
      {/* Top Section - Horizontal Layout */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 mb-8">
        {/* Left Content */}
        <div className="flex-shrink-0">
          <h3 className="text-3xl lg:text-[42px] font-black text-gray-900 mb-3 leading-[1.1] tracking-tight">
            More productivity.<br />
            Fewer tools.
          </h3>
          <p className="text-gray-500 text-[15px] mb-4">
            Bring all your tools and teams under one roof. Calculate savings below.
          </p>
        </div>

        {/* Right - Tool Icons in a row */}
        <div className="relative flex items-center">
          {/* Strikethrough line */}
          <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-gray-900 -rotate-3 z-10" />
          
          {/* Tool icons - grayscale brand-like icons */}
          <div className="flex items-center gap-3">
            {/* Simulated brand icons */}
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center opacity-50">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center opacity-50">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z"/></svg>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center opacity-50">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center opacity-50">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/></svg>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center opacity-50">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center opacity-50">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center opacity-50">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center opacity-50">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z"/></svg>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center opacity-50">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Checkboxes Section */}
      <div className="border-t border-gray-200 pt-8 mt-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {savingsTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => toggleTool(tool.id)}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 text-left ${
                selectedTools.includes(tool.id)
                  ? 'border-[#0275de] bg-[#e6f3fe]'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                selectedTools.includes(tool.id)
                  ? 'bg-[#0275de]'
                  : 'border-2 border-gray-300'
              }`}>
                {selectedTools.includes(tool.id) && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900 block truncate">{tool.name}</span>
                <span className="text-xs text-gray-400">${tool.price}/mo</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Savings Display */}
      <div className="border-t border-gray-200 mt-8 pt-8 grid grid-cols-2 divide-x divide-gray-200">
        <div className="pr-8">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Monthly savings</p>
          <motion.p
            key={monthlySavings}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl lg:text-4xl font-bold text-gray-900"
          >
            ${monthlySavings}
          </motion.p>
        </div>
        <div className="pl-8">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Annual savings</p>
          <motion.p
            key={annualSavings}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl lg:text-4xl font-bold text-gray-900"
          >
            ${annualSavings}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}

// Try For Free Section - Notion Style
function TryForFree() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="pt-8 pb-16"
    >
      {/* Title */}
      <h2 className="text-5xl lg:text-6xl font-black text-gray-900 mb-10 tracking-tight">
        Try for free.
      </h2>

      {/* Cards Grid - 2 columns, auto rows */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] lg:grid-rows-[1fr_1fr] gap-4 lg:auto-rows-fr">
        {/* Main Card - AutoPilot - spans both rows */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm lg:row-span-2 flex flex-col">
          <div className="p-8 pb-6">
            {/* Icon - Simple black */}
            <svg viewBox="0 0 40 40" fill="none" className="w-12 h-12 mb-5">
              <rect x="4" y="4" width="32" height="32" rx="6" stroke="#1a1a1a" strokeWidth="2.5"/>
              <path d="M12 20h16M20 12v16" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Get started with AutoPilot
            </h3>
            <p className="text-gray-500 text-base mb-5">
              Your AI workspace for mass job applications.
            </p>
            
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors w-fit"
            >
              Start free trial
            </Link>
          </div>

          {/* Image - Full width */}
          <div className="px-8 pb-4">
            <div className="rounded-xl overflow-hidden bg-[#f5f0e8]">
              <FirebaseImage 
                path="images/try-autopilot.png" 
                alt="AutoPilot Screenshot" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          {/* Sub-section like Notion's "Design system" */}
          <div className="px-8 py-6 border-t border-gray-100 mt-auto">
            <h4 className="text-xl font-bold text-gray-900 mb-2">Mass Applications</h4>
            <p className="text-gray-500 text-sm leading-relaxed">
              Send hundreds of personalized applications automatically.<br/>
              AI tailors each message to the company and role.
            </p>
          </div>
        </div>

        {/* Job Tracker Card - row 1, col 2 */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm relative flex flex-col">
          <div className="p-6 pr-[55%] flex-1">
            {/* Icon - Simple line */}
            <svg viewBox="0 0 32 32" fill="none" className="w-10 h-10 mb-3">
              <rect x="3" y="3" width="26" height="26" rx="4" stroke="#1a1a1a" strokeWidth="2"/>
              <path d="M3 11h26" stroke="#1a1a1a" strokeWidth="2"/>
              <path d="M11 11v18" stroke="#1a1a1a" strokeWidth="2"/>
            </svg>
            
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Job Tracker
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Track all your applications in one place.
            </p>
            
            <Link
              to="/signup"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors w-fit"
            >
              Try free
            </Link>
          </div>
          
          {/* Screenshot - absolute, top to bottom, clipped at bottom */}
          <div className="absolute right-0 top-5 bottom-0 w-[52%] overflow-hidden">
            <div className="rounded-tl-xl shadow-2xl overflow-hidden h-[120%]">
              <FirebaseImage 
                path="images/try-job-tracker.png" 
                alt="Job Tracker Screenshot" 
                className="w-full h-full object-cover object-left-top"
              />
            </div>
          </div>
        </div>

        {/* Mock Interview Card - row 2, col 2 */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm relative flex flex-col">
          <div className="p-6 pr-[55%] flex-1">
            {/* Icon - Simple line */}
            <svg viewBox="0 0 32 32" fill="none" className="w-10 h-10 mb-3">
              <rect x="2" y="5" width="28" height="22" rx="3" stroke="#1a1a1a" strokeWidth="2"/>
              <circle cx="16" cy="16" r="4" stroke="#1a1a1a" strokeWidth="2"/>
              <path d="M16 5v3M16 24v3" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Mock Interview
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Practice with AI-powered interviews.
            </p>
            
            <Link
              to="/signup"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors w-fit"
            >
              Try free
            </Link>
          </div>
          
          {/* Screenshot - absolute, top to bottom, clipped at bottom */}
          <div className="absolute right-0 top-5 bottom-0 w-[52%] overflow-hidden">
            <div className="rounded-tl-xl shadow-2xl overflow-hidden h-[120%]">
              <FirebaseImage 
                path="images/try-mock-interview.png" 
                alt="Mock Interview Screenshot" 
                className="w-full h-full object-cover object-left-top"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Press Quote Component
function PressQuote() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-16 lg:py-20"
    >
      <div className="text-center">
        <p className="text-2xl lg:text-4xl font-serif italic text-gray-900 mb-4">
          "The unfair advantage every job seeker needs."
        </p>
        <p className="text-lg font-bold text-gray-900">
          ProductHunt
        </p>
      </div>
    </motion.div>
  );
}

// Marketing Stats Cards
function MarketingStats() {
  const stats = [
    {
      label: 'Market Insights',
      title: 'Hidden Market Access',
      description: 'Use AI to discover and apply to job opportunities that are never posted publicly.',
      stat: '85%',
      statLabel: 'of opportunities never reach job boards',
      bgColor: 'bg-white',
      textColor: 'text-gray-900',
      labelColor: 'text-gray-500',
      statColor: 'text-[#0275de]',
    },
    {
      label: 'Case Study',
      title: 'Response Time Revolution',
      description: 'AI-powered outreach achieves first interviews within',
      stat: '24h',
      statLabel: '',
      bgColor: 'bg-[#0275de]',
      textColor: 'text-white',
      labelColor: 'text-blue-200',
      statColor: 'text-white',
    },
    {
      label: 'Automation',
      title: 'Effortless Applications',
      description: 'Generate personalized applications with just a few clicks. Let AI handle the heavy lifting.',
      stat: '',
      statLabel: '',
      bgColor: 'bg-gray-900',
      textColor: 'text-white',
      labelColor: 'text-gray-400',
      statColor: 'text-white',
    },
    {
      label: 'Analytics',
      title: 'Smart Campaign Management',
      description: 'Track your applications in real-time with our intuitive dashboard.',
      stat: '',
      statLabel: '',
      bgColor: 'bg-white',
      textColor: 'text-gray-900',
      labelColor: 'text-gray-500',
      statColor: 'text-[#0275de]',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {stats.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className={`${item.bgColor} rounded-2xl p-8 min-h-[280px] flex flex-col shadow-sm`}
        >
          {/* Label */}
          <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${item.labelColor}`}>
            {item.label}
          </p>
          
          {/* Title */}
          <h3 className={`text-2xl lg:text-3xl font-bold mb-3 ${item.textColor}`}>
            {item.title}
          </h3>
          
          {/* Description */}
          <p className={`text-sm lg:text-base mb-auto ${item.textColor} opacity-80`}>
            {item.description}
          </p>
          
          {/* Stat */}
          {item.stat && (
            <div className="mt-6">
              <p className={`text-5xl lg:text-6xl font-black ${item.statColor}`}>
                {item.stat}
              </p>
              {item.statLabel && (
                <p className={`text-sm mt-1 ${item.labelColor}`}>
                  {item.statLabel}
                </p>
              )}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

export default function FeatureSection() {
  const gridFeatures = [
    {
      label: 'Application Tracking',
      title: 'Every application, tracked.',
      icon: BarChart3,
      accentColor: 'text-[#FF6B5B]',
      accentBg: 'bg-[#FFECE8]',
      accentBorder: 'bg-[#FF6B5B]',
      href: '/signup',
    },
    {
      label: 'Interview Prep',
      title: 'Ace every call.',
      icon: MessageSquare,
      accentColor: 'text-[#4A9EFF]',
      accentBg: 'bg-[#E8F4FF]',
      accentBorder: 'bg-[#4A9EFF]',
      href: '/signup',
    },
  ];

  return (
    <section id="features" className="pt-8 pb-16 lg:pt-12 lg:pb-24">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <h2 className="text-5xl lg:text-6xl font-black text-gray-900 tracking-tight" style={{ fontWeight: 900 }}>
            Introducing <span className="italic font-black">Cubbbe 3.0</span>
          </h2>
        </motion.div>

        {/* Hero Feature Card - AI Campaigns */}
        <HeroFeatureCard />

        {/* Secondary Card - CV Rewrite */}
        <div className="mt-6">
          <SecondaryFeatureCard />
        </div>

        {/* Grid Cards - 2x2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {gridFeatures.map((feature, index) => (
            <GridFeatureCard
              key={feature.label}
              {...feature}
              delay={0.1 + index * 0.1}
            />
          ))}
        </div>
      </div>

      {/* Savings Calculator - Full Width White Bar */}
      <div className="bg-white mt-12">
        <div className="max-w-7xl mx-auto px-6">
          <SavingsCalculator />
        </div>
      </div>

      {/* Try For Free Section */}
      <div className="max-w-7xl mx-auto px-6">
        <TryForFree />
      </div>

      {/* Press Quote - Back to container */}
      <div className="max-w-7xl mx-auto px-6">
        <PressQuote />
      </div>
    </section>
  );
}
