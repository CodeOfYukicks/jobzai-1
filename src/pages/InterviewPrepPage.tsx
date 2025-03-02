import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import AuthLayout from '../components/AuthLayout';
import { analyzeJobPost, JobPostAnalysisResult } from '../services/jobPostAnalyzer';
import { 
  ArrowLeft, Briefcase, Building, MapPin, Calendar, Clock, Link as LinkIcon, 
  MessageSquare, Check, AlertTriangle, BookOpen, FileText, 
  PlayCircle, BookmarkPlus, Download, Share2,
  CheckCircle, XCircle, Clock as ClockIcon, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Interface for the job application data
interface Interview {
  id: string;
  date: string;
  time: string;
  type: 'technical' | 'hr' | 'manager' | 'final' | 'other';
  interviewers?: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  feedback?: string;
  location?: string;
  preparation?: JobPostAnalysisResult;
  jobPostContent?: string;
  jobPostUrl?: string;
  lastAnalyzed?: string;
}

interface JobApplication {
  id: string;
  companyName: string;
  position: string;
  location: string;
  status: string;
  appliedDate: string;
  url?: string;
  notes?: string;
  interviews?: Interview[];
}

export default function InterviewPrepPage() {
  const { applicationId, interviewId } = useParams<{ applicationId: string, interviewId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [jobUrl, setJobUrl] = useState('');
  const [tab, setTab] = useState<'overview' | 'questions' | 'skills' | 'resources'>('overview');
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !applicationId || !interviewId) {
        toast.error('Missing required information');
        navigate('/applications');
        return;
      }

      try {
        const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
        const applicationSnapshot = await getDoc(applicationRef);
        
        if (applicationSnapshot.exists()) {
          const appData = { id: applicationSnapshot.id, ...applicationSnapshot.data() } as JobApplication;
          setApplication(appData);
          
          const interviewData = appData.interviews?.find(interview => interview.id === interviewId);
          if (interviewData) {
            setInterview(interviewData);
            setJobUrl(interviewData.jobPostUrl || appData.url || '');
          } else {
            toast.error('Interview not found');
            navigate(`/applications`);
          }
        } else {
          toast.error('Application not found');
          navigate('/applications');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Error loading data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser, applicationId, interviewId, navigate]);

  const handleAnalyzeJobPost = async () => {
    if (!currentUser || !application || !interview || !applicationId) return;
    
    if (!jobUrl) {
      toast.error('Please enter a job post URL');
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      const analysisResult = await analyzeJobPost(
        jobUrl,
        application.position,
        application.companyName,
        'perplexity' // Use Perplexity as default
      );
      
      if (analysisResult.error) {
        toast.error(analysisResult.error);
        return;
      }
      
      // Find the index of the interview in the application
      const interviewIndex = application.interviews?.findIndex(i => i.id === interview.id) ?? -1;
      
      if (interviewIndex === -1) {
        toast.error('Could not find interview to update');
        return;
      }
      
      // Create updated interviews array
      const updatedInterviews = [...(application.interviews || [])];
      updatedInterviews[interviewIndex] = {
        ...interview,
        preparation: analysisResult,
        jobPostUrl: jobUrl,
        lastAnalyzed: new Date().toISOString()
      };
      
      // Update Firestore - Make sure applicationId is not undefined
      const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
      await updateDoc(applicationRef, {
        interviews: updatedInterviews,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setInterview({
        ...interview,
        preparation: analysisResult,
        jobPostUrl: jobUrl,
        lastAnalyzed: new Date().toISOString()
      });
      
      toast.success('Job post analyzed successfully with Perplexity AI');
    } catch (error) {
      console.error('Error analyzing job post:', error);
      toast.error('Failed to analyze job post: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Add a function to update interview status
  const updateInterviewStatus = async (newStatus: 'scheduled' | 'completed' | 'cancelled') => {
    if (!currentUser || !application || !interview || !applicationId) return;
    
    try {
      // Get the application reference
      const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
      
      // Create updated interviews array
      const updatedInterviews = application.interviews?.map(item => {
        if (item.id === interviewId) {
          return { ...item, status: newStatus };
        }
        return item;
      });
      
      // Update in Firestore
      await updateDoc(applicationRef, {
        interviews: updatedInterviews,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setInterview({
        ...interview,
        status: newStatus
      });
      
      // Close status menu
      setStatusMenuOpen(false);
      
      // Show success message
      toast.success(`Interview status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating interview status:', error);
      toast.error('Failed to update interview status');
    }
  };

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (!application || !interview) {
    return (
      <AuthLayout>
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Interview not found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            The interview you're looking for doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={() => navigate('/applications')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Applications
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/applications`)}
            className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Applications
          </button>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Interview Preparation
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Prepare for your {interview.type} interview at {application.companyName}
              </p>
            </div>

            {interview && (
              <div className="relative">
                <button
                  onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                    ${interview.status === 'scheduled' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                      : interview.status === 'completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}
                >
                  {interview.status === 'scheduled' && <ClockIcon className="w-4 h-4" />}
                  {interview.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                  {interview.status === 'cancelled' && <XCircle className="w-4 h-4" />}
                  <span className="capitalize">{interview.status}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {/* Dropdown menu */}
                <AnimatePresence>
                  {statusMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute right-0 mt-1 z-10 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1"
                    >
                      <button
                        onClick={() => updateInterviewStatus('scheduled')}
                        className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${
                          interview.status === 'scheduled' 
                            ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                        }`}
                      >
                        <ClockIcon className="w-4 h-4" />
                        Scheduled
                      </button>
                      <button
                        onClick={() => updateInterviewStatus('completed')}
                        className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${
                          interview.status === 'completed' 
                            ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Completed
                      </button>
                      <button
                        onClick={() => updateInterviewStatus('cancelled')}
                        className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${
                          interview.status === 'cancelled' 
                            ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        Cancelled
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Application details card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                  {application.position}
                </h2>
                <div className="flex items-center text-gray-600 dark:text-gray-300 mb-1">
                  <Building className="w-4 h-4 mr-1" />
                  {application.companyName}
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <MapPin className="w-4 h-4 mr-1" />
                  {application.location}
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <Calendar className="w-4 h-4 mr-1" />
                  Interview: {new Date(interview.date).toLocaleDateString()}
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4 mr-1" />
                  Time: {interview.time}
                </div>
                {interview.location && (
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <MapPin className="w-4 h-4 mr-1" />
                    Location: {interview.location}
                  </div>
                )}
              </div>
            </div>
            
            {application.url && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <a
                  href={application.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-purple-600 dark:text-purple-400 hover:underline text-sm"
                >
                  <LinkIcon className="w-4 h-4 mr-1" />
                  Job Posting
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Job URL input section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Analyze Job Posting
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <div className="flex-1">
              <label htmlFor="jobUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Job Posting URL
              </label>
              <input
                type="url"
                id="jobUrl"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://example.com/job-posting"
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              onClick={handleAnalyzeJobPost}
              disabled={isAnalyzing || !jobUrl}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4 sm:mt-6 whitespace-nowrap"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Job Post'}
            </button>
          </div>
          
          {interview.lastAnalyzed && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Last analyzed: {new Date(interview.lastAnalyzed).toLocaleString()}
            </p>
          )}
        </div>

        {/* Tab navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: <Briefcase className="w-4 h-4 mr-1" /> },
              { id: 'questions', label: 'Interview Questions', icon: <MessageSquare className="w-4 h-4 mr-1" /> },
              { id: 'skills', label: 'Required Skills', icon: <BookOpen className="w-4 h-4 mr-1" /> },
              { id: 'resources', label: 'Preparation Resources', icon: <FileText className="w-4 h-4 mr-1" /> }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id as any)}
                className={`inline-flex items-center px-1 py-3 border-b-2 text-sm font-medium ${
                  tab === item.id 
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="mb-8">
          {!interview.preparation ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center">
              <div className="mx-auto w-16 h-16 text-gray-300 dark:text-gray-700 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No analysis available</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Enter a job posting URL above and click "Analyze Job Post" to get personalized interview preparation.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Our AI will analyze the job post and provide key insights, likely interview questions, and preparation tips.
              </p>
            </div>
          ) : (
            <>
              {tab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Company overview card */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <h3 className="flex items-center text-lg font-semibold text-gray-800 dark:text-white mb-3">
                      <Building className="w-5 h-5 mr-2 text-purple-600" />
                      Company Overview
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {interview.preparation.companyInfo || 'No company information available.'}
                    </p>
                  </div>
                  
                  {/* Position details card */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <h3 className="flex items-center text-lg font-semibold text-gray-800 dark:text-white mb-3">
                      <Briefcase className="w-5 h-5 mr-2 text-purple-600" />
                      Position Details
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {interview.preparation.positionDetails || 'No position details available.'}
                    </p>
                  </div>
                  
                  {/* Culture fit card */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <h3 className="flex items-center text-lg font-semibold text-gray-800 dark:text-white mb-3">
                      <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
                      Cultural Fit
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {interview.preparation.cultureFit || 'No culture information available.'}
                    </p>
                  </div>
                  
                  {/* Key points card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="md:col-span-3 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                      Key Points to Emphasize
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {interview.preparation.keyPoints?.map((point, index) => (
                        <li key={index} className="flex items-start text-gray-600 dark:text-gray-300 text-sm">
                          <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </div>
              )}
              
              {tab === 'questions' && (
                <div className="space-y-6">
                  {interview.preparation?.suggestedQuestions?.map((question, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700"
                    >
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                        Question {index + 1}
                      </h3>
                      <p className="mb-4 text-gray-700 dark:text-gray-200">
                        {question}
                      </p>
                      
                      <div className="pl-5 border-l-2 border-purple-200 dark:border-purple-900">
                        <h4 className="text-sm font-medium text-purple-700 dark:text-purple-400 mb-2">
                          Suggested Answer Approach
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {interview.preparation?.suggestedAnswers && 
                           interview.preparation.suggestedAnswers[index] && 
                           typeof interview.preparation.suggestedAnswers[index] === 'object' && 
                           'answer' in interview.preparation.suggestedAnswers[index]
                            ? (interview.preparation.suggestedAnswers[index] as { answer: string }).answer
                            : "Structure your answer using the STAR method: Situation, Task, Action, Result. Focus on highlighting relevant experience and skills from your background that match the job requirements."}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  
                  {(!interview.preparation?.suggestedQuestions || interview.preparation.suggestedQuestions.length === 0) && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        No suggested questions available.
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {tab === 'skills' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      Required Skills & Qualifications
                    </h3>
                    
                    <div className="space-y-4">
                      {interview.preparation.requiredSkills?.map((skill, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-start"
                        >
                          <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-1 rounded mr-3 flex-shrink-0">
                            <Check className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                              {skill}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                      
                      {(!interview.preparation.requiredSkills || interview.preparation.requiredSkills.length === 0) && (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                          No skills information available.
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      Skills Assessment
                    </h3>
                    
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                        Rate your confidence with each required skill to identify areas for preparation.
                      </p>
                      
                      {interview.preparation.requiredSkills?.map((skill, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-700 dark:text-gray-300">{skill}</p>
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                  key={rating}
                                  className={`w-6 h-6 rounded-full ${
                                    rating <= 3 
                                      ? 'bg-gray-200 dark:bg-gray-700 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {tab === 'resources' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-3 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      Preparation Tips
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        {
                          title: 'Research the Company',
                          description: 'Look up their mission, values, recent news, and products/services.',
                          icon: <Building className="w-5 h-5 text-purple-600" />
                        },
                        {
                          title: 'Prepare Your STAR Stories',
                          description: 'Create specific examples using the Situation, Task, Action, Result format.',
                          icon: <MessageSquare className="w-5 h-5 text-purple-600" />
                        },
                        {
                          title: 'Practice Your Responses',
                          description: 'Rehearse answers to common questions out loud or with a friend.',
                          icon: <PlayCircle className="w-5 h-5 text-purple-600" />
                        },
                        {
                          title: 'Prepare Questions to Ask',
                          description: 'Have thoughtful questions ready about the role, team, and company.',
                          icon: <BookmarkPlus className="w-5 h-5 text-purple-600" />
                        },
                        {
                          title: 'Review Job Description',
                          description: 'Align your talking points with the skills and qualifications listed.',
                          icon: <FileText className="w-5 h-5 text-purple-600" />
                        },
                        {
                          title: 'Plan Your Presentation',
                          description: 'Prepare what to wear, test your tech for virtual interviews, plan your route.',
                          icon: <Share2 className="w-5 h-5 text-purple-600" />
                        }
                      ].map((tip, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg"
                        >
                          <div className="flex items-start">
                            <div className="mr-3 mt-0.5">
                              {tip.icon}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800 dark:text-white text-sm mb-1">
                                {tip.title}
                              </h4>
                              <p className="text-gray-600 dark:text-gray-400 text-xs">
                                {tip.description}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="md:col-span-3 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      Helpful Resources
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        {
                          title: 'Company Glassdoor Reviews',
                          url: `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(application.companyName)}`,
                          description: 'Check employee reviews and interview experiences'
                        },
                        {
                          title: 'LinkedIn Company Page',
                          url: `https://www.linkedin.com/company/${encodeURIComponent(application.companyName)}`,
                          description: 'Research employees and company updates'
                        },
                        {
                          title: 'Interview Question Database',
                          url: `https://www.glassdoor.com/Interview/index.htm`,
                          description: 'Browse thousands of real interview questions'
                        }
                      ].map((resource, index) => (
                        <a
                          key={index}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                        >
                          <LinkIcon className="w-5 h-5 text-purple-600 mr-3 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-gray-800 dark:text-white text-sm mb-1">
                              {resource.title}
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400 text-xs">
                              {resource.description}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Notes section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Your Notes
          </h3>
          
          <textarea
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
            rows={5}
            value={interview.notes || ''}
            placeholder="Add your personal notes to prepare for this interview..."
            readOnly // In a real app, you would add save functionality
          ></textarea>
        </div>
      </div>
    </AuthLayout>
  );
} 