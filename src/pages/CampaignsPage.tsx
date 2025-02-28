import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, Filter, Mail, MessageSquare, Target, Calendar, Inbox, PlayCircle, LayoutGrid, List, ChevronRight } from 'lucide-react';
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

// Define local Campaign interface to match what we're using in this file
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
  updatedAt?: string;
  lastEmailSentAt?: string;
}

// Ajout du type pour la modale de confirmation
type StartModalType = {
  show: boolean;
  campaign?: any;
}

export default function CampaignsPage() {
  const { currentUser } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState<{show: boolean; campaign?: any}>({ show: false });
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [filters, setFilters] = useState<FiltersType>({});
  const [error, setError] = useState<string | null>(null);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [startModal, setStartModal] = useState<StartModalType>({ show: false });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (!currentUser) return;

    const campaignsRef = collection(db, 'users', currentUser.uid, 'campaigns');
    let q = query(campaignsRef);

    // Apply status filter
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    // Apply date range filters
    if (filters.dateRange?.start) {
      // Convert Date to Firestore Timestamp or ISO string format depending on your data model
      const startDate = filters.dateRange.start;
      q = query(q, where('createdAt', '>=', startDate));
    }
    
    if (filters.dateRange?.end) {
      // Convert Date to Firestore Timestamp or ISO string format depending on your data model
      const endDate = filters.dateRange.end;
      // Set time to end of day for the end date
      if (endDate instanceof Date) {
        endDate.setHours(23, 59, 59, 999);
      }
      q = query(q, where('createdAt', '<=', endDate));
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

  useEffect(() => {
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      const userData = doc.data();
      setUserCredits(userData?.credits || 0);
    });

    return () => unsubscribe();
  }, [currentUser]);

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

  const handleStartCampaign = async (campaignId: string) => {
    setStartModal({ show: false });
    
    if (!currentUser) {
      toast.error("Please login first");
      return;
    }

    const toastId = toast.loading("Starting campaign...");
    
    try {
      // Récupérer les données de l'utilisateur
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        toast.error("User data not found");
        toast.dismiss(toastId);
        return;
      }
      
      const userData = userSnap.data();

      // Vérifier si l'utilisateur a assez de crédits
      const currentCredits = userData?.credits || 0;

      // Récupérer la campagne
      const campaignRef = doc(db, 'users', currentUser.uid, 'campaigns', campaignId);
      const campaignSnap = await getDoc(campaignRef);
      
      if (!campaignSnap.exists()) {
        toast.error("Campaign not found");
        toast.dismiss(toastId);
        return;
      }
      
      const campaignData = campaignSnap.data();

      // Vérifier si la campagne existe et a des crédits assignés
      if (!campaignData?.credits) {
        toast.error("Campaign credits not specified");
        toast.dismiss(toastId);
        return;
      }

      // Vérifier si l'utilisateur a assez de crédits
      if (currentCredits < campaignData.credits) {
        toast.error(`Insufficient credits. You need ${campaignData.credits} credits but only have ${currentCredits}`);
        toast.dismiss(toastId);
        return;
      }

      // Vérifier que le template existe
      if (!campaignData.templateId) {
        toast.error("Email template not specified");
        toast.dismiss(toastId);
        return;
      }

      // Récupérer le template
      const templateRef = doc(db, 'users', currentUser.uid, 'emailTemplates', campaignData.templateId);
      const templateSnap = await getDoc(templateRef);
      
      if (!templateSnap.exists()) {
        toast.error("Email template not found");
        toast.dismiss(toastId);
        return;
      }
      
      const emailTemplate = templateSnap.data();

      // Déduire les crédits du solde de l'utilisateur
      await updateDoc(userRef, {
        credits: currentCredits - campaignData.credits
      });

      // Préparer les données pour le webhook
      const webhookData = {
        user: {
          id: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          ...userData
        },
        campaign: {
          id: campaignId,
          ...campaignData,
          emailTemplate: emailTemplate ? {
            id: campaignData.templateId,
            name: emailTemplate.name,
            subject: emailTemplate.subject,
            content: emailTemplate.content
          } : null
        }
      };

      console.log("📤 Sending to webhook with user data:", webhookData);

      // Essayer d'envoyer les données au webhook (on continue même si ça échoue)
      const WEBHOOK_URL = "https://hook.eu1.make.com/orrmdfwy6ahw3315pi3gfrryc4h5uj1s";
      try {
        await axios.post(WEBHOOK_URL, webhookData);
      } catch (webhookError) {
        console.error("Webhook error:", webhookError);
        // On continue même si le webhook échoue
      }

      // Mettre à jour le statut de la campagne
      await updateDoc(campaignRef, {
        status: 'active',
        startedAt: serverTimestamp(),
        creditsDeducted: true // Marquer que les crédits ont été déduits
      });

      toast.success(`Campaign started successfully! ${campaignData.credits} credits deducted from your balance.`);
    } catch (error) {
      console.error("Error starting campaign:", error);
      toast.error("Failed to start campaign");
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleStartClick = (e: React.MouseEvent, campaign: any) => {
    e.stopPropagation();
    setStartModal({ show: true, campaign });
  };

  const handleFilterChange = (newFilters: FiltersType) => {
    setFilters(newFilters);
  };

  // Filtrage des campagnes
  const filteredCampaigns = campaigns.filter(campaign =>
    (campaign.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (campaign.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
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

  // Render the table/list view for campaigns
  const renderListView = () => (
    <div className="overflow-hidden bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Campaign
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Emails
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Responses
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredCampaigns.length > 0 ? (
              filteredCampaigns.map((campaign) => (
                <tr 
                  key={campaign.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col cursor-pointer" onClick={() => setSelectedCampaign(campaign)}>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {campaign.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {campaign.jobTitle}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                      {campaign.status === 'pending' && campaign.credits && (
                        <div className="text-xs text-gray-500 mt-1">
                          {campaign.credits} / {userCredits} credits
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {campaign.emailsSent || 0} sent
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {campaign.responses || 0} responses
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(campaign.createdAt)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {campaign.status === 'pending' && (
                        <button
                          onClick={(e) => { 
                            e.stopPropagation();
                            handleStartClick(e, campaign);
                          }}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 
                            hover:bg-green-200 dark:hover:bg-green-900/50 transition-all duration-200"
                        >
                          <PlayCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">
                            Start
                          </span>
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModal({ show: true, campaign });
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                      </button>
                      <button
                        onClick={() => setSelectedCampaign(campaign)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                  {searchQuery || Object.keys(filters).length > 0 
                    ? "No campaigns match your filters or search criteria" 
                    : "No campaigns found. Create your first campaign to get started."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render the grid view for campaigns
  const renderGridView = () => (
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
            <div className="flex flex-col items-end gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium
                ${getStatusColor(campaign.status)}`}>
                {campaign.status}
              </span>
              {campaign.status === 'pending' && (
                <span className="text-xs text-gray-500">
                  Credits: {campaign.credits} / {userCredits} available
                </span>
              )}
            </div>
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
                    onClick={(e) => handleStartClick(e, campaign)}
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
  );

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

        {/* Search, Filters and View Toggle */}
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
          <div className="flex items-center gap-3">
            <CampaignFilters filters={filters} onFilterChange={handleFilterChange} />
            
            {/* View Toggle Buttons */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 flex">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg flex items-center justify-center ${
                  viewMode === 'grid' 
                    ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' 
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                aria-label="Grid View"
              >
                <LayoutGrid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg flex items-center justify-center ${
                  viewMode === 'list' 
                    ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' 
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                aria-label="List View"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Campaigns View (Grid or List) */}
        {viewMode === 'grid' ? renderGridView() : renderListView()}

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
        {startModal.show && startModal.campaign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-xl transform transition-all">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-6">
                  <PlayCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Start Campaign
                </h3>
                <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                  You are about to start the campaign "<span className="font-semibold">{startModal.campaign.title}</span>". This action will:
                </p>
                <ul className="space-y-3 mb-6 w-full">
                  <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    Use <span className="font-semibold mx-1">{startModal.campaign.credits}</span> credits from your account
                  </li>
                  <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    Send automated job applications based on your template
                  </li>
                  <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    Start running immediately and cannot be undone
                  </li>
                </ul>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                  Available credits: <span className="font-semibold">{userCredits}</span>
                </p>
                <div className="flex gap-4 w-full">
                  <button
                    onClick={() => setStartModal({ show: false })}
                    className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleStartCampaign(startModal.campaign!.id)}
                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors duration-200"
                  >
                    Start Campaign
                  </button>
                </div>
              </div>
            </div>
          </div>
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
