import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileSearch, Loader2, Upload, Maximize2 } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

interface AnalysisResult {
  strengths: string[];
  improvements: string[];
  skills: string[];
  recommendations: string[];
}

interface UserData {
  cvUrl?: string;
  firstName?: string;
  lastName?: string;
  // ... autres champs si nécessaire
}

export default function CVAnalysisPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load CV data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const analyzeCV = async () => {
    if (!userData?.cvUrl) {
      toast.error('Please upload your CV first');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('https://hook.eu1.make.com/dpnpquc7fik97h1rqdirjcn5od6jxu9r', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cvUrl: userData.cvUrl,
          userId: currentUser?.uid,
          firstName: userData.firstName,
          lastName: userData.lastName,
          ...userData,
        }),
      });
      
      const data = await response.json();
      setResults(data);
      toast.success('CV analysis completed');
    } catch (error) {
      console.error('Error analyzing CV:', error);
      toast.error('Failed to analyze CV');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AuthLayout>
      <div className="relative">
        {/* En-tête de page modifié */}
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold text-purple-600">Resume Lab</h1>
          <p className="mt-2 text-base text-gray-500">
            Get detailed insights about your CV and optimize it for better job opportunities
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
          {/* Left Column - CV Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Your CV</h2>
              {userData?.cvUrl && (
                <button
                  onClick={() => window.open(userData.cvUrl, '_blank')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700"
                >
                  <Maximize2 className="h-4 w-4" />
                  View Full Screen
                </button>
              )}
            </div>
            <div className="h-[calc(100vh-300px)] min-h-[600px] bg-white rounded-xl shadow-inner">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : userData?.cvUrl ? (
                <iframe
                  src={userData.cvUrl}
                  className="w-full h-full rounded-lg"
                  title="CV Preview"
                  style={{ 
                    width: '100%', 
                    height: '100%',
                    border: 'none',
                    transform: 'scale(0.95)',
                    transformOrigin: 'center center'
                  }}
                />
              ) : (
                <div className="h-full border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-gray-400 text-center">
                    No CV found. Please upload your CV in your profile settings.
                  </p>
                  <button
                    onClick={() => window.location.href = '/professional-profile'}
                    className="mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Go to Profile Settings
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Column - Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">CV Analysis</h2>
            
            {!results && (
              <div className="text-center py-16">
                <div className="relative">
                  <div className="relative">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <FileSearch className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {userData?.cvUrl ? 'Ready to analyze your CV' : 'Upload your CV first'}
                    </h3>
                    
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      {userData?.cvUrl 
                        ? 'Get detailed insights about your CV and recommendations for improvement'
                        : 'Please upload your CV in your profile settings before analysis'
                      }
                    </p>
                    
                    <button
                      onClick={analyzeCV}
                      disabled={isAnalyzing || !userData?.cvUrl}
                      className="inline-flex items-center justify-center px-6 py-3 
                        bg-gradient-to-r from-purple-600 to-indigo-600 
                        text-white text-sm font-medium rounded-xl
                        shadow-lg shadow-purple-500/30 
                        hover:shadow-xl hover:shadow-purple-500/40 
                        transform hover:-translate-y-0.5 
                        transition-all duration-200 
                        disabled:opacity-50 disabled:cursor-not-allowed
                        disabled:hover:shadow-none disabled:hover:translate-y-0"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                          Analyzing...
                        </>
                      ) : (
                        'Analyze CV'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {results && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Results sections */}
                {/* Add your results display components here */}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </AuthLayout>
  );
} 