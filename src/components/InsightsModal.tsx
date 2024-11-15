import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { generatePersonalizedInsights, InsightData } from '../lib/recommendations';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserData } from '../types';

interface InsightsModalProps {
  category: 'timing' | 'salary' | 'keywords' | 'companies';
  title: string;
  onClose: () => void;
}

export default function InsightsModal({ category, title, onClose }: InsightsModalProps) {
  const { currentUser } = useAuth();
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to user data
    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (doc) => {
        if (doc.exists()) {
          setUserData(doc.data() as UserData);
        }
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const generateInsights = async () => {
      if (!userData) return;

      try {
        setIsLoading(true);
        setError(null);
        const data = await generatePersonalizedInsights(category, userData);
        setInsights(data);
      } catch (error) {
        console.error('Error generating insights:', error);
        setError('Failed to generate insights. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    generateInsights();
  }, [category, userData]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title} Insights</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#8D75E6] mb-4" />
              <p className="text-gray-500">Generating personalized insights...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-red-500">
              <AlertCircle className="h-8 w-8 mb-4" />
              <p>{error}</p>
            </div>
          ) : insights ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {insights.title}
                </h3>
                <p className="text-gray-600">
                  {insights.description}
                </p>
              </div>

              {insights.metrics && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  {insights.metrics.map((metric, index) => (
                    <div key={index} className="text-center">
                      <div className="text-lg font-semibold text-[#4D3E78]">
                        {metric.value}
                      </div>
                      <div className="text-xs text-gray-500">
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Personalized Recommendations
                </h4>
                <ul className="space-y-4">
                  {insights.tips.map((tip, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#8D75E6] text-white flex items-center justify-center text-sm mr-3">
                        {index + 1}
                      </span>
                      <span className="text-gray-600">{tip}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No insights available. Please try again.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-[#8D75E6] text-white rounded-lg hover:bg-[#8D75E6]/90 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}