import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, Target, CheckCircle, AlertCircle, AlertTriangle, Lightbulb, Info,
  ArrowLeft, Sparkles, TrendingUp, TrendingDown, ExternalLink, Wand2, Building2,
  Calendar, MapPin, Briefcase, BookOpen, List
} from 'lucide-react';
import { motion } from 'framer-motion';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import ScoreDonut from '../components/ats/ScoreDonut';

interface ATSAnalysis {
  id: string;
  jobTitle: string;
  company: string;
  location?: string;
  date: string;
  matchScore: number;
  userId: string;
  status?: string;
  jobUrl?: string;
  keyFindings: string[];
  skillsMatch: {
    matching: { name: string; relevance: number; location?: string }[];
    missing: { name: string; relevance: number }[];
    alternative: { name: string; alternativeTo: string; explanation?: string }[];
  };
  categoryScores: {
    skills: number;
    experience: number;
    education: number;
    industryFit: number;
  };
  executiveSummary: string;
  experienceAnalysis: { aspect: string; analysis: string }[];
  recommendations: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    examples?: string;
  }[];
  jobSummary?: string;
}

function getScoreColorClass(score: number): string {
  if (score >= 80) return "text-purple-600 dark:text-purple-400";
  if (score >= 60) return "text-blue-600 dark:text-blue-400";
  return "text-pink-600 dark:text-pink-400";
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-purple-500";
  if (score >= 60) return "bg-blue-500";
  return "bg-pink-500";
}

function getScoreGradient(score: number): string {
  if (score >= 80) return "from-purple-500 to-indigo-500";
  if (score >= 60) return "from-blue-500 to-cyan-500";
  return "from-pink-500 to-rose-500";
}

// Section Card Component
function SectionCard({ 
  title, 
  icon, 
  children, 
  className = '',
  id
}: { 
  title?: string; 
  icon?: ReactNode; 
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div id={id} className={`scroll-mt-24 rounded-xl bg-white dark:bg-[#1E1F22] border border-gray-200 dark:border-[#2A2A2E] p-6 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          {icon}
          {title}
        </h3>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

// Progress Bar Component
function ProgressBar({ 
  label, 
  value, 
  className = '' 
}: { 
  label: string; 
  value: number; 
  className?: string;
}) {
  const colorClass = getScoreColorClass(value);
  const bgColor = getScoreBgColor(value);
  
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          <span className={`text-sm font-semibold ${colorClass}`}>{Math.round(value)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-gray-100 dark:bg-[#2A2A2E] rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${bgColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// Skill Bar Component
function SkillBar({ 
  skill, 
  relevance, 
  category 
}: { 
  skill: string; 
  relevance: number; 
  category?: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#26262B] border border-gray-200 dark:border-[#2A2A2E]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{skill}</span>
          {category && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-200 dark:bg-[#2A2A2E] text-gray-600 dark:text-gray-400">
              {category}
            </span>
          )}
        </div>
        <span className={`text-sm font-semibold ${getScoreColorClass(relevance)}`}>
          {relevance}%
        </span>
      </div>
      <ProgressBar label="" value={relevance} />
    </div>
  );
}

function getWeaknessPriority(gap: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (gap >= 40) return 'HIGH';
  if (gap >= 20) return 'MEDIUM';
  return 'LOW';
}

function getFindingVariant(finding: string): 'positive' | 'warning' | 'info' {
  const text = finding.toLowerCase();
  if (text.includes('strong') || text.includes('excellent') || text.includes('good fit') || text.includes('well aligned')) {
    return 'positive';
  }
  if (text.includes('missing') || text.includes('gap') || text.includes('weak') || text.includes('risk')) {
    return 'warning';
  }
  return 'info';
}

// Sticky Sidebar with Two Tabs
function StickySidebar({ 
  analysis, 
  activeSection, 
  onNavigate 
}: { 
  analysis: ATSAnalysis;
  activeSection: string;
  onNavigate: (section: string) => void;
}) {
  const [sidebarTab, setSidebarTab] = useState<'summary' | 'navigation'>('summary');

  const sections = [
    { id: 'overview', label: 'Overview', icon: <Target className="w-4 h-4" /> },
    { id: 'skills', label: 'Matched Skills', icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'missing', label: 'Missing Skills', icon: <AlertCircle className="w-4 h-4" /> },
    { id: 'recommendations', label: 'Recommendations', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'findings', label: 'Key Findings', icon: <Info className="w-4 h-4" /> },
  ];

  // Parse job summary for better formatting
  const parseJobSummary = (summary?: string) => {
    if (!summary) return null;
    
    const sections: { title: string; items: string[] }[] = [];
    const lines = summary.split('\n');
    let currentSection: { title: string; items: string[] } | null = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Check if it's a header (bold text with **)
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: trimmed.replace(/\*\*/g, ''),
          items: []
        };
      } else if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        // It's a bullet point
        if (currentSection) {
          currentSection.items.push(trimmed.substring(1).trim());
        }
      } else if (currentSection && trimmed.length > 0) {
        // It's regular text under a section
        currentSection.items.push(trimmed);
      }
    });

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections.length > 0 ? sections : null;
  };

  const parsedSummary = parseJobSummary(analysis.jobSummary);

  return (
    <aside className="hidden lg:block w-80 flex-shrink-0">
      <div className="sticky top-24 space-y-4">
        {/* Two-tab interface */}
        <div className="bg-white dark:bg-[#1E1F22] border border-gray-200 dark:border-[#2A2A2E] rounded-xl overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-200 dark:border-[#2A2A2E]">
            <button
              onClick={() => setSidebarTab('summary')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                sidebarTab === 'summary'
                  ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-b-2 border-purple-600 dark:border-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#26262B]'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                Job Summary
              </div>
            </button>
            <button
              onClick={() => setSidebarTab('navigation')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                sidebarTab === 'navigation'
                  ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-b-2 border-purple-600 dark:border-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#26262B]'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <List className="w-4 h-4" />
                Navigation
              </div>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {sidebarTab === 'summary' ? (
              <div className="space-y-4">
                {parsedSummary && parsedSummary.length > 0 ? (
                  parsedSummary.map((section, idx) => (
                    <div key={idx}>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {section.title}
                      </h4>
                      <ul className="space-y-1.5">
                        {section.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed flex items-start gap-2">
                            <span className="text-purple-500 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      No job summary available
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => onNavigate(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                      activeSection === section.id
                        ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#26262B] hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <span className={activeSection === section.id ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}>
                      {section.icon}
                    </span>
                    <span className="text-sm">{section.label}</span>
                  </button>
                ))}
              </nav>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function ATSAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  
  const sectionsRef = useRef<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!id || !currentUser) return;

      try {
        const analysisDoc = await getDoc(doc(db, 'users', currentUser.uid, 'analyses', id));
        if (analysisDoc.exists()) {
          const data = analysisDoc.data();
          
          // Normalize matchScore: for premium analyses, use match_scores.overall_score if available
          // This ensures consistency between card display and detail page
          const normalizedMatchScore = data.match_scores?.overall_score !== undefined
            ? data.match_scores.overall_score
            : (data.matchScore !== undefined ? data.matchScore : 0);
          
          // Create analysis object with normalized score
          const normalizedAnalysis = {
            id: analysisDoc.id,
            ...data,
            matchScore: normalizedMatchScore
          } as ATSAnalysis;
          
          setAnalysis(normalizedAnalysis);
        } else {
          toast.error('Analysis not found');
          navigate('/cv-analysis');
        }
      } catch (error) {
        console.error('Error fetching analysis:', error);
        toast.error('Failed to load analysis');
        navigate('/cv-analysis');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id, currentUser, navigate]);

  // Scroll spy - detect active section
  useEffect(() => {
    const handleScroll = () => {
      const sectionIds = ['overview', 'skills', 'missing', 'recommendations', 'findings'];
      
      for (const sectionId of sectionIds) {
        const element = sectionsRef.current[sectionId];
        if (element) {
          const rect = element.getBoundingClientRect();
          // Check if section is in viewport
          if (rect.top >= 0 && rect.top < window.innerHeight / 3) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, [analysis]);

  // Navigate to section with smooth scroll
  const handleNavigate = (sectionId: string) => {
    const element = sectionsRef.current[sectionId];
    if (element) {
      const offset = 96; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  // Calculate top strengths and weaknesses
  const getTopStrengths = () => {
    if (!analysis || !analysis.skillsMatch || !analysis.skillsMatch.matching) return [];
    const strengths = analysis.skillsMatch.matching
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 3);
    return strengths;
  };

  const getTopWeaknesses = () => {
    if (!analysis || !analysis.skillsMatch || !analysis.skillsMatch.missing) return [];
    const weaknesses = analysis.skillsMatch.missing
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 3);
    return weaknesses;
  };

  const handleAIAction = (action: string) => {
    toast.info(`${action} - Coming soon!`);
  };

  if (loading) {
    return (
      <AuthLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0B] flex items-center justify-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-gray-800"></div>
              <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-purple-600 dark:border-purple-400 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Loading analysis...
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (!analysis) {
    return (
      <AuthLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0B] flex items-center justify-center">
          <div className="text-center py-16 max-w-md">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400 dark:text-gray-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Analysis Not Found
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              The analysis you're looking for doesn't exist or has been deleted.
            </p>
            <button
              onClick={() => navigate('/cv-analysis')}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              Back to Resume Lab
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0B]">
        {/* Compact Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E1F22]">
          <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Left: Back button + Title */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/cv-analysis')}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back</span>
                </button>
                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {analysis.jobTitle}
                  </h1>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      {analysis.company}
                    </span>
                    {analysis.location && (
                      <>
                        <span className="text-gray-300 dark:text-gray-700">•</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {analysis.location}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Match score badge */}
              <div className="flex items-center gap-3">
                {analysis.jobUrl && (
                  <a
                    href={analysis.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Job
                  </a>
                )}
                <div className={`px-4 py-2 rounded-full font-semibold text-sm border-2 ${
                  analysis.matchScore >= 80
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                    : analysis.matchScore >= 60
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                    : 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800'
                }`}>
                  {analysis.matchScore}% Match
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Sidebar */}
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start gap-8">
            {/* Main Content Area */}
            <main className="flex-1 min-w-0 space-y-8">
              {/* Overview Section */}
              <div ref={(el) => { sectionsRef.current['overview'] = el; }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  {/* Executive Summary */}
                  <SectionCard
                    id="overview"
                    title="Executive Summary"
                    icon={<FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                  >
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {analysis.executiveSummary}
                    </p>
                  </SectionCard>

                  {/* Category Scores Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(analysis.categoryScores || {}).map(([category, score]) => (
                      <div key={category} className="bg-white dark:bg-[#1E1F22] border border-gray-200 dark:border-[#2A2A2E] rounded-xl p-4 text-center">
                        <div className="text-xs uppercase tracking-wider font-medium text-gray-500 dark:text-gray-400 mb-2">
                          {category.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className={`text-2xl font-bold ${getScoreColorClass(score)}`}>
                          {Math.round(score)}%
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Top Strengths & Weaknesses Side by Side */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Top Strengths */}
                    <SectionCard
                      title="Top Strengths"
                      icon={<TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />}
                    >
                      {getTopStrengths().length > 0 ? (
                        <div className="space-y-3">
                          {getTopStrengths().map((strength, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {strength.name}
                                  </span>
                                </div>
                                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                  {strength.relevance}%
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-green-100 dark:bg-green-900/40 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-green-500"
                                  style={{ width: `${strength.relevance}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No strengths identified.</p>
                      )}
                    </SectionCard>

                    {/* Top Weaknesses */}
                    <SectionCard
                      title="Top Weaknesses"
                      icon={<TrendingDown className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
                    >
                      {getTopWeaknesses().length > 0 ? (
                        <div className="space-y-3">
                          {getTopWeaknesses().map((weakness, idx) => {
                            const gap = Math.max(0, 100 - weakness.relevance);
                            const priority = getWeaknessPriority(gap);
                            const priorityClasses =
                              priority === 'HIGH'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                : priority === 'MEDIUM'
                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';

                            return (
                              <div
                                key={idx}
                                className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {weakness.name}
                                    </span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${priorityClasses}`}>
                                    {priority}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {gap}% gap
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No weaknesses identified.</p>
                      )}
                    </SectionCard>
                  </div>
                </motion.div>
              </div>

              {/* Skills Section */}
              <div ref={(el) => { sectionsRef.current['skills'] = el; }}>
                <SectionCard
                  id="skills"
                  title="Matched Skills"
                  icon={<CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />}
                >
                  {analysis.skillsMatch?.matching && analysis.skillsMatch.matching.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {analysis.skillsMatch.matching
                        .slice()
                        .sort((a, b) => b.relevance - a.relevance)
                        .map((skill, idx) => (
                          <SkillBar 
                            key={idx}
                            skill={skill.name} 
                            relevance={skill.relevance}
                            category={skill.location}
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500 dark:text-green-400 opacity-50" />
                      <p className="text-sm">No matched skills found.</p>
                    </div>
                  )}
                </SectionCard>
              </div>

              {/* Missing Skills Section */}
              <div ref={(el) => { sectionsRef.current['missing'] = el; }}>
                <SectionCard
                  id="missing"
                  title="Missing Skills"
                  icon={<AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
                >
                  {analysis.skillsMatch?.missing && analysis.skillsMatch.missing.length > 0 ? (
                    <div className="space-y-4">
                      {analysis.skillsMatch.missing
                        .slice()
                        .sort((a, b) => b.relevance - a.relevance)
                        .map((skill, idx) => {
                          const gap = Math.max(0, 100 - skill.relevance);
                          const priority = getWeaknessPriority(gap);
                          const priorityClasses =
                            priority === 'HIGH'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              : priority === 'MEDIUM'
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
                          return (
                            <div key={idx} className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30">
                              <div className="flex items-start justify-between mb-2 gap-3">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{skill.name}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityClasses}`}>
                                      {priority} IMPORTANCE
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {gap}% skill gap vs. ideal profile
                                  </span>
                                </div>
                                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                  {skill.relevance} / 100
                                </span>
                              </div>
                              <ProgressBar label="" value={skill.relevance} />
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                <span className="font-medium">Why it matters:</span> This capability is explicitly called out in the job post and is likely to be evaluated during screening.
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                <span className="font-medium">Actionable improvement:</span> Add 1–2
                                concrete bullet points demonstrating {skill.name.toLowerCase()} in your
                                recent roles, or highlight it in a dedicated skills section.
                              </p>
                              <button
                                onClick={() => handleAIAction(`Apply fix for missing skill: ${skill.name}`)}
                                className="mt-3 px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors inline-flex items-center gap-1.5"
                              >
                                <Wand2 className="w-3 h-3" />
                                Apply fix with AI
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500 dark:text-green-400 opacity-50" />
                      <p className="text-sm">No missing skills! Your resume covers all required skills.</p>
                    </div>
                  )}
                </SectionCard>
              </div>

              {/* Recommendations Section */}
              <div ref={(el) => { sectionsRef.current['recommendations'] = el; }}>
                <div id="recommendations" className="scroll-mt-24 space-y-6">
                  {/* HIGH Priority */}
                  {analysis.recommendations?.filter(r => r.priority === 'high').length > 0 && (
                    <SectionCard
                      title="HIGH Priority Fixes"
                      icon={<AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
                    >
                      <div className="space-y-4">
                        {analysis.recommendations
                          .filter(r => r.priority === 'high')
                          .map((rec, idx) => (
                            <div key={idx} className="p-4 rounded-lg border-l-4 bg-red-50 dark:bg-red-900/10 border-red-500">
                              <div className="flex items-start justify-between mb-2 gap-3">
                                <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                                  {rec.title}
                                </h4>
                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-300 flex-shrink-0">
                                  HIGH
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                                {rec.description}
                              </p>
                              {rec.examples && (
                                <div className="mt-2 p-3 bg-white dark:bg-[#1E1F22] rounded text-xs text-gray-600 dark:text-gray-400 font-mono border border-gray-200 dark:border-[#2A2A2E] mb-3">
                                  {rec.examples}
                                </div>
                              )}
                              <div className="flex flex-wrap items-center gap-3">
                                <button
                                  onClick={() => handleAIAction(`Apply fix: ${rec.title}`)}
                                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-600 rounded-lg transition-colors flex items-center gap-2"
                                >
                                  <Sparkles className="w-4 h-4" />
                                  Apply Fix with AI
                                </button>
                                <button
                                  onClick={() => handleAIAction(`Open Resume Check for: ${rec.title}`)}
                                  className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 inline-flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Open in Resume Check
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </SectionCard>
                  )}

                  {/* MEDIUM Priority */}
                  {analysis.recommendations?.filter(r => r.priority === 'medium').length > 0 && (
                    <SectionCard
                      title="MEDIUM Priority"
                      icon={<Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />}
                    >
                      <div className="space-y-4">
                        {analysis.recommendations
                          .filter(r => r.priority === 'medium')
                          .map((rec, idx) => (
                            <div key={idx} className="p-4 rounded-lg border-l-4 bg-yellow-50 dark:bg-yellow-900/10 border-yellow-500">
                              <div className="flex items-start justify-between mb-2 gap-3">
                                <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                                  {rec.title}
                                </h4>
                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-300 flex-shrink-0">
                                  MEDIUM
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                                {rec.description}
                              </p>
                              {rec.examples && (
                                <div className="mt-2 p-3 bg-white dark:bg-[#1E1F22] rounded text-xs text-gray-600 dark:text-gray-400 font-mono border border-gray-200 dark:border-[#2A2A2E] mb-3">
                                  {rec.examples}
                                </div>
                              )}
                              <div className="flex flex-wrap items-center gap-3">
                                <button
                                  onClick={() => handleAIAction(`Apply fix: ${rec.title}`)}
                                  className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex items-center gap-2"
                                >
                                  <Sparkles className="w-4 h-4" />
                                  Apply Fix with AI
                                </button>
                                <button
                                  onClick={() => handleAIAction(`Open Resume Check for: ${rec.title}`)}
                                  className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 inline-flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Open in Resume Check
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </SectionCard>
                  )}

                  {/* LOW Priority */}
                  {analysis.recommendations?.filter(r => r.priority === 'low').length > 0 && (
                    <SectionCard
                      title="LOW Priority"
                      icon={<Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                    >
                      <div className="space-y-4">
                        {analysis.recommendations
                          .filter(r => r.priority === 'low')
                          .map((rec, idx) => (
                            <div key={idx} className="p-4 rounded-lg border-l-4 bg-blue-50 dark:bg-blue-900/10 border-blue-500">
                              <div className="flex items-start justify-between mb-2 gap-3">
                                <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                                  {rec.title}
                                </h4>
                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex-shrink-0">
                                  LOW
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                                {rec.description}
                              </p>
                              {rec.examples && (
                                <div className="mt-2 p-3 bg-white dark:bg-[#1E1F22] rounded text-xs text-gray-600 dark:text-gray-400 font-mono border border-gray-200 dark:border-[#2A2A2E] mb-3">
                                  {rec.examples}
                                </div>
                              )}
                              <div className="flex flex-wrap items-center gap-3">
                                <button
                                  onClick={() => handleAIAction(`Apply fix: ${rec.title}`)}
                                  className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex items-center gap-2"
                                >
                                  <Sparkles className="w-4 h-4" />
                                  Apply Fix with AI
                                </button>
                                <button
                                  onClick={() => handleAIAction(`Open Resume Check for: ${rec.title}`)}
                                  className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 inline-flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Open in Resume Check
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </SectionCard>
                  )}

                  {(!analysis.recommendations || analysis.recommendations.length === 0) && (
                    <SectionCard
                      title="Recommendations"
                      icon={<Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />}
                    >
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Lightbulb className="w-12 h-12 mx-auto mb-3 text-yellow-500 dark:text-yellow-400 opacity-50" />
                        <p className="text-sm">No recommendations available for this analysis.</p>
                      </div>
                    </SectionCard>
                  )}
                </div>
              </div>

              {/* Key Findings Section */}
              <div ref={(el) => { sectionsRef.current['findings'] = el; }}>
                <SectionCard
                  id="findings"
                  title="Key Findings"
                  icon={<Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                >
                  {analysis.keyFindings && analysis.keyFindings.length > 0 ? (
                    <ul className="space-y-3">
                      {analysis.keyFindings.map((finding, idx) => {
                        const variant = getFindingVariant(finding);
                        const iconClasses =
                          variant === 'positive'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300'
                            : variant === 'warning'
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300';

                        const IconComponent =
                          variant === 'positive' ? CheckCircle : variant === 'warning' ? AlertTriangle : Info;

                        return (
                          <li
                            key={idx}
                            className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-[#2A2A2E] bg-gray-50 dark:bg-[#26262B]"
                          >
                            <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 ${iconClasses}`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                              {finding}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Info className="w-12 h-12 mx-auto mb-3 text-blue-500 dark:text-blue-400 opacity-50" />
                      <p className="text-sm">No key findings available for this analysis.</p>
                    </div>
                  )}
                </SectionCard>
              </div>
            </main>

            {/* Sticky Right Sidebar */}
            <StickySidebar 
              analysis={analysis} 
              activeSection={activeSection}
              onNavigate={handleNavigate}
            />
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
