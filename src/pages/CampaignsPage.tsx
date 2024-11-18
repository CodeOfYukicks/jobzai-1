import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2 } from 'lucide-react';
import { collection, query, onSnapshot, doc, deleteDoc, where, orderBy } from 'firebase/firestore';
import { db, functions } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import DeleteCampaignModal from '../components/DeleteCampaignModal';
import { CampaignFilters, type CampaignFilters as FiltersType } from '../components/CampaignFilters';
import CampaignPreview from './CampaignPreview';
import CampaignDetailsModal from '../components/CampaignDetailsModal';
import { toast } from 'sonner';
import { httpsCallable } from 'firebase/functions';
import CampaignCard from '../components/CampaignCard';

interface Campaign {
  id: string;
  title: string;
  description: string;
  jobTitle: string;
  industry: string;
  jobType: string;
  location: string;
  status: string;
  emailsSent: number;
  responses: number;
  createdAt: string;
  blacklistedCompanies: { id: string; name: string; }[];
  credits: number;
}

export default function CampaignsPage() {
  const { currentUser } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState<{show: boolean; campaign?: Campaign}>({ show: false });
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [filters, setFilters] = useState<FiltersType>({});
  const [error, setError] = useState<string | null>(null);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const formatDate = (date: string | Date): string => {
    if (!date) return 'N/A';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartCampaign = async (campaignId: string) => {
    try {
      if (!currentUser) {
        toast.error('Please login first');
        return;
      }

      console.log('Starting campaign:', campaignId);
      
      // Forcer le rafra├«chissement du token
      await currentUser.getIdToken(true);
      
      const startCampaignFunction = httpsCallable(
        functions, 
        'startCampaign',
        { timeout: 60000 }
      );
      
      const result = await startCampaignFunction({ campaignId });
      console.log('Function result:', result.data);
      
      toast.success('Campaign started successfully');
    } catch (error: any) {
      console.error('Error starting campaign:', error);
      toast.error(error.message || 'Failed to start campaign');
    }
  };

  const handleFilterChange = (newFilters: FiltersType) => {
    setFilters(newFilters);
  };

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
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        {/* Header - Adapt├® pour mobile */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your job application campaigns
            </p>
          </div>
          <button
            onClick={() => setShowNewCampaign(true)}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2.5 bg-[#8D75E6] text-white rounded-lg hover:bg-[#8D75E6]/90 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Campaign
          </button>
        </div>

        {/* Search and Filters - R├®organis├®s pour mobile */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:space-x-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search campaigns..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6]"
            />
          </div>
          <div className="w-full sm:w-auto">
            <CampaignFilters
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>
        </div>

        {/* Campaigns List */}
        <div className="space-y-4">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onDelete={(campaign) => setDeleteModal({ show: true, campaign })}
              onSelect={setSelectedCampaign}
              onStartCampaign={handleStartCampaign}
              formatDate={formatDate}
              isMobile={window.innerWidth < 640}
            />
          ))}

          {/* ├ëtats vides et erreurs adapt├®s */}
          {filteredCampaigns.length === 0 && !error && (
            <div className="text-center py-8 sm:py-12">
              <p className="text-gray-500">No campaigns found</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8 sm:py-12">
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
