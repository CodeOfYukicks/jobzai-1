import { useState, useEffect, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, Target, CheckCircle, AlertCircle, AlertTriangle, Lightbulb, Info,
  ArrowLeft, Sparkles, TrendingUp, TrendingDown, ExternalLink, Wand2
} from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import HeaderCard from '../components/ats/HeaderCard';
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

// Section Card Component
function SectionCard({ 
  title, 
  icon, 
  children, 
  className = '' 
}: { 
  title?: string; 
  icon?: ReactNode; 
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl bg-white dark:bg-[#1E1F22] border border-gray-200 dark:border-[#2A2A2E] shadow-sm dark:shadow-none p-6 ${className}`}>
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
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className={`text-sm font-semibold ${colorClass}`}>{Math.round(value)}%</span>
      </div>
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

type TabId = 'overview' | 'skills' | 'missing' | 'recommendations' | 'findings';

interface TabConfig {
  id: TabId;
  label: string;
}

// Premium pill Tab Navigation
function TabNav({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: TabConfig[];
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={[
              'px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap border transition-all',
              isActive
                ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-500/60'
                : 'bg-transparent text-gray-600 border-transparent hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#26262B]',
            ].join(' ')}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function TabPanel({
  activeTab,
  tabId,
  children,
}: {
  activeTab: TabId;
  tabId: TabId;
  children: ReactNode;
}) {
  if (activeTab !== tabId) return null;
  return <div className="space-y-8">{children}</div>;
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

export default function ATSAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!id || !currentUser) return;

      try {
        const analysisDoc = await getDoc(doc(db, 'users', currentUser.uid, 'analyses', id));
        if (analysisDoc.exists()) {
          setAnalysis({ id: analysisDoc.id, ...analysisDoc.data() } as ATSAnalysis);
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

  if (loading) {
    return (
      <AuthLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (!analysis) {
    return (
      <AuthLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400">Analysis not found</p>
            <button
              onClick={() => navigate('/cv-analysis')}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Back to Resume Lab
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'skills' as const, label: 'Skills' },
    { id: 'missing' as const, label: 'Missing Skills' },
    { id: 'recommendations' as const, label: 'Recommendations' },
    { id: 'findings' as const, label: 'Key Findings' },
  ];

  const handleAIAction = (action: string) => {
    toast.info(`${action} - Coming soon!`);
    // TODO: Link to Resume Check or implement action
  };

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/cv-analysis')}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Resume Lab
        </button>

        {/* Premium Header Card */}
        <HeaderCard analysis={analysis} />

        {/* Main Content Layout */}
        <div className="space-y-6">
          <TabNav
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id)}
          />

          {/* Overview Tab */}
          <TabPanel activeTab={activeTab} tabId="overview">
              <div className="space-y-8">
                {/* Executive Summary */}
                <SectionCard
                  title="Executive Summary"
                  icon={<FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {analysis.executiveSummary}
                  </p>
                </SectionCard>

                {/* Match Breakdown */}
                <SectionCard
                  title="Match Breakdown"
                  icon={<Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                >
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-[#26262B] rounded-lg">
                      <div className="text-center sm:text-left">
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Overall Match
                        </div>
                        <div className={`text-2xl font-bold ${getScoreColorClass(analysis.matchScore)}`}>
                          {analysis.matchScore}%
                        </div>
                      </div>
                      <ScoreDonut value={analysis.matchScore} size={80} strokeWidth={6} />
                    </div>
                    <div className="space-y-3">
                      <ProgressBar label="Skills" value={analysis.categoryScores?.skills ?? 0} />
                      <ProgressBar label="Experience" value={analysis.categoryScores?.experience ?? 0} />
                      <ProgressBar label="Education" value={analysis.categoryScores?.education ?? 0} />
                      <ProgressBar label="Industry Fit" value={analysis.categoryScores?.industryFit ?? 0} />
                    </div>
                  </div>
                </SectionCard>

                {/* Top Strengths */}
                <SectionCard
                  title="Top 3 Strengths"
                  icon={<TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />}
                >
                  {getTopStrengths().length > 0 ? (
                    <div className="space-y-3">
                      {getTopStrengths().map((strength, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30"
                        >
                          <div className="flex items-center justify-between">
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
                          <div className="mt-2 h-1.5 w-full bg-green-100 dark:bg-green-900/40 rounded-full overflow-hidden">
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
                  title="Top 3 Weaknesses"
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
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {weakness.name}
                                </span>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                  {gap}% gap
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${priorityClasses}`}
                                >
                                  {priority} PRIORITY
                                </span>
                              </div>
                            </div>
                            <p className="mt-2 text-xs text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Why it matters:</span> This skill is
                              heavily weighted in the job description and is a key signal of readiness
                              for this role.
                            </p>
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Actionable next step:</span> Add 1–2
                              concrete bullet points demonstrating {weakness.name.toLowerCase()} in your
                              recent roles, or highlight it in a dedicated skills section.
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No weaknesses identified.</p>
                  )}
                </SectionCard>
              </div>
          </TabPanel>

          {/* Skills Tab */}
          <TabPanel activeTab={activeTab} tabId="skills">
            <SectionCard
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
          </TabPanel>

          {/* Missing Skills Tab */}
          <TabPanel activeTab={activeTab} tabId="missing">
              <SectionCard
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
                              <span className="font-medium">Actionable improvement:</span> Add a short bullet demonstrating {skill.name.toLowerCase()} in your most recent role and consider mentioning it in your summary section.
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
          </TabPanel>

            {/* Recommendations Tab */}
          <TabPanel activeTab={activeTab} tabId="recommendations">
              <div className="space-y-8">
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
                              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-500 dark:text-yellow-300 flex-shrink-0">
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
          </TabPanel>

          {/* Key Findings Tab */}
          <TabPanel activeTab={activeTab} tabId="findings">
            <SectionCard
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
          </TabPanel>
        </div>
      </div>
    </AuthLayout>
  );
}
