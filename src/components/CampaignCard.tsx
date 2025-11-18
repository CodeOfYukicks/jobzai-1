import { useState } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  description: string;
  status: string;
  emailsSent: number;
  responses: number;
  createdAt: string;
}

interface CampaignCardProps {
  campaign: Campaign;
  onDelete: (campaign: Campaign) => void;
  onSelect: (campaign: Campaign) => void;
  onStartCampaign: (campaignId: string) => void;
  formatDate: (date: string | Date) => string;
  isMobile: boolean;
}

export default function CampaignCard({
  campaign,
  onDelete,
  onSelect,
  onStartCampaign,
  formatDate,
  isMobile
}: CampaignCardProps) {
  const controls = useAnimation();
  const swipeThreshold = 100;
  const [isSwipedLeftEnough, setIsSwipedLeftEnough] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = async (event: any, info: PanInfo) => {
    const offset = info.offset.x;
    if (offset < -swipeThreshold) {
      await controls.start({ x: -100 });
      setIsSwipedLeftEnough(true);
    } else {
      await controls.start({ x: 0 });
      setIsSwipedLeftEnough(false);
    }

    setTimeout(() => {
      setIsDragging(false);
    }, 100);
  };

  const handleClick = () => {
    if (!isDragging) {
      onSelect(campaign);
    }
  };

  if (isMobile) {
    return (
      <div className="relative">
        {/* Delete background */}
        <div
          className="absolute top-0 bottom-0 right-0 w-[100px] flex items-center justify-center bg-red-500 rounded-r-lg"
          onClick={() => {
            if (isSwipedLeftEnough) {
              onDelete(campaign);
            }
          }}
        >
          <Trash2 className="h-6 w-6 text-white" />
        </div>

        {/* Swipeable card */}
        <motion.div
          drag="x"
          dragConstraints={{ left: -100, right: 0 }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          animate={controls}
          onClick={handleClick}
          className="bg-white p-4 rounded-lg shadow-sm relative"
          style={{ zIndex: 1, touchAction: 'pan-x' }}
        >
          <div className="flex flex-col">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-medium text-gray-900">{campaign.title}</h3>
              <span className={`ml-2 px-2.5 py-1 text-xs font-medium rounded-full ${
                campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                campaign.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {campaign.status}
              </span>
            </div>

            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{campaign.description}</p>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex flex-col">
                <span className="text-xs text-gray-400">Emails Sent</span>
                <span className="font-medium">{campaign.emailsSent}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400">Responses</span>
                <span className="font-medium">{campaign.responses}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400">Created</span>
                <span className="font-medium">{formatDate(campaign.createdAt)}</span>
              </div>
            </div>

            {campaign.status === 'pending' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartCampaign(campaign.id);
                }}
                className="mt-4 w-full px-4 py-2 bg-[hsl(var(--primary))] text-white text-sm rounded-lg hover:bg-[hsl(var(--primary))]/90 transition-colors"
              >
                Start Campaign
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Version desktop
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(campaign)}
      className="group bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow relative cursor-pointer"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
        <div className="flex-grow pr-2 sm:pr-8">
          <div className="flex items-start justify-between">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">{campaign.title}</h3>
            <span className={`ml-2 px-2.5 py-1 text-xs sm:text-sm font-medium rounded-full ${
              campaign.status === 'active' ? 'bg-green-100 text-green-800' :
              campaign.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {campaign.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{campaign.description}</p>

          <div className="flex items-center space-x-6 text-sm text-gray-500 mt-4">
            <div className="flex flex-col">
              <span className="text-xs text-gray-400">Emails Sent</span>
              <span className="font-medium">{campaign.emailsSent}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400">Responses</span>
              <span className="font-medium">{campaign.responses}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400">Created</span>
              <span className="font-medium">{formatDate(campaign.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          {campaign.status === 'pending' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartCampaign(campaign.id);
              }}
              className="px-4 py-2 bg-[hsl(var(--primary))] text-white text-sm rounded-lg hover:bg-[hsl(var(--primary))]/90 transition-colors"
            >
              Start Campaign
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(campaign);
            }}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}