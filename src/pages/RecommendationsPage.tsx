import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building, Clock, DollarSign, Key } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import RecommendationCard from '../components/RecommendationCard';
import CVAnalysisCard from '../components/CVAnalysisCard';
import { analyzeCVWithGPT, CVAnalysis } from '../lib/cvAnalysis';
import { UserData } from '../types';

export default function RecommendationsPage() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [cvAnalysis, setCvAnalysis] = useState<CVAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      async (doc) => {
        if (doc.exists()) {
          const data = doc.data() as UserData;
          setUserData(data);

          // If user has a CV, analyze it
          if (data.cvUrl) {
            try {
              setIsAnalyzing(true);
              setAnalysisError(null);
              const analysis = await analyzeCVWithGPT(data.cvUrl, data);
              setCvAnalysis(analysis);
            } catch (error) {
              console.error('Error analyzing CV:', error);
              setAnalysisError('Failed to analyze CV. Please try again later.');
            } finally {
              setIsAnalyzing(false);
            }
          }
        }
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const hasPremiumAccess = userData?.plan === 'standard' || userData?.plan === 'premium';

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Recommendations</h1>
            <p className="mt-1 text-sm text-gray-500">
              Personalized insights to improve your job search success
            </p>
          </div>

          {/* CV Analysis */}
          <CVAnalysisCard 
            analysis={cvAnalysis}
            isLoading={isAnalyzing}
            error={analysisError}
          />

          {/* Recommendation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <RecommendationCard
              title="Target Companies"
              description="Discover companies that match your profile and preferences"
              icon={Building}
              stats={[
                { label: 'Matched Companies', value: '150+' },
                { label: 'Culture Fit Score', value: '85%' },
                { label: 'Growth Potential', value: 'High' }
              ]}
              features={[
                'Personalized company matches',
                'Culture fit assessment',
                'Growth opportunity analysis'
              ]}
              ctaText="View Matches"
              onAction={() => {}}
              isPremium={!hasPremiumAccess}
              category="companies"
            />

            <RecommendationCard
              title="Application Timing"
              description="Optimize your application timing for maximum success"
              icon={Clock}
              stats={[
                { label: 'Best Time to Apply', value: 'Tue 10am' },
                { label: 'Response Rate', value: '+45%' },
                { label: 'Peak Season', value: 'Q2' }
              ]}
              features={[
                'Peak hiring season insights',
                'Industry-specific timing',
                'Success rate patterns'
              ]}
              ctaText="View Insights"
              onAction={() => {}}
              isPremium={!hasPremiumAccess}
              category="timing"
            />

            <RecommendationCard
              title="Salary Insights"
              description="Real-time compensation data for your target roles"
              icon={DollarSign}
              stats={[
                { label: 'Salary Range', value: '€45-75k' },
                { label: 'Market Average', value: '€60k' },
                { label: 'YoY Growth', value: '+8%' }
              ]}
              features={[
                'Role-based salary ranges',
                'Benefits benchmarking',
                'Industry comparisons'
              ]}
              ctaText="View Details"
              onAction={() => {}}
              isPremium={!hasPremiumAccess}
              category="salary"
            />

            <RecommendationCard
              title="Keyword Optimization"
              description="Optimize your applications for ATS systems"
              icon={Key}
              stats={[
                { label: 'Missing Keywords', value: '12' },
                { label: 'ATS Score', value: '82%' },
                { label: 'Skills Gap', value: '3' }
              ]}
              features={[
                'Industry-specific terms',
                'ATS-friendly suggestions',
                'Skills gap analysis'
              ]}
              ctaText="Optimize Now"
              onAction={() => {}}
              isPremium={!hasPremiumAccess}
              category="keywords"
            />
          </div>
        </motion.div>
      </div>
    </AuthLayout>
  );
}