import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, FileText, Check, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import FirebaseImage from '../FirebaseImage';
import ProductShowcaseSection from './ProductShowcaseSection';

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

// Hero Feature Card - AI Campaigns with interactive items
function HeroFeatureCard() {
  const [activeFeature, setActiveFeature] = useState(campaignFeatures[0].id);
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});
  const [loadingVideos, setLoadingVideos] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  const activeFeatureData = campaignFeatures.find(f => f.id === activeFeature);
  const activeFeatureIndex = campaignFeatures.findIndex(f => f.id === activeFeature);

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

  // Handle mobile scroll to update active feature
  useEffect(() => {
    const container = mobileScrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.offsetWidth;
      const newIndex = Math.round(scrollLeft / cardWidth);
      const newFeature = campaignFeatures[Math.min(Math.max(newIndex, 0), campaignFeatures.length - 1)];
      if (newFeature) setActiveFeature(newFeature.id);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Desktop Layout */}
      <div className="hidden lg:grid grid-cols-[45%_55%]">
        {/* Left Content */}
        <div className="p-8 flex flex-col">
          {/* Label + Badge */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium text-gray-500">AI Campaigns</span>
            <span className="px-2.5 py-1 text-xs font-semibold bg-[#add7f6] text-[#2667ff] rounded-full">
              New
            </span>
          </div>

          {/* Title */}
          <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
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
                {index > 0 && <div className="h-px bg-gray-100 ml-2" />}
                <button
                  onClick={() => setActiveFeature(feature.id)}
                  className={`w-full text-left py-3 transition-all duration-200 ${activeFeature === feature.id ? 'pl-4 border-l-2 border-gray-900' : 'pl-2 border-l-2 border-transparent hover:pl-3'}`}
                >
                  <h4 className={`font-semibold transition-colors ${activeFeature === feature.id ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>
                    {feature.title}
                  </h4>
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

        {/* Right Preview */}
        <div className="relative bg-gradient-to-br from-[#add7f6]/30 to-[#87bfff]/40 min-h-[520px]">
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-b from-[#87bfff]/40 via-[#3f8efc]/30 to-[#87bfff]/40"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 30 Q15 20 30 30 T60 30\' fill=\'none\' stroke=\'%2310b981\' stroke-width=\'2\' opacity=\'0.3\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat-y' }} />
          <div className="absolute top-6 bottom-6 left-10 right-0 bg-zinc-950 rounded-l-xl shadow-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#fafafa] border-b border-gray-100">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
              </div>
            </div>
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
                    className="w-full h-full object-cover bg-zinc-950"
                  >
                    <source src={videoUrls[activeFeature]} type="video/mp4" />
                  </video>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100 flex items-center justify-center">
                        <span className="text-2xl">??</span>
                      </div>
                      <p className="text-sm text-gray-400">{activeFeatureData?.title}</p>
                      <p className="text-xs text-gray-300 mt-1">Video coming soon</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Header */}
        <div className="p-5 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-gray-500">AI Campaigns</span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-[#add7f6] text-[#2667ff] rounded-full">
              New
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
            You set the target.<br />
            AI does the outreach.
          </h2>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Get started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Feature Cards Carousel */}
        <div
          ref={mobileScrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {campaignFeatures.map((feature, index) => (
            <div
              key={feature.id}
              className="flex-shrink-0 w-full snap-center px-5 pb-4"
              style={{ scrollSnapAlign: 'center' }}
            >
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Indicators */}
        <div className="flex justify-center gap-2 pb-4">
          {campaignFeatures.map((feature, index) => (
            <button
              key={feature.id}
              onClick={() => {
                const container = mobileScrollRef.current;
                if (container) {
                  container.scrollTo({ left: container.offsetWidth * index, behavior: 'smooth' });
                }
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${activeFeature === feature.id
                ? 'w-6 bg-gray-900'
                : 'w-1.5 bg-gray-300'
                }`}
              aria-label={`View ${feature.title}`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Secondary Card - CV Rewrite
function SecondaryFeatureCard() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load video URL from Firebase Storage
  useEffect(() => {
    const loadVideo = async () => {
      try {
        const storage = getStorage();
        const videoStorageRef = ref(storage, 'images/CVeditor.mp4');
        const url = await getDownloadURL(videoStorageRef);
        setVideoUrl(url);
      } catch (error) {
        console.log('CV Editor video not found:', error);
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
            <span className="text-sm font-medium text-gray-500">CV Rewrite</span>
            <span className="px-2.5 py-1 text-xs font-semibold bg-[#add7f6] text-[#2667ff] rounded-full">
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

        <div className="relative bg-gradient-to-br from-[#add7f6]/30 to-[#87bfff]/40 min-h-[380px]">
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-b from-[#87bfff]/50 via-[#3f8efc]/30 to-[#87bfff]/50" />
          <div className="absolute top-6 bottom-6 left-8 right-6 rounded-xl shadow-lg overflow-hidden bg-white">
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
                className="w-full h-full object-cover bg-gray-50"
              >
                <source src={videoUrl} type="video/mp4" />
              </video>
            ) : (
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#add7f6] flex items-center justify-center">
                    <FileText className="w-8 h-8 text-[#2667ff]" />
                  </div>
                  <p className="text-sm text-gray-400">CV Rewrite Demo</p>
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
            <FileText className="w-6 h-6 text-[#2667ff]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-500">CV Rewrite</span>
              <span className="px-2 py-0.5 text-xs font-semibold bg-[#add7f6] text-[#2667ff] rounded-full">
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
            <span className="px-2.5 py-1 text-xs font-semibold bg-[#add7f6] text-[#2667ff] rounded-full">
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
              <span className="px-2 py-0.5 text-xs font-semibold bg-[#add7f6] text-[#2667ff] rounded-full">
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
      className="py-8 md:py-12 lg:py-16"
    >
      {/* Top Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 md:gap-8 mb-6 md:mb-8">
        {/* Left Content */}
        <div className="flex-shrink-0">
          <h3 className="text-2xl md:text-3xl lg:text-[42px] font-extrabold text-gray-900 mb-2 md:mb-3 leading-[1.1] tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>
            More productivity.<br />
            Fewer tools.
          </h3>
          <p className="text-gray-500 text-sm md:text-[15px]">
            Bring all your tools under one roof. Calculate savings below.
          </p>
        </div>

        {/* Right - Tool Icons - Hidden on mobile */}
        <div className="hidden md:flex relative items-center">
          {/* Strikethrough line */}
          <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-gray-900 -rotate-3 z-10" />
          {/* Tool icons - grayscale brand-like icons */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center opacity-50">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" /></svg>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center opacity-50">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z" /></svg>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center opacity-50">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" /></svg>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center opacity-50">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center opacity-50">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Checkboxes Section - 1 column on mobile, 2-3 on larger */}
      <div className="border-t border-gray-200 pt-6 md:pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
          {savingsTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => toggleTool(tool.id)}
              className={`flex items-center gap-3 p-3 md:p-3 rounded-xl border transition-all duration-200 text-left ${selectedTools.includes(tool.id)
                ? 'border-[#3f8efc] bg-[#add7f6]/30'
                : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${selectedTools.includes(tool.id)
                ? 'bg-[#2667ff]'
                : 'border-2 border-gray-300'
                }`}>
                {selectedTools.includes(tool.id) && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
              <div className="flex-1 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-900">{tool.name}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">${tool.price}/mo</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Savings Display - More compact on mobile */}
      <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-gray-200">
        <div className="bg-gray-50 rounded-2xl p-4 md:p-6">
          <div className="grid grid-cols-2 gap-4 md:gap-8">
            <div className="text-center md:text-left">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Monthly savings</p>
              <motion.p
                key={monthlySavings}
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900"
              >
                ${monthlySavings}
              </motion.p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Annual savings</p>
              <motion.p
                key={annualSavings}
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-2xl md:text-3xl lg:text-4xl font-bold text-green-600"
              >
                ${annualSavings}
              </motion.p>
            </div>
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
      title: 'Job Tracker',
      description: 'Track all your applications in one organized dashboard.',
      icon: (
        <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
          <rect x="3" y="3" width="26" height="26" rx="4" stroke="currentColor" strokeWidth="2" />
          <path d="M3 11h26" stroke="currentColor" strokeWidth="2" />
          <path d="M11 11v18" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
      imagePath: 'images/try-job-tracker.png',
    },
    {
      title: 'Mock Interview',
      description: 'Practice with AI and build unshakeable confidence.',
      icon: (
        <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
          <rect x="2" y="5" width="28" height="22" rx="3" stroke="currentColor" strokeWidth="2" />
          <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="2" />
          <path d="M16 5v3M16 24v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      imagePath: 'images/try-mock-interview.png',
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
      className="pt-12 md:pt-16 pb-12 md:pb-16"
    >
      {/* Title - Responsive */}
      <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 md:mb-10 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>
        Try for free.
      </h2>

      {/* Desktop Layout */}
      <div className="hidden lg:grid grid-cols-[1fr_1fr] grid-rows-[1fr_1fr] gap-4 auto-rows-fr">
        {/* Main Card - AutoPilot - spans both rows */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm row-span-2 flex flex-col">
          <div className="p-8 pb-6">
            <svg viewBox="0 0 40 40" fill="none" className="w-12 h-12 mb-5">
              <rect x="4" y="4" width="32" height="32" rx="6" stroke="#1a1a1a" strokeWidth="2.5" />
              <path d="M12 20h16M20 12v16" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
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

          <div className="px-8 pb-4">
            <div className="rounded-xl overflow-hidden bg-[#f5f0e8]">
              <FirebaseImage
                path="images/try-autopilot.png"
                alt="AutoPilot Screenshot"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          <div className="px-8 py-6 border-t border-gray-100 mt-auto">
            <h4 className="text-xl font-bold text-gray-900 mb-2">Mass Applications</h4>
            <p className="text-gray-500 text-sm leading-relaxed">
              Send hundreds of personalized applications automatically.<br />
              AI tailors each message to the company and role.
            </p>
          </div>
        </div>

        {/* Secondary Cards - Desktop */}
        {secondaryFeatures.map((feature, index) => (
          <div key={feature.title} className="bg-white rounded-2xl overflow-hidden shadow-sm relative flex flex-col">
            <div className="p-6 pr-[55%] flex-1">
              <div className="text-gray-900 mb-3">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{feature.title}</h3>
              <p className="text-gray-500 text-sm mb-4">{feature.description}</p>
              <Link
                to="/signup"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors w-fit"
              >
                Try free
              </Link>
            </div>
            <div className="absolute right-0 top-5 bottom-0 w-[52%] overflow-hidden">
              <div className="rounded-tl-xl shadow-2xl overflow-hidden h-[120%]">
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
        {/* AutoPilot Card - Simplified for Mobile */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5">
            {/* Compact header with icon */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
                  <rect x="4" y="4" width="32" height="32" rx="6" stroke="#1a1a1a" strokeWidth="2.5" />
                  <path d="M12 20h16M20 12v16" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  AutoPilot
                </h3>
                <p className="text-gray-500 text-sm">
                  Mass-apply to jobs with AI
                </p>
              </div>
            </div>

            {/* Key benefit */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="font-semibold text-gray-900">Send 100+ applications</span> in minutes.
                AI personalizes each one to the company and role.
              </p>
            </div>

            {/* CTA - Full width for better touch */}
            <Link
              to="/signup"
              className="flex items-center justify-center w-full py-3.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
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
            {secondaryFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className="flex-shrink-0 w-[85%] snap-center pr-3"
                style={{ scrollSnapAlign: 'center' }}
              >
                <div className="bg-white rounded-2xl p-5 shadow-sm h-full">
                  {/* Icon + Title */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-700">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{feature.title}</h3>
                      <p className="text-gray-500 text-sm mt-0.5">{feature.description}</p>
                    </div>
                  </div>

                  {/* Mini Preview */}
                  <div className="rounded-xl overflow-hidden bg-gray-100 mb-4 h-32">
                    <FirebaseImage
                      path={feature.imagePath}
                      alt={`${feature.title} Preview`}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>

                  {/* CTA */}
                  <Link
                    to="/signup"
                    className="flex items-center justify-center w-full py-3 border border-gray-200 text-gray-900 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Try free
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
    <section id="features" className="pt-12 pb-0 lg:pt-20 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Section Title - Responsive */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6 md:mb-10"
        >
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>
            Introducing <span className="italic font-black">Cubbbe 3.0</span>
          </h2>
        </motion.div>

        {/* Hero Feature Card - AI Campaigns */}
        <HeroFeatureCard />

        {/* Secondary Card - CV Rewrite */}
        <div className="mt-4 md:mt-6 mb-6 md:mb-8">
          <SecondaryFeatureCard />
        </div>

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
