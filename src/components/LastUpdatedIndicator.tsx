import React from 'react';
import { Clock } from 'lucide-react';

interface LastUpdatedIndicatorProps {
  lastUpdated: Date | null;
  className?: string;
}

const LastUpdatedIndicator: React.FC<LastUpdatedIndicatorProps> = ({ lastUpdated, className = '' }) => {
  if (!lastUpdated) return null;

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
  };

  return (
    <div className={`flex items-center gap-1 text-xs text-gray-500 ${className}`}>
      <Clock className="h-3 w-3" />
      <span>Updated {formatTimeAgo(lastUpdated)}</span>
    </div>
  );
};

export default LastUpdatedIndicator; 