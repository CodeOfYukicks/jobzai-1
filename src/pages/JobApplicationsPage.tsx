import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { collection, query, onSnapshot, doc, updateDoc, where, orderBy, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Calendar, Building, ExternalLink, MapPin, Edit3, Trash2, User, Mail, Phone, Briefcase, DollarSign, FileText, MessageSquare, Link, X, PlusCircle, Clock, Users, Check, BarChart, PieChart, Kanban, Calendar as CalendarIcon, LineChart, TrendingUp, Activity, Download } from 'lucide-react';
import { toast } from 'sonner';
import AuthLayout from '../components/AuthLayout';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

interface Interview {
  id: string;
  date: string;
  time: string;
  type: 'technical' | 'hr' | 'manager' | 'final' | 'other';
  interviewers?: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  feedback?: string;
  location?: string;
}

interface StatusChange {
  status: 'applied' | 'interview' | 'offer' | 'rejected' | 'archived';
  date: string;
  notes?: string;
}

interface JobApplication {
  id: string;
  companyName: string;
  position: string;
  location: string;
  status: 'applied' | 'interview' | 'offer' | 'rejected' | 'archived';
  appliedDate: string;
  url?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  salary?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  interviews?: Interview[];
  statusHistory?: StatusChange[];
}

export default function JobApplicationsPage() {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editModal, setEditModal] = useState<{show: boolean; application?: JobApplication}>({ show: false });
  const [deleteModal, setDeleteModal] = useState<{show: boolean; application?: JobApplication}>({ show: false });
  const [newApplicationModal, setNewApplicationModal] = useState(false);
  const [formData, setFormData] = useState<Partial<JobApplication>>({
    companyName: '',
    position: '',
    location: '',
    status: 'applied',
    appliedDate: new Date().toISOString().split('T')[0],
  });
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [timelineModal, setTimelineModal] = useState(false);
  const [view, setView] = useState<'kanban' | 'analytics'>('kanban');

  useEffect(() => {
    if (!currentUser) return;

    const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
    const q = query(applicationsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const applicationsData: JobApplication[] = [];
      snapshot.forEach((doc) => {
        applicationsData.push({ id: doc.id, ...doc.data() } as JobApplication);
      });
      setApplications(applicationsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const fireConfetti = () => {
    // Création d'un effet de confettis festif
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 1500 // Pour être sûr que les confettis apparaissent au-dessus de tout
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
        scalar: 1.2,
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#9333ea', '#6366f1'] // Couleurs violet et indigo pour matcher votre thème
    });

    fire(0.2, {
      spread: 60,
      colors: ['#22c55e', '#10b981'] // Vert pour symboliser le succès
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      colors: ['#6366f1', '#8b5cf6'] // Plus de violet et indigo
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      colors: ['#22c55e', '#9333ea'] // Mix de vert et violet
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
      colors: ['#f472b6', '#c084fc'] // Rose et violet clair pour plus de festivité
    });
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination || !currentUser) return;

    const { source, destination, draggableId } = result;
    
    // Si l'application est déplacée vers la même colonne, ne rien faire
    if (source.droppableId === destination.droppableId) return;
    
    const newStatus = destination.droppableId as 'applied' | 'interview' | 'offer' | 'rejected';
    
    try {
      // Get the application we're updating
      const app = applications.find(a => a.id === draggableId);
      if (!app) return;
      
      // Create a new status history entry
      const newStatusChange: StatusChange = {
        status: newStatus,
        date: new Date().toISOString().split('T')[0],
      };
      
      // Update history - make sure it exists first
      const statusHistory = app.statusHistory || [{
        status: app.status,
        date: app.appliedDate,
        notes: 'Initial application'
      }];
      
      // Add new status change to history
      statusHistory.push(newStatusChange);
      
      // Mise à jour optimiste de l'UI
      setApplications(prev => prev.map(app => 
        app.id === draggableId ? { 
          ...app, 
          status: newStatus,
          statusHistory
        } : app
      ));
      
      // Mise à jour dans Firestore
      const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', draggableId);
      await updateDoc(applicationRef, { 
        status: newStatus,
        updatedAt: serverTimestamp(),
        statusHistory
      });
      
      // Lancer les confettis si déplacé vers "offer"
      if (newStatus === 'offer') {
        fireConfetti();
      }
      
      toast.success(`Application moved to ${newStatus}`);
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error('Failed to update application status');
      // Retour à l'état précédent en cas d'erreur
      setApplications(prev => [...prev]);
    }
  };

  const handleCreateApplication = async () => {
    if (!currentUser) {
      toast.error('You must be logged in');
      return;
    }
    
    try {
      // Formatage des données avant envoi
      const newApplication = {
        companyName: formData.companyName,
        position: formData.position,
        location: formData.location,
        status: formData.status || 'applied',
        appliedDate: formData.appliedDate,
        url: formData.url || '',
        notes: formData.notes || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Ajout de valeurs par défaut pour les champs optionnels
        contactName: formData.contactName || '',
        contactEmail: formData.contactEmail || '',
        contactPhone: formData.contactPhone || '',
        salary: formData.salary || ''
      };

      // Vérification des champs requis
      if (!newApplication.companyName || !newApplication.position || !newApplication.location || !newApplication.appliedDate) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Création du document dans Firestore
      const docRef = await addDoc(
        collection(db, 'users', currentUser.uid, 'jobApplications'), 
        newApplication
      );

      // Si la création réussit, on ferme le modal et réinitialise le formulaire
      setNewApplicationModal(false);
      setFormData({
        companyName: '',
        position: '',
        location: '',
        status: 'applied',
        appliedDate: new Date().toISOString().split('T')[0],
        url: '',
        notes: ''
      });
      
      toast.success('Application created successfully');
    } catch (error) {
      console.error('Error creating application:', error);
      toast.error('Failed to create application: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleUpdateApplication = async () => {
    if (!currentUser || !editModal.application) return;
    
    try {
      const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', editModal.application.id);
      
      await updateDoc(applicationRef, {
        ...formData,
        updatedAt: serverTimestamp()
      });
      
      setEditModal({ show: false });
      toast.success('Application updated successfully');
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application');
    }
  };

  const handleDeleteApplication = async () => {
    if (!currentUser || !deleteModal.application) return;
    
    try {
      const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', deleteModal.application.id);
      await deleteDoc(applicationRef);
      
      setDeleteModal({ show: false });
      toast.success('Application deleted successfully');
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Failed to delete application');
    }
  };

  const filteredApplications = applications.filter(app =>
    app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const applicationsByStatus = {
    applied: filteredApplications.filter(app => app.status === 'applied'),
    interview: filteredApplications.filter(app => app.status === 'interview'),
    offer: filteredApplications.filter(app => app.status === 'offer'),
    rejected: filteredApplications.filter(app => app.status === 'rejected'),
    archived: filteredApplications.filter(app => app.status === 'archived')
  };

  const columnOrder = ['applied', 'interview', 'offer', 'rejected', 'archived'];
  
  // Analytics helper functions
  const getMonthlyApplicationData = () => {
    const monthData: { [key: string]: { applied: number, interviews: number, offers: number, rejected: number }} = {};
    
    applications.forEach(app => {
      const date = new Date(app.appliedDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthData[monthKey]) {
        monthData[monthKey] = { applied: 0, interviews: 0, offers: 0, rejected: 0 };
      }
      
      // Count applications by current status
      if (app.status === 'applied') monthData[monthKey].applied++;
      else if (app.status === 'interview') monthData[monthKey].interviews++;
      else if (app.status === 'offer') monthData[monthKey].offers++;
      else if (app.status === 'rejected') monthData[monthKey].rejected++;
    });
    
    // Sort by month
    return Object.entries(monthData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6); // Last 6 months
  };
  
  const getApplicationSourceData = () => {
    // In a real app, you would track the source of each application
    // Here we'll simulate some sample data
    return [
      { source: 'LinkedIn', count: Math.floor(applications.length * 0.4) },
      { source: 'Company Website', count: Math.floor(applications.length * 0.3) },
      { source: 'Referral', count: Math.floor(applications.length * 0.15) },
      { source: 'Job Board', count: Math.floor(applications.length * 0.1) },
      { source: 'Other', count: applications.length - Math.floor(applications.length * 0.95) }
    ].filter(item => item.count > 0);
  };
  
  const getResponseRateData = () => {
    const total = applications.length;
    const responses = applications.filter(app => app.status !== 'applied').length;
    const interviews = applications.filter(app => app.status === 'interview' || app.status === 'offer' || 
      (app.interviews && app.interviews.length > 0)).length;
    const offers = applications.filter(app => app.status === 'offer').length;
    
    return {
      responseRate: total ? (responses / total) * 100 : 0,
      interviewRate: total ? (interviews / total) * 100 : 0,
      offerRate: total ? (offers / total) * 100 : 0
    };
  };
  
  const getAverageTimeData = () => {
    let totalApplicationToInterview = 0;
    let totalInterviewToOffer = 0;
    let applicationsWithInterviews = 0;
    let interviewsWithOffers = 0;
    
    applications.forEach(app => {
      if (app.statusHistory && app.statusHistory.length > 1) {
        const appliedEntry = app.statusHistory.find(h => h.status === 'applied');
        const interviewEntry = app.statusHistory.find(h => h.status === 'interview');
        const offerEntry = app.statusHistory.find(h => h.status === 'offer');
        
        if (appliedEntry && interviewEntry) {
          const appliedDate = new Date(appliedEntry.date);
          const interviewDate = new Date(interviewEntry.date);
          const daysDiff = Math.round((interviewDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff >= 0) {
            totalApplicationToInterview += daysDiff;
            applicationsWithInterviews++;
          }
        }
        
        if (interviewEntry && offerEntry) {
          const interviewDate = new Date(interviewEntry.date);
          const offerDate = new Date(offerEntry.date);
          const daysDiff = Math.round((offerDate.getTime() - interviewDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff >= 0) {
            totalInterviewToOffer += daysDiff;
            interviewsWithOffers++;
          }
        }
      }
    });
    
    return {
      avgDaysToInterview: applicationsWithInterviews ? Math.round(totalApplicationToInterview / applicationsWithInterviews) : 0,
      avgDaysToOffer: interviewsWithOffers ? Math.round(totalInterviewToOffer / interviewsWithOffers) : 0
    };
  };

  // Helper function to generate .ics file for calendar integration
  const generateICSFile = (interview: Interview, company: string, position: string) => {
    // Create a timestamp in the format: YYYYMMDDTHHmmssZ
    const formatDate = (dateStr: string, timeStr: string) => {
      const date = new Date(`${dateStr}T${timeStr}`);
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const startTime = formatDate(interview.date, interview.time || '09:00');
    
    // Calculate end time (default to 1 hour later)
    const endDate = new Date(`${interview.date}T${interview.time || '09:00'}`);
    endDate.setHours(endDate.getHours() + 1);
    const endTime = formatDate(interview.date, endDate.toTimeString().split(' ')[0].substring(0, 5));
    
    // Create the .ics content
    const icsContent = 
  `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:${interview.type.charAt(0).toUpperCase() + interview.type.slice(1)} Interview with ${company}
DTSTART:${startTime}
DTEND:${endTime}
DESCRIPTION:Interview for ${position} position.${interview.notes ? '\\n\\n' + interview.notes : ''}
LOCATION:${interview.location || 'Remote/TBD'}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    return icsContent;
  };

  // Helper function to download the .ics file
  const downloadICS = (interview: Interview, company: string, position: string) => {
    const icsContent = generateICSFile(interview, company, position);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    
    // Create a download link and trigger it
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `interview-${company}-${interview.date}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Animations customisées pour les composants draggables
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    dragging: { 
      scale: 1.05, 
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)", 
      zIndex: 50,
      background: "var(--card-dragging-bg)",
      borderColor: "var(--card-dragging-border)",
    }
  };

  // Variables CSS pour les propriétés adaptatives en clair/sombre
  const cssVariables = `
    :root {
      --card-dragging-bg: white;
      --card-dragging-border: #9333ea;
    }
    
    .dark {
      --card-dragging-bg: #1f2937;
      --card-dragging-border: #9333ea;
    }

    /* Animation effet de brillance pendant le drag */
    @keyframes pulse-border {
      0% { box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.7); }
      70% { box-shadow: 0 0 0 4px rgba(147, 51, 234, 0); }
      100% { box-shadow: 0 0 0 0 rgba(147, 51, 234, 0); }
    }
    
    .dragging {
      animation: pulse-border 2s infinite;
    }

    /* Animation pour le dropzone hover */
    .droppable-hover {
      background-color: rgba(147, 51, 234, 0.05);
      transition: background-color 0.2s ease;
    }

    /* Styles pour le drag and drop */
    .dragging-card {
      z-index: 9999 !important;
      opacity: 1 !important;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
      background: var(--card-dragging-bg) !important;
      border-color: var(--card-dragging-border) !important;
      border-width: 2px !important;
      transform-origin: center center !important;
    }
  `;

  return (
    <AuthLayout>
      {/* CSS Variables pour les animations */}
      <style>{cssVariables}</style>
      
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Hero Section avec statistiques */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Job Applications
              </h1>
              <p className="mt-1 text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400">
                Track and manage your job applications
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setNewApplicationModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs sm:text-sm font-medium hover:opacity-90 transition-all duration-200"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Add Application
            </motion.button>
          </div>

          {/* View Toggle Tabs */}
          <div className="flex justify-center sm:justify-start mb-6">
            <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex">
              <button
                onClick={() => setView('kanban')}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                  view === 'kanban' 
                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
                }`}
              >
                <Kanban className="w-4 h-4" />
                <span>Kanban</span>
              </button>
              <button
                onClick={() => setView('analytics')}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                  view === 'analytics' 
                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
                }`}
              >
                <BarChart className="w-4 h-4" />
                <span>Analytics</span>
              </button>
            </div>
          </div>

          {/* Statistiques en grille responsive */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            {[
              { label: 'Applied', count: applications.filter(a => a.status === 'applied').length, color: 'blue' },
              { label: 'Interview', count: applications.filter(a => a.status === 'interview').length, color: 'purple' },
              { label: 'Offer', count: applications.filter(a => a.status === 'offer').length, color: 'green' },
              { label: 'Rejected', count: applications.filter(a => a.status === 'rejected').length, color: 'red' }
            ].map((stat, index) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                whileHover={{ scale: 1.03, boxShadow: "0 10px 30px -15px rgba(0,0,0,0.2)" }}
                className={`bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-200 dark:border-gray-700`}
              >
                <div className={`text-${stat.color}-600 dark:text-${stat.color}-400 text-lg sm:text-xl lg:text-2xl font-bold`}>
                  {stat.count}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Barre de recherche responsive - only show for kanban view */}
        {view === 'kanban' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-4 sm:mb-6">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search by company or position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500"
              />
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </motion.div>
        )}

        {/* Main content area - switch between kanban and analytics */}
        <AnimatePresence mode="wait">
          {view === 'kanban' ? (
            <motion.div
              key="kanban"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Kanban Board */}
              <DragDropContext onDragEnd={handleDragEnd}>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="flex overflow-x-auto pb-4 sm:pb-6 -mx-2 px-2 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 hide-scrollbar"
                >
                  {['applied', 'interview', 'offer', 'rejected'].map((status, columnIndex) => (
                    <Droppable key={status} droppableId={status}>
                      {(provided, snapshot) => (
                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.1 * columnIndex }}
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-shrink-0 w-[80vw] sm:w-auto bg-gray-50 dark:bg-gray-900/50 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 transition-colors duration-200 ${snapshot.isDraggingOver ? 'droppable-hover' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <h3 className="font-semibold text-gray-900 dark:text-white capitalize text-xs sm:text-sm">
                              {status}
                            </h3>
                            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              {applications.filter(a => a.status === status).length}
                            </span>
                          </div>

                          <div className="space-y-2 sm:space-y-3">
                            <AnimatePresence>
                              {applications
                                .filter(app => app.status === status)
                                .map((app, index) => (
                                  <Draggable key={app.id} draggableId={app.id} index={index}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={snapshot.isDragging ? 'dragging-card' : ''}
                                        style={{
                                          ...provided.draggableProps.style,
                                          // On conserve tous les styles fournis par react-beautiful-dnd pendant le drag
                                          zIndex: snapshot.isDragging ? 9999 : 'auto',
                                        }}
                                      >
                                        <div
                                          className={`bg-white dark:bg-gray-800 rounded-lg p-2 sm:p-3 lg:p-4 border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200 ${snapshot.isDragging ? 'ring-2 ring-purple-500 ring-opacity-50 dragging' : 'hover:shadow-md'}`}
                                        >
                                          {/* Add onClick to show timeline */}
                                          <div 
                                            onClick={() => {
                                              if (!snapshot.isDragging) {
                                                setSelectedApplication(app);
                                                setTimelineModal(true);
                                              }
                                            }}
                                            className="cursor-pointer"
                                          >
                                            {/* Contenu de la carte */}
                                            <div className="flex justify-between items-start mb-2">
                                              <div>
                                                <h4 className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                                                  {app.companyName}
                                                </h4>
                                                <p className="text-purple-600 dark:text-purple-400 text-xs">
                                                  {app.position}
                                                </p>
                                              </div>
                                              <div className="flex gap-1 sm:gap-2">
                                                <motion.button
                                                  whileHover={{ scale: 1.1 }}
                                                  whileTap={{ scale: 0.9 }}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFormData(app);
                                                    setEditModal({ show: true, application: app });
                                                  }}
                                                  className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                                >
                                                  <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500" />
                                                </motion.button>
                                                <motion.button
                                                  whileHover={{ scale: 1.1 }}
                                                  whileTap={{ scale: 0.9 }}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteModal({ show: true, application: app });
                                                  }}
                                                  className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                                >
                                                  <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500" />
                                                </motion.button>
                                              </div>
                                            </div>

                                            {/* Indicateurs d'entretien avec petite animation sur hover */}
                                            {app.interviews && app.interviews.length > 0 && (
                                              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                  {app.interviews.slice(0, 3).map((interview, i) => (
                                                    <motion.div
                                                      key={interview.id}
                                                      className="relative group"
                                                      whileHover={{ y: -2 }}
                                                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                                    >
                                                      <div
                                                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium border ${
                                                          interview.status === 'completed'
                                                            ? 'bg-green-100 border-green-500 text-green-700'
                                                            : interview.status === 'cancelled'
                                                            ? 'bg-red-100 border-red-500 text-red-700'
                                                            : 'bg-purple-100 border-purple-500 text-purple-700'
                                                        }`}
                                                      >
                                                        {interview.type.charAt(0).toUpperCase()}
                                                      </div>
                                                      {/* Tooltip avec animation */}
                                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-[10px] rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-lg">
                                                        {interview.type} - {interview.date}
                                                      </div>
                                                    </motion.div>
                                                  ))}
                                                  {app.interviews.length > 3 && (
                                                    <motion.div 
                                                      whileHover={{ scale: 1.1 }}
                                                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-500 flex items-center justify-center text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-300"
                                                    >
                                                      +{app.interviews.length - 3}
                                                    </motion.div>
                                                  )}
                                                </div>
                                              </div>
                                            )}

                                            {/* Informations supplémentaires */}
                                            <div className="mt-2 space-y-1">
                                              <div className="flex items-center text-[10px] sm:text-xs text-gray-500">
                                                <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
                                                {app.location}
                                              </div>
                                              <div className="flex items-center text-[10px] sm:text-xs text-gray-500">
                                                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
                                                Applied: {app.appliedDate}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                            </AnimatePresence>
                            {provided.placeholder}
                          </div>
                        </motion.div>
                      )}
                    </Droppable>
                  ))}
                </motion.div>
              </DragDropContext>
            </motion.div>
          ) : (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Analytics Dashboard */}
              {applications.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                  <LineChart className="mx-auto w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No data to analyze yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Start tracking your job applications to see analytics
                  </p>
                  <button
                    onClick={() => setNewApplicationModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Your First Application</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Top row - Response rate metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { 
                        label: 'Response Rate', 
                        value: `${getResponseRateData().responseRate.toFixed(0)}%`,
                        desc: 'Applications that received any response',
                        icon: <MessageSquare className="text-purple-500" />,
                        trend: '+5% vs last month'
                      },
                      { 
                        label: 'Interview Rate', 
                        value: `${getResponseRateData().interviewRate.toFixed(0)}%`,
                        desc: 'Applications that led to interviews',
                        icon: <Users className="text-blue-500" />,
                        trend: '+2% vs last month'
                      },
                      { 
                        label: 'Offer Rate', 
                        value: `${getResponseRateData().offerRate.toFixed(0)}%`,
                        desc: 'Applications that resulted in offers',
                        icon: <Check className="text-green-500" />,
                        trend: getResponseRateData().offerRate > 0 ? '+3% vs last month' : 'No change'
                      }
                    ].map((metric, i) => (
                      <motion.div 
                        key={metric.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 * i }}
                        className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</p>
                            <h3 className="text-2xl font-bold mt-1">{metric.value}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{metric.desc}</p>
                          </div>
                          <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                            {metric.icon}
                          </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs">
                          <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                          <span className="text-green-500">{metric.trend}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Middle row - Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Monthly Applications Chart */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 }}
                      className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">Applications Over Time</h3>
                        <div className="text-xs text-gray-500">Last 6 months</div>
                      </div>
                      
                      <div className="h-60 flex items-end justify-between px-2">
                        {getMonthlyApplicationData().map(([month, data], i) => {
                          const total = data.applied + data.interviews + data.offers + data.rejected;
                          const maxHeight = 200; // max height in pixels
                          
                          return (
                            <div key={month} className="flex flex-col items-center gap-2 w-1/6">
                              {/* Stacked bars */}
                              <div className="relative w-12 flex flex-col-reverse items-center">
                                {[
                                  { type: 'rejected', count: data.rejected, color: 'bg-red-500' },
                                  { type: 'offers', count: data.offers, color: 'bg-green-500' },
                                  { type: 'interviews', count: data.interviews, color: 'bg-purple-500' },
                                  { type: 'applied', count: data.applied, color: 'bg-blue-500' }
                                ].map((segment, j) => {
                                  const height = total > 0 ? (segment.count / total) * maxHeight : 0;
                                  
                                  return (
                                    <motion.div
                                      key={segment.type}
                                      initial={{ height: 0 }}
                                      animate={{ height: Math.max(height, segment.count > 0 ? 4 : 0) }}
                                      transition={{ duration: 0.5, delay: 0.1 * j + 0.1 * i }}
                                      className={`w-8 ${segment.color} rounded-sm`}
                                      style={{ marginBottom: segment.count > 0 ? 1 : 0 }}
                                    />
                                  );
                                })}
                              </div>
                              
                              {/* Month label */}
                              <div className="text-xs text-gray-500">
                                {new Date(month).toLocaleDateString(undefined, { month: 'short' })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Legend */}
                      <div className="flex justify-center mt-4 gap-4 text-xs">
                        {[
                          { label: 'Applied', color: 'bg-blue-500' },
                          { label: 'Interviews', color: 'bg-purple-500' },
                          { label: 'Offers', color: 'bg-green-500' },
                          { label: 'Rejected', color: 'bg-red-500' }
                        ].map(item => (
                          <div key={item.label} className="flex items-center gap-1">
                            <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                            <span>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                    
                    {/* Application Sources */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.4 }}
                      className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">Application Sources</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {/* Placeholder for Pie Chart - In a real app you would use a chart library */}
                        <div className="flex items-center justify-center">
                          <div className="relative w-32 h-32">
                            <PieChart className="w-32 h-32 text-gray-200 dark:text-gray-700" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-lg font-medium">{applications.length}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Legend / List */}
                        <div className="flex flex-col justify-center space-y-2">
                          {getApplicationSourceData().map((source, i) => (
                            <motion.div 
                              key={source.source}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.1 * i }}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full bg-${
                                  ['blue', 'purple', 'green', 'yellow', 'pink'][i % 5]
                                }-500`}></div>
                                <span className="text-sm">{source.source}</span>
                              </div>
                              <span className="text-sm font-medium">{source.count}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* Bottom row - Time metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      {
                        label: 'Avg. Days to Interview',
                        value: getAverageTimeData().avgDaysToInterview,
                        icon: <Calendar className="text-blue-500" />
                      },
                      {
                        label: 'Avg. Days to Offer',
                        value: getAverageTimeData().avgDaysToOffer,
                        icon: <Activity className="text-green-500" />
                      }
                    ].map((metric, i) => (
                      <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.6 + 0.1 * i }}
                        className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                            {metric.icon}
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</p>
                            <div className="flex items-baseline gap-1">
                              <h3 className="text-xl font-bold">{metric.value}</h3>
                              <span className="text-sm">days</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Existing modals */}
        {newApplicationModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">New Application</h2>
                <button onClick={() => setNewApplicationModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Company Name *</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Position *</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Location *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Applied Date *</label>
                  <input
                    type="date"
                    value={formData.appliedDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, appliedDate: e.target.value }))}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Job URL</label>
                  <input
                    type="url"
                    value={formData.url || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => setNewApplicationModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateApplication}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:opacity-90"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal d'édition */}
        {editModal.show && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
              {/* Header fixe */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Edit Application</h2>
                  <button onClick={() => setEditModal({ show: false })} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Contenu scrollable */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Champs principaux */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Company Name *</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Position *</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Location *</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Applied Date *</label>
                    <input
                      type="date"
                      value={formData.appliedDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, appliedDate: e.target.value }))}
                      className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Job URL</label>
                    <input
                      type="url"
                      value={formData.url || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                      className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                      value={formData.notes || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Section des entretiens avec son propre scroll si nécessaire */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 py-2">
                    <label className="block text-sm font-medium">Interviews</label>
                    <button
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          interviews: [...(prev.interviews || []), {
                            id: crypto.randomUUID(),
                            date: new Date().toISOString().split('T')[0],
                            time: '09:00',
                            type: 'technical',
                            status: 'scheduled'
                          }]
                        }));
                      }}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5 mr-1" />
                      Add Interview
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[40vh] overflow-y-auto rounded-lg">
                    {formData.interviews?.map((interview, index) => (
                      <div 
                        key={interview.id} 
                        className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800"
                      >
                        {/* Header de l'entretien */}
                        <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800/50">
                          <div className="flex items-center gap-2 flex-1">
                            <select
                              value={interview.type}
                              onChange={(e) => {
                                const newInterviews = [...(formData.interviews || [])];
                                newInterviews[index] = {
                                  ...interview,
                                  type: e.target.value as 'technical' | 'hr' | 'manager' | 'final' | 'other'
                                };
                                setFormData(prev => ({ ...prev, interviews: newInterviews }));
                              }}
                              className="text-xs p-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 w-24"
                            >
                              <option value="technical">Technical</option>
                              <option value="hr">HR</option>
                              <option value="manager">Manager</option>
                              <option value="final">Final</option>
                              <option value="other">Other</option>
                            </select>
                            <select
                              value={interview.status}
                              onChange={(e) => {
                                const newInterviews = [...(formData.interviews || [])];
                                newInterviews[index] = {
                                  ...interview,
                                  status: e.target.value as 'scheduled' | 'completed' | 'cancelled'
                                };
                                setFormData(prev => ({ ...prev, interviews: newInterviews }));
                              }}
                              className={`text-xs p-1 rounded border ${
                                interview.status === 'completed' 
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' 
                                  : interview.status === 'cancelled'
                                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                                  : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400'
                              } w-24`}
                            >
                              <option value="scheduled">Scheduled</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                          <button
                            onClick={() => {
                              const newInterviews = formData.interviews?.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, interviews: newInterviews }));
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                          >
                            <X className="w-3.5 h-3.5 text-gray-500" />
                          </button>
                        </div>

                        {/* Corps de l'entretien */}
                        <div className="p-2">
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <input
                                type="date"
                                value={interview.date}
                                onChange={(e) => {
                                  const newInterviews = [...(formData.interviews || [])];
                                  newInterviews[index] = { ...interview, date: e.target.value };
                                  setFormData(prev => ({ ...prev, interviews: newInterviews }));
                                }}
                                className="flex-1 text-xs p-1 rounded border border-gray-200 dark:border-gray-700"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              <input
                                type="time"
                                value={interview.time}
                                onChange={(e) => {
                                  const newInterviews = [...(formData.interviews || [])];
                                  newInterviews[index] = { ...interview, time: e.target.value };
                                  setFormData(prev => ({ ...prev, interviews: newInterviews }));
                                }}
                                className="flex-1 text-xs p-1 rounded border border-gray-200 dark:border-gray-700"
                              />
                            </div>
                          </div>

                          <div className="mb-2">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Location (e.g. Office, Zoom link, etc.)"
                                value={interview.location || ''}
                                onChange={(e) => {
                                  const newInterviews = [...(formData.interviews || [])];
                                  newInterviews[index] = { ...interview, location: e.target.value };
                                  setFormData(prev => ({ ...prev, interviews: newInterviews }));
                                }}
                                className="flex-1 text-xs p-1 rounded border border-gray-200 dark:border-gray-700"
                              />
                            </div>
                          </div>

                          <div className="flex items-start gap-1">
                            <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-1" />
                            <textarea
                              placeholder="Notes & Feedback..."
                              value={interview.notes || ''}
                              onChange={(e) => {
                                const newInterviews = [...(formData.interviews || [])];
                                newInterviews[index] = { ...interview, notes: e.target.value };
                                setFormData(prev => ({ ...prev, interviews: newInterviews }));
                              }}
                              className="flex-1 text-xs p-1.5 rounded border border-gray-200 dark:border-gray-700 min-h-[60px] resize-y"
                            />
                          </div>

                          {interview.status === 'scheduled' && (
                            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  downloadICS(interview, formData.companyName || '', formData.position || '');
                                }}
                                className="w-full flex items-center justify-center gap-1 text-xs text-purple-600 dark:text-purple-400 py-1 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded"
                              >
                                <Download className="w-3 h-3" />
                                Add to Calendar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer fixe avec les boutons */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditModal({ show: false })}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateApplication}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:opacity-90"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de suppression */}
        {deleteModal.show && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Delete Application</h2>
                <button onClick={() => setDeleteModal({ show: false })} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this application? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteModal({ show: false })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteApplication}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add the timeline modal at the end of the component */}
        {timelineModal && selectedApplication && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Application Timeline</h2>
                <button onClick={() => setTimelineModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <h3 className="font-medium text-purple-600">{selectedApplication.companyName}</h3>
                <p className="text-sm text-gray-600">{selectedApplication.position}</p>
              </div>
              
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-purple-200 dark:bg-purple-900/30"></div>
                
                {/* Status history items */}
                <div className="space-y-4">
                  {(selectedApplication.statusHistory || [{
                    status: selectedApplication.status,
                    date: selectedApplication.appliedDate,
                    notes: 'Initial application'
                  }]).map((statusChange, index) => (
                    <div key={index} className="ml-10 relative">
                      {/* Timeline dot */}
                      <div className={`absolute -left-6 w-6 h-6 rounded-full border-2 flex items-center justify-center
                        ${statusChange.status === 'applied' ? 'bg-blue-100 border-blue-500 text-blue-700' :
                          statusChange.status === 'interview' ? 'bg-purple-100 border-purple-500 text-purple-700' :
                          statusChange.status === 'offer' ? 'bg-green-100 border-green-500 text-green-700' :
                          'bg-red-100 border-red-500 text-red-700'}`}>
                        {statusChange.status === 'applied' ? <Briefcase className="w-3 h-3" /> :
                         statusChange.status === 'interview' ? <Users className="w-3 h-3" /> :
                         statusChange.status === 'offer' ? <Check className="w-3 h-3" /> :
                         <X className="w-3 h-3" />}
                      </div>
                      
                      {/* Timeline content */}
                      <div className="bg-gray-50 dark:bg-gray-900/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-medium capitalize">{statusChange.status}</h4>
                          <span className="text-xs text-gray-500">{statusChange.date}</span>
                        </div>
                        {statusChange.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-2">{statusChange.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Add note button */}
              {selectedApplication.interviews && selectedApplication.interviews.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium mb-2">Interviews</h3>
                  <div className="space-y-3">
                    {selectedApplication.interviews.map((interview, idx) => (
                      <div key={idx} className="bg-gray-50 dark:bg-gray-900/30 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full 
                              ${interview.status === 'completed' ? 'bg-green-500' : 
                                interview.status === 'cancelled' ? 'bg-red-500' : 'bg-purple-500'}`}>
                            </div>
                            <span className="capitalize font-medium">{interview.type} Interview</span>
                          </div>
                          <span className="text-xs text-gray-500">{interview.date} {interview.time}</span>
                        </div>
                        
                        {interview.location && (
                          <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                            <MapPin className="w-3 h-3" />
                            <span>{interview.location}</span>
                          </div>
                        )}
                        
                        {interview.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-2">{interview.notes}</p>
                        )}
                        
                        {interview.status === 'scheduled' && (
                          <button
                            onClick={() => downloadICS(interview, selectedApplication.companyName, selectedApplication.position)}
                            className="w-full flex items-center justify-center gap-1 text-xs text-purple-600 dark:text-purple-400 py-1 mt-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800"
                          >
                            <Download className="w-3 h-3" />
                            Add to Calendar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Style for hiding scrollbar */}
        <style>{`
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </AuthLayout>
  );
} 