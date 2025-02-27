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
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Hero Section avec statistiques */}
        <div className="mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Job Applications
              </h1>
              <p className="mt-1 text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400">
                Track and manage your job applications
              </p>
            </div>
            <button
              onClick={() => setNewApplicationModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs sm:text-sm font-medium hover:opacity-90 transition-all duration-200"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Add Application
            </button>
          </div>

          {/* Statistiques en grille responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            {[
              { label: 'Applied', count: applications.filter(a => a.status === 'applied').length, color: 'blue' },
              { label: 'Interview', count: applications.filter(a => a.status === 'interview').length, color: 'purple' },
              { label: 'Offer', count: applications.filter(a => a.status === 'offer').length, color: 'green' },
              { label: 'Rejected', count: applications.filter(a => a.status === 'rejected').length, color: 'red' }
            ].map(stat => (
              <div key={stat.label} 
                className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className={`text-${stat.color}-600 dark:text-${stat.color}-400 text-lg sm:text-xl lg:text-2xl font-bold`}>
                  {stat.count}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Barre de recherche responsive */}
        <div className="mb-4 sm:mb-6">
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
        </div>

        {/* Kanban Board avec meilleur scroll horizontal sur mobile */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex overflow-x-auto pb-4 sm:pb-6 -mx-2 px-2 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 hide-scrollbar">
            {['applied', 'interview', 'offer', 'rejected'].map((status) => (
              <Droppable key={status} droppableId={status}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-shrink-0 w-[80vw] sm:w-auto bg-gray-50 dark:bg-gray-900/50 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4"
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
                      {applications
                        .filter(app => app.status === status)
                        .map((app, index) => (
                          <Draggable key={app.id} draggableId={app.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-white dark:bg-gray-800 rounded-lg p-2 sm:p-3 lg:p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200"
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
                                    <button
                                      onClick={() => {
                                        setFormData(app);
                                        setEditModal({ show: true, application: app });
                                      }}
                                      className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                    >
                                      <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500" />
                                    </button>
                                    <button
                                      onClick={() => setDeleteModal({ show: true, application: app })}
                                      className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                    >
                                      <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500" />
                                    </button>
                                  </div>
                                </div>

                                {/* Indicateurs d'entretien */}
                                {app.interviews && app.interviews.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {app.interviews.slice(0, 3).map((interview, i) => (
                                        <div
                                          key={interview.id}
                                          className="relative group"
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
                                          {/* Tooltip plus compact */}
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-[10px] rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                            {interview.type} - {interview.date}
                                          </div>
                                        </div>
                                      ))}
                                      {app.interviews.length > 3 && (
                                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-500 flex items-center justify-center text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-300">
                                          +{app.interviews.length - 3}
                                        </div>
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
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>

        {/* Style pour cacher la scrollbar sur mobile tout en gardant la fonctionnalité */}
        <style jsx global>{`
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* Ajouter le modal à la fin du composant, avant la dernière div */}
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
      </div>
    </AuthLayout>
  );
} 