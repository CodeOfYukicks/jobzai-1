import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Mail, Clock, Target, CreditCard, Building, MapPin, 
  Briefcase, FileText, Eye, Users, BarChart, Calendar,
  CheckCircle2, AlertCircle, PauseCircle, PlayCircle, ExternalLink, Download
} from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  description: string;
  jobTitle: string;
  industry: string;
  jobType: string;
  location: string;
  credits: number;
  status: string;
  emailsSent: number;
  responses: number;
  createdAt: any;
  updatedAt: any;
  lastEmailSentAt: any;
  targetAudience?: string;
  emailTemplate?: {
    subject: string;
    content: string;
  };
  stats?: {
    openRate: number;
    responseRate: number;
    bounceRate: number;
  };
  schedule?: {
    frequency: string;
    maxEmailsPerDay: number;
    timezone: string;
  };
  cv?: {
    name: string;
    url: string;
    updatedAt: any;
  };
  template?: {
    name: string;
    subject: string;
    content: string;
  };
}

export default function CampaignDetailsModal({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return <PlayCircle className="h-5 w-5 text-green-500" />;
      case 'completed': return <CheckCircle2 className="h-5 w-5 text-blue-500" />;
      case 'paused': return <PauseCircle className="h-5 w-5 text-yellow-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header avec status et actions */}
        <div className="border-b border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {getStatusIcon(campaign.status)}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {campaign.title}
                </h2>
              </div>
              <p className="text-gray-500 dark:text-gray-400">{campaign.description}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-4 mt-6">
            {['overview', 'details'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${activeTab === tab 
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 p-6 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500/10 rounded-lg">
                      <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {campaign.emailsSent}
                      </p>
                      <p className="text-sm text-purple-600/70 dark:text-purple-400/70">
                        Emails Sent
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 p-6 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {campaign.responses}
                      </p>
                      <p className="text-sm text-blue-600/70 dark:text-blue-400/70">
                        Responses
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 p-6 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <BarChart className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {((campaign.responses / campaign.emailsSent) * 100).toFixed(1)}%
                      </p>
                      <p className="text-sm text-green-600/70 dark:text-green-400/70">
                        Response Rate
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaign Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Job Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {campaign.jobTitle}
                        </p>
                        <p className="text-xs text-gray-500">Position</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <Building className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {campaign.industry}
                        </p>
                        <p className="text-xs text-gray-500">Industry</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {campaign.location}
                        </p>
                        <p className="text-xs text-gray-500">Location</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Campaign Timeline
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(campaign.createdAt?.toDate()).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">Created</p>
                      </div>
                    </div>
                    {campaign.lastEmailSentAt && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(campaign.lastEmailSentAt?.toDate()).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">Last Email Sent</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Campaign Resources */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Campaign Resources
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900/50 
                    rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {campaign.credits} credits
                      </p>
                      <p className="text-xs text-gray-500">Credits Used</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CV Section */}
              {campaign.cv && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    CV Used
                  </h3>
                  <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900/50 
                    rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                      <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {typeof campaign.cv === 'string' 
                          ? 'CV Document' 
                          : campaign.cv.name || 'CV Document'}
                      </p>
                      {campaign.cv.updatedAt && (
                        <p className="text-xs text-gray-500">
                          Last updated: {new Date(campaign.cv.updatedAt?.toDate()).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <a 
                        href={typeof campaign.cv === 'string' ? campaign.cv : campaign.cv.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm 
                          bg-purple-50 dark:bg-purple-900/20 
                          text-purple-600 dark:text-purple-400 
                          rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 
                          transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View
                      </a>
                      <a 
                        href={typeof campaign.cv === 'string' ? campaign.cv : campaign.cv.url}
                        download
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm 
                          bg-gray-50 dark:bg-gray-800/50
                          text-gray-600 dark:text-gray-400 
                          rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                          transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Template */}
              {campaign.template && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Email Template
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-white dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {campaign.template.name}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Subject: {campaign.template.subject}
                        </p>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                            {campaign.template.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Campaign Description */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Description
                </h3>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {campaign.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
