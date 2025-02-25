import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { collection, query, onSnapshot, doc, updateDoc, where, orderBy, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Calendar, Building, ExternalLink, MapPin, Edit3, Trash2, User, Mail, Phone, Briefcase, DollarSign, FileText, MessageSquare, Link, X, PlusCircle, Clock, Users, Check } from 'lucide-react';
import { toast } from 'sonner';
import AuthLayout from '../components/AuthLayout';
import confetti from 'canvas-confetti';

interface Interview {
  id: string;
  date: string;
  time: string;
  type: 'technical' | 'hr' | 'manager' | 'final' | 'other';
  interviewers?: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  feedback?: string;
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
      // Mise à jour optimiste de l'UI
      setApplications(prev => prev.map(app => 
        app.id === draggableId ? { ...app, status: newStatus } : app
      ));
      
      // Mise à jour dans Firestore
      const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', draggableId);
      await updateDoc(applicationRef, { 
        status: newStatus,
        updatedAt: serverTimestamp()
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
  
  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Hero Section avec statistiques */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Job Applications
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400">
                Track and manage your job applications
              </p>
            </div>
            <button
              onClick={() => setNewApplicationModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium text-sm hover:opacity-90 transition-all duration-200 shadow-lg shadow-purple-500/20"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Add Application
            </button>
          </div>

          {/* Statistiques en grille responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Applied', count: applications.filter(a => a.status === 'applied').length, color: 'blue' },
              { label: 'Interview', count: applications.filter(a => a.status === 'interview').length, color: 'purple' },
              { label: 'Offer', count: applications.filter(a => a.status === 'offer').length, color: 'green' },
              { label: 'Rejected', count: applications.filter(a => a.status === 'rejected').length, color: 'red' }
            ].map(stat => (
              <div key={stat.label} 
                className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 flex flex-col items-center sm:items-start"
              >
                <div className={`text-${stat.color}-600 dark:text-${stat.color}-400 text-xl sm:text-2xl font-bold mb-1`}>
                  {stat.count}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Barre de recherche responsive */}
        <div className="mb-6">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by company or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm sm:text-base focus:ring-2 focus:ring-purple-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>

        {/* Kanban Board avec scroll horizontal sur mobile */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {['applied', 'interview', 'offer', 'rejected'].map((status) => (
              <Droppable key={status} droppableId={status}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-shrink-0 w-[85vw] sm:w-auto bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 sm:p-4"
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white capitalize text-sm sm:text-base">
                        {status}
                      </h3>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {applications.filter(a => a.status === status).length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {applications
                        .filter(app => app.status === status)
                        .map((app, index) => (
                          <Draggable key={app.id} draggableId={app.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200"
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                      {app.companyName}
                                    </h4>
                                    <p className="text-purple-600 dark:text-purple-400 text-sm">
                                      {app.position}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setFormData(app);
                                        setEditModal({ show: true, application: app });
                                      }}
                                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                    >
                                      <Edit3 className="w-4 h-4 text-gray-500" />
                                    </button>
                                    <button
                                      onClick={() => setDeleteModal({ show: true, application: app })}
                                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                    >
                                      <Trash2 className="w-4 h-4 text-gray-500" />
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    <MapPin className="w-4 h-4 mr-2" />
                                    {app.location}
                                  </div>
                                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Applied: {app.appliedDate}
                                  </div>
                                </div>

                                {/* Indicateur d'entretiens */}
                                {app.interviews && app.interviews.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-2">
                                      <Users className="w-4 h-4 text-purple-500" />
                                      <div className="flex items-center gap-1.5">
                                        {app.interviews.map((interview, i) => (
                                          <div
                                            key={interview.id}
                                            className={`relative group ${i > 2 ? 'hidden' : ''}`}
                                          >
                                            <div
                                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 ${
                                                interview.status === 'completed'
                                                  ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-400 dark:text-green-400'
                                                  : interview.status === 'cancelled'
                                                  ? 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900/30 dark:border-red-400 dark:text-red-400'
                                                  : 'bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-900/30 dark:border-purple-400 dark:text-purple-400'
                                              }`}
                                            >
                                              {interview.type === 'technical' ? 'T' :
                                               interview.type === 'hr' ? 'HR' :
                                               interview.type === 'manager' ? 'M' :
                                               interview.type === 'final' ? 'F' : 'O'}
                                            </div>
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                              {interview.type.charAt(0).toUpperCase() + interview.type.slice(1)} Interview
                                              <br />
                                              {interview.date} {interview.time}
                                            </div>
                                          </div>
                                        ))}
                                        {app.interviews.length > 3 && (
                                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-500 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                                            +{app.interviews.length - 3}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {app.url && (
                                  <a
                                    href={app.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-3 inline-flex items-center text-sm text-purple-600 dark:text-purple-400 hover:underline"
                                  >
                                    <ExternalLink className="w-4 h-4 mr-1" />
                                    View Job
                                  </a>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                      {applications.filter(a => a.status === status).length === 0 && (
                        <div className="flex items-center justify-center h-24 sm:h-32">
                          <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">
                            No applications
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>

        {/* Modal d'édition responsive */}
        {editModal.show && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 z-10">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    Edit Application
                  </h3>
                  <button
                    onClick={() => setEditModal({ show: false })}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                {/* Sections du formulaire avec espacement responsive */}
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Company Name*
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            value={formData.companyName || ''}
                            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                            className="pl-10 w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Position*
                        </label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            value={formData.position || ''}
                            onChange={(e) => setFormData({...formData, position: e.target.value})}
                            className="pl-10 w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location & Date */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Location & Date
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Location*
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            value={formData.location || ''}
                            onChange={(e) => setFormData({...formData, location: e.target.value})}
                            className="pl-10 w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Application Date*
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="date"
                            value={formData.appliedDate || ''}
                            onChange={(e) => setFormData({...formData, appliedDate: e.target.value})}
                            className="pl-10 w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Contact Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            value={formData.contactName || ''}
                            onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                            className="pl-10 w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Contact Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="email"
                            value={formData.contactEmail || ''}
                            onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                            className="pl-10 w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Contact Phone
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="tel"
                            value={formData.contactPhone || ''}
                            onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                            className="pl-10 w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Additional Details
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Job URL
                        </label>
                        <div className="relative">
                          <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="url"
                            value={formData.url || ''}
                            onChange={(e) => setFormData({...formData, url: e.target.value})}
                            className="pl-10 w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Salary Range
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            value={formData.salary || ''}
                            onChange={(e) => setFormData({...formData, salary: e.target.value})}
                            className="pl-10 w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600"
                            placeholder="e.g. 50,000 - 70,000 €"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Notes
                        </label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                          <textarea
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            rows={4}
                            className="pl-10 w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600"
                            placeholder="Add any additional notes about the application..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section Interviews */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Interviews
                    </h3>
                    <button
                      onClick={() => {
                        const newInterview: Interview = {
                          id: Date.now().toString(),
                          date: '',
                          time: '',
                          type: 'technical',
                          status: 'scheduled'
                        };
                        setFormData({
                          ...formData,
                          interviews: [...(formData.interviews || []), newInterview]
                        });
                      }}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg"
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Interview
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.interviews?.map((interview, index) => (
                      <div
                        key={interview.id}
                        className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              interview.status === 'completed' ? 'bg-green-500' :
                              interview.status === 'cancelled' ? 'bg-red-500' :
                              'bg-yellow-500'
                            }`} />
                            <select
                              value={interview.type}
                              onChange={(e) => {
                                const updatedInterviews = [...(formData.interviews || [])];
                                updatedInterviews[index] = {
                                  ...interview,
                                  type: e.target.value as Interview['type']
                                };
                                setFormData({ ...formData, interviews: updatedInterviews });
                              }}
                              className="text-sm font-medium bg-transparent border-none focus:ring-0"
                            >
                              <option value="technical">Technical Interview</option>
                              <option value="hr">HR Interview</option>
                              <option value="manager">Manager Interview</option>
                              <option value="final">Final Interview</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={interview.status}
                              onChange={(e) => {
                                const updatedInterviews = [...(formData.interviews || [])];
                                updatedInterviews[index] = {
                                  ...interview,
                                  status: e.target.value as Interview['status']
                                };
                                setFormData({ ...formData, interviews: updatedInterviews });
                              }}
                              className="text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg"
                            >
                              <option value="scheduled">Scheduled</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            <button
                              onClick={() => {
                                const updatedInterviews = formData.interviews?.filter(
                                  (_, i) => i !== index
                                );
                                setFormData({ ...formData, interviews: updatedInterviews });
                              }}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                            >
                              <Trash2 className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Date
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="date"
                                value={interview.date}
                                onChange={(e) => {
                                  const updatedInterviews = [...(formData.interviews || [])];
                                  updatedInterviews[index] = {
                                    ...interview,
                                    date: e.target.value
                                  };
                                  setFormData({ ...formData, interviews: updatedInterviews });
                                }}
                                className="pl-10 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Time
                            </label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="time"
                                value={interview.time}
                                onChange={(e) => {
                                  const updatedInterviews = [...(formData.interviews || [])];
                                  updatedInterviews[index] = {
                                    ...interview,
                                    time: e.target.value
                                  };
                                  setFormData({ ...formData, interviews: updatedInterviews });
                                }}
                                className="pl-10 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Interviewers
                          </label>
                          <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={interview.interviewers?.join(', ') || ''}
                              onChange={(e) => {
                                const updatedInterviews = [...(formData.interviews || [])];
                                updatedInterviews[index] = {
                                  ...interview,
                                  interviewers: e.target.value.split(',').map(s => s.trim())
                                };
                                setFormData({ ...formData, interviews: updatedInterviews });
                              }}
                              placeholder="Enter interviewer names separated by commas"
                              className="pl-10 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Notes & Feedback
                          </label>
                          <div className="relative">
                            <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <textarea
                              value={interview.notes}
                              onChange={(e) => {
                                const updatedInterviews = [...(formData.interviews || [])];
                                updatedInterviews[index] = {
                                  ...interview,
                                  notes: e.target.value
                                };
                                setFormData({ ...formData, interviews: updatedInterviews });
                              }}
                              rows={3}
                              placeholder="Add any notes or feedback about the interview..."
                              className="pl-10 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {!formData.interviews?.length && (
                      <div className="text-center py-6">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No interviews scheduled yet. Click "Add Interview" to create one.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    onClick={() => setEditModal({ show: false })}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateApplication}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-xl transform transition-all">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                  <Trash2 className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Delete Application
                </h3>
                <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                  Are you sure you want to delete this job application? This action cannot be undone.
                </p>
                
                <div className="flex gap-4 w-full">
                  <button
                    onClick={() => setDeleteModal({ show: false })}
                    className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteApplication}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700"
                  >
                    Delete
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