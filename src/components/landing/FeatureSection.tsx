import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, FileText, Check, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import FirebaseImage from '../FirebaseImage';
import ProductShowcaseSection from './ProductShowcaseSection';
import { Icon } from '@iconify/react';

// Savings calculator data - tools replaced by Cubbbe with their market prices
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

// Hero Feature Cards - Minimal 2-Column Design
function HeroFeatureCard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
      {/* Card 1 - AI Campaigns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-[#f5f5f5] rounded-3xl p-6 lg:p-8 min-h-[450px] lg:min-h-[520px] flex flex-col"
      >
        {/* Pill Badge with Premium Icon */}
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full text-sm font-medium text-gray-900 shadow-sm">
            <Icon icon="solar:plain-bold" className="w-4 h-4 text-gray-700" />
            Campaigns
          </span>
        </div>

        {/* Title */}
        <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight mb-6">
          Automate your outreach.<br />
          Land more interviews.
        </h3>

        <div className="flex-1 flex items-center justify-center rounded-2xl overflow-hidden min-h-[200px]">
          {/* Placeholder - will be replaced by video */}
          <div className="text-center p-4">
            <Icon icon="solar:plain-bold" className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-xs text-gray-400">Animation coming soon</p>
          </div>
        </div>

        {/* Bottom Link - Pill Style */}
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white shadow-sm rounded-full text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors mt-auto w-fit"
        >
          About Campaigns
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>

      {/* Card 2 - CV Rewrite */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="bg-[#f5f5f5] rounded-3xl p-6 lg:p-8 min-h-[450px] lg:min-h-[520px] flex flex-col"
      >
        {/* Pill Badge with Premium Icon */}
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full text-sm font-medium text-gray-900 shadow-sm">
            <Icon icon="solar:document-bold" className="w-4 h-4 text-gray-700" />
            CV Rewrite
          </span>
        </div>

        {/* Title */}
        <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight mb-6">
          Your CV, tailored<br />
          for every application.
        </h3>

        <div className="flex-1 flex items-center justify-center rounded-2xl overflow-hidden min-h-[200px]">
          {/* Placeholder - will be replaced by video */}
          <div className="text-center p-4">
            <Icon icon="solar:document-bold" className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-xs text-gray-400">Animation coming soon</p>
          </div>
        </div>

        {/* Bottom Link - Pill Style */}
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white shadow-sm rounded-full text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors mt-auto w-fit"
        >
          About CV Rewrite
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  );
}

// Secondary Card - CV Rewrite
function SecondaryFeatureCard() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load image URL from Firebase Storage
  useEffect(() => {
    const loadImage = async () => {
      try {
        const storage = getStorage();
        const imageStorageRef = ref(storage, 'images/CVeditor.png');
        const url = await getDownloadURL(imageStorageRef);
        setImageUrl(url);
      } catch (error) {
        console.log('CV Editor image not found:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Desktop Layout */}
      <div className="hidden lg:grid grid-cols-[45%_55%]">
        <div className="p-8 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium text-gray-500">CV Rewrite</span>
            <span
              className="px-2.5 py-0.5 text-[10px] font-medium tracking-wide uppercase rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(34, 0, 65, 0.08) 0%, rgba(34, 0, 65, 0.04) 100%)',
                color: '#220041',
                border: '1px solid rgba(34, 0, 65, 0.1)'
              }}
            >
              New update
            </span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
            Your CV tailored to each role.<br />
            Optimized for recruiters.
          </h3>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center w-9 h-9 bg-gray-900 hover:bg-gray-800 text-white rounded-full transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="relative min-h-[380px]" style={{ background: 'linear-gradient(135deg, rgba(223, 189, 255, 0.3) 0%, rgba(223, 189, 255, 0.4) 100%)' }}>
          <div className="absolute left-0 top-0 bottom-0 w-12" style={{ background: 'linear-gradient(180deg, rgba(223, 189, 255, 0.5) 0%, rgba(34, 0, 65, 0.15) 50%, rgba(223, 189, 255, 0.5) 100%)' }} />
          <div className="absolute top-6 bottom-6 left-8 right-6 rounded-xl shadow-lg overflow-hidden bg-white">
            {isLoading ? (
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt="CV Rewrite feature preview"
                className="w-full h-full object-contain" style={{ backgroundColor: 'rgba(223, 189, 255, 0.15)' }}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(223, 189, 255, 0.5)' }}>
                    <FileText className="w-8 h-8 text-[#2667ff]" />
                  </div>
                  <p className="text-sm text-gray-400">CV Rewrite Demo</p>
                  <p className="text-xs text-gray-300 mt-1">Image coming soon</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#add7f6] flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-[#2667ff]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-500">CV Rewrite</span>
              <span
                className="px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 0, 65, 0.08) 0%, rgba(34, 0, 65, 0.04) 100%)',
                  color: '#220041',
                  border: '1px solid rgba(34, 0, 65, 0.1)'
                }}
              >
                New
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">
              CV tailored to each role
            </h3>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-3 mb-4">
          AI optimizes your resume for ATS systems and recruiters. Stand out in every application.
        </p>

        <Link
          to="/signup"
          className="flex items-center justify-center w-full py-3 border border-gray-200 text-gray-900 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Try CV Rewrite
        </Link>
      </div>
    </motion.div>
  );
}

// Mock Interview Card - Similar to CV Rewrite
function MockInterviewCard() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load video URL from Firebase Storage
  useEffect(() => {
    const loadVideo = async () => {
      try {
        const storage = getStorage();
        const videoStorageRef = ref(storage, 'images/mockinterview.mp4');
        const url = await getDownloadURL(videoStorageRef);
        setVideoUrl(url);
      } catch (error) {
        console.log('Mock Interview video not found:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVideo();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Desktop Layout */}
      <div className="hidden lg:grid grid-cols-[45%_55%]">
        <div className="p-8 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium text-gray-500">Mock Interview</span>
            <span
              className="px-2.5 py-0.5 text-[10px] font-medium tracking-wide uppercase rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(34, 0, 65, 0.08) 0%, rgba(34, 0, 65, 0.04) 100%)',
                color: '#220041',
                border: '1px solid rgba(34, 0, 65, 0.1)'
              }}
            >
              AI Powered
            </span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
            Train like it's<br />
            the real interview.
          </h3>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center w-9 h-9 bg-gray-900 hover:bg-gray-800 text-white rounded-full transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="relative bg-gradient-to-br from-[#add7f6]/30 to-[#87bfff]/40 min-h-[380px]">
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-b from-[#87bfff]/50 via-[#3f8efc]/30 to-[#87bfff]/50" />
          <div className="absolute top-6 bottom-6 left-8 right-6 rounded-xl shadow-lg overflow-hidden bg-zinc-950">
            {isLoading ? (
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              </div>
            ) : videoUrl ? (
              <video
                ref={videoRef}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover bg-zinc-950"
              >
                <source src={videoUrl} type="video/mp4" />
              </video>
            ) : (
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#add7f6] flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-[#2667ff]" />
                  </div>
                  <p className="text-sm text-gray-400">Mock Interview Demo</p>
                  <p className="text-xs text-gray-300 mt-1">Video coming soon</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#add7f6] flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-6 h-6 text-[#2667ff]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-500">Mock Interview</span>
              <span
                className="px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 0, 65, 0.08) 0%, rgba(34, 0, 65, 0.04) 100%)',
                  color: '#220041',
                  border: '1px solid rgba(34, 0, 65, 0.1)'
                }}
              >
                AI
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">
              Train like the real thing
            </h3>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-3 mb-4">
          Practice with AI interviews tailored to your target roles. Get instant feedback and improve.
        </p>

        <Link
          to="/signup"
          className="flex items-center justify-center w-full py-3 border border-gray-200 text-gray-900 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Try Mock Interview
        </Link>
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
  videoPath?: string;
}

function GridFeatureCard({ label, title, icon: Icon, accentColor, accentBg, accentBorder, href, delay = 0, videoPath }: GridCardProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!!videoPath);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load video URL from Firebase Storage if videoPath is provided
  useEffect(() => {
    if (!videoPath) return;

    const loadVideo = async () => {
      try {
        const storage = getStorage();
        const videoStorageRef = ref(storage, videoPath);
        const url = await getDownloadURL(videoStorageRef);
        setVideoUrl(url);
      } catch (error) {
        console.log(`Video not found: ${videoPath}`, error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVideo();
  }, [videoPath]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm group"
    >
      {/* Header - matched height with ApplicationTrackingCard */}
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
        <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>

        {/* Spacer to match ApplicationTrackingCard toggle height */}
        <div className="h-[34px]"></div>
      </div>

      {/* Preview Zone */}
      <div className={`relative h-48 sm:h-96 ${accentBg}`}>
        {/* Accent border at top */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${accentBorder}`} />

        {/* Video or Placeholder - Notion style: starts from middle, rounded top, extends to bottom */}
        <div className="absolute left-4 sm:left-6 right-4 sm:right-6 top-4 sm:top-6 bottom-0 rounded-t-2xl shadow-lg overflow-hidden bg-zinc-950">
          {isLoading ? (
            <div className="h-full flex items-center justify-center bg-white">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
          ) : videoUrl ? (
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain sm:object-cover object-top bg-zinc-950"
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          ) : (
            <div className="h-full bg-white p-3">
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
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Application Tracking Card with Toggle
const trackingModes = [
  {
    id: 'jobs',
    label: 'Job Applications',
    videoPath: 'images/jobapplication.mp4',
  },
  {
    id: 'outreach',
    label: 'Outreach Campaigns',
    videoPath: 'images/outreach applcation.mp4',
  },
];

function ApplicationTrackingCard() {
  const [activeMode, setActiveMode] = useState(trackingModes[0].id);
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});
  const [loadingVideos, setLoadingVideos] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const activeModeData = trackingModes.find(m => m.id === activeMode);

  // Load video URLs from Firebase Storage
  useEffect(() => {
    const loadVideos = async () => {
      const storage = getStorage();
      const urls: Record<string, string> = {};

      for (const mode of trackingModes) {
        try {
          const videoStorageRef = ref(storage, mode.videoPath);
          const url = await getDownloadURL(videoStorageRef);
          urls[mode.id] = url;
        } catch {
          console.log(`Video not found: ${mode.videoPath}`);
        }
      }

      setVideoUrls(urls);
      setLoadingVideos(false);
    };

    loadVideos();
  }, []);

  // Reset video when active mode changes
  useEffect(() => {
    if (videoRef.current && videoUrls[activeMode]) {
      videoRef.current.load();
      videoRef.current.play();
    }
  }, [activeMode, videoUrls]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-sm font-medium text-gray-500">Application Tracking</span>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center w-10 h-10 bg-gray-900 hover:bg-gray-800 text-white rounded-full transition-all"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Know exactly what's working — and what isn't.</h3>

        {/* Toggle Pills */}
        <div className="flex gap-2">
          {trackingModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeMode === mode.id
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview Zone */}
      <div className="relative h-48 sm:h-96 bg-[#add7f6]/30">
        {/* Accent border at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#3f8efc]" />

        {/* Video - Notion style */}
        <div className="absolute left-4 sm:left-6 right-4 sm:right-6 top-4 sm:top-6 bottom-0 rounded-t-2xl shadow-lg overflow-hidden bg-zinc-950">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {loadingVideos ? (
                <div className="h-full flex items-center justify-center bg-white">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                </div>
              ) : videoUrls[activeMode] ? (
                <video
                  ref={videoRef}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-contain sm:object-cover object-top bg-zinc-950"
                >
                  <source src={videoUrls[activeMode]} type="video/mp4" />
                </video>
              ) : (
                <div className="h-full flex items-center justify-center bg-white">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#add7f6] flex items-center justify-center">
                      <BarChart3 className="w-8 h-8 text-[#2667ff]" />
                    </div>
                    <p className="text-sm text-gray-400">{activeModeData?.label}</p>
                    <p className="text-xs text-gray-300 mt-1">Video coming soon</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// Savings Calculator Component - Premium Minimalist Design
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
      className="py-16 md:py-20 lg:py-24"
    >
      {/* Centered Header */}
      <div className="text-center mb-10 md:mb-14">
        <h3
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          One platform.<br className="md:hidden" /> All your tools.
        </h3>
        <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto">
          Replace multiple subscriptions with a single solution. See how much you could save.
        </p>
      </div>

      {/* Checkboxes in Cards - Cleaner Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10 md:mb-14">
        {savingsTools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => toggleTool(tool.id)}
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${selectedTools.includes(tool.id)
              ? 'bg-gray-900 border-gray-900'
              : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
          >
            <div
              className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${selectedTools.includes(tool.id)
                ? 'bg-white'
                : 'border-2 border-gray-300'
                }`}
            >
              {selectedTools.includes(tool.id) && (
                <Check className="w-3.5 h-3.5 text-gray-900" />
              )}
            </div>
            <div className="flex-1 flex items-center justify-between gap-2">
              <span className={`text-sm font-medium transition-colors ${selectedTools.includes(tool.id) ? 'text-white' : 'text-gray-900'}`}>
                {tool.name}
              </span>
              <span className={`text-xs font-medium flex-shrink-0 ${selectedTools.includes(tool.id) ? 'text-white/60' : 'text-gray-400'}`}>
                ${tool.price}/mo
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Savings Display - Centered, Clean */}
      <div className="bg-[#f5f5f5] rounded-3xl p-8 md:p-10">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Monthly savings</p>
            <motion.p
              key={monthlySavings}
              initial={{ scale: 1.05, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl md:text-5xl font-bold text-gray-900"
            >
              ${monthlySavings}
            </motion.p>
          </div>
          <div className="hidden md:block w-px h-16 bg-gray-300" />
          <div className="text-center">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Annual savings</p>
            <motion.p
              key={annualSavings}
              initial={{ scale: 1.05, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl md:text-5xl font-bold text-gray-900"
            >
              ${annualSavings}
            </motion.p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Try For Free Section - Notion Style with Mobile Optimization
function TryForFree() {
  const [activeFeature, setActiveFeature] = useState(0);
  const featureScrollRef = useRef<HTMLDivElement>(null);

  const secondaryFeatures = [
    {
      title: 'Creative Studio',
      description: 'Design resumes, capture ideas, and brainstorm visually.',
      cta: 'Open Studio',
      icon: (
        <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
          <rect x="4" y="2" width="24" height="28" rx="3" stroke="currentColor" strokeWidth="2" />
          <path d="M9 8h14M9 13h14M9 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      imagePath: 'images/try-creative-studio.png',
    },
    {
      title: 'Dashboard',
      description: 'Your command center for applications, interviews, and insights.',
      cta: 'View Dashboard',
      icon: (
        <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
          <rect x="3" y="3" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
          <rect x="18" y="3" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
          <rect x="3" y="18" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
          <rect x="18" y="18" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
      imagePath: 'images/try-dashboard.png',
    },
  ];

  // Handle scroll to update active indicator (mobile)
  useEffect(() => {
    const container = featureScrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.offsetWidth * 0.85;
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveFeature(Math.min(Math.max(newIndex, 0), secondaryFeatures.length - 1));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [secondaryFeatures.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="pt-16 md:pt-20 pb-16 md:pb-20"
    >
      {/* Centered Title */}
      <div className="text-center mb-10 md:mb-14">
        <h2
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Everything you need.<br className="md:hidden" /> Nothing you don't.
        </h2>
        <p className="text-gray-500 text-base md:text-lg max-w-lg mx-auto">
          Start for free. No credit card required.
        </p>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:grid grid-cols-[1fr_1fr] grid-rows-[1fr_1fr] gap-4 auto-rows-fr">
        {/* Main Card - AI Assistant - spans both rows */}
        <div className="bg-[#f5f5f5] rounded-3xl overflow-hidden row-span-2 flex flex-col">
          <div className="p-8 pb-6">
            <svg viewBox="0 0 40 40" fill="none" className="w-12 h-12 mb-5">
              <path d="M20 4l2.5 7.5L30 14l-7.5 2.5L20 24l-2.5-7.5L10 14l7.5-2.5L20 4z" stroke="#1a1a1a" strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M32 22l1.5 4.5L38 28l-4.5 1.5L32 34l-1.5-4.5L26 28l4.5-1.5L32 22z" stroke="#1a1a1a" strokeWidth="2" strokeLinejoin="round" />
              <path d="M10 26l1 3L14 30l-3 1L10 34l-1-3L6 30l3-1L10 26z" stroke="#1a1a1a" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Meet your AI Assistant
            </h3>
            <p className="text-gray-500 text-base mb-6">
              Your personal job search copilot. Ask anything, get instant help.
            </p>

            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors w-fit"
            >
              Start free trial
            </Link>
          </div>

          <div className="px-8 pb-4">
            <div className="rounded-2xl overflow-hidden bg-white">
              <FirebaseImage
                path="images/try-ai-assistant.png"
                alt="AI Assistant Screenshot"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          <div className="px-8 py-6 mt-auto">
            <h4 className="text-xl font-bold text-gray-900 mb-2">Always There to Help</h4>
            <p className="text-gray-500 text-sm leading-relaxed">
              From writing cover letters to preparing for interviews.<br />
              Your AI assistant knows your profile and goals.
            </p>
          </div>
        </div>

        {/* Secondary Cards - Desktop */}
        {secondaryFeatures.map((feature) => (
          <div key={feature.title} className="bg-[#f5f5f5] rounded-3xl overflow-hidden relative flex flex-col">
            <div className="p-6 pr-[55%] flex-1">
              <div className="text-gray-900 mb-3">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{feature.title}</h3>
              <p className="text-gray-500 text-sm mb-4">{feature.description}</p>
              <Link
                to="/signup"
                className="inline-flex items-center px-5 py-2.5 border-2 border-gray-900 text-gray-900 rounded-full text-sm font-medium hover:bg-gray-900 hover:text-white transition-colors w-fit"
              >
                {feature.cta}
              </Link>
            </div>
            <div className="absolute right-0 top-5 bottom-0 w-[52%] overflow-hidden">
              <div className="rounded-tl-2xl shadow-xl overflow-hidden h-[120%] bg-white">
                <FirebaseImage
                  path={feature.imagePath}
                  alt={`${feature.title} Screenshot`}
                  className="w-full h-full object-cover object-left-top"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden space-y-4">
        {/* AI Assistant Card - Simplified for Mobile */}
        <div className="bg-[#f5f5f5] rounded-3xl overflow-hidden">
          <div className="p-5">
            {/* Compact header with icon */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
                  <path d="M20 4l2.5 7.5L30 14l-7.5 2.5L20 24l-2.5-7.5L10 14l7.5-2.5L20 4z" stroke="#1a1a1a" strokeWidth="2.5" strokeLinejoin="round" />
                  <path d="M32 22l1.5 4.5L38 28l-4.5 1.5L32 34l-1.5-4.5L26 28l4.5-1.5L32 22z" stroke="#1a1a1a" strokeWidth="2" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  AI Assistant
                </h3>
                <p className="text-gray-500 text-sm">
                  Your personal job search copilot
                </p>
              </div>
            </div>

            {/* Key benefit */}
            <div className="bg-white rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="font-semibold text-gray-900">Ask anything, get instant help.</span> From cover letters to interview prep, your AI knows your profile and goals.
              </p>
            </div>

            {/* CTA - Full width for better touch */}
            <Link
              to="/signup"
              className="flex items-center justify-center w-full py-3.5 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              Start free trial
            </Link>
          </div>
        </div>

        {/* Secondary Features - Horizontal Scroll */}
        <div>
          <div
            ref={featureScrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-2"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {secondaryFeatures.map((feature) => (
              <div
                key={feature.title}
                className="flex-shrink-0 w-[85%] snap-center pr-3"
                style={{ scrollSnapAlign: 'center' }}
              >
                <div className="bg-[#f5f5f5] rounded-3xl p-5 h-full">
                  {/* Icon + Title */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 text-gray-700">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{feature.title}</h3>
                      <p className="text-gray-500 text-sm mt-0.5">{feature.description}</p>
                    </div>
                  </div>

                  {/* Mini Preview */}
                  <div className="rounded-xl overflow-hidden bg-white mb-4 h-32">
                    <FirebaseImage
                      path={feature.imagePath}
                      alt={`${feature.title} Preview`}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>

                  {/* CTA */}
                  <Link
                    to="/signup"
                    className="flex items-center justify-center w-full py-3 border-2 border-gray-900 text-gray-900 rounded-full text-sm font-medium hover:bg-gray-900 hover:text-white transition-colors"
                  >
                    {feature.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Indicators */}
          <div className="flex justify-center gap-2 mt-3">
            {secondaryFeatures.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  const container = featureScrollRef.current;
                  if (container) {
                    const cardWidth = container.offsetWidth * 0.85;
                    container.scrollTo({ left: cardWidth * index, behavior: 'smooth' });
                  }
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${activeFeature === index
                  ? 'w-6 bg-gray-900'
                  : 'w-1.5 bg-gray-300'
                  }`}
                aria-label={`View ${secondaryFeatures[index].title}`}
              />
            ))}
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
        <p className="text-2xl lg:text-4xl font-serif italic text-gray-900 mb-1">
          "The unfair advantage every job seeker needs."
        </p>
        <img
          src="/images/Product_Hunt-Logo.wine.png"
          alt="Product Hunt"
          className="h-32 w-auto mx-auto object-contain"
        />
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
      statColor: 'text-[#2667ff]',
    },
    {
      label: 'Case Study',
      title: 'Response Time Revolution',
      description: 'AI-powered outreach achieves first interviews within',
      stat: '24h',
      statLabel: '',
      bgColor: 'bg-[#2667ff]',
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
      statColor: 'text-[#2667ff]',
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
      label: 'Interview Prep',
      title: 'Practice with AI. Show up confident.',
      icon: MessageSquare,
      accentColor: 'text-[#2667ff]',
      accentBg: 'bg-[#add7f6]/30',
      accentBorder: 'bg-[#3f8efc]',
      href: '/signup',
      videoPath: 'images/interviewprep.mp4',
    },
  ];

  return (
    <section id="features" className="pt-12 pb-16 lg:pt-20 lg:pb-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Section Title - Responsive */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 md:mb-16 text-center"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>
            The future of job search.
          </h2>
        </motion.div>

        {/* Hero Feature Cards - 2 Column Layout */}
        <HeroFeatureCard />

      </div>

      {/* Premium Product Showcase - Application Tracking, Interview Prep, Mock Interview */}
      <ProductShowcaseSection />

      {/* Savings Calculator - Full Width White Bar */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <SavingsCalculator />
        </div>
      </div>

      {/* Try For Free Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <TryForFree />
      </div>
    </section>
  );
}
