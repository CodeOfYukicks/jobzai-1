import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Clock, Target, CreditCard, Building, MapPin, Briefcase, FileText, Eye } from 'lucide-react';
import CVPreviewModal from './CVPreviewModal';

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
  cvUrl?: string;
  cvName?: string;
  blacklistedCompanies?: { id: string; name: string; }[];
}

interface CampaignDetailsModalProps {
  campaign: Campaign;
  onClose: () => void;
}

export default function CampaignDetailsModal({ campaign, onClose }: CampaignDetailsModalProps) {
  const [showCVPreview, setShowCVPreview] = useState(false);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="border-b p-4 flex justify-between items-center sticky top-0 bg-white">
            <h2 className="text-xl font-bold text-gray-900">Campaign Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Title and Status */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{campaign.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{campaign.description}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(campaign.status)}`}>
                {campaign.status}
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center text-sm font-medium text-gray-500">
                  <Mail className="h-4 w-4 mr-1.5" />
                  Emails Sent
                </div>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{campaign.emailsSent}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center text-sm font-medium text-gray-500">
                  <Target className="h-4 w-4 mr-1.5" />
                  Responses
                </div>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{campaign.responses}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center text-sm font-medium text-gray-500">
                  <CreditCard className="h-4 w-4 mr-1.5" />
                  Credits Used
                </div>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{campaign.credits}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center text-sm font-medium text-gray-500">
                  <Clock className="h-4 w-4 mr-1.5" />
                  Created
                </div>
                <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(campaign.createdAt)}</p>
              </div>
            </div>

            {/* CV Information */}
            {campaign.cvUrl && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">CV/Resume</p>
                      <p className="text-sm text-gray-500">{campaign.cvName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCVPreview(true)}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    title="Preview CV"
                  >
                    <Eye className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>
            )}

            {/* Job Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Job Details</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center space-x-3 text-sm">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{campaign.jobTitle}</p>
                    <p className="text-gray-500">Job Title</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Building className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{campaign.industry}</p>
                    <p className="text-gray-500">Industry</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{campaign.location}</p>
                    <p className="text-gray-500">Location</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{campaign.jobType}</p>
                    <p className="text-gray-500">Job Type</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Blacklisted Companies */}
            {campaign.blacklistedCompanies && campaign.blacklistedCompanies.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Blacklisted Companies</h4>
                <div className="flex flex-wrap gap-2">
                  {campaign.blacklistedCompanies.map((company) => (
                    <span
                      key={company.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                    >
                      {company.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-4 bg-gray-50">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* CV Preview Modal */}
      <AnimatePresence>
        {showCVPreview && campaign.cvUrl && (
          <CVPreviewModal
            cvUrl={campaign.cvUrl}
            cvName={campaign.cvName || 'CV Preview'}
            onClose={() => setShowCVPreview(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}