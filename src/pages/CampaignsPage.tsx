import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, Filter, Mail, MessageSquare, Target, Calendar, Inbox, PlayCircle } from 'lucide-react';
import { collection, query, onSnapshot, doc, deleteDoc, where, orderBy, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
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
import axios from 'axios';

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
  cv: string;
  templateId: string;
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

      const toastId = toast.loading("Starting campaign...");

      // Récupérer les données de l'utilisateur
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      // Récupérer la campagne
      const campaignRef = doc(db, 'users', currentUser.uid, 'campaigns', campaignId);
      const campaignSnap = await getDoc(campaignRef);
      const campaign = campaignSnap.data();

      // Récupérer le template
      const templateRef = doc(db, 'users', currentUser.uid, 'emailTemplates', campaign.templateId);
      const templateSnap = await getDoc(templateRef);
      const emailTemplate = templateSnap.data();

      // Préparer les données pour le webhook
      const webhookData = {
        user: {
          id: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          // Ajouter d'autres informations utilisateur si nécessaire
          ...userData
        },
        campaign: {
          id: campaignId,
          title: campaign.title,
          jobTitle: campaign.jobTitle,
          industry: campaign.industry,
          jobType: campaign.jobType,
          location: campaign.location,
          description: campaign.description,
          blacklistedCompanies: campaign.blacklistedCompanies || [],
          credits: campaign.credits,
          status: campaign.status,
          emailsSent: campaign.emailsSent || 0,
          responses: campaign.responses || 0,
          createdAt: campaign.createdAt,
          cv: campaign.cv || null,
          emailTemplate: emailTemplate ? {
            id: campaign.templateId,
            name: emailTemplate.name,
            subject: emailTemplate.subject,
            content: emailTemplate.content
          } : null
        }
      };

      console.log("📤 Sending to webhook with user data:", webhookData);

      const WEBHOOK_URL = "https://hook.eu1.make.com/orrmdfwy6ahw3315pi3gfrryc4h5uj1s";
      await axios.post(WEBHOOK_URL, webhookData);

      // Mettre à jour le statut
      await updateDoc(campaignRef, {
        status: 'active',
        startedAt: serverTimestamp()
      });

      toast.dismiss(toastId);
      toast.success("Campaign started successfully!");

    } catch (error) {
      console.error("Error starting campaign:", error);
      toast.error("Failed to start campaign");
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Campaigns
              </h1>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Manage your job application campaigns
              </p>
            </div>
            <button
              onClick={() => setShowNewCampaign(true)}
              className="group px-4 py-2.5 rounded-xl 
                bg-gradient-to-r from-purple-600 to-indigo-600
                hover:opacity-90 transition-all duration-200
                shadow-lg shadow-purple-500/20"
            >
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">New Campaign</span>
              </div>
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {campaigns.reduce((total, campaign) => total + (Number(campaign.emailsSent) || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Emails Sent</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {campaigns.reduce((acc, c) => acc + (c.responses || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Responses</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {campaigns.filter(c => c.status === 'completed').length}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Completed Campaigns</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search campaigns..."
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 
                border border-gray-200 dark:border-gray-700 rounded-xl
                focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <CampaignFilters filters={filters} onFilterChange={handleFilterChange} />
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="group bg-white dark:bg-gray-800 rounded-xl p-6 
                border border-gray-200 dark:border-gray-700
                hover:shadow-lg hover:border-purple-500 dark:hover:border-purple-500
                transition-all duration-200 cursor-pointer"
              onClick={() => setSelectedCampaign(campaign)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-purple-600">
                    {campaign.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {campaign.jobTitle}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium
                  ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {campaign.emailsSent} sent
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {campaign.responses} responses
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {formatDate(campaign.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {campaign.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartCampaign(campaign.id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 
                          hover:bg-green-200 dark:hover:bg-green-900/50 transition-all duration-200"
                      >
                        <div className="flex items-center gap-2">
                          <PlayCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            Start
                          </span>
                        </div>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModal({ show: true, campaign });
                      }}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCampaigns.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
              <Inbox className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No campaigns found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchQuery 
                ? "No campaigns match your search criteria" 
                : "Get started by creating your first campaign"}
            </p>
          </div>
        )}

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

// Utility function for status colors
function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'completed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
}
