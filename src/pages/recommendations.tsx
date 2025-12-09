import { useState, useEffect } from 'react';
import { NetworkCard } from '../components/NetworkCard';
import { CompaniesCard } from '../components/CompaniesCard';
import { TimingCard } from '../components/TimingCard';
import { SalaryCard } from '../components/SalaryCard';
import { KeywordsCard } from '../components/KeywordsCard';
import { Loader2 } from 'lucide-react';
import { generatePersonalizedInsights } from '../lib/recommendations';
import { useAuth } from '../contexts/AuthContext';
import { notify } from '@/lib/notify';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { analyzeCVWithGPT, testCVAnalysis } from '../lib/cvAnalysis';
import { UserData } from '../types';

export default function RecommendationsPage() {
  const { currentUser } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string>('');

  // ├ëcouter les changements des donn├®es utilisateur
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (doc) => {
        if (doc.exists()) {
          setUserData(doc.data() as UserData);
        }
      },
      (error) => {
        console.error('Error fetching user data:', error);
        notify.error('Failed to load user data');
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleAnalyzeCV = async () => {
    if (isAnalyzing || !userData?.cvUrl) return;

    try {
      setIsAnalyzing(true);
      setError(null);

      await analyzeCVWithGPT(userData.cvUrl);
      
      // Rafra├«chir les recommandations si n├®cessaire
      // TODO: Ajouter votre logique de rafra├«chissement

    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTestAnalysis = async () => {
    if (!userData?.cvUrl) {
      notify.error('Please upload a CV first');
      return;
    }

    try {
      setIsAnalyzing(true);
      const result = await testCVAnalysis(userData.cvUrl);
      
      if (result.success) {
        notify.success(result.message);
        console.log('Test details:', result.details);
      } else {
        notify.error(result.message);
        console.error('Test failed:', result.error);
      }

    } catch (error: any) {
      notify.error('Test failed: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">AI Recommendations</h1>
            <p className="text-gray-600">
              Personalized insights to improve your job search success
            </p>
          </div>

          <div className="flex space-x-4">
            {/* Bouton de test */}
            <button
              onClick={handleTestAnalysis}
              disabled={isAnalyzing}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Test CV Analysis
            </button>

            {/* Bouton principal */}
            <button
              onClick={handleAnalyzeCV}
              disabled={isAnalyzing || !userData?.cvUrl}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg
                ${isAnalyzing || !userData?.cvUrl 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[hsl(var(--primary))] text-white hover:bg-[#7D63D6] transition-colors'}
              `}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing CV...</span>
                </>
              ) : (
                <span>{userData?.cvUrl ? 'Analyze CV' : 'Upload CV First'}</span>
              )}
            </button>
          </div>
        </div>

        {/* Affichage des r├®sultats de test */}
        {testResult && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <pre className="text-sm font-mono whitespace-pre-wrap">
              {testResult}
            </pre>
          </div>
        )}

        {/* Affichage des erreurs */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Grille des cartes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TimingCard />
        <SalaryCard />
        <KeywordsCard />
        <CompaniesCard />
        <NetworkCard />
      </div>
    </div>
  );
} 
