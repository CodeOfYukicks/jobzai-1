import { ArrowLeft, X } from 'lucide-react';
import React from 'react';

interface MobileStepLayoutProps {
  title: string;
  subtitle: string;
  progress: number;
  children: React.ReactNode;
  onNext?: () => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export function MobileStepLayout({
  title,
  subtitle,
  progress,
  children,
  onNext,
  onBack,
  onCancel
}: MobileStepLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 z-10">
        <div className="flex items-center px-4 py-3">
          {onBack && (
            <button onClick={onBack} className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex-1 mx-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600">{progress}%</span>
              <h1 className="text-lg font-medium">{title}</h1>
              {onCancel && (
                <button onClick={onCancel} className="p-2">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            <div className="mt-2 h-1 bg-gray-200 rounded-full">
              <div 
                className="h-full bg-purple-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-20 px-4 pb-24">
        <div className="mb-8">
          <p className="text-gray-500">{subtitle}</p>
        </div>
        {children}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-4">
        {onNext && (
          <button
            onClick={onNext}
            className="w-full py-4 bg-purple-600 text-white rounded-xl font-medium"
          >
            Continue
          </button>
        )}
        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full py-3 text-gray-600 dark:text-gray-400 font-medium mt-2"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
} 