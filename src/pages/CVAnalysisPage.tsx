import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Briefcase, Building, Target, 
  ChevronRight, X, Sparkles, Brain,
  CheckCircle, AlertCircle, Trophy, Lightbulb, Upload, Check
} from 'lucide-react';
import { Dialog, Disclosure } from '@headlessui/react';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { getDoc, doc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { toast } from 'sonner';
import { db, storage } from '../lib/firebase';
import PrivateRoute from '../components/PrivateRoute';
import { extractTextFromPDF } from '../utils/pdfParser';
import * as pdfjsLib from 'pdfjs-dist';

interface ATSAnalysis {
  id: string;
  date: string;
  jobTitle: string;
  company: string;
  matchScore: number;
  keyFindings: {
    title: string;
    score: number;
    details: string[];
  }[];
  skillsMatch: {
    matching: string[];
    missing: string[];
  };
  recommendations: string[];
  keywords: {
    found: string[];
    missing: string[];
  };
  experience: {
    relevant: string[];
    gaps: string[];
  };
  cvUrl: string;
}

interface CVOption {
  id: string;
  name: string;
  url: string;
}

interface AnalysisRequest {
  cvContent: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
}

// Configurer le worker PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const analyzeCV = async (data: AnalysisRequest): Promise<ATSAnalysis> => {
  try {
    const response = await fetch('/api/analyze-cv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Analysis failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error during CV analysis:', error);
    throw error;
  }
};

export default function CVAnalysisPage() {
  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCV, setSelectedCV] = useState<string>('');
  const [userCV, setUserCV] = useState<{ url: string; name: string } | null>(null);
  const [formData, setFormData] = useState({
    jobTitle: '',
    company: '',
    jobDescription: '',
  });
  const [analyses, setAnalyses] = useState<ATSAnalysis[]>([]);

  // Charger le CV depuis le profil utilisateur
  useEffect(() => {
    const fetchUserCV = async () => {
      if (!currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && userDoc.data().cvUrl) {
          setUserCV({
            url: userDoc.data().cvUrl,
            name: userDoc.data().cvName || 'Profile CV'
          });
        }
      } catch (error) {
        console.error('Error fetching user CV:', error);
      }
    };
    fetchUserCV();
  }, [currentUser]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    try {
      const storageRef = ref(storage, `cvs/${currentUser?.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setSelectedCV(url);
      toast.success('CV uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload CV');
    }
  };

  const extractTextFromPDF = async (pdfUrl: string): Promise<string> => {
    try {
      console.log('Starting PDF extraction from URL:', pdfUrl);
      
      // Utiliser notre API proxy pour récupérer le PDF
      const response = await fetch('/api/fetch-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfUrl }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      console.log('PDF downloaded, size:', arrayBuffer.byteLength);

      // Charger le PDF avec PDF.js
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      console.log('PDF loaded successfully, pages:', pdf.numPages);

      let text = '';
      
      // Extraire le texte de chaque page
      for (let i = 1; i <= pdf.numPages; i++) {
        console.log(`Processing page ${i}/${pdf.numPages}`);
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => item.str)
          .join(' ');
        text += pageText + '\n';
      }
      
      console.log('Text extraction completed, length:', text.length);
      return text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  };

  const handleAnalysis = async () => {
    try {
      toast.loading('Analyzing your CV...');
      console.log('Starting analysis process');

      if (!selectedCV) {
        toast.error('Please select a CV first');
        return;
      }

      // Obtenir une URL signée
      const cvRef = ref(storage, selectedCV);
      const signedUrl = await getDownloadURL(cvRef);
      console.log('Signed URL:', signedUrl);

      let cvContent = '';
      try {
        cvContent = await extractTextFromPDF(signedUrl);
        console.log('CV text extracted successfully');
      } catch (error) {
        console.error('CV processing error:', error);
        toast.error(`Failed to process CV: ${error.message}`);
        return;
      }

      if (!cvContent || cvContent.trim().length === 0) {
        toast.error('No text could be extracted from the CV');
        return;
      }

      console.log('Preparing analysis data');
      const analysisData = {
        cvContent,
        jobTitle: formData.jobTitle,
        company: formData.company,
        jobDescription: formData.jobDescription,
      };

      console.log('Sending analysis request');
      const analysis = await analyzeCV(analysisData);

      console.log('Analysis completed successfully');
      setAnalyses(prev => [analysis, ...prev]);
      setIsModalOpen(false);
      setCurrentStep(1);
      toast.dismiss();
      toast.success('Analysis completed successfully!');
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.dismiss();
      toast.error(`Analysis failed: ${error.message}`);
    }
  };

  const steps = [
    {
      title: "Select CV",
      description: "Choose which CV you want to analyze",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {userCV && (
              <button
                onClick={() => setSelectedCV(userCV.url)}
                className={`flex items-center p-4 border-2 rounded-xl transition-all ${
                  selectedCV === userCV.url
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-4">
                  <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Use Profile CV
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {userCV.name}
                  </p>
                </div>
                {selectedCV === userCV.url && (
                  <Check className="w-5 h-5 text-purple-600" />
                )}
              </button>
            )}

            <label
              className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                selectedCV && selectedCV !== userCV?.url
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-4">
                <Upload className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Upload New CV
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedCV && selectedCV !== userCV?.url ? 'CV uploaded' : 'Upload a different CV for this analysis'}
                </p>
              </div>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              {selectedCV && selectedCV !== userCV?.url && (
                <Check className="w-5 h-5 text-purple-600" />
              )}
            </label>
          </div>

          {!selectedCV && (
            <p className="text-sm text-red-500">
              Please select or upload a CV to continue
            </p>
          )}
        </div>
      )
    },
    {
      title: "Job Details",
      description: "Enter the position details you're applying for",
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Job Title
            </label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500"
              placeholder="e.g. Senior Software Engineer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500"
              placeholder="e.g. Google"
            />
          </div>
        </div>
      )
    },
    {
      title: "Job Description",
      description: "Paste the job description for analysis",
      content: (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Job Description
          </label>
          <textarea
            value={formData.jobDescription}
            onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
            className="w-full h-64 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500"
            placeholder="Paste the full job description here..."
          />
        </div>
      )
    }
  ];

  const handleNextStep = () => {
    if (currentStep === 1 && !selectedCV) {
      toast.error('Please select or upload a CV first');
      return;
    }
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Handle final submission
      console.log('Final form data:', { ...formData, cvUrl: selectedCV });
      setIsModalOpen(false);
      setCurrentStep(1);
    }
  };

  const AnalysisCard = ({ analysis }: { analysis: ATSAnalysis }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700"
    >
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Building className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {analysis.jobTitle}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {analysis.company} • {new Date(analysis.date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">
              {analysis.matchScore}%
            </div>
            <div className="text-sm text-gray-500">Match Score</div>
          </div>
        </div>
      </div>

      <Disclosure>
        {({ open }) => (
          <>
            <Disclosure.Button className="w-full px-6 py-4 flex items-center justify-between text-left">
              <span className="font-medium text-gray-900 dark:text-white">View Details</span>
              <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform ${open ? 'rotate-90' : ''}`} />
            </Disclosure.Button>

            <Disclosure.Panel className="px-6 pb-6">
              <div className="space-y-6">
                {/* Key Findings */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-500" />
                    Key Findings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.keyFindings.map((finding, index) => (
                      <div key={index} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">{finding.title}</span>
                          <span className="text-purple-600 font-semibold">{finding.score}%</span>
                        </div>
                        <ul className="space-y-1">
                          {finding.details.map((detail, i) => (
                            <li key={i} className="text-sm text-gray-600 dark:text-gray-400">• {detail}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills Match */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-500" />
                    Skills Analysis
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.skillsMatch.matching.map((skill) => (
                      <span key={skill} className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        {skill}
                      </span>
                    ))}
                    {analysis.skillsMatch.missing.map((skill) => (
                      <span key={skill} className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    Improvement Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-yellow-600 text-xs font-medium">{index + 1}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{rec}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </motion.div>
  );

  return (
    <AuthLayout>
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                ATS Resume Analysis
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Get detailed insights about your CV match for specific positions
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200"
            >
              New Analysis
            </button>
          </div>

          {/* Liste des analyses */}
          <div className="mt-8 space-y-6">
            {analyses.map((analysis) => (
              <AnalysisCard key={analysis.id} analysis={analysis} />
            ))}
            
            {analyses.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  No analyses yet. Start by clicking "New Analysis"!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <Dialog
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <div className="flex items-center justify-center min-h-screen px-4">
              <Dialog.Overlay 
                as={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full mx-auto p-6"
              >
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                      {steps[currentStep - 1].title}
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {steps[currentStep - 1].description}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Content */}
                {steps[currentStep - 1].content}

                {/* Modal Footer */}
                <div className="mt-6 flex justify-end gap-3">
                  {currentStep > 1 && (
                    <button
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      Back
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (currentStep < steps.length) {
                        setCurrentStep(currentStep + 1);
                      } else {
                        // Appeler handleAnalysis au lieu de juste fermer le modal
                        handleAnalysis();
                      }
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium"
                    disabled={currentStep === 1 && !selectedCV}
                  >
                    {currentStep === steps.length ? 'Analyze' : 'Next'}
                  </button>
                </div>
              </motion.div>
            </div>
          </Dialog>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}

// Composants utilitaires
const Section = ({ title, icon, children }: any) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2">
      {icon}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
    </div>
    {children}
  </div>
);

const SkillTag = ({ skill, matched }: { skill: string; matched: boolean }) => (
  <div
    className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
      matched
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    }`}
  >
    {skill}
  </div>
);

const CircularProgress = ({ value }: { value: number }) => (
  <div className="relative w-16 h-16">
    <svg className="w-full h-full" viewBox="0 0 36 36">
      <circle
        cx="18"
        cy="18"
        r="16"
        fill="none"
        className="stroke-current text-gray-200 dark:text-gray-700"
        strokeWidth="2"
      />
      <circle
        cx="18"
        cy="18"
        r="16"
        fill="none"
        className="stroke-current text-purple-500"
        strokeWidth="2"
        strokeDasharray={100}
        strokeDashoffset={100 - value}
        transform="rotate(-90 18 18)"
      />
      <text
        x="18"
        y="18"
        dy=".35em"
        textAnchor="middle"
        className="fill-current text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {value}%
      </text>
    </svg>
  </div>
); 