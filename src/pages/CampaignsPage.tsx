import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, Filter } from 'lucide-react';
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

  const formatDate = (date: string | Date | any): string => {
    try {
      if (!date) return "N/A";
      
      // Si c'est un timestamp Firestore
      if (date?.toDate) {
        return new Intl.DateTimeFormat("fr-FR", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }).format(date.toDate());
      }
      
      // Si c'est une date standard
      const d = new Date(date);
      if (isNaN(d.getTime())) return "N/A";
      
      return new Intl.DateTimeFormat("fr-FR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(d);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartCampaign = async (campaignId: string) => {
    try {
      if (!currentUser) {
        toast.error("Please login first");
        return;
      }

      console.log("Starting campaign with ID:", campaignId);
      console.log("Current user:", currentUser.uid);
      
      const startCampaignFunction = httpsCallable<
        { campaignId: string },
        { success: boolean; message: string }
      >(functions, 'startCampaign');
      
      const toastId = toast.loading("Starting campaign...");
      
      // Appel de la fonction avec plus de logs
      console.log("Calling Cloud Function with data:", { campaignId });
      const result = await startCampaignFunction({
        campaignId: campaignId
      });
      console.log("Raw function result:", result);
      
      if (result.data.success) {
        toast.dismiss(toastId);
        toast.success(result.data.message);
      } else {
        throw new Error(result.data.message || "Unknown error");
      }

    } catch (error: any) {
      console.error("Detailed error starting campaign:", {
        error,
        message: error.message,
        code: error.code,
        details: error.details
      });
      toast.dismiss();
      toast.error(error.message || "Failed to start campaign");
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header amélioré */}
          <div className="mb-12 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#8D75E6] to-[#A990FF] text-transparent bg-clip-text mb-3">
                Campaigns
              </h1>
              <p className="text-lg text-gray-400">
                Manage your job application campaigns
              </p>
            </div>

            {/* Bouton amélioré */}
            <button
              onClick={() => setShowNewCampaign(true)}
              className="group px-5 py-2.5 rounded-xl 
                bg-gradient-to-r from-[#8D75E6] to-[#A990FF]
                hover:opacity-90
                border border-[#8D75E6]/20
                shadow-lg shadow-[#8D75E6]/20
                transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <Plus className="h-4 w-4 text-white group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-white">New Campaign</span>
              </div>
            </button>
          </div>

          {/* Search amélioré */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campaigns..."
                className="w-full pl-12 pr-4 py-3.5
                  bg-white/80 dark:bg-[#353040]/80
                  backdrop-blur-sm
                  border border-gray-200/50 dark:border-gray-700/30
                  rounded-xl
                  text-base
                  placeholder:text-gray-400
                  focus:ring-2 focus:ring-[#8D75E6]/20 focus:border-[#8D75E6]/50
                  shadow-sm
                  transition-all duration-200"
              />
            </div>
            <CampaignFilters
              filters={filters}
              onFilterChange={handleFilterChange}
            />
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
        </motion.div>
      </div>
    </AuthLayout>
  );
}
