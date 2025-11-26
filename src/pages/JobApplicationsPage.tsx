import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { collection, query, onSnapshot, doc, updateDoc, orderBy, addDoc, deleteDoc, serverTimestamp, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  Activity,
  Calendar,
  Calendar as CalIcon,
  Check,
  CheckCircle,
  Clock,
  Code,
  Download,
  Edit2,
  ExternalLink,
  FileIcon,
  FileText,
  LineChart,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  PieChart,
  Plus,
  PlusCircle,
  Search,
  Trash2,
  TrendingUp,
  User,
  Users,
  X,
  Sparkles,
  Loader2,
  Link,
  Info,
  Briefcase,
  Building,
  Filter,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import AuthLayout from '../components/AuthLayout';
import PageHeader from '../components/PageHeader';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { extractJobInfo, DetailedJobInfo } from '../lib/jobExtractor';
import DatePicker from '../components/ui/DatePicker';
import { JobApplication, Interview, StatusChange } from '../types/job';
import { ApplicationList } from '../components/application/ApplicationList';
import { JobDetailPanel } from '../components/job-detail-panel';

export default function JobApplicationsPage() {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editModal, setEditModal] = useState<{ show: boolean; application?: JobApplication }>({ show: false });
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; application?: JobApplication }>({ show: false });
  const [newApplicationModal, setNewApplicationModal] = useState(false);
  const [eventType, setEventType] = useState<'application' | 'interview' | null>(null);
  const [formData, setFormData] = useState<Partial<JobApplication> & {
    interviewType?: 'technical' | 'hr' | 'manager' | 'final' | 'other';
    interviewTime?: string;
    interviewDate?: string;
  }>({
    companyName: '',
    position: '',
    location: '',
    status: 'applied',
    appliedDate: new Date().toISOString().split('T')[0],
    description: '',
    fullJobDescription: '',
    notes: '',
    interviewType: 'technical',
    interviewTime: '09:00',
    interviewDate: new Date().toISOString().split('T')[0],
  });
  const [lookupApplications, setLookupApplications] = useState<JobApplication[]>([]);
  const [lookupSearchQuery, setLookupSearchQuery] = useState('');
  const [lookupSelectedApplication, setLookupSelectedApplication] = useState<JobApplication | null>(null);
  const [showLookupDropdown, setShowLookupDropdown] = useState(false);
  const [linkedApplicationId, setLinkedApplicationId] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [timelineModal, setTimelineModal] = useState(false);
  const [view, setView] = useState<'kanban' | 'analytics'>('kanban');
  const [isAnalyzingJob, setIsAnalyzingJob] = useState(false);
  const [showAddInterviewForm, setShowAddInterviewForm] = useState(false);
  const [newInterview, setNewInterview] = useState<Partial<Interview>>({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    type: 'technical',
    status: 'scheduled',
    location: '',
    notes: ''
  });

  // Filter states
  // Temporal filters
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d' | '3m' | '6m' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState<{ start: string, end: string } | null>(null);
  const [updateDateFilter, setUpdateDateFilter] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const [upcomingInterviewsDays, setUpcomingInterviewsDays] = useState<number | null>(null);

  // Interview filters
  const [interviewTypes, setInterviewTypes] = useState<string[]>([]);
  const [interviewStatus, setInterviewStatus] = useState<string[]>([]);
  const [hasInterviews, setHasInterviews] = useState<'all' | 'with' | 'without' | 'upcoming'>('all');

  // Sorting
  const [sortBy, setSortBy] = useState<'appliedDate' | 'updatedAt' | 'companyName' | 'position' | 'interviewCount'>('appliedDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Company filters
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [companySearchQuery, setCompanySearchQuery] = useState('');

  // Filter UI state
  const [openFilterModal, setOpenFilterModal] = useState<string | null>(null);

  // New Application Form State
  const [showFullForm, setShowFullForm] = useState(false);

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

  // Charger les candidatures existantes quand on sélectionne "interview" dans le modal
  useEffect(() => {
    if (eventType === 'interview' && currentUser) {
      const fetchApplications = async () => {
        try {
          const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
          const applicationsSnapshot = await getDocs(query(applicationsRef));
          const apps: JobApplication[] = [];
          applicationsSnapshot.forEach((doc) => {
            apps.push({ id: doc.id, ...doc.data() } as JobApplication);
          });
          setLookupApplications(apps);
        } catch (error) {
          console.error('Error fetching applications:', error);
        }
      };
      fetchApplications();
    }
  }, [eventType, currentUser]);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.application-search-container')) {
        setShowLookupDropdown(false);
      }
    };

    if (showLookupDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showLookupDropdown]);

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

    const newStatus = destination.droppableId as 'wishlist' | 'applied' | 'interview' | 'offer' | 'rejected' | 'pending_decision' | 'archived';

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

  // Fonction pour extraire les informations depuis l'URL avec AI
  const handleExtractJobInfo = async () => {
    if (!formData.url || !formData.url.trim()) {
      toast.error('Please enter a job URL first');
      return;
    }

    setIsAnalyzingJob(true);
    toast.info('Analyzing job posting...', { duration: 2000 });

    try {
      const jobUrl = formData.url.trim();

      // Use shared extraction utility with detailed mode
      const extractedData = await extractJobInfo(jobUrl, { detailed: true }) as DetailedJobInfo;

      console.log('Successfully extracted data:', extractedData);

      // Format the summary for description - structured format with 3 bullet points
      let formattedDescription = extractedData.summary;
      if (formattedDescription) {
        // Ensure proper formatting (unescape JSON escapes)
        formattedDescription = formattedDescription
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .trim();

        // Ensure bullets are properly formatted (• or -)
        if (!formattedDescription.includes('•') && !formattedDescription.includes('-')) {
          const lines = formattedDescription.split('\n').filter((line: string) => line.trim().length > 0);
          if (lines.length > 0) {
            formattedDescription = lines.map((line: string) => {
              const trimmed = line.trim();
              if (!trimmed.startsWith('•') && !trimmed.startsWith('-')) {
                return `• ${trimmed}`;
              }
              return trimmed;
            }).join('\n');
          }
        }

        // Add visual separation if description already exists
        if (formData.description && formData.description.trim()) {
          formattedDescription = `${formData.description}\n\n---\n\n${formattedDescription}`;
        }
      }

      // Update form with extracted data
      setFormData(prev => ({
        ...prev,
        companyName: extractedData.companyName || prev.companyName,
        position: extractedData.position || prev.position,
        location: extractedData.location || prev.location,
        description: formattedDescription || prev.description || '',
        fullJobDescription: extractedData.fullJobDescription || prev.fullJobDescription || '',
        jobInsights: extractedData.jobInsights || prev.jobInsights
      }));

      setShowFullForm(true);
      toast.success('Job information extracted successfully!');
    } catch (error) {
      console.error('Error extracting job info:', error);
      toast.error(`Failed to extract job information: ${error instanceof Error ? error.message : 'Unknown error'}. Please fill in the fields manually.`);
    } finally {
      setIsAnalyzingJob(false);
    }
  };

  const handleCreateApplication = async () => {
    if (!currentUser) {
      toast.error('You must be logged in');
      return;
    }

    if (!eventType) {
      toast.error('Please select an event type first');
      return;
    }

    try {
      if (eventType === 'application') {
        // Formatage des données avant envoi
        const newApplication = {
          companyName: formData.companyName,
          position: formData.position,
          location: formData.location,
          status: formData.status || 'applied',
          appliedDate: formData.appliedDate,
          url: formData.url || '',
          description: formData.description || '',  // AI-powered summary (3 bullet points)
          fullJobDescription: formData.fullJobDescription || '',  // Complete job description from posting
          notes: formData.notes || '',              // User's personal notes
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          // Ajout de valeurs par défaut pour les champs optionnels
          contactName: formData.contactName || '',
          contactEmail: formData.contactEmail || '',
          contactPhone: formData.contactPhone || '',
          salary: formData.salary || '',
          // Initialize arrays for new features
          generatedEmails: [],
          stickyNotes: [],
          // Initialize jobInsights if extracted by AI
          ...(formData.jobInsights && { jobInsights: formData.jobInsights })
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
        setEventType(null);
        setLookupSelectedApplication(null);
        setLinkedApplicationId(null);
        setLookupSearchQuery('');
        setShowLookupDropdown(false);
        setFormData({
          companyName: '',
          position: '',
          location: '',
          status: 'applied',
          appliedDate: new Date().toISOString().split('T')[0],
          url: '',
          description: '',
          fullJobDescription: '',
          notes: '',
          interviewType: 'technical',
          interviewTime: '09:00',
          interviewDate: new Date().toISOString().split('T')[0],
        });

        toast.success('Application created successfully');
      } else {
        // Pour un entretien, vérifier si une candidature existe déjà
        let existingApplication: any = null;
        let applicationId: string;

        // Si un ID de candidature est fourni (lié depuis le modal), l'utiliser directement
        if (linkedApplicationId) {
          applicationId = linkedApplicationId;
          const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
          const applicationDoc = await getDoc(applicationRef);
          if (applicationDoc.exists()) {
            existingApplication = { id: applicationDoc.id, ...applicationDoc.data() };
          }
        } else {
          // Sinon, chercher par nom d'entreprise et poste
          const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
          const applicationsSnapshot = await getDocs(query(applicationsRef));

          applicationsSnapshot.forEach(doc => {
            const app = doc.data() as any;
            if (
              app.companyName?.toLowerCase() === formData.companyName?.toLowerCase() &&
              app.position?.toLowerCase() === formData.position?.toLowerCase()
            ) {
              existingApplication = { id: doc.id, ...app };
            }
          });

          if (existingApplication) {
            applicationId = existingApplication.id;
          } else {
            // Créer une nouvelle candidature
            const applicationData = {
              companyName: formData.companyName,
              position: formData.position,
              location: formData.location || '',
              status: 'interview',
              appliedDate: formData.interviewDate || new Date().toISOString().split('T')[0],
              notes: formData.notes || '',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              statusHistory: [{
                status: 'applied',
                date: formData.interviewDate || new Date().toISOString().split('T')[0],
                notes: 'Application created from job applications page'
              }, {
                status: 'interview',
                date: formData.interviewDate || new Date().toISOString().split('T')[0],
                notes: 'Interview scheduled from job applications page'
              }]
            };

            const docRef = await addDoc(
              collection(db, 'users', currentUser.uid, 'jobApplications'),
              applicationData
            );

            applicationId = docRef.id;
          }
        }

        // Vérification des champs requis pour l'interview
        if (!formData.companyName || !formData.position || !formData.interviewDate) {
          toast.error('Please fill in all required fields');
          return;
        }

        // Ajouter l'entretien
        const interviewData = {
          id: crypto.randomUUID(),
          date: formData.interviewDate,
          time: formData.interviewTime || '09:00',
          type: formData.interviewType || 'technical',
          status: 'scheduled',
          location: formData.location || '',
          notes: formData.notes || '',
          contactName: formData.contactName || '',
          contactEmail: formData.contactEmail || ''
        };

        // Mise à jour de la candidature avec le nouvel entretien
        const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
        await updateDoc(applicationRef, {
          interviews: existingApplication?.interviews ? [...existingApplication.interviews, interviewData] : [interviewData],
          status: 'interview',
          updatedAt: serverTimestamp(),
          statusHistory: existingApplication?.statusHistory ?
            [...existingApplication.statusHistory, {
              status: 'interview',
              date: formData.interviewDate,
              notes: 'Interview added from job applications page'
            }] :
            [{
              status: 'applied',
              date: formData.interviewDate || new Date().toISOString().split('T')[0],
              notes: 'Application created from job applications page'
            }, {
              status: 'interview',
              date: formData.interviewDate,
              notes: 'Interview scheduled from job applications page'
            }]
        });

        // Si la création réussit, on ferme le modal et réinitialise le formulaire
        setNewApplicationModal(false);
        setEventType(null);
        setLookupSelectedApplication(null);
        setLinkedApplicationId(null);
        setLookupSearchQuery('');
        setShowLookupDropdown(false);
        setFormData({
          companyName: '',
          position: '',
          location: '',
          status: 'applied',
          appliedDate: new Date().toISOString().split('T')[0],
          url: '',
          description: '',
          fullJobDescription: '',
          notes: '',
          interviewType: 'technical',
          interviewTime: '09:00',
          interviewDate: new Date().toISOString().split('T')[0],
        });

        toast.success('Interview added successfully');
      }
    } catch (error) {
      console.error('Error creating application/interview:', error);
      toast.error('Failed to create: ' + (error instanceof Error ? error.message : 'Unknown error'));
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

      // Optimistically update the UI first
      setApplications(prevApplications =>
        prevApplications.filter(app => app.id !== deleteModal.application?.id)
      );

      // Then delete from Firestore
      await deleteDoc(applicationRef);

      // Close the modal
      setDeleteModal({ show: false });

      // Show success toast
      toast.success('Application deleted successfully');

      // Close timeline modal if it's open for the deleted application
      if (timelineModal && selectedApplication?.id === deleteModal.application.id) {
        setTimelineModal(false);
        setSelectedApplication(null);
      }
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Failed to delete application');

      // If there was an error, revert the optimistic update
      // by refreshing the applications from Firestore
      const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
      const q = query(applicationsRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const applicationsData: JobApplication[] = [];
        snapshot.forEach((doc) => {
          applicationsData.push({ id: doc.id, ...doc.data() } as JobApplication);
        });
        setApplications(applicationsData);
      });

      // Cleanup the temporary listener
      setTimeout(() => unsubscribe(), 2000);
    }
  };

  // Fonction pour ajouter un interview directement depuis la modal Timeline
  const handleAddInterview = async () => {
    if (!currentUser || !selectedApplication) return;

    try {
      // Valider les champs requis
      if (!newInterview.date || !newInterview.time) {
        toast.error('Please fill in date and time');
        return;
      }

      // Créer le nouvel interview
      const interview: Interview = {
        id: crypto.randomUUID(),
        date: newInterview.date!,
        time: newInterview.time!,
        type: newInterview.type || 'technical',
        status: newInterview.status || 'scheduled',
        location: newInterview.location || '',
        notes: newInterview.notes || ''
      };

      // Mettre à jour l'application avec le nouvel interview
      const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', selectedApplication.id);
      const updatedInterviews = [...(selectedApplication.interviews || []), interview];

      // Mettre à jour le statut si nécessaire
      let updatedStatus = selectedApplication.status;
      if (selectedApplication.status === 'applied' && interview.status === 'scheduled') {
        updatedStatus = 'interview';

        // Ajouter une entrée dans l'historique de statut
        const statusHistory = selectedApplication.statusHistory || [{
          status: selectedApplication.status,
          date: selectedApplication.appliedDate,
          notes: 'Initial application'
        }];
        statusHistory.push({
          status: 'interview',
          date: new Date().toISOString().split('T')[0],
          notes: 'Interview scheduled'
        });

        await updateDoc(applicationRef, {
          interviews: updatedInterviews,
          status: updatedStatus,
          statusHistory,
          updatedAt: serverTimestamp()
        });
      } else {
        await updateDoc(applicationRef, {
          interviews: updatedInterviews,
          updatedAt: serverTimestamp()
        });
      }

      // Mettre à jour l'état local
      const updatedApplication = {
        ...selectedApplication,
        interviews: updatedInterviews,
        status: updatedStatus
      };
      setSelectedApplication(updatedApplication);

      // Mettre à jour la liste des applications
      setApplications(prev => prev.map(app =>
        app.id === selectedApplication.id ? updatedApplication : app
      ));

      // Réinitialiser le formulaire
      setNewInterview({
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        type: 'technical',
        status: 'scheduled',
        location: '',
        notes: ''
      });
      setShowAddInterviewForm(false);

      toast.success('Interview added successfully!');
    } catch (error) {
      console.error('Error adding interview:', error);
      toast.error('Failed to add interview');
    }
  };

  // Get unique companies for company filter
  const uniqueCompanies = Array.from(new Set(applications.map(app => app.companyName))).sort();

  // Main filter function that combines all filters
  const applyFilters = (apps: JobApplication[]): JobApplication[] => {
    let filtered = [...apps];

    // Text search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(app =>
        app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.position.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Company filter
    if (selectedCompanies.length > 0) {
      filtered = filtered.filter(app => selectedCompanies.includes(app.companyName));
    }

    // Date filter (applied date)
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case '7d':
          filterDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          filterDate.setDate(now.getDate() - 30);
          break;
        case '3m':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case '6m':
          filterDate.setMonth(now.getMonth() - 6);
          break;
        case 'custom':
          if (customDateRange) {
            filtered = filtered.filter(app => {
              const appDate = new Date(app.appliedDate);
              const startDate = new Date(customDateRange.start);
              const endDate = new Date(customDateRange.end);
              return appDate >= startDate && appDate <= endDate;
            });
            break;
          }
          break;
      }

      if (dateFilter !== 'custom' || !customDateRange) {
        filtered = filtered.filter(app => {
          const appDate = new Date(app.appliedDate);
          return appDate >= filterDate;
        });
      }
    }

    // Update date filter
    if (updateDateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (updateDateFilter) {
        case '24h':
          filterDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          filterDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          filterDate.setDate(now.getDate() - 30);
          break;
      }

      filtered = filtered.filter(app => {
        const updatedAt = app.updatedAt ? new Date(app.updatedAt) : new Date(app.createdAt);
        return updatedAt >= filterDate;
      });
    }

    // Interview filters
    if (hasInterviews !== 'all') {
      if (hasInterviews === 'with') {
        filtered = filtered.filter(app => app.interviews && app.interviews.length > 0);
      } else if (hasInterviews === 'without') {
        filtered = filtered.filter(app => !app.interviews || app.interviews.length === 0);
      } else if (hasInterviews === 'upcoming') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filtered = filtered.filter(app => {
          if (!app.interviews || app.interviews.length === 0) return false;
          return app.interviews.some(interview => {
            const interviewDate = new Date(interview.date);
            interviewDate.setHours(0, 0, 0, 0);
            return interviewDate >= today && interview.status === 'scheduled';
          });
        });
      }
    }

    // Interview type filter
    if (interviewTypes.length > 0) {
      filtered = filtered.filter(app => {
        if (!app.interviews || app.interviews.length === 0) return false;
        return app.interviews.some(interview => interviewTypes.includes(interview.type));
      });
    }

    // Interview status filter
    if (interviewStatus.length > 0) {
      filtered = filtered.filter(app => {
        if (!app.interviews || app.interviews.length === 0) return false;
        return app.interviews.some(interview => interviewStatus.includes(interview.status));
      });
    }

    // Upcoming interviews days filter
    if (upcomingInterviewsDays !== null) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + upcomingInterviewsDays);

      filtered = filtered.filter(app => {
        if (!app.interviews || app.interviews.length === 0) return false;
        return app.interviews.some(interview => {
          const interviewDate = new Date(interview.date);
          interviewDate.setHours(0, 0, 0, 0);
          return interviewDate >= today && interviewDate <= futureDate && interview.status === 'scheduled';
        });
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'appliedDate':
          comparison = new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime();
          break;
        case 'updatedAt':
          const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime();
          const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : new Date(b.createdAt).getTime();
          comparison = aUpdated - bUpdated;
          break;
        case 'companyName':
          comparison = a.companyName.localeCompare(b.companyName);
          break;
        case 'position':
          comparison = a.position.localeCompare(b.position);
          break;
        case 'interviewCount':
          const aCount = a.interviews?.length || 0;
          const bCount = b.interviews?.length || 0;
          comparison = aCount - bCount;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  const filteredApplications = applyFilters(applications);

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (dateFilter !== 'all') count++;
    if (updateDateFilter !== 'all') count++;
    if (upcomingInterviewsDays !== null) count++;
    if (interviewTypes.length > 0) count++;
    if (interviewStatus.length > 0) count++;
    if (hasInterviews !== 'all') count++;
    if (selectedCompanies.length > 0) count++;
    if (sortBy !== 'appliedDate' || sortOrder !== 'desc') count++;
    return count;
  };

  // Clear all filters
  const clearAllFilters = () => {
    setDateFilter('all');
    setCustomDateRange(null);
    setUpdateDateFilter('all');
    setUpcomingInterviewsDays(null);
    setInterviewTypes([]);
    setInterviewStatus([]);
    setHasInterviews('all');
    setSelectedCompanies([]);
    setCompanySearchQuery('');
    setSortBy('appliedDate');
    setSortOrder('desc');
  };

  const applicationsByStatus = {
    wishlist: filteredApplications.filter(app => app.status === 'wishlist'),
    applied: filteredApplications.filter(app => app.status === 'applied'),
    interview: filteredApplications.filter(app => app.status === 'interview'),
    pending_decision: filteredApplications.filter(app => app.status === 'pending_decision'),
    offer: filteredApplications.filter(app => app.status === 'offer'),
    rejected: filteredApplications.filter(app => app.status === 'rejected'),
    archived: filteredApplications.filter(app => app.status === 'archived')
  };

  const columnOrder = ['wishlist', 'applied', 'interview', 'pending_decision', 'offer', 'rejected', 'archived'];

  // Analytics helper functions
  const getMonthlyApplicationData = () => {
    const monthData: { [key: string]: { applied: number, interviews: number, pending: number, offers: number, rejected: number } } = {};

    applications.forEach(app => {
      const date = new Date(app.appliedDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthData[monthKey]) {
        monthData[monthKey] = { applied: 0, interviews: 0, pending: 0, offers: 0, rejected: 0 };
      }

      // Count applications by current status
      if (app.status === 'applied') monthData[monthKey].applied++;
      else if (app.status === 'interview') monthData[monthKey].interviews++;
      else if (app.status === 'pending_decision') monthData[monthKey].pending++;
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

    /* Styles pour les actions de la carte */
    .card-actions {
      opacity: 0.5;
      transition: opacity 0.2s ease;
    }

    .card-container:hover .card-actions,
    .card-actions:hover {
      opacity: 1;
    }

    /* Animation hover des cartes */
    .card-container {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .card-container:hover:not(.dragging-card) {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03);
    }
  `;

  return (
    <AuthLayout>
      {/* CSS Variables pour les animations */}
      <style>{cssVariables}</style>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden flex flex-col px-4 pt-6 pb-6">
        {/* Compact Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            {/* Titre à gauche */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Applications</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Track and manage your job applications
              </p>
            </div>

            {/* Bouton Add à droite */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setEventType(null);
                setLookupSelectedApplication(null);
                setLinkedApplicationId(null);
                setLookupSearchQuery('');
                setShowLookupDropdown(false);
                setNewApplicationModal(true);
              }}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Application
            </motion.button>
          </div>

          {/* Stats en ligne horizontale + View Toggle */}
          <div className="flex items-center justify-between mb-3">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center gap-3">
              {[
                { label: 'Applied', count: applications.filter(a => a.status === 'applied').length, color: 'blue' },
                { label: 'Interview', count: applications.filter(a => a.status === 'interview').length, color: 'purple' },
                { label: 'Pending', count: applications.filter(a => a.status === 'pending_decision').length, color: 'amber' },
                { label: 'Offer', count: applications.filter(a => a.status === 'offer').length, color: 'green' },
                { label: 'Rejected', count: applications.filter(a => a.status === 'rejected').length, color: 'red' }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className={`text-lg font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
                    {stat.count}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* View Toggle intégré */}
            <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex">
              <button
                onClick={() => setView('kanban')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${view === 'kanban'
                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
                  }`}
              >
                <PieChart className="w-4 h-4" />
                <span>Kanban</span>
              </button>
              <button
                onClick={() => setView('analytics')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${view === 'analytics'
                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
                  }`}
              >
                <LineChart className="w-4 h-4" />
                <span>Analytics</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Barre de recherche et filtres - only show for kanban view */}
        {view === 'kanban' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-3 flex-shrink-0">
            {/* Search bar + Filters en une ligne */}
            <div className="flex items-center gap-3">
              {/* Search bar plus compact */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search by company or position..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>

              {/* Filters en ligne */}
              <div className="flex items-center gap-2">
                {/* Date Filter */}
                <button
                  onClick={() => setOpenFilterModal(openFilterModal === 'date' ? null : 'date')}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${dateFilter !== 'all' || customDateRange
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Date</span>
                  {dateFilter !== 'all' || customDateRange ? (
                    <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-purple-600 dark:bg-purple-500 px-1 text-xs font-semibold text-white">
                      1
                    </span>
                  ) : null}
                </button>

                {/* Interview Filter */}
                <button
                  onClick={() => setOpenFilterModal(openFilterModal === 'interview' ? null : 'interview')}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${hasInterviews !== 'all' || interviewTypes.length > 0 || interviewStatus.length > 0 || upcomingInterviewsDays !== null
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Interviews</span>
                  {hasInterviews !== 'all' || interviewTypes.length > 0 || interviewStatus.length > 0 || upcomingInterviewsDays !== null ? (
                    <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-purple-600 dark:bg-purple-500 px-1 text-xs font-semibold text-white">
                      {[hasInterviews !== 'all' ? 1 : 0, interviewTypes.length, interviewStatus.length, upcomingInterviewsDays !== null ? 1 : 0].reduce((a, b) => a + b, 0)}
                    </span>
                  ) : null}
                </button>

                {/* Company Filter */}
                <button
                  onClick={() => setOpenFilterModal(openFilterModal === 'company' ? null : 'company')}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCompanies.length > 0
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  <Building className="w-4 h-4" />
                  <span>Company</span>
                  {selectedCompanies.length > 0 ? (
                    <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-purple-600 dark:bg-purple-500 px-1 text-xs font-semibold text-white">
                      {selectedCompanies.length}
                    </span>
                  ) : null}
                </button>

                {/* Sort Filter */}
                <button
                  onClick={() => setOpenFilterModal(openFilterModal === 'sort' ? null : 'sort')}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${sortBy !== 'appliedDate' || sortOrder !== 'desc'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  <Filter className="w-4 h-4" />
                  <span>Sort</span>
                  {sortBy !== 'appliedDate' || sortOrder !== 'desc' ? (
                    <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-purple-600 dark:bg-purple-500 px-1 text-xs font-semibold text-white">
                      1
                    </span>
                  ) : null}
                </button>
              </div>

              {/* Clear filters button */}
              {getActiveFilterCount() > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Clear all</span>
                </button>
              )}

              {/* Results count */}
              <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {filteredApplications.length} {filteredApplications.length === 1 ? 'result' : 'results'}
                {getActiveFilterCount() > 0 && (
                  <span className="ml-1 text-purple-600 dark:text-purple-400">
                    ({getActiveFilterCount()} {getActiveFilterCount() === 1 ? 'filter' : 'filters'})
                  </span>
                )}
              </div>
            </div>

            {/* Active filter badges */}
            {getActiveFilterCount() > 0 && (
              <div className="flex flex-wrap gap-2">
                {dateFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    Date: {dateFilter === 'custom' && customDateRange
                      ? `${new Date(customDateRange.start).toLocaleDateString()} - ${new Date(customDateRange.end).toLocaleDateString()}`
                      : dateFilter === '7d' ? 'Last 7 days'
                        : dateFilter === '30d' ? 'Last 30 days'
                          : dateFilter === '3m' ? 'Last 3 months'
                            : dateFilter === '6m' ? 'Last 6 months'
                              : 'All'}
                    <button
                      onClick={() => {
                        setDateFilter('all');
                        setCustomDateRange(null);
                      }}
                      className="ml-1 hover:text-purple-900 dark:hover:text-purple-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedCompanies.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    Companies: {selectedCompanies.length}
                    <button
                      onClick={() => setSelectedCompanies([])}
                      className="ml-1 hover:text-purple-900 dark:hover:text-purple-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {hasInterviews !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    Interviews: {hasInterviews === 'with' ? 'With' : hasInterviews === 'without' ? 'Without' : 'Upcoming'}
                    <button
                      onClick={() => setHasInterviews('all')}
                      className="ml-1 hover:text-purple-900 dark:hover:text-purple-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {(sortBy !== 'appliedDate' || sortOrder !== 'desc') && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    Sort: {sortBy === 'appliedDate' ? 'Applied Date' : sortBy === 'updatedAt' ? 'Updated' : sortBy === 'companyName' ? 'Company' : sortBy === 'position' ? 'Position' : 'Interviews'} ({sortOrder === 'asc' ? 'Asc' : 'Desc'})
                    <button
                      onClick={() => {
                        setSortBy('appliedDate');
                        setSortOrder('desc');
                      }}
                      className="ml-1 hover:text-purple-900 dark:hover:text-purple-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
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
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Kanban Board - Optimisé pleine hauteur */}
              <DragDropContext onDragEnd={handleDragEnd}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="flex-1 overflow-x-auto min-h-0"
                >
                  <div className="flex gap-0 h-full min-w-min">
                    {['wishlist', 'applied', 'interview', 'pending_decision', 'offer', 'rejected'].map((status, columnIndex) => {
                      const statusCount = filteredApplications.filter(a => a.status === status).length;
                      const isLastColumn = columnIndex === ['wishlist', 'applied', 'interview', 'pending_decision', 'offer', 'rejected'].length - 1;

                      return (
                        <div key={status} className="flex items-stretch h-full">
                          <Droppable droppableId={status}>
                            {(provided, snapshot) => (
                              <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.1 * columnIndex }}
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`flex-1 min-w-[280px] max-w-[340px] h-full flex flex-col bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 transition-colors duration-200 ${snapshot.isDraggingOver ? 'droppable-hover' : ''}`}
                              >
                              <div className="mb-2 sm:mb-3 text-center">
                                <div className="mb-2">
                                  <h3 className="font-semibold text-gray-900 dark:text-white uppercase text-xs sm:text-sm mb-1">
                                    {status === 'pending_decision' ? 'PENDING DECISION' : status.toUpperCase()}
                                  </h3>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    {statusCount} {statusCount === 1 ? 'job' : 'jobs'}
                                  </span>
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    setEventType('application');
                                    setLookupSelectedApplication(null);
                                    setLinkedApplicationId(null);
                                    setLookupSearchQuery('');
                                    setShowLookupDropdown(false);
                                    setFormData({
                                      companyName: '',
                                      position: '',
                                      location: '',
                                      status: status as 'wishlist' | 'applied' | 'interview' | 'pending_decision' | 'offer' | 'rejected',
                                      appliedDate: new Date().toISOString().split('T')[0],
                                      url: '',
                                      description: '',
                                      fullJobDescription: '',
                                      notes: '',
                                      interviewType: 'technical',
                                      interviewTime: '09:00',
                                      interviewDate: new Date().toISOString().split('T')[0],
                                    });
                                    setNewApplicationModal(true);
                                  }}
                                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 border border-gray-200 dark:border-gray-700 shadow-sm"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span className="text-xs font-semibold">Add</span>
                                </motion.button>
                              </div>

                              <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3">
                                <ApplicationList
                                  applications={filteredApplications.filter(a => a.status === status)}
                                  onCardClick={(app) => {
                                    setSelectedApplication(app);
                                    setTimelineModal(true);
                                  }}
                                  onCardDelete={(app) => {
                                    setDeleteModal({ show: true, application: app });
                                  }}
                                />
                                {provided.placeholder}
                              </div>
                            </motion.div>
                          )}
                        </Droppable>
                        
                        {/* Séparateur vertical droit entre les colonnes */}
                        {!isLastColumn && (
                          <div className="w-px bg-gray-200 dark:bg-gray-700 mx-3 flex-shrink-0" />
                        )}
                      </div>
                      );
                    })}
                  </div>
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
                    onClick={() => {
                      setEventType(null);
                      setLookupSelectedApplication(null);
                      setLinkedApplicationId(null);
                      setLookupSearchQuery('');
                      setShowLookupDropdown(false);
                      setNewApplicationModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <PlusCircle className="h-4 w-4" />
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
                          const total = data.applied + data.interviews + data.pending + data.offers + data.rejected;
                          const maxHeight = 200; // max height in pixels

                          return (
                            <div key={month} className="flex flex-col items-center gap-2 w-1/6">
                              {/* Stacked bars */}
                              <div className="relative w-12 flex flex-col-reverse items-center">
                                {[
                                  { type: 'rejected', count: data.rejected, color: 'bg-red-500' },
                                  { type: 'offers', count: data.offers, color: 'bg-green-500' },
                                  { type: 'pending', count: data.pending, color: 'bg-amber-500' },
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
                          { label: 'Pending', color: 'bg-amber-500' },
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
                                <div className={`w-3 h-3 rounded-full bg-${['blue', 'purple', 'green', 'yellow', 'pink'][i % 5]
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

        {/* Filter Modals */}
        <AnimatePresence>
          {/* Date Filter Modal */}
          {openFilterModal === 'date' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenFilterModal(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter by Date</h3>
                  <button
                    onClick={() => setOpenFilterModal(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Applied Date</label>
                    <div className="space-y-2">
                      {['all', '7d', '30d', '3m', '6m', 'custom'].map((option) => (
                        <label key={option} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="dateFilter"
                            value={option}
                            checked={dateFilter === option}
                            onChange={(e) => {
                              setDateFilter(e.target.value as any);
                              if (option !== 'custom') {
                                setCustomDateRange(null);
                              }
                            }}
                            className="w-4 h-4 text-purple-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {option === 'all' ? 'All dates' :
                              option === '7d' ? 'Last 7 days' :
                                option === '30d' ? 'Last 30 days' :
                                  option === '3m' ? 'Last 3 months' :
                                    option === '6m' ? 'Last 6 months' :
                                      'Custom range'}
                          </span>
                        </label>
                      ))}
                    </div>
                    {dateFilter === 'custom' && (
                      <div className="mt-4 space-y-2">
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Start Date</label>
                          <input
                            type="date"
                            value={customDateRange?.start || ''}
                            onChange={(e) => setCustomDateRange(prev => ({ ...prev || { start: '', end: '' }, start: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">End Date</label>
                          <input
                            type="date"
                            value={customDateRange?.end || ''}
                            onChange={(e) => setCustomDateRange(prev => ({ ...prev || { start: '', end: '' }, end: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Last Updated</label>
                    <div className="space-y-2">
                      {['all', '24h', '7d', '30d'].map((option) => (
                        <label key={option} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="updateDateFilter"
                            value={option}
                            checked={updateDateFilter === option}
                            onChange={(e) => setUpdateDateFilter(e.target.value as any)}
                            className="w-4 h-4 text-purple-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {option === 'all' ? 'All time' :
                              option === '24h' ? 'Last 24 hours' :
                                option === '7d' ? 'Last 7 days' :
                                  'Last 30 days'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setDateFilter('all');
                      setCustomDateRange(null);
                      setUpdateDateFilter('all');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setOpenFilterModal(null)}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:opacity-90"
                  >
                    Apply
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Interview Filter Modal */}
          {openFilterModal === 'interview' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenFilterModal(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter by Interviews</h3>
                  <button
                    onClick={() => setOpenFilterModal(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Interview Presence</label>
                    <div className="space-y-2">
                      {['all', 'with', 'without', 'upcoming'].map((option) => (
                        <label key={option} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="hasInterviews"
                            value={option}
                            checked={hasInterviews === option}
                            onChange={(e) => setHasInterviews(e.target.value as any)}
                            className="w-4 h-4 text-purple-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {option === 'all' ? 'All applications' :
                              option === 'with' ? 'With interviews' :
                                option === 'without' ? 'Without interviews' :
                                  'Upcoming interviews only'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Interview Types</label>
                    <div className="space-y-2">
                      {['technical', 'hr', 'manager', 'final', 'other'].map((type) => (
                        <label key={type} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={interviewTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setInterviewTypes([...interviewTypes, type]);
                              } else {
                                setInterviewTypes(interviewTypes.filter(t => t !== type));
                              }
                            }}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Interview Status</label>
                    <div className="space-y-2">
                      {['scheduled', 'completed', 'cancelled'].map((status) => (
                        <label key={status} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={interviewStatus.includes(status)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setInterviewStatus([...interviewStatus, status]);
                              } else {
                                setInterviewStatus(interviewStatus.filter(s => s !== status));
                              }
                            }}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Upcoming Interviews</label>
                    <div className="space-y-2">
                      {[null, 7, 14, 30].map((days) => (
                        <label key={days || 'all'} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="upcomingInterviewsDays"
                            checked={upcomingInterviewsDays === days}
                            onChange={() => setUpcomingInterviewsDays(days)}
                            className="w-4 h-4 text-purple-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {days === null ? 'All upcoming' : `Within next ${days} days`}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setHasInterviews('all');
                      setInterviewTypes([]);
                      setInterviewStatus([]);
                      setUpcomingInterviewsDays(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setOpenFilterModal(null)}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:opacity-90"
                  >
                    Apply
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Company Filter Modal */}
          {openFilterModal === 'company' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenFilterModal(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] flex flex-col"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter by Company</h3>
                  <button
                    onClick={() => setOpenFilterModal(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search companies..."
                    value={companySearchQuery}
                    onChange={(e) => setCompanySearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
                  />
                </div>

                <div className="flex-1 overflow-y-auto mb-4">
                  <div className="space-y-2">
                    {uniqueCompanies
                      .filter(company => company.toLowerCase().includes(companySearchQuery.toLowerCase()))
                      .map((company) => {
                        const count = applications.filter(app => app.companyName === company).length;
                        return (
                          <label key={company} className="flex items-center justify-between gap-3 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedCompanies.includes(company)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCompanies([...selectedCompanies, company]);
                                  } else {
                                    setSelectedCompanies(selectedCompanies.filter(c => c !== company));
                                  }
                                }}
                                className="w-4 h-4 text-purple-600 rounded"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{company}</span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{count} {count === 1 ? 'application' : 'applications'}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>

                {selectedCompanies.length > 0 && (
                  <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2">Selected:</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedCompanies.map((company) => (
                        <span
                          key={company}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                        >
                          {company}
                          <button
                            onClick={() => setSelectedCompanies(selectedCompanies.filter(c => c !== company))}
                            className="hover:text-purple-900 dark:hover:text-purple-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setSelectedCompanies([]);
                      setCompanySearchQuery('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setOpenFilterModal(null)}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:opacity-90"
                  >
                    Apply
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Sort Filter Modal */}
          {openFilterModal === 'sort' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenFilterModal(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sort Applications</h3>
                  <button
                    onClick={() => setOpenFilterModal(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Sort By</label>
                    <div className="space-y-2">
                      {[
                        { value: 'appliedDate', label: 'Applied Date' },
                        { value: 'updatedAt', label: 'Last Updated' },
                        { value: 'companyName', label: 'Company Name' },
                        { value: 'position', label: 'Position' },
                        { value: 'interviewCount', label: 'Number of Interviews' }
                      ].map((option) => (
                        <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="sortBy"
                            value={option.value}
                            checked={sortBy === option.value}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="w-4 h-4 text-purple-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Order</label>
                    <div className="space-y-2">
                      {['asc', 'desc'].map((order) => (
                        <label key={order} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="sortOrder"
                            value={order}
                            checked={sortOrder === order}
                            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                            className="w-4 h-4 text-purple-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {order === 'asc' ? 'Ascending (A-Z, Oldest first)' : 'Descending (Z-A, Newest first)'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setSortBy('appliedDate');
                      setSortOrder('desc');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setOpenFilterModal(null)}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:opacity-90"
                  >
                    Apply
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Existing modals */}
        <AnimatePresence>
          {newApplicationModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setEventType(null);
                setLookupSelectedApplication(null);
                setLinkedApplicationId(null);
                setLookupSearchQuery('');
                setShowLookupDropdown(false);
                setFormData({
                  companyName: '',
                  position: '',
                  location: '',
                  status: 'applied',
                  appliedDate: new Date().toISOString().split('T')[0],
                  url: '',
                  description: '',
                  fullJobDescription: '',
                  notes: '',
                  interviewType: 'technical',
                  interviewTime: '09:00',
                  interviewDate: new Date().toISOString().split('T')[0],
                });
                setNewApplicationModal(false);
                setShowFullForm(false);
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-[#121212] w-full sm:rounded-2xl rounded-t-2xl max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/80 dark:bg-[#121212]/80 backdrop-blur-xl z-10 sticky top-0">
                  <div>
                    <h2 className="font-semibold text-xl text-gray-900 dark:text-white tracking-tight">
                      {eventType ? (eventType === 'application' ? 'New Application' : 'Schedule Interview') : 'Add to Tracker'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {eventType ? (eventType === 'application' ? 'Track a new job opportunity' : 'Add an upcoming interview') : 'Select an event type'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEventType(null);
                      setLookupSelectedApplication(null);
                      setLinkedApplicationId(null);
                      setLookupSearchQuery('');
                      setShowLookupDropdown(false);
                      setFormData({
                        companyName: '',
                        position: '',
                        location: '',
                        status: 'applied',
                        appliedDate: new Date().toISOString().split('T')[0],
                        url: '',
                        description: '',
                        notes: ''
                      });
                      setNewApplicationModal(false);
                      setShowFullForm(false);
                    }}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6">
                  <form onSubmit={(e) => { e.preventDefault(); handleCreateApplication(); }} className="space-y-6">
                    {/* Selection Cards */}
                    {!eventType && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setEventType('application');
                            setShowFullForm(false);
                          }}
                          className="group relative p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A1A1A] hover:bg-white dark:hover:bg-[#202020] hover:shadow-lg hover:border-transparent transition-all text-left"
                        >
                          <div className="flex flex-col items-start gap-4">
                            <div className="p-3.5 rounded-xl bg-white dark:bg-[#252525] shadow-sm group-hover:scale-110 transition-transform duration-300">
                              <Briefcase className="w-6 h-6 text-gray-900 dark:text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                                Job Application
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Track a new job application
                              </p>
                            </div>
                          </div>
                        </motion.button>

                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setEventType('interview');
                            setShowFullForm(true); // Interviews always show full form
                          }}
                          className="group relative p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A1A1A] hover:bg-white dark:hover:bg-[#202020] hover:shadow-lg hover:border-transparent transition-all text-left"
                        >
                          <div className="flex flex-col items-start gap-4">
                            <div className="p-3.5 rounded-xl bg-white dark:bg-[#252525] shadow-sm group-hover:scale-110 transition-transform duration-300">
                              <CalIcon className="w-6 h-6 text-gray-900 dark:text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                                Interview
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Schedule an interview
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      </div>
                    )}

                    {/* Form Content */}
                    {eventType && (
                      <>
                        {/* Switcher - Premium */}
                        <div className="relative p-1 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-inner">
                          <div className="flex items-center gap-1 relative">
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setEventType('application');
                                setLookupSelectedApplication(null);
                                setLinkedApplicationId(null);
                                setLookupSearchQuery('');
                                setShowLookupDropdown(false);
                                setShowFullForm(false);
                              }}
                              className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                                eventType === 'application'
                                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg shadow-gray-200/50 dark:shadow-black/30'
                                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                              }`}
                            >
                              {eventType === 'application' && (
                                <motion.div
                                  layoutId="activeTab"
                                  className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-lg"
                                  style={{ zIndex: -1 }}
                                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                              )}
                              <Briefcase className={`w-4 h-4 transition-colors ${
                                eventType === 'application' ? 'text-purple-600 dark:text-purple-400' : ''
                              }`} />
                              <span>Application</span>
                            </motion.button>
                            
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setEventType('interview');
                                setShowFullForm(true);
                              }}
                              className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                                eventType === 'interview'
                                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg shadow-gray-200/50 dark:shadow-black/30'
                                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                              }`}
                            >
                              {eventType === 'interview' && (
                                <motion.div
                                  layoutId="activeTab"
                                  className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-lg"
                                  style={{ zIndex: -1 }}
                                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                              )}
                              <CalIcon className={`w-4 h-4 transition-colors ${
                                eventType === 'interview' ? 'text-indigo-600 dark:text-indigo-400' : ''
                              }`} />
                              <span>Interview</span>
                            </motion.button>
                          </div>
                        </div>

                        {/* Job URL (Application only) */}
                        {eventType === 'application' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
                                Job Posting URL
                              </label>
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                AI Powered
                              </span>
                            </div>
                            <div className="relative flex items-center group">
                              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-xl opacity-30 blur-sm group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                              <div className="relative flex items-center w-full bg-white dark:bg-[#1A1A1A] rounded-xl">
                                <input
                                  type="url"
                                  value={formData.url || ''}
                                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                                  className="w-full pl-4 pr-24 py-3 bg-transparent border-0 focus:ring-0 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 transition-all"
                                  placeholder="https://linkedin.com/jobs/..."
                                  autoFocus
                                />
                                <div className="absolute right-1.5">
                                  <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleExtractJobInfo}
                                    disabled={isAnalyzingJob || !formData.url || !formData.url.trim()}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-[#252525] text-gray-900 dark:text-white text-xs font-medium shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-[#303030] disabled:opacity-50 transition-all"
                                  >
                                    {isAnalyzingJob ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Sparkles className="w-3 h-3 text-purple-500" />
                                    )}
                                    {isAnalyzingJob ? 'Analyzing...' : 'Auto-Fill'}
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Interview Link Search - Premium Design */}
                        {eventType === 'interview' && (
                          <div className="space-y-3">
                            <div className="text-center">
                              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                                Link to Application
                              </label>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Search and select an existing application
                              </p>
                            </div>
                            
                            <div className="relative">
                              <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-lg opacity-20 blur-sm group-hover:opacity-40 transition duration-300"></div>
                                <div className="relative flex items-center w-full bg-white dark:bg-[#1A1A1A] rounded-lg border border-gray-200 dark:border-gray-800">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                  type="text"
                                  value={lookupSearchQuery}
                                  onChange={(e) => {
                                    setLookupSearchQuery(e.target.value);
                                    setShowLookupDropdown(true);
                                  }}
                                  onFocus={() => setShowLookupDropdown(true)}
                                  className="w-full pl-10 pr-10 py-2.5 bg-transparent border-0 focus:ring-0 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 transition-all"
                                  placeholder="Search by company or position..."
                                />
                                {lookupSelectedApplication && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setLookupSelectedApplication(null);
                                      setLinkedApplicationId(null);
                                      setLookupSearchQuery('');
                                      setFormData(prev => ({
                                        ...prev,
                                        companyName: '',
                                        position: '',
                                        location: '',
                                      }));
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5 text-gray-500" />
                                  </button>
                                )}
                                </div>
                              </div>
                              
                              {/* Dropdown with Company Logos */}
                              <AnimatePresence>
                                {showLookupDropdown && lookupSearchQuery && !lookupSelectedApplication && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-lg shadow-2xl max-h-[140px] overflow-y-auto backdrop-blur-xl"
                                >
                                  {lookupApplications
                                    .filter(app =>
                                      app.companyName.toLowerCase().includes(lookupSearchQuery.toLowerCase()) ||
                                      app.position.toLowerCase().includes(lookupSearchQuery.toLowerCase())
                                    )
                                    .slice(0, 3)
                                    .map((app) => {
                                      // Generate color based on company name
                                      const getCompanyColor = (name: string) => {
                                        const colors = [
                                          'bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 
                                          'bg-green-500', 'bg-yellow-500', 'bg-red-500',
                                          'bg-pink-500', 'bg-teal-500', 'bg-orange-500'
                                        ];
                                        const index = name.charCodeAt(0) % colors.length;
                                        return colors[index];
                                      };
                                      
                                      return (
                                        <button
                                          key={app.id}
                                          type="button"
                                          onClick={() => {
                                            setLookupSelectedApplication(app);
                                            setLinkedApplicationId(app.id);
                                            setLookupSearchQuery(`${app.companyName} - ${app.position}`);
                                            setFormData(prev => ({
                                              ...prev,
                                              companyName: app.companyName,
                                              position: app.position,
                                              location: app.location || prev.location,
                                            }));
                                            setShowLookupDropdown(false);
                                          }}
                                          className="w-full px-3 py-1.5 text-left hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 dark:hover:from-purple-900/20 dark:hover:to-indigo-900/20 transition-all border-b border-gray-100 dark:border-gray-800 last:border-b-0 flex items-center gap-2"
                                        >
                                          {/* Company Logo/Avatar */}
                                          <div className={`flex-shrink-0 w-7 h-7 rounded-md ${getCompanyColor(app.companyName)} flex items-center justify-center shadow-sm`}>
                                            <span className="text-white font-semibold text-[11px]">
                                              {app.companyName.charAt(0).toUpperCase()}
                                            </span>
                                          </div>
                                          
                                          {/* Company Info */}
                                          <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-[11px] text-gray-900 dark:text-white truncate leading-tight">
                                              {app.companyName}
                                            </div>
                                            <div className="text-[10px] text-gray-600 dark:text-gray-400 truncate leading-tight mt-0.5">
                                              {app.position}
                                            </div>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  {lookupApplications.filter(app =>
                                    app.companyName.toLowerCase().includes(lookupSearchQuery.toLowerCase()) ||
                                    app.position.toLowerCase().includes(lookupSearchQuery.toLowerCase())
                                  ).length === 0 && (
                                    <div className="px-3 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                                      No applications found
                                    </div>
                                  )}
                                </motion.div>
                              )}
                              </AnimatePresence>
                            </div>

                            {/* Selected Application Badges */}
                            {lookupSelectedApplication && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-wrap items-center gap-2 p-3 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200/50 dark:border-purple-800/30"
                              >
                                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-md border border-purple-200 dark:border-purple-700">
                                  <Building className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                                    {lookupSelectedApplication.companyName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-md border border-indigo-200 dark:border-indigo-700">
                                  <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                                    {lookupSelectedApplication.position}
                                  </span>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        )}

                        <AnimatePresence>
                          {(eventType !== 'application' || showFullForm) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-6 overflow-hidden"
                            >
                              {/* Main Fields - Only for Applications */}
                              {eventType === 'application' && (
                                <div className="grid grid-cols-1 gap-5">
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                                      Company Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      value={formData.companyName || ''}
                                      onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] border-transparent focus:bg-white dark:focus:bg-[#1A1A1A] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                      placeholder="e.g. Google, Spotify..."
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                                      Position <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      value={formData.position || ''}
                                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] border-transparent focus:bg-white dark:focus:bg-[#1A1A1A] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                      placeholder="e.g. Senior Frontend Engineer"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                                      Location <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      value={formData.location || ''}
                                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] border-transparent focus:bg-white dark:focus:bg-[#1A1A1A] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                      placeholder="e.g. Remote, Paris..."
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Date & Time Grid */}
                              <div className={eventType === 'application' ? '' : 'grid grid-cols-2 gap-5'}>
                                {eventType === 'application' ? (
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                                      Applied Date <span className="text-red-500">*</span>
                                    </label>
                                    <DatePicker
                                      value={formData.appliedDate || ''}
                                      onChange={(value) => setFormData(prev => ({ ...prev, appliedDate: value }))}
                                      placeholder="Select date"
                                      required
                                      className="w-full"
                                      buttonClassName="!bg-gray-50 dark:!bg-[#1A1A1A] !border-transparent focus:!bg-white dark:focus:!bg-[#1A1A1A] !rounded-xl !text-sm !text-gray-900 dark:!text-white !py-3 focus:!ring-2 focus:!ring-purple-500/20 focus:!border-purple-500 !shadow-none"
                                    />
                                  </div>
                                ) : (
                                  <>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                        Interview Date <span className="text-red-500">*</span>
                                      </label>
                                      <DatePicker
                                        value={formData.interviewDate || ''}
                                        onChange={(value) => setFormData(prev => ({ ...prev, interviewDate: value }))}
                                        placeholder="Select date"
                                        required
                                        className="w-full"
                                        buttonClassName="!bg-white dark:!bg-[#1A1A1A] !border !border-gray-200 dark:!border-gray-800 hover:!border-purple-400 dark:hover:!border-purple-600 !rounded-xl !text-sm !text-gray-900 dark:!text-white !py-3.5 !px-4 focus:!ring-2 focus:!ring-purple-500/30 focus:!border-purple-500 !shadow-sm hover:!shadow-md !transition-all"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                        Interview Time
                                      </label>
                                      <div className="relative">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                          type="time"
                                          value={formData.interviewTime}
                                          onChange={(e) => setFormData(prev => ({ ...prev, interviewTime: e.target.value }))}
                                          className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 hover:border-purple-400 dark:hover:border-purple-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 shadow-sm hover:shadow-md transition-all"
                                        />
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Interview specific extras */}
                              {eventType === 'interview' && (
                                <div className="space-y-6">
                                  {/* Interview Type - Visual Cards */}
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3 text-center">
                                      Interview Type
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                      {[
                                        { value: 'technical', label: 'Technical', icon: Code },
                                        { value: 'hr', label: 'HR', icon: Users },
                                        { value: 'manager', label: 'Manager', icon: Briefcase },
                                        { value: 'final', label: 'Final', icon: CheckCircle },
                                        { value: 'other', label: 'Other', icon: MoreHorizontal },
                                      ].map((type) => {
                                        const Icon = type.icon;
                                        const isSelected = formData.interviewType === type.value;
                                        return (
                                          <motion.button
                                            key={type.value}
                                            type="button"
                                            whileHover={{ scale: 1.02, y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setFormData(prev => ({ ...prev, interviewType: type.value as any }))}
                                            className={`relative p-4 rounded-xl border-2 transition-all ${
                                              isSelected
                                                ? 'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 border-purple-500 dark:border-purple-400 shadow-lg shadow-purple-500/20'
                                                : 'bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md'
                                            }`}
                                          >
                                            <div className="flex flex-col items-center gap-2">
                                              <div className={`p-2 rounded-lg transition-colors ${
                                                isSelected
                                                  ? 'bg-purple-100 dark:bg-purple-900/50'
                                                  : 'bg-gray-100 dark:bg-gray-800'
                                              }`}>
                                                <Icon className={`w-5 h-5 ${
                                                  isSelected
                                                    ? 'text-purple-600 dark:text-purple-400'
                                                    : 'text-gray-600 dark:text-gray-400'
                                                }`} />
                                              </div>
                                              <span className={`text-sm font-medium ${
                                                isSelected
                                                  ? 'text-purple-900 dark:text-purple-200'
                                                  : 'text-gray-700 dark:text-gray-300'
                                              }`}>
                                                {type.label}
                                              </span>
                                            </div>
                                            {isSelected && (
                                              <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute top-2 right-2"
                                              >
                                                <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                              </motion.div>
                                            )}
                                          </motion.button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Contact Field */}
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                      Interviewer Name
                                    </label>
                                    <div className="relative">
                                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                      <input
                                        type="text"
                                        value={formData.contactName || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                                        className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 hover:border-purple-400 dark:hover:border-purple-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 shadow-sm hover:shadow-md transition-all"
                                        placeholder="e.g., John Doe, Hiring Manager"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Notes only for Applications */}
                              {eventType === 'application' && (
                                <div>
                                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                                    Notes
                                  </label>
                                  <textarea
                                    value={formData.notes || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] border-transparent focus:bg-white dark:focus:bg-[#1A1A1A] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
                                    placeholder="Add any additional details..."
                                    rows={3}
                                  />
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Manual Entry Link for Application */}
                        {!showFullForm && eventType === 'application' && (
                           <motion.div 
                             initial={{ opacity: 0 }}
                             animate={{ opacity: 1 }}
                             className="flex justify-center pt-2"
                           >
                            <button
                              type="button"
                              onClick={() => setShowFullForm(true)}
                              className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors border-b border-gray-300 dark:border-gray-700 hover:border-gray-900 dark:hover:border-white pb-0.5"
                            >
                              Enter details manually without URL
                            </button>
                          </motion.div>
                        )}
                      </>
                    )}
                  </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#121212] flex justify-end gap-3 z-10">
                  <button
                    type="button"
                    onClick={() => {
                      setEventType(null);
                      setNewApplicationModal(false);
                      setShowFullForm(false);
                    }}
                    className="px-6 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateApplication}
                    disabled={
                      !eventType || 
                      (eventType === 'application' && (!formData.companyName || !formData.position || !formData.location || !formData.appliedDate)) ||
                      (eventType === 'interview' && (!linkedApplicationId || !formData.interviewDate))
                    }
                    className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg shadow-gray-200 dark:shadow-none flex items-center gap-2"
                  >
                    {eventType === 'application' ? (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Application
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Event
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal d'édition */}
        {editModal.show && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-800 w-full sm:rounded-xl rounded-t-2xl max-w-lg max-h-[90vh] flex flex-col"
            >
              {/* Drag handle for mobile */}
              <div className="w-full flex justify-center pt-2 pb-1 sm:hidden">
                <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              </div>

              {/* Header fixe */}
              <div className="px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Edit Application</h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setEditModal({ show: false });
                      setShowAddInterviewForm(false);
                      setNewInterview({
                        date: new Date().toISOString().split('T')[0],
                        time: '09:00',
                        type: 'technical',
                        status: 'scheduled',
                        location: '',
                        notes: ''
                      });
                    }}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Contenu scrollable */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 space-y-4">
                {/* Champs principaux */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Company Name *</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      className="w-full p-3 text-base sm:p-2 sm:text-sm rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Position *</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      className="w-full p-3 text-base sm:p-2 sm:text-sm rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Location *</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full p-3 text-base sm:p-2 sm:text-sm rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Applied Date *</label>
                    <input
                      type="date"
                      value={formData.appliedDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, appliedDate: e.target.value }))}
                      className="w-full p-3 text-base sm:p-2 sm:text-sm rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Job URL</label>
                    <input
                      type="url"
                      value={formData.url || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                      className="w-full p-3 text-base sm:p-2 sm:text-sm rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                      value={formData.notes || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full p-3 text-base sm:p-2 sm:text-sm rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Section des entretiens avec le même design élégant */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-semibold">Interviews</h4>
                    {!showAddInterviewForm && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowAddInterviewForm(true)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Add Interview
                      </motion.button>
                    )}
                  </div>

                  {/* Formulaire d'ajout d'interview */}
                  <AnimatePresence>
                    {showAddInterviewForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="text-sm font-semibold text-purple-900 dark:text-purple-300">New Interview</h5>
                            <button
                              onClick={() => {
                                setShowAddInterviewForm(false);
                                setNewInterview({
                                  date: new Date().toISOString().split('T')[0],
                                  time: '09:00',
                                  type: 'technical',
                                  status: 'scheduled',
                                  location: '',
                                  notes: ''
                                });
                              }}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                              aria-label="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label>
                                <input
                                  type="date"
                                  value={newInterview.date}
                                  onChange={(e) => setNewInterview(prev => ({ ...prev, date: e.target.value }))}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Time *</label>
                                <input
                                  type="time"
                                  value={newInterview.time}
                                  onChange={(e) => setNewInterview(prev => ({ ...prev, time: e.target.value }))}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                <select
                                  value={newInterview.type}
                                  onChange={(e) => setNewInterview(prev => ({ ...prev, type: e.target.value as Interview['type'] }))}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                  <option value="technical">Technical</option>
                                  <option value="hr">HR</option>
                                  <option value="manager">Manager</option>
                                  <option value="final">Final</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                <select
                                  value={newInterview.status}
                                  onChange={(e) => setNewInterview(prev => ({ ...prev, status: e.target.value as Interview['status'] }))}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                  <option value="scheduled">Scheduled</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                              <input
                                type="text"
                                value={newInterview.location || ''}
                                onChange={(e) => setNewInterview(prev => ({ ...prev, location: e.target.value }))}
                                placeholder="e.g., Zoom, Office, Remote"
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                              <textarea
                                value={newInterview.notes || ''}
                                onChange={(e) => setNewInterview(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Add any notes or preparation tips..."
                                rows={2}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                              />
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={() => {
                                  setShowAddInterviewForm(false);
                                  setNewInterview({
                                    date: new Date().toISOString().split('T')[0],
                                    time: '09:00',
                                    type: 'technical',
                                    status: 'scheduled',
                                    location: '',
                                    notes: ''
                                  });
                                }}
                                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  if (!newInterview.date || !newInterview.time) {
                                    toast.error('Please fill in date and time');
                                    return;
                                  }
                                  const interview: Interview = {
                                    id: crypto.randomUUID(),
                                    date: newInterview.date!,
                                    time: newInterview.time!,
                                    type: newInterview.type || 'technical',
                                    status: newInterview.status || 'scheduled',
                                    location: newInterview.location || '',
                                    notes: newInterview.notes || ''
                                  };
                                  setFormData(prev => ({
                                    ...prev,
                                    interviews: [...(prev.interviews || []), interview]
                                  }));
                                  setShowAddInterviewForm(false);
                                  setNewInterview({
                                    date: new Date().toISOString().split('T')[0],
                                    time: '09:00',
                                    type: 'technical',
                                    status: 'scheduled',
                                    location: '',
                                    notes: ''
                                  });
                                  toast.success('Interview added!');
                                }}
                                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg transition-all shadow-sm hover:shadow-md"
                              >
                                Add Interview
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Liste des interviews existants avec le même design élégant */}
                  {formData.interviews && formData.interviews.length > 0 ? (
                    <div className="space-y-4">
                      {formData.interviews.map((interview, index) => (
                        <div
                          key={interview.id}
                          className={`p-4 rounded-lg border ${interview.status === 'completed'
                              ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/50'
                              : interview.status === 'cancelled'
                                ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50'
                                : 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-900/50'
                            }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                            <div className="flex items-center gap-2 mb-2 sm:mb-0 flex-wrap">
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
                                className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 capitalize"
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
                                className={`text-xs px-2 py-1 rounded-full border ${interview.status === 'completed'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-300 dark:border-green-800'
                                    : interview.status === 'cancelled'
                                      ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-300 dark:border-red-800'
                                      : 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-300 dark:border-purple-800'
                                  }`}
                              >
                                <option value="scheduled">Scheduled</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">{interview.date} {interview.time}</span>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  const newInterviews = formData.interviews?.filter((_, i) => i !== index);
                                  setFormData(prev => ({ ...prev, interviews: newInterviews }));
                                }}
                                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                aria-label="Remove interview"
                              >
                                <X className="w-3.5 h-3.5" />
                              </motion.button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                <input
                                  type="date"
                                  value={interview.date}
                                  onChange={(e) => {
                                    const newInterviews = [...(formData.interviews || [])];
                                    newInterviews[index] = { ...interview, date: e.target.value };
                                    setFormData(prev => ({ ...prev, interviews: newInterviews }));
                                  }}
                                  className="flex-1 text-xs px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 focus:ring-1 focus:ring-purple-500"
                                />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                <input
                                  type="time"
                                  value={interview.time}
                                  onChange={(e) => {
                                    const newInterviews = [...(formData.interviews || [])];
                                    newInterviews[index] = { ...interview, time: e.target.value };
                                    setFormData(prev => ({ ...prev, interviews: newInterviews }));
                                  }}
                                  className="flex-1 text-xs px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 focus:ring-1 focus:ring-purple-500"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <input
                                type="text"
                                placeholder="Location (e.g. Zoom, Office, Remote)"
                                value={interview.location || ''}
                                onChange={(e) => {
                                  const newInterviews = [...(formData.interviews || [])];
                                  newInterviews[index] = { ...interview, location: e.target.value };
                                  setFormData(prev => ({ ...prev, interviews: newInterviews }));
                                }}
                                className="flex-1 text-xs px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 focus:ring-1 focus:ring-purple-500"
                              />
                            </div>

                            <div className="flex items-start gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-1.5 flex-shrink-0" />
                              <textarea
                                placeholder="Notes & Feedback..."
                                value={interview.notes || ''}
                                onChange={(e) => {
                                  const newInterviews = [...(formData.interviews || [])];
                                  newInterviews[index] = { ...interview, notes: e.target.value };
                                  setFormData(prev => ({ ...prev, interviews: newInterviews }));
                                }}
                                className="flex-1 text-xs px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 min-h-[60px] resize-y focus:ring-1 focus:ring-purple-500"
                                rows={2}
                              />
                            </div>
                          </div>

                          {interview.status === 'scheduled' && editModal.application && (
                            <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <button
                                onClick={() => downloadICS(interview, editModal.application!.companyName, editModal.application!.position)}
                                className="flex-1 flex items-center justify-center gap-1 text-xs text-purple-600 dark:text-purple-400 py-2 px-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Add to Calendar
                              </button>

                              <a
                                href={`/interview-prep/${editModal.application.id}/${interview.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-1 text-xs text-blue-600 dark:text-blue-400 py-2 px-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Prepare
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                      <Calendar className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No interviews scheduled yet</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Click "Add Interview" to schedule one</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer fixe avec les boutons */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800 shadow-md">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditModal({ show: false });
                      setShowAddInterviewForm(false);
                      setNewInterview({
                        date: new Date().toISOString().split('T')[0],
                        time: '09:00',
                        type: 'technical',
                        status: 'scheduled',
                        location: '',
                        notes: ''
                      });
                    }}
                    className="px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg flex-1 sm:flex-initial"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateApplication}
                    className="px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:opacity-90 flex-1 sm:flex-initial"
                  >
                    Update
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Job Detail Panel - Premium slide-over */}
        <JobDetailPanel
          job={selectedApplication}
          open={timelineModal}
          onClose={() => {
            setTimelineModal(false);
            setShowAddInterviewForm(false);
            setNewInterview({
              date: new Date().toISOString().split('T')[0],
              time: '09:00',
              type: 'technical',
              status: 'scheduled',
              location: '',
              notes: ''
            });
          }}
          onUpdate={async (updates) => {
            if (!currentUser || !selectedApplication) return;

            try {
              const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', selectedApplication.id);
              await updateDoc(applicationRef, {
                ...updates,
                updatedAt: serverTimestamp()
              });

              // Create the updated application object
              const updatedApplication = {
                ...selectedApplication,
                ...updates,
                updatedAt: new Date().toISOString()
              };

              // Update local state
              setApplications(prev =>
                prev.map(app =>
                  app.id === selectedApplication.id
                    ? updatedApplication
                    : app
                )
              );

              // Update selected application to reflect changes immediately
              setSelectedApplication(updatedApplication);

              // Don't show toast for every update (only for user-initiated saves)
              if (!updates.interviews) {
                toast.success('Application updated successfully');
              }
            } catch (error) {
              console.error('Error updating application:', error);
              toast.error('Failed to update application');
            }
          }}
          onDelete={async () => {
            if (!currentUser || !selectedApplication) return;

            try {
              const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', selectedApplication.id);
              await deleteDoc(applicationRef);

              setApplications(prev => prev.filter(app => app.id !== selectedApplication.id));
              toast.success('Application deleted successfully');
              setTimelineModal(false);
              setSelectedApplication(null);
            } catch (error) {
              console.error('Error deleting application:', error);
              toast.error('Failed to delete application');
            }
          }}
        />

        {/* Old Timeline Modal - Keeping temporarily as backup */}
        {false && timelineModal && selectedApplication && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setTimelineModal(false);
              setShowAddInterviewForm(false);
              setNewInterview({
                date: new Date().toISOString().split('T')[0],
                time: '09:00',
                type: 'technical',
                status: 'scheduled',
                location: '',
                notes: ''
              });
            }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: "100%" }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: "100%" }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="group relative bg-white dark:bg-gray-900/80 backdrop-blur-xl w-full sm:rounded-2xl rounded-t-2xl max-w-lg max-h-[90vh] flex flex-col overflow-hidden
                transition-all duration-500 ease-out
                hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-black/30
                border border-gray-200/60 dark:border-gray-800/50"
              style={{
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              {/* Subtle accent line - Apple style */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400/60 to-indigo-500/40" />

              {/* Drag handle for mobile */}
              <div className="w-full flex justify-center pt-2 pb-1 sm:hidden">
                <div className="w-12 h-1 bg-gray-300/60 dark:bg-gray-600/60 rounded-full"></div>
              </div>

              {/* Header with title and close/edit buttons - Apple style */}
              <div className="px-5 sm:px-6 py-4 border-b border-gray-200/60 dark:border-gray-800/50 sticky top-0 bg-white dark:bg-gray-900/80 backdrop-blur-xl z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">Application Timeline</h2>
                  <div className="flex items-center gap-1">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setFormData(selectedApplication);
                        setTimelineModal(false);
                        setEditModal({ show: true, application: selectedApplication });
                      }}
                      className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 
                        hover:bg-purple-50/60 dark:hover:bg-purple-900/30 rounded-lg transition-all duration-200 backdrop-blur-sm"
                      aria-label="Edit application"
                    >
                      <Edit2 className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setTimelineModal(false);
                        setDeleteModal({ show: true, application: selectedApplication });
                      }}
                      className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 
                        hover:bg-red-50/60 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200 backdrop-blur-sm"
                      aria-label="Delete application"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setTimelineModal(false);
                        setShowAddInterviewForm(false);
                        setNewInterview({
                          date: new Date().toISOString().split('T')[0],
                          time: '09:00',
                          type: 'technical',
                          status: 'scheduled',
                          location: '',
                          notes: ''
                        });
                      }}
                      className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 
                        hover:bg-gray-100/60 dark:hover:bg-gray-800/50 rounded-lg transition-all duration-200 backdrop-blur-sm"
                      aria-label="Close modal"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Content with overflow */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-5">
                {/* Application details - Apple style */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  className="mb-6"
                >
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1.5 tracking-tight">{selectedApplication.companyName}</h3>
                  <p className="text-purple-600 dark:text-purple-400 font-medium text-base mb-4">{selectedApplication.position}</p>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="p-1.5 rounded-lg bg-gray-100/80 dark:bg-gray-800/50 backdrop-blur-sm">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      </div>
                      <span>{selectedApplication.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="p-1.5 rounded-lg bg-gray-100/80 dark:bg-gray-800/50 backdrop-blur-sm">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      </div>
                      <span>Applied on {new Date(selectedApplication.appliedDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {selectedApplication.url && (
                    <div className="mb-4">
                      <a
                        href={selectedApplication.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 
                          hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50/60 dark:hover:bg-blue-900/20 
                          rounded-lg transition-all duration-200 backdrop-blur-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>View Job Posting</span>
                      </a>
                    </div>
                  )}

                  {selectedApplication.notes && (
                    <div className="mt-4 p-4 bg-gray-50/80 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-gray-800/50">
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2.5 uppercase tracking-wide">
                        <FileIcon className="w-3.5 h-3.5" />
                        <span>Notes</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{selectedApplication.notes}</p>
                    </div>
                  )}
                </motion.div>

                {/* Status History - Apple style */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  className="mb-6"
                >
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wide flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                    <span>Status History</span>
                  </h4>
                  <div className="relative pl-6 border-l-2 border-gray-200/50 dark:border-gray-700/50 space-y-4">
                    {selectedApplication.statusHistory?.slice().reverse().map((status, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
                        className="relative"
                      >
                        {/* Status dot - Apple style - positioned on top of the card */}
                        <div className={`absolute -left-[17px] top-0 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-sm border-2 z-10 shadow-sm ${status.status === 'applied' ? 'bg-blue-50/60 text-blue-600 border-blue-200/50 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/30' :
                            status.status === 'interview' ? 'bg-purple-50/60 text-purple-600 border-purple-200/50 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800/30' :
                              status.status === 'offer' ? 'bg-green-50/60 text-green-600 border-green-200/50 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/30' :
                                status.status === 'pending_decision' ? 'bg-amber-50/60 text-amber-600 border-amber-200/50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/30' :
                                  status.status === 'archived' ? 'bg-gray-50/60 text-gray-600 border-gray-200/50 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-800/30' :
                                    'bg-red-50/60 text-red-600 border-red-200/50 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/30'
                          }`}>
                          <span className="text-xs font-semibold capitalize">{status.status.slice(0, 1)}</span>
                        </div>

                        {/* Status details - Apple style */}
                        <div className="bg-white/90 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-gray-800/50 pl-4 py-3 px-4 transition-all duration-200 hover:bg-white dark:hover:bg-gray-800/50 relative z-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <p className={`font-medium text-sm capitalize ${status.status === 'applied' ? 'text-blue-600 dark:text-blue-400' :
                                status.status === 'interview' ? 'text-purple-600 dark:text-purple-400' :
                                  status.status === 'offer' ? 'text-green-600 dark:text-green-400' :
                                    status.status === 'pending_decision' ? 'text-amber-600 dark:text-amber-400' :
                                      status.status === 'archived' ? 'text-gray-600 dark:text-gray-400' :
                                        'text-red-600 dark:text-red-400'
                              }`}>
                              {status.status === 'pending_decision' ? 'Pending Decision' : status.status}
                            </p>
                            <time className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              {new Date(status.date).toLocaleDateString()}
                            </time>
                          </div>
                          {status.notes && (
                            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                              {status.notes}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Interviews Section - Apple style */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                      <span>Interviews</span>
                    </h4>
                    {!showAddInterviewForm && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowAddInterviewForm(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 
                          bg-purple-50/60 dark:bg-purple-900/30 hover:bg-purple-100/80 dark:hover:bg-purple-900/40 
                          rounded-lg border border-purple-200/50 dark:border-purple-800/30 transition-all duration-200 backdrop-blur-sm"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Add Interview</span>
                      </motion.button>
                    )}
                  </div>

                  {/* Formulaire d'ajout d'interview - Apple style */}
                  <AnimatePresence>
                    {showAddInterviewForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                        className="mb-4 overflow-hidden"
                      >
                        <div className="bg-gradient-to-br from-purple-50/90 to-indigo-50/90 dark:from-purple-900/20 dark:to-indigo-900/20 
                      border border-purple-200/60 dark:border-purple-800/30 rounded-xl p-4 shadow-sm backdrop-blur-sm">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="text-sm font-semibold text-purple-900 dark:text-purple-300 tracking-tight">New Interview</h5>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setShowAddInterviewForm(false);
                                setNewInterview({
                                  date: new Date().toISOString().split('T')[0],
                                  time: '09:00',
                                  type: 'technical',
                                  status: 'scheduled',
                                  location: '',
                                  notes: ''
                                });
                              }}
                              className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
                                hover:bg-gray-100/60 dark:hover:bg-gray-800/50 rounded-lg transition-all duration-200 backdrop-blur-sm"
                              aria-label="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </motion.button>
                          </div>

                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Date *</label>
                                <input
                                  type="date"
                                  value={newInterview.date}
                                  onChange={(e) => setNewInterview(prev => ({ ...prev, date: e.target.value }))}
                                  className="w-full px-3 py-2.5 text-sm border border-gray-200/60 dark:border-gray-700/50 rounded-lg 
                                bg-white/90 dark:bg-gray-800/30 backdrop-blur-sm 
                                focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                                transition-all duration-200"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Time *</label>
                                <input
                                  type="time"
                                  value={newInterview.time}
                                  onChange={(e) => setNewInterview(prev => ({ ...prev, time: e.target.value }))}
                                  className="w-full px-3 py-2.5 text-sm border border-gray-200/60 dark:border-gray-700/50 rounded-lg 
                                bg-white/90 dark:bg-gray-800/30 backdrop-blur-sm 
                                focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                                transition-all duration-200"
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Type</label>
                                <select
                                  value={newInterview.type}
                                  onChange={(e) => setNewInterview(prev => ({ ...prev, type: e.target.value as Interview['type'] }))}
                                  className="w-full px-3 py-2.5 text-sm border border-gray-200/60 dark:border-gray-700/50 rounded-lg 
                                bg-white/90 dark:bg-gray-800/30 backdrop-blur-sm 
                                focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                                transition-all duration-200"
                                >
                                  <option value="technical">Technical</option>
                                  <option value="hr">HR</option>
                                  <option value="manager">Manager</option>
                                  <option value="final">Final</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Status</label>
                                <select
                                  value={newInterview.status}
                                  onChange={(e) => setNewInterview(prev => ({ ...prev, status: e.target.value as Interview['status'] }))}
                                  className="w-full px-3 py-2.5 text-sm border border-gray-200/60 dark:border-gray-700/50 rounded-lg 
                                bg-white/90 dark:bg-gray-800/30 backdrop-blur-sm 
                                focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                                transition-all duration-200"
                                >
                                  <option value="scheduled">Scheduled</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Location</label>
                              <input
                                type="text"
                                value={newInterview.location || ''}
                                onChange={(e) => setNewInterview(prev => ({ ...prev, location: e.target.value }))}
                                placeholder="e.g., Zoom, Office, Remote"
                                className="w-full px-3 py-2.5 text-sm border border-gray-200/60 dark:border-gray-700/50 rounded-lg 
                                bg-white/90 dark:bg-gray-800/30 backdrop-blur-sm 
                                focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                                transition-all duration-200"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Notes</label>
                              <textarea
                                value={newInterview.notes || ''}
                                onChange={(e) => setNewInterview(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Add any notes or preparation tips..."
                                rows={2}
                                className="w-full px-3 py-2.5 text-sm border border-gray-200/60 dark:border-gray-700/50 rounded-lg 
                              bg-white/90 dark:bg-gray-800/30 backdrop-blur-sm 
                              focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                              transition-all duration-200 resize-none"
                              />
                            </div>

                            <div className="flex gap-2 pt-2">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setShowAddInterviewForm(false);
                                  setNewInterview({
                                    date: new Date().toISOString().split('T')[0],
                                    time: '09:00',
                                    type: 'technical',
                                    status: 'scheduled',
                                    location: '',
                                    notes: ''
                                  });
                                }}
                                className="flex-1 px-3 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-300 
                              bg-gray-100/90 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600/60 
                              rounded-lg transition-all duration-200 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/50"
                              >
                                Cancel
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleAddInterview}
                                className="flex-1 px-3 py-2.5 text-xs font-medium text-white 
                                  bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 
                                  rounded-lg transition-all duration-200 shadow-sm hover:shadow-md backdrop-blur-sm"
                              >
                                Add Interview
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Liste des interviews existants - Apple style */}
                  {selectedApplication.interviews && selectedApplication.interviews.length > 0 ? (
                    <div className="space-y-3">
                      {selectedApplication.interviews.map((interview, index) => (
                        <motion.div
                          key={interview.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25 + index * 0.05, duration: 0.3 }}
                          className={`group relative p-4 rounded-xl border backdrop-blur-sm transition-all duration-200 hover:shadow-md ${interview.status === 'completed'
                              ? 'bg-green-50/90 dark:bg-green-900/20 border-green-200/60 dark:border-green-900/50 hover:bg-green-50 dark:hover:bg-green-900/30'
                              : interview.status === 'cancelled'
                                ? 'bg-red-50/90 dark:bg-red-900/20 border-red-200/60 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/30'
                                : 'bg-purple-50/90 dark:bg-purple-900/20 border-purple-200/60 dark:border-purple-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                            }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                            <div className="flex items-center gap-2">
                              <span className="capitalize font-medium text-sm text-gray-900 dark:text-white">{interview.type} Interview</span>
                              <span className={`px-2.5 py-1 text-[10px] font-medium rounded-full backdrop-blur-sm border ${interview.status === 'completed'
                                  ? 'bg-green-100/60 text-green-700 border-green-200/50 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/30'
                                  : interview.status === 'cancelled'
                                    ? 'bg-red-100/60 text-red-700 border-red-200/50 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/30'
                                    : 'bg-purple-100/60 text-purple-700 border-purple-200/50 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800/30'
                                }`}>
                                {interview.status}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{interview.date} {interview.time}</span>
                          </div>

                          {interview.location && (
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
                              <div className="p-1 rounded-lg bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm">
                                <MapPin className="w-3 h-3" />
                              </div>
                              <span>{interview.location}</span>
                            </div>
                          )}

                          {interview.notes && (
                            <div className="mb-3 p-3 bg-white/90 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-200/60 dark:border-gray-800/50">
                              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{interview.notes}</p>
                            </div>
                          )}

                          {interview.status === 'scheduled' && (
                            <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => downloadICS(interview, selectedApplication.companyName, selectedApplication.position)}
                                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 
                                  py-2.5 px-3 hover:bg-purple-50/60 dark:hover:bg-purple-900/30 rounded-lg 
                                  border border-purple-200/50 dark:border-purple-800/30 backdrop-blur-sm transition-all duration-200"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Add to Calendar
                              </motion.button>

                              <a
                                href={`/interview-prep/${selectedApplication.id}/${interview.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-white 
                                  py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 
                                  rounded-lg transition-all duration-200 shadow-sm hover:shadow-md backdrop-blur-sm"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Prepare for Interview
                              </a>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4 bg-gray-50/80 dark:bg-gray-900/30 backdrop-blur-sm rounded-xl border border-dashed border-gray-200/60 dark:border-gray-700/50">
                      <Calendar className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No interviews scheduled yet</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Click "Add Interview" to schedule one</p>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Footer with Close button - Apple style */}
              <div className="px-5 sm:px-6 py-4 border-t border-gray-200/60 dark:border-gray-800/50 flex justify-end sticky bottom-0 
            bg-white dark:bg-gray-900/80 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/20">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setTimelineModal(false);
                    setShowAddInterviewForm(false);
                    setNewInterview({
                      date: new Date().toISOString().split('T')[0],
                      time: '09:00',
                      type: 'technical',
                      status: 'scheduled',
                      location: '',
                      notes: ''
                    });
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white 
                    bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 
                    rounded-lg transition-all duration-200 shadow-lg shadow-purple-500/20 dark:shadow-purple-900/30 
                    hover:shadow-xl hover:shadow-purple-500/30 dark:hover:shadow-purple-900/40 backdrop-blur-sm"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.show && deleteModal.application && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-lg font-semibold">Delete Application</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDeleteModal({ show: false })}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete your application for <strong>{deleteModal.application.position}</strong> at <strong>{deleteModal.application.companyName}</strong>? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModal({ show: false })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg flex-1 sm:flex-initial"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteApplication}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-lg flex-1 sm:flex-initial"
                >
                  Delete
                </button>
              </div>
            </div>
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

        {/* Floating action button to view all scheduled interviews */}
        <button
          onClick={() => {
            // Redirect to upcoming interviews page
            window.location.href = '/upcoming-interviews';
          }}
          className="fixed bottom-20 right-6 z-10 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg flex items-center justify-center"
          aria-label="View all scheduled interviews"
        >
          <Calendar className="w-6 h-6" />
          <span className="sr-only">View all scheduled interviews</span>
        </button>
      </div>
    </AuthLayout>
  );
} 