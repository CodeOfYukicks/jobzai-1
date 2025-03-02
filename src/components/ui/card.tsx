import React from 'react';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className = '', children }: CardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children }: CardProps) {
  return (
    <div className={`p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children }: CardProps) {
  return (
    <h3 className={`text-lg sm:text-xl font-semibold text-gray-900 dark:text-white ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', children }: CardProps) {
  return (
    <p className={`mt-1 text-sm text-gray-500 dark:text-gray-400 ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ className = '', children }: CardProps) {
  return (
    <div className={`p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children }: CardProps) {
  return (
    <div className={`p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
} 