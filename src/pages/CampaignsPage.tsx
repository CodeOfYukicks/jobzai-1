import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2 } from 'lucide-react';
import { collection, query, onSnapshot, doc, deleteDoc, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import DeleteCampaignModal from '../components/DeleteCampaignModal';
import CampaignFilters from '../components/CampaignFilters';
import CampaignPreview from './CampaignPreview';
import CampaignDetailsModal from '../components/CampaignDetailsModal';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  title: string;
  description: string;
  status: string;
  emailsSent: number;
  responses: number;
  createdAt: any;
  jobTitle: string;
  industry: string;
  jobType: string;
  location: string;
  credits: number;
  cvUrl?: string;
  cvName?: string;
  blacklistedCompanies?: { id: string; name: string; }[];
}

interface DeleteModalState {
  show: boolean;
  campaign?: Campaign;
}

export default function CampaignsPage() {
  const { currentUser } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({ show: false });
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [filters, setFilters] = useState({});
  const [error, setError] = useState<string | null>(null);
  const [showNewCampaign, setShowNewCampaign] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const campaignsRef = collection(db, 'users', currentUser.uid, 'campaigns');
    let q = query(campaignsRef);

    // Apply filters
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters.dateRange?.start) {
      q = query(q, where('createdAt', '>=', filters.dateRange.start));
    }
    if (filters.dateRange?.end) {
      q = query(q, where('createdAt', '<=', filters.dateRange.end));
    }

    // Add ordering
    q = query(q, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const campaignsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Campaign[];
        setCampaigns(campaignsList);
      },
      (error) => {
        console.error('Error fetching campaigns:', error);
        setError('Failed to load campaigns');
      }
    );

    return () => unsubscribe();
  }, [currentUser, filters]);

  const handleDeleteCampaign = async () => {
    if (!currentUser || !deleteModal.campaign) return;

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'campaigns', deleteModal.campaign.id));
      toast.success('Campaign deleted successfully');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      if (date.toDate) {
        return date.toDate().toLocaleDateString();
      }
      return new Date(date).toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showNewCampaign) {
    return (
      <AuthLayout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <CampaignPreview onBack={() => setShowNewCampaign(false)} />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your job application campaigns
            </p>
          </div>
          <button
            onClick={() => setShowNewCampaign(true)}
            className="flex items-center px-4 py-2 bg-[#8D75E6] text-white rounded-lg hover:bg-[#8D75E6]/90 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Campaign
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search campaigns..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6]"
            />
          </div>
          <CampaignFilters
            filters={filters}
            onFilterChange={setFilters}
          />
        </div>

        {/* Campaigns List */}
        <div className="space-y-4">
          {filteredCampaigns.map((campaign) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedCampaign(campaign)}
              className="group bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow relative cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="flex-grow pr-8">
                  <h3 className="text-lg font-medium text-gray-900">{campaign.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{campaign.description}</p>
                  <div className="flex items-center space-x-6 text-sm text-gray-500 mt-4">
                    <span>Emails Sent: {campaign.emailsSent}</span>
                    <span>Responses: {campaign.responses}</span>
                    <span>Created: {formatDate(campaign.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                    campaign.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {campaign.status}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteModal({ show: true, campaign });
                    }}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredCampaigns.length === 0 && !error && (
            <div className="text-center py-12">
              <p className="text-gray-500">No campaigns found</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          )}
        </div>

        {/* Modals */}
        {deleteModal.show && deleteModal.campaign && (
          <DeleteCampaignModal
            campaignTitle={deleteModal.campaign.title}
            onConfirm={handleDeleteCampaign}
            onClose={() => setDeleteModal({ show: false })}
          />
        )}
        {selectedCampaign && (
          <CampaignDetailsModal
            campaign={selectedCampaign}
            onClose={() => setSelectedCampaign(null)}
          />
        )}
      </div>
    </AuthLayout>
  );
}