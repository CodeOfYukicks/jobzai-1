import { motion } from 'framer-motion';
import { FileText, CheckCircle, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { CVAnalysis } from '../lib/cvAnalysis';

interface CVAnalysisCardProps {
  analysis: CVAnalysis | null;
  isLoading?: boolean;
  error?: string | null;
}

export default function CVAnalysisCard({ analysis, isLoading, error }: CVAnalysisCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center space-x-3 mb-4">
          <Loader2 className="h-5 w-5 animate-spin text-[#4D3E78]" />
          <span className="text-gray-600">Analyzing your CV...</span>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center space-x-3 text-red-500">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center space-x-3">
          <FileText className="h-5 w-5 text-gray-400" />
          <span className="text-gray-600">Upload your CV in settings to get an AI-powered analysis</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
    >
      <div className="p-6">
        <div className="flex items-center mb-6">
          <div className="flex-shrink-0">
            <FileText className="h-6 w-6 text-[#4D3E78]" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">CV Analysis</h3>
            {analysis.lastAnalyzed && (
              <p className="text-sm text-gray-500">
                Last analyzed: {new Date(analysis.lastAnalyzed).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Strengths */}
          <div>
            <h4 className="flex items-center text-sm font-medium text-green-600 mb-2">
              <CheckCircle className="h-4 w-4 mr-2" />
              Key Strengths
            </h4>
            <ul className="space-y-2">
              {analysis.strengths.map((strength, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start text-sm text-gray-600"
                >
                  <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
                  {strength}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Areas for Improvement */}
          <div>
            <h4 className="flex items-center text-sm font-medium text-amber-600 mb-2">
              <AlertCircle className="h-4 w-4 mr-2" />
              Areas for Improvement
            </h4>
            <ul className="space-y-2">
              {analysis.improvements.map((improvement, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  className="flex items-start text-sm text-gray-600"
                >
                  <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-amber-500" />
                  {improvement}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          <div>
            <h4 className="flex items-center text-sm font-medium text-[#4D3E78] mb-2">
              <CheckCircle className="h-4 w-4 mr-2" />
              Recommendations
            </h4>
            <ul className="space-y-2">
              {analysis.recommendations.map((recommendation, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.6 }}
                  className="flex items-start text-sm text-gray-600"
                >
                  <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-[#4D3E78]" />
                  {recommendation}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}