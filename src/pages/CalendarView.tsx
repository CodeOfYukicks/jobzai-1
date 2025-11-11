import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { collection, query, getDocs, getDoc, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Briefcase, 
  Calendar as CalIcon, 
  Check, 
  X,
  MapPin,
  Clock,
  Building,
  User,
  ChevronLeft,
  ChevronRight,
  Info,
  FileText,
  Plus,
  GripVertical,
  Sparkles,
  Loader2,
  Link,
  Search,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { queryPerplexityForJobExtraction } from '../lib/perplexity';

// Import types from JobApplicationsPage
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
  contactName?: string;
  contactEmail?: string;
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
  createdAt: any;
  updatedAt: any;
  interviews?: Interview[];
  statusHistory?: StatusChange[];
}

// Setup le localisateur pour le calendrier
const localizer = momentLocalizer(moment);

// Créer le composant Calendar avec drag and drop
const DragAndDropCalendar = withDragAndDrop(BigCalendar);

// Types pour les événements du calendrier
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: any;
  type: 'interview' | 'application';
  color?: string;
}

// Composant Modal pour afficher les détails d'un événement
interface EventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
}

const EventModal = ({ event, onClose }: EventModalProps) => {
  const navigate = useNavigate();
  
  if (!event) return null;
  
  const isInterview = event.type === 'interview';
  const resource = event.resource || {};
  const application = isInterview ? resource.application : resource;
  const interview = isInterview ? resource.interview : null;
  
  const handleNavigateToPrep = () => {
    if (isInterview && application?.id && interview?.id) {
      navigate(`/interview-prep/${application.id}/${interview.id}`);
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50">
          <div>
            <h3 className="font-semibold text-xl text-gray-900 dark:text-gray-100">{event.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {moment(event.start).format('dddd, MMMM D, YYYY')}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          {/* Date et heure */}
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium">
                {moment(event.start).format('dddd, MMMM D, YYYY')}
              </p>
              {!event.allDay && (
                <p className="text-gray-600 dark:text-gray-400">
                  {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
                </p>
              )}
            </div>
          </div>
          
          {/* Entreprise */}
          <div className="flex items-start gap-3">
            <Building className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium">
                {application?.companyName || 'Company'}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {application?.position || 'Position'}
              </p>
            </div>
          </div>
          
          {/* Lieu (pour les entretiens) */}
          {isInterview && interview?.location && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-gray-600 dark:text-gray-400">
                  {interview.location}
                </p>
              </div>
            </div>
          )}
          
          {/* Contact (pour les entretiens) */}
          {isInterview && interview?.contactName && (
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium">Contact</p>
                <p className="text-gray-600 dark:text-gray-400">
                  {interview.contactName}
                  {interview.contactEmail && ` • ${interview.contactEmail}`}
                </p>
              </div>
            </div>
          )}
          
          {/* Notes */}
          {(isInterview && interview?.notes) || application?.notes ? (
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium">Notes</p>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {isInterview ? interview?.notes : application?.notes}
                </p>
              </div>
            </div>
          ) : null}
        </div>
        
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between bg-gray-50 dark:bg-gray-800/50">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium active:scale-95"
          >
            Close
          </button>
          
          {isInterview && application?.id && interview?.id && (
            <button 
              onClick={handleNavigateToPrep}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium active:scale-95 shadow-sm"
            >
              <FileText className="w-4 h-4" />
              Prepare for Interview
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Composant Modal pour ajouter un événement
interface AddEventModalProps {
  selectedDate: Date;
  onClose: () => void;
  onAddEvent: (eventData: any) => Promise<void>;
}

const AddEventModal = ({ selectedDate, onClose, onAddEvent }: AddEventModalProps) => {
  const { currentUser } = useAuth();
  const [eventType, setEventType] = useState<'application' | 'interview' | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    position: '',
    location: '',
    notes: '',
    url: '',
    interviewType: 'technical',
    interviewTime: moment(selectedDate).format('HH:mm'),
    contactName: '',
    contactEmail: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzingJob, setIsAnalyzingJob] = useState(false);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [showApplicationDropdown, setShowApplicationDropdown] = useState(false);
  const [linkedApplicationId, setLinkedApplicationId] = useState<string | null>(null);

  const resetForm = () => {
    setEventType(null);
    setFormData({
      companyName: '',
      position: '',
      location: '',
      notes: '',
      url: '',
      interviewType: 'technical',
      interviewTime: moment(selectedDate).format('HH:mm'),
      contactName: '',
      contactEmail: '',
    });
    setSearchQuery('');
    setSelectedApplication(null);
    setShowApplicationDropdown(false);
    setLinkedApplicationId(null);
  };

  // Charger les candidatures existantes quand on sélectionne "interview"
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
          setApplications(apps);
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
        setShowApplicationDropdown(false);
      }
    };

    if (showApplicationDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showApplicationDropdown]);

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
      const prompt = `
You are a precise job posting information extractor. Your task is to visit this URL and extract EXACT information from the job posting page.

URL TO VISIT: ${jobUrl}

CRITICAL INSTRUCTIONS - FOLLOW THESE EXACTLY:
1. You MUST visit the URL using web browsing/search capabilities
2. Read the ENTIRE page content carefully - do NOT skim or rush
3. Understand the STRUCTURE and CONTEXT of the page - analyze how information is organized
4. Read the ACTUAL HTML content of the page - do NOT use training data or assumptions
5. Extract ONLY information that is VISIBLY DISPLAYED on the page
6. Do NOT guess, infer, or use information from similar job postings
7. Do NOT use information from the URL or domain name to infer details
8. For location specifically: 
   - Read the ENTIRE page to understand the context
   - Identify ALL location mentions on the page
   - Analyze the CONTEXT around each location to determine which applies to THIS specific job posting
   - The page may mention multiple locations (headquarters, other offices, general info) - you MUST identify which one is for THIS job

EXTRACTION REQUIREMENTS FOR EACH FIELD:

1. "companyName":
   - Find the EXACT company name as displayed on the page
   - Look in: page header, job title area, company information section, "About" section, footer
   - Copy it EXACTLY as shown (case-sensitive, with exact spelling and punctuation)
   - Examples: "Boston Consulting Group", "Google LLC", "Microsoft Corporation"
   - Do NOT abbreviate or modify the company name

2. "position":
   - Find the EXACT job title/position as displayed on the page
   - Look for: <h1>, <h2>, title tags, main job title element, job header section
   - Copy it EXACTLY as shown (case-sensitive, with exact spelling, punctuation, and formatting)
   - Examples: "Manager, Platinion", "Senior Software Engineer", "Product Manager - EMEA"
   - Do NOT modify, abbreviate, or generalize the job title
   - This is CRITICAL - the exact title is essential

3. "location" - THIS IS THE MOST CRITICAL FIELD - CONTEXTUAL ANALYSIS REQUIRED:
   - STOP: Before extracting location, you MUST read the ENTIRE page content carefully and understand the CONTEXT
   - CRITICAL: The page may mention MULTIPLE locations (headquarters, other offices, general company info)
   - You MUST identify which location applies to THIS SPECIFIC job posting by analyzing the CONTEXT
   
   CONTEXTUAL ANALYSIS PROCESS:
   1. Read the ENTIRE page to understand the structure and context
   2. Identify ALL location mentions on the page
   3. For EACH location mention, analyze the CONTEXT around it:
      - Is it in the job details section near the job title? → Likely the job location
      - Is it in a "Location:" field in the job posting section? → Likely the job location
      - Is it in the header/footer mentioning company headquarters? → NOT the job location
      - Is it in a general "About Us" or "Our Offices" section? → NOT the job location
      - Is it mentioned with phrases like "This role is based in...", "Location for this position:", "Work location:", "This position is located in..."? → Likely the job location
      - Is it near the job title, job description, or application section? → Likely the job location
   
   SEARCH STRATEGY - Look for location in THIS ORDER OF PRIORITY:
   1. Job-specific location indicators (HIGHEST PRIORITY):
      * Location field/icon in the job details section (near job title)
      * "Location:" or "Work Location:" in the job posting section
      * "This role is based in..." or "This position is located in..."
      * "Where you'll work:" section within the job posting
      * Location mentioned in the job description or requirements section
      * Location in the application information section
   
   2. Contextual phrases that indicate job location:
      * "Based in [location]" near the job title or description
      * "Location: [location]" in the job details
      * "Work Location: [location]" in the job posting
      * "Office Location: [location]" for this specific position
      * "This position is in [location]"
      * "The role is located in [location]"
      * Any location mention that is clearly associated with THIS job posting
   
   3. AVOID these locations (they are NOT the job location):
      * Company headquarters mentioned in header/footer
      * General "Our Offices" section listing all offices
      * Location in "About Us" or company information sections
      * Location mentioned in unrelated job postings on the same page
      * Location in general company information
   
   CRITICAL CONTEXTUAL VERIFICATION:
   - If you see "New York" in the header/footer but "Paris" near the job title → Use "Paris"
   - If you see multiple locations, identify which one is associated with THIS job posting
   - Analyze the proximity: location near job title/description = job location
   - Analyze the phrasing: "This role is based in Paris" = job location is Paris
   - If location is mentioned with the job title or in job details section → That's the job location
   - If location is in general company info → NOT the job location
   
   EXTRACTION RULES:
   - Find the location that is CONTEXTUALLY associated with THIS specific job posting
   - Read it word-for-word EXACTLY as displayed
   - Copy it character-by-character - do NOT modify, translate, or interpret
   - If the context clearly indicates "Paris, France" for this job → return "Paris, France"
   - If the context clearly indicates "New York, NY, US" for this job → return "New York, NY, US"
   - DO NOT use a location just because it appears on the page - it must be CONTEXTUALLY linked to THIS job
   - If multiple locations are listed for this job, use the PRIMARY or FIRST one mentioned
   - CRITICAL: The location MUST be the one that applies to THIS specific job posting based on context
   - CRITICAL: If you cannot determine the job location from context, return an empty string "" - do NOT guess

4. "summary":
   - Extract a comprehensive, useful summary of the job posting
   - Include: key responsibilities, required qualifications, main requirements, and what makes this role unique
   - Format: 3-5 sentences that provide valuable context about the role
   - Focus on: what the role entails, key responsibilities, required experience/skills, and any notable aspects
   - Make it informative and useful for someone tracking this application
   - Do NOT just copy the first paragraph - synthesize the most important information
   - Length: approximately 150-300 words

Return ONLY a valid JSON object (no markdown, no code blocks, no explanations, no additional text):
{
  "companyName": "exact company name from page",
  "position": "exact job title from page",
  "location": "exact location for this specific job posting from page",
  "summary": "comprehensive 3-5 sentence summary of the role, responsibilities, and key requirements"
}

URL to visit: ${jobUrl}
`;

      const response = await queryPerplexityForJobExtraction(prompt);
      
      if (response.error) {
        throw new Error(response.errorMessage || 'Failed to analyze job posting');
      }

      let jsonString = response.text || '';
      jsonString = jsonString.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }
      
      const tryParseJSON = (str: string) => {
        try {
          return JSON.parse(str);
        } catch (e) {
          let repaired = str
            .replace(/,\s*\]/g, ']')
            .replace(/,\s*\}/g, '}')
            .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
            .replace(/:\s*'([^']*)'/g, ': "$1"')
            .replace(/:\s*([^",{\[\]}\s]+)(\s*[,}\]])/g, ': "$1"$2')
            .replace(/"([^"]*)"\s*:\s*"([^"]*)\n([^"]*)"/g, '"$1": "$2\\n$3"')
            .replace(/"([^"]*)"\s*:\s*"([^"]*)"([^"]*)"/g, (match, key, val1, val2) => {
              return `"${key}": "${val1}\\"${val2}"`;
            });
          
          try {
            return JSON.parse(repaired);
          } catch (e2) {
            return null;
          }
        }
      };
      
      let extractedData = tryParseJSON(jsonString);
      
      if (!extractedData) {
        const text = response.text || '';
        const companyPatterns = [
          /"companyName"\s*:\s*"([^"]+)"/i,
          /companyName["\s]*:["\s]*([^",\n}]+)/i,
        ];
        let companyName = '';
        for (const pattern of companyPatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            companyName = match[1].trim();
            break;
          }
        }
        
        const positionPatterns = [
          /"position"\s*:\s*"([^"]+)"/i,
          /position["\s]*:["\s]*"([^"]+)"/i,
        ];
        let position = '';
        for (const pattern of positionPatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            position = match[1].trim().replace(/^["']+|["']+$/g, '');
            if (position.length > 5) break;
          }
        }
        
        const locationPatterns = [
          /"location"\s*:\s*"([^"]+)"/i,
          /location["\s]*:["\s]*"([^"]+)"/i,
        ];
        let location = '';
        for (const pattern of locationPatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            location = match[1].trim().replace(/^["']+|["']+$/g, '');
            if (location.length > 3) break;
          }
        }
        
        extractedData = {
          companyName: companyName.trim(),
          position: position.trim(),
          location: location.trim(),
          summary: ''
        };
      }

      if (!extractedData.position || extractedData.position.length < 3) {
        throw new Error('Could not extract valid job position from the posting');
      }
      
      if (!extractedData.companyName || extractedData.companyName.length < 2) {
        throw new Error('Could not extract valid company name from the posting');
      }

      const cleanedData = {
        companyName: extractedData.companyName.trim(),
        position: extractedData.position.trim(),
        location: extractedData.location?.trim() || '',
        summary: extractedData.summary?.trim() || ''
      };

      let formattedNotes = cleanedData.summary;
      if (formattedNotes) {
        formattedNotes = formattedNotes
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .trim();
        
        if (formattedNotes.length < 50) {
          formattedNotes = `Job Summary:\n${formattedNotes}`;
        }
        
        if (formData.notes && formData.notes.trim()) {
          formattedNotes = `${formData.notes}\n\n---\n\n${formattedNotes}`;
        }
      }

      setFormData(prev => ({
        ...prev,
        companyName: cleanedData.companyName || prev.companyName,
        position: cleanedData.position || prev.position,
        location: cleanedData.location || prev.location,
        notes: formattedNotes || prev.notes || ''
      }));

      toast.success('Job information extracted successfully!');
    } catch (error) {
      console.error('Error extracting job info:', error);
      toast.error(`Failed to extract job information: ${error instanceof Error ? error.message : 'Unknown error'}. Please fill in the fields manually.`);
    } finally {
      setIsAnalyzingJob(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
    e.preventDefault();
    }
    
    if (!eventType) {
      toast.error('Please select an event type first');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const eventData = {
        ...formData,
        date: moment(selectedDate).format('YYYY-MM-DD'),
        eventType,
        linkedApplicationId: linkedApplicationId || undefined, // Passer l'ID de la candidature liée si elle existe
      };
      
      await onAddEvent(eventData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Failed to add event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => {
        resetForm();
        onClose();
      }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: "100%" }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: "100%" }}
        onClick={(e) => e.stopPropagation()}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white dark:bg-gray-800 w-full rounded-2xl max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {/* Drag handle for mobile */}
        <div className="w-full flex justify-center pt-2 pb-1 sm:hidden">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50">
          <div>
            <h2 className="font-semibold text-xl text-gray-900 dark:text-gray-100">
              {eventType ? `Add ${eventType === 'application' ? 'Job Application' : 'Interview'}` : 'Add Event'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {moment(selectedDate).format('dddd, MMMM D, YYYY')}
            </p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEventType(null);
              setFormData({
                companyName: '',
                position: '',
                location: '',
                notes: '',
                url: '',
                interviewType: 'technical',
                interviewTime: moment(selectedDate).format('HH:mm'),
                contactName: '',
                contactEmail: '',
              });
              onClose();
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>
        
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-5">
          {/* Sélection du type d'événement - Cartes visuelles */}
          {!eventType && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">
                What would you like to add?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.button
              type="button"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
              onClick={() => setEventType('application')}
                  className="group relative p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-500 dark:hover:border-purple-500 transition-all text-left"
                >
                  <div className="flex flex-col items-start gap-3">
                    <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                      <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                        Job Application
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Track a new job application you've submitted
                      </p>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  </div>
                </motion.button>
                
                <motion.button
              type="button"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
              onClick={() => setEventType('interview')}
                  className="group relative p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all text-left"
                >
                  <div className="flex flex-col items-start gap-3">
                    <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                      <CalIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
              Interview
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Schedule or log an interview for a position
                      </p>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  </div>
                </motion.button>
              </div>
            </div>
          )}

          {/* Bouton pour changer de type si déjà sélectionné */}
          {eventType && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                {eventType === 'application' ? (
                  <>
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <Briefcase className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">Adding Job Application</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Track a new application</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                      <CalIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">Adding Interview</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Schedule or log an interview</p>
                    </div>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setEventType(eventType === 'application' ? 'interview' : 'application');
                  setSelectedApplication(null);
                  setLinkedApplicationId(null);
                  setSearchQuery('');
                  setFormData(prev => ({
                    ...prev,
                    companyName: '',
                    position: '',
                    location: '',
                  }));
                }}
                className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
              >
                Switch
          </button>
        </div>
          )}

          {/* Recherche de candidature existante pour les interviews */}
          {eventType === 'interview' && (
            <div className="space-y-2 application-search-container">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                <Link className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Link to Existing Application (Optional)
              </label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowApplicationDropdown(true);
                    }}
                    onFocus={() => setShowApplicationDropdown(true)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Search by company or position..."
                  />
                  {selectedApplication && (
            <button
              type="button"
                      onClick={() => {
                        setSelectedApplication(null);
                        setLinkedApplicationId(null);
                        setSearchQuery('');
                        setFormData(prev => ({
                          ...prev,
                          companyName: '',
                          position: '',
                          location: '',
                        }));
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
            </button>
                  )}
                </div>
                
                {/* Dropdown avec les résultats de recherche */}
                <AnimatePresence>
                  {showApplicationDropdown && searchQuery && !selectedApplication && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                    >
                      {applications
                        .filter(app => 
                          app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.position.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .slice(0, 5)
                        .map((app) => (
            <button
                            key={app.id}
              type="button"
                            onClick={() => {
                              setSelectedApplication(app);
                              setLinkedApplicationId(app.id);
                              setSearchQuery(`${app.companyName} - ${app.position}`);
                              setFormData(prev => ({
                                ...prev,
                                companyName: app.companyName,
                                position: app.position,
                                location: app.location || prev.location,
                              }));
                              setShowApplicationDropdown(false);
                              toast.success('Application linked successfully');
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
                                <Building className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                  {app.companyName}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                  {app.position}
                                </p>
                                {app.location && (
                                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {app.location}
                                  </p>
                                )}
                              </div>
                            </div>
            </button>
                        ))}
                      {applications.filter(app => 
                        app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        app.position.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                          No applications found
          </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {selectedApplication && (
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-300">
                        Linked to: {selectedApplication.companyName} - {selectedApplication.position}
                      </p>
                      <p className="text-xs text-purple-700 dark:text-purple-400 mt-0.5">
                        Fields will be pre-filled from this application
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Search for an existing job application to link this interview. Fields will be auto-filled.
              </p>
            </div>
          )}
          
            {/* Formulaire - affiché seulement si un type est sélectionné */}
            {eventType && (
              <>
            {/* Job URL - Featured First with AI Emphasis (only for applications) */}
            {eventType === 'application' && (
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  <Link className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Job Posting URL
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 opacity-75 blur-sm group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative rounded-xl p-[2px] bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500">
                    <div className="relative flex rounded-xl bg-white dark:bg-gray-800/95 overflow-hidden">
                      <input
                        type="url"
                        value={formData.url || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                        className="flex-1 px-4 py-3.5 rounded-l-xl bg-transparent border-0 focus:ring-0 focus:outline-none text-base placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-100"
                        placeholder="https://linkedin.com/jobs/view/..."
                        autoFocus
                      />
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleExtractJobInfo}
                        disabled={isAnalyzingJob || !formData.url || !formData.url.trim()}
                        className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-r-xl bg-gray-800 dark:bg-gray-700 text-white hover:bg-gray-700 dark:hover:bg-gray-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                        title="Extract job information with AI"
                      >
                        {isAnalyzingJob ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                            <span className="text-sm font-medium whitespace-nowrap">Extracting...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-medium whitespace-nowrap">Extract</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Paste the job posting URL and our AI will extract all information automatically</span>
                </div>
              </div>
            )}

            {/* Divider with subtle animation */}
            {(formData.companyName || formData.position || formData.location) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-2 border-t border-gray-200 dark:border-gray-700"
              >
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span>AI extracted information below</span>
                </p>
              </motion.div>
            )}
            
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter company name"
              />
            </div>
            
            {/* Position */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Position *
              </label>
              <input
                type="text"
                required
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter position"
              />
            </div>
            
            {/* Location */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Location {eventType === 'application' ? '*' : ''}
              </label>
              <input
                type="text"
                required={eventType === 'application'}
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter location"
              />
            </div>
            
            {/* Champs spécifiques pour les entretiens */}
            {eventType === 'interview' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Interview Type</label>
                  <select
                    value={formData.interviewType}
                    onChange={(e) => setFormData(prev => ({ ...prev, interviewType: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="technical">Technical</option>
                    <option value="hr">HR</option>
                    <option value="manager">Manager</option>
                    <option value="final">Final</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Time</label>
                  <input
                    type="time"
                    value={formData.interviewTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, interviewTime: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Contact Name</label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter contact name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter contact email"
                  />
                </div>
              </>
            )}
            
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 min-h-[100px] focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                placeholder="Add any relevant notes..."
                rows={3}
              />
            </div>
            </>
            )}
          </form>
          </div>
          
        {/* Footer with action buttons */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium active:scale-95"
            >
              Cancel
            </button>
            <button
            type="button"
            onClick={handleSubmit}
              disabled={isSubmitting || !eventType}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed font-medium active:scale-95 flex items-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <>
                <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
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
  );
};


export default function CalendarView() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'month' | 'week' | 'day'>('month');
  const [showApplications, setShowApplications] = useState(true);
  const [showInterviews, setShowInterviews] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [justSelectedEvent, setJustSelectedEvent] = useState(false);

  // Styles personnalisés pour améliorer la lisibilité et l'élégance en dark mode et light mode
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerText = `
      /* ===== STYLES GÉNÉRAUX DU CALENDRIER ===== */
      
      /* Fond principal du calendrier - LIGHT MODE */
      .rbc-calendar {
        background-color: #FFFFFF !important;
        color: #1F2937 !important;
      }
      
      /* Fond principal du calendrier - DARK MODE */
      .dark .rbc-calendar {
        background-color: #0F172A !important;
        color: #F1F5F9 !important;
      }
      
      /* ===== LIGHT MODE STYLES ===== */
      
      /* En-têtes de colonnes (jours de la semaine) - LIGHT MODE */
      .rbc-header {
        background: linear-gradient(to bottom, #F9FAFB 0%, #F3F4F6 100%) !important;
        border-bottom: 1px solid rgba(229, 231, 235, 0.8) !important;
        color: #374151 !important;
        font-weight: 600 !important;
        font-size: 13px !important;
        padding: 12px 8px !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
      }
      
      /* Cellules du calendrier - LIGHT MODE */
      .rbc-day-bg {
        background-color: #FFFFFF !important;
        border: 1px solid rgba(229, 231, 235, 0.6) !important;
        transition: background-color 0.2s ease-in-out !important;
      }
      
      .rbc-day-bg:hover {
        background-color: #F9FAFB !important;
      }
      
      /* Cellules de dates - LIGHT MODE */
      .rbc-date-cell {
        color: #1F2937 !important;
        font-size: 15px !important;
        font-weight: 500 !important;
        padding: 8px !important;
      }
      
      .rbc-date-cell a {
        color: #1F2937 !important;
        transition: color 0.2s ease-in-out !important;
      }
      
      .rbc-date-cell a:hover {
        color: #8B5CF6 !important;
      }
      
      /* Jour actuel - LIGHT MODE */
      .rbc-today {
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%) !important;
        border-left: 3px solid #8B5CF6 !important;
      }
      
      .rbc-today .rbc-date-cell a {
        color: #8B5CF6 !important;
        font-weight: 700 !important;
      }
      
      /* Weekends - LIGHT MODE */
      .rbc-off-range-bg.rbc-day-bg:first-child,
      .rbc-off-range-bg.rbc-day-bg:last-child {
        background-color: #F9FAFB !important;
      }
      
      /* Jours hors mois - LIGHT MODE */
      .rbc-off-range-bg {
        background-color: #FAFAFA !important;
      }
      
      .rbc-off-range {
        background-color: #FAFAFA !important;
        color: rgba(107, 114, 128, 0.5) !important;
      }
      
      .rbc-day-bg.rbc-off-range-bg {
        background-color: #FAFAFA !important;
      }
      
      .rbc-date-cell.rbc-off-range {
        background-color: #FAFAFA !important;
        color: rgba(107, 114, 128, 0.5) !important;
      }
      
      .rbc-date-cell.rbc-off-range a {
        color: rgba(107, 114, 128, 0.5) !important;
      }
      
      .rbc-day-slot.rbc-off-range-bg {
        background-color: #FAFAFA !important;
      }
      
      .rbc-month-view .rbc-day-bg.rbc-off-range-bg {
        background-color: #FAFAFA !important;
      }
      
      .rbc-month-view .rbc-date-cell.rbc-off-range {
        background-color: #FAFAFA !important;
      }
      
      .rbc-month-view .rbc-date-cell.rbc-off-range a {
        color: rgba(107, 114, 128, 0.5) !important;
      }
      
      /* Bordures et séparateurs - LIGHT MODE */
      .rbc-month-view,
      .rbc-time-view,
      .rbc-day-view {
        border: 1px solid rgba(229, 231, 235, 0.8) !important;
      }
      
      .rbc-month-view .rbc-day-bg {
        border: 1px solid rgba(229, 231, 235, 0.6) !important;
      }
      
      /* Vue temps (WEEK/DAY) - LIGHT MODE */
      .rbc-time-header {
        border-bottom: 1px solid rgba(229, 231, 235, 0.8) !important;
      }
      
      .rbc-time-header-content {
        border-left: 1px solid rgba(229, 231, 235, 0.6) !important;
      }
      
      .rbc-time-content {
        border-top: 2px solid rgba(229, 231, 235, 0.8) !important;
      }
      
      .rbc-time-slot {
        border-top: 1px solid rgba(243, 244, 246, 0.8) !important;
      }
      
      .rbc-time-slot:first-child {
        border-top: none !important;
      }
      
      .rbc-day-slot {
        background-color: #FFFFFF !important;
      }
      
      .rbc-day-slot .rbc-time-slot {
        border-top: 1px solid rgba(243, 244, 246, 0.8) !important;
      }
      
      .rbc-time-header-gutter,
      .rbc-time-gutter {
        background: linear-gradient(to right, #F9FAFB 0%, #FFFFFF 100%) !important;
        border-right: 1px solid rgba(229, 231, 235, 0.8) !important;
      }
      
      .rbc-time-gutter .rbc-timeslot-group {
        border-bottom: 1px solid rgba(243, 244, 246, 0.8) !important;
      }
      
      .rbc-label {
        color: #6B7280 !important;
        font-size: 12px !important;
        font-weight: 500 !important;
      }
      
      /* Vue agenda - LIGHT MODE */
      .rbc-agenda-view table {
        background-color: #FFFFFF !important;
      }
      
      .rbc-agenda-view table thead > tr > th {
        background: linear-gradient(to bottom, #F9FAFB 0%, #F3F4F6 100%) !important;
        border-bottom: 1px solid rgba(229, 231, 235, 0.8) !important;
        color: #374151 !important;
        font-weight: 600 !important;
      }
      
      .rbc-agenda-view table tbody > tr > td {
        border-bottom: 1px solid rgba(243, 244, 246, 0.8) !important;
        color: #1F2937 !important;
      }
      
      .rbc-agenda-view table tbody > tr:hover > td {
        background-color: #F9FAFB !important;
      }
      
      /* Scrollbar personnalisée - LIGHT MODE */
      .rbc-calendar::-webkit-scrollbar {
        width: 8px !important;
        height: 8px !important;
      }
      
      .rbc-calendar::-webkit-scrollbar-track {
        background: #F3F4F6 !important;
      }
      
      .rbc-calendar::-webkit-scrollbar-thumb {
        background: #D1D5DB !important;
        border-radius: 4px !important;
      }
      
      .rbc-calendar::-webkit-scrollbar-thumb:hover {
        background: #9CA3AF !important;
      }
      
      /* ===== DARK MODE STYLES ===== */
      
      /* En-têtes de colonnes (jours de la semaine) - Spécificité maximale */
      .dark .rbc-calendar .rbc-header,
      .dark .rbc-month-view .rbc-header,
      .dark .rbc-time-header .rbc-header,
      .dark .rbc-day-view .rbc-header,
      .dark .rbc-week-view .rbc-header,
      .dark .rbc-agenda-view .rbc-header {
        background-color: #334155 !important;
        background: #334155 !important;
        border-bottom: 1px solid rgba(51, 65, 85, 0.6) !important;
        color: #FFFFFF !important;
        font-weight: 700 !important;
        font-size: 13px !important;
        padding: 12px 8px !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2) !important;
      }
      
      /* S'assurer que tous les éléments dans les en-têtes héritent de la couleur blanche */
      .dark .rbc-calendar .rbc-header *,
      .dark .rbc-month-view .rbc-header *,
      .dark .rbc-time-header .rbc-header * {
        color: #FFFFFF !important;
      }
      
      .dark .rbc-calendar .rbc-header a,
      .dark .rbc-month-view .rbc-header a,
      .dark .rbc-time-header .rbc-header a {
        color: #FFFFFF !important;
        font-weight: 700 !important;
      }
      
      .dark .rbc-calendar .rbc-header button,
      .dark .rbc-month-view .rbc-header button,
      .dark .rbc-time-header .rbc-header button {
        color: #FFFFFF !important;
      }
      
      /* Forcer le fond sur les éléments parents si nécessaire */
      .dark .rbc-time-header {
        background-color: #1E293B !important;
        background: #1E293B !important;
      }
      
      /* Cellules du calendrier */
      .dark .rbc-day-bg {
        background-color: #1E293B !important;
        border: 1px solid rgba(51, 65, 85, 0.3) !important;
        transition: background-color 0.2s ease-in-out !important;
      }
      
      .dark .rbc-day-bg:hover {
        background-color: #334155 !important;
      }
      
      /* Cellules de dates */
      .dark .rbc-date-cell {
        color: #F1F5F9 !important;
        font-size: 15px !important;
        font-weight: 500 !important;
        padding: 8px !important;
      }
      
      .dark .rbc-date-cell a {
        color: #F1F5F9 !important;
        transition: color 0.2s ease-in-out !important;
      }
      
      .dark .rbc-date-cell a:hover {
        color: #8B5CF6 !important;
      }
      
      /* Jour actuel */
      .dark .rbc-today {
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%) !important;
        border-left: 3px solid #8B5CF6 !important;
      }
      
      .dark .rbc-today .rbc-date-cell a {
        color: #8B5CF6 !important;
        font-weight: 700 !important;
      }
      
      /* Weekends - légère teinte différente */
      .dark .rbc-off-range-bg.rbc-day-bg:first-child,
      .dark .rbc-off-range-bg.rbc-day-bg:last-child {
        background-color: rgba(30, 41, 59, 0.6) !important;
      }
      
      /* Jours hors mois */
      .dark .rbc-off-range-bg {
        background-color: rgba(15, 23, 42, 0.4) !important;
      }
      
      .dark .rbc-off-range {
        background-color: rgba(15, 23, 42, 0.4) !important;
        color: rgba(148, 163, 184, 0.4) !important;
      }
      
      .dark .rbc-day-bg.rbc-off-range-bg {
        background-color: rgba(15, 23, 42, 0.4) !important;
      }
      
      .dark .rbc-date-cell.rbc-off-range {
        background-color: rgba(15, 23, 42, 0.4) !important;
        color: rgba(148, 163, 184, 0.4) !important;
      }
      
      .dark .rbc-date-cell.rbc-off-range a {
        color: rgba(148, 163, 184, 0.4) !important;
      }
      
      .dark .rbc-day-slot.rbc-off-range-bg {
        background-color: rgba(15, 23, 42, 0.4) !important;
      }
      
      .dark .rbc-month-view .rbc-day-bg.rbc-off-range-bg {
        background-color: rgba(15, 23, 42, 0.4) !important;
      }
      
      .dark .rbc-month-view .rbc-date-cell.rbc-off-range {
        background-color: rgba(15, 23, 42, 0.4) !important;
      }
      
      .dark .rbc-month-view .rbc-date-cell.rbc-off-range a {
        color: rgba(148, 163, 184, 0.4) !important;
      }
      
      /* Bordures et séparateurs */
      .dark .rbc-month-view,
      .dark .rbc-time-view,
      .dark .rbc-day-view {
        border: 1px solid rgba(51, 65, 85, 0.5) !important;
      }
      
      .dark .rbc-month-view .rbc-day-bg {
        border: 1px solid rgba(51, 65, 85, 0.3) !important;
      }
      
      /* ===== STYLES DES ÉVÉNEMENTS ===== */
      
      .rbc-event {
        margin-bottom: 3px !important;
        border-radius: 8px !important;
        overflow: hidden !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        border: none !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        position: relative !important;
      }
      
      /* Ombres plus prononcées en dark mode */
      .dark .rbc-event {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25) !important;
      }
      
      /* Gradient subtil sur les événements - LIGHT MODE */
      .rbc-event::before {
        content: '' !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 100%) !important;
        pointer-events: none !important;
      }
      
      /* Gradient subtil sur les événements - DARK MODE */
      .dark .rbc-event::before {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%) !important;
      }
      
      /* Hover - LIGHT MODE */
      .rbc-event:hover {
        transform: translateY(-1px) scale(1.01) !important;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15), 0 0 0 2px rgba(139, 92, 246, 0.25) !important;
        z-index: 10 !important;
      }
      
      /* Hover - DARK MODE */
      .dark .rbc-event:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25), 0 0 0 2px rgba(139, 92, 246, 0.3) !important;
      }
      
      .rbc-event:active {
        cursor: grabbing !important;
        transform: scale(0.98) !important;
      }
      
      .rbc-event:last-child {
        margin-bottom: 0 !important;
      }
      
      /* Événements en vue mois - LIGHT MODE */
      .rbc-month-view .rbc-event {
        min-height: 24px !important;
        margin-bottom: 3px !important;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1) !important;
      }
      
      /* Événements en vue mois - DARK MODE */
      .dark .rbc-month-view .rbc-event {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important;
      }
      
      .rbc-month-view .rbc-day-slot .rbc-events-container {
        margin-right: 0 !important;
        padding: 2px !important;
      }
      
      .rbc-month-view .rbc-day-slot .rbc-event {
        margin-bottom: 3px !important;
      }
      
      /* Événements en vue agenda */
      .rbc-agenda-view .rbc-event {
        min-height: 32px !important;
        margin-bottom: 4px !important;
      }
      
      /* Événements en vue temps */
      .rbc-time-view .rbc-event {
        min-height: 32px !important;
        margin-bottom: 4px !important;
      }
      
      /* Contenu des événements */
      .rbc-event-content {
        display: flex !important;
        align-items: center !important;
        width: 100% !important;
        height: 100% !important;
        padding: 4px 8px !important;
        position: relative !important;
        z-index: 1 !important;
      }
      
      /* Événement sélectionné - LIGHT MODE */
      .rbc-event.rbc-selected {
        outline: 2px solid rgba(139, 92, 246, 0.5) !important;
        outline-offset: 2px !important;
        box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3) !important;
      }
      
      /* Événement sélectionné - DARK MODE */
      .dark .rbc-event.rbc-selected {
        outline: 2px solid rgba(139, 92, 246, 0.6) !important;
        box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4) !important;
      }
      
      /* ===== DRAG AND DROP ===== */
      
      .rbc-addons-dnd-drag-preview {
        opacity: 0.85 !important;
        z-index: 1000 !important;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4) !important;
        transform: rotate(2deg) !important;
        filter: blur(0.5px) !important;
      }
      
      .rbc-addons-dnd-dragging {
        opacity: 0.4 !important;
      }
      
      .rbc-addons-dnd-drag-preview .rbc-event {
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4) !important;
      }
      
      /* ===== VUE TEMPS (WEEK/DAY) ===== */
      
      .dark .rbc-time-header {
        border-bottom: 1px solid rgba(51, 65, 85, 0.5) !important;
      }
      
      .dark .rbc-time-header-content {
        border-left: 1px solid rgba(51, 65, 85, 0.3) !important;
      }
      
      .dark .rbc-time-content {
        border-top: 2px solid rgba(51, 65, 85, 0.5) !important;
      }
      
      .dark .rbc-time-slot {
        border-top: 1px solid rgba(51, 65, 85, 0.2) !important;
      }
      
      .dark .rbc-time-slot:first-child {
        border-top: none !important;
      }
      
      .dark .rbc-day-slot {
        background-color: #1E293B !important;
      }
      
      .dark .rbc-day-slot .rbc-time-slot {
        border-top: 1px solid rgba(51, 65, 85, 0.2) !important;
      }
      
      .dark .rbc-time-header-gutter,
      .dark .rbc-time-gutter {
        background-color: #1E293B !important;
        border-right: 1px solid rgba(51, 65, 85, 0.5) !important;
      }
      
      .dark .rbc-time-gutter .rbc-timeslot-group {
        border-bottom: 1px solid rgba(51, 65, 85, 0.2) !important;
      }
      
      .dark .rbc-label {
        color: #94A3B8 !important;
        font-size: 12px !important;
        font-weight: 500 !important;
      }
      
      /* ===== VUE AGENDA ===== */
      
      .dark .rbc-agenda-view table {
        background-color: #1E293B !important;
      }
      
      .dark .rbc-agenda-view table thead > tr > th {
        background-color: #1E293B !important;
        border-bottom: 1px solid rgba(51, 65, 85, 0.5) !important;
        color: #F1F5F9 !important;
        font-weight: 600 !important;
      }
      
      .dark .rbc-agenda-view table tbody > tr > td {
        border-bottom: 1px solid rgba(51, 65, 85, 0.3) !important;
        color: #F1F5F9 !important;
      }
      
      .dark .rbc-agenda-view table tbody > tr:hover > td {
        background-color: #334155 !important;
      }
      
      /* ===== SCROLLBAR PERSONNALISÉE ===== */
      
      .dark .rbc-calendar::-webkit-scrollbar {
        width: 8px !important;
        height: 8px !important;
      }
      
      .dark .rbc-calendar::-webkit-scrollbar-track {
        background: #1E293B !important;
      }
      
      .dark .rbc-calendar::-webkit-scrollbar-thumb {
        background: #475569 !important;
        border-radius: 4px !important;
      }
      
      .dark .rbc-calendar::-webkit-scrollbar-thumb:hover {
        background: #64748B !important;
      }
      
      /* ===== AMÉLIORATIONS MOBILE ===== */
      
      @media (max-width: 768px) {
        .dark .rbc-calendar .rbc-header,
        .dark .rbc-month-view .rbc-header,
        .dark .rbc-time-header .rbc-header {
          font-size: 11px !important;
          padding: 8px 4px !important;
        }
        
        .dark .rbc-date-cell {
          font-size: 13px !important;
          padding: 6px !important;
        }
        
        .rbc-month-view .rbc-event {
          min-height: 20px !important;
        }
      }
    `;
    // Injecter les styles à la fin du head pour qu'ils soient chargés après ceux de la bibliothèque
    styleSheet.id = 'calendar-custom-styles';
    document.head.appendChild(styleSheet);
    
    return () => {
      const existingStyle = document.getElementById('calendar-custom-styles');
      if (existingStyle && document.head.contains(existingStyle)) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchApplicationsAndInterviews = async () => {
      try {
        setIsLoading(true);
        const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
        const applicationsSnapshot = await getDocs(query(applicationsRef));
        
        const newEvents: CalendarEvent[] = [];
        
        // Convertir les candidatures et entretiens en événements de calendrier
        applicationsSnapshot.forEach((doc) => {
          const application = { id: doc.id, ...doc.data() } as JobApplication;
          
          // Ajouter la date de candidature comme événement
          if (application.appliedDate) {
            const appliedDate = new Date(application.appliedDate);
            newEvents.push({
              id: `app-${application.id}`,
              title: `Applied: ${application.companyName} - ${application.position}`,
              start: appliedDate,
              end: appliedDate,
              allDay: true,
              type: 'application',
              color: '#8b5cf6', // purple
              resource: application
            });
          }
          
          // Ajouter les entretiens comme événements
          if (application.interviews && application.interviews.length > 0) {
            application.interviews.forEach((interview, index) => {
              if (interview.date) {
                const interviewDate = new Date(interview.date);
                const [hours, minutes] = (interview.time || '09:00').split(':').map(Number);
                interviewDate.setHours(hours, minutes);
                
                // Créer une date de fin (par défaut, 1 heure plus tard)
                const endDate = new Date(interviewDate);
                endDate.setHours(endDate.getHours() + 1);
                
                // Couleur basée sur le type d'entretien
                let color = '#6366f1'; // indigo par défaut
                if (interview.type === 'hr') color = '#ec4899'; // pink
                if (interview.type === 'technical') color = '#14b8a6'; // teal
                if (interview.type === 'manager') color = '#f59e0b'; // amber
                if (interview.type === 'final') color = '#22c55e'; // green
                
                // Modifier la couleur si l'entretien est annulé
                if (interview.status === 'cancelled') color = '#ef4444'; // red
                
                newEvents.push({
                  id: `int-${application.id}-${index}`,
                  title: `${interview.type.charAt(0).toUpperCase() + interview.type.slice(1)} Interview: ${application.companyName}`,
                  start: interviewDate,
                  end: endDate,
                  allDay: false,
                  type: 'interview',
                  color,
                  resource: { ...application, interview }
                });
              }
            });
          }
        });
        
        setEvents(newEvents);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
        toast.error('Failed to load calendar data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApplicationsAndInterviews();
  }, [currentUser]);

  // Gestion du drag and drop des événements
  const handleEventDrop = async ({ event, start, end }: any) => {
    if (!currentUser) return;
    
    setIsDragging(false);
    
    // Utiliser end si fourni, sinon calculer la durée à partir de l'événement original
    const eventEnd = end || new Date(start.getTime() + (event.end.getTime() - event.start.getTime()));
    
    try {
      const eventId = event.id;
      const isApplication = event.type === 'application';
      
      if (isApplication) {
        // Mettre à jour la date de candidature
        const applicationId = eventId.replace('app-', '');
        const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
        
        const newDate = moment(start).format('YYYY-MM-DD');
        
        await updateDoc(applicationRef, {
          appliedDate: newDate,
          updatedAt: serverTimestamp(),
          statusHistory: [
            ...(event.resource?.statusHistory || []),
            {
              status: event.resource?.status || 'applied',
              date: newDate,
              notes: 'Date updated via calendar drag and drop'
            }
          ]
        });
        
        // Mettre à jour l'événement local
        setEvents(prev => prev.map(e => 
          e.id === eventId 
            ? { ...e, start, end: start, resource: { ...e.resource, appliedDate: newDate } }
            : e
        ));
        
        toast.success('Application date updated');
      } else {
        // Mettre à jour la date/heure de l'entretien
        const [applicationId, interviewIndex] = eventId.replace('int-', '').split('-');
        const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
        
        // Récupérer l'application actuelle
        const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
        const applicationsSnapshot = await getDocs(query(applicationsRef));
        let currentApplication: any = null;
        
        applicationsSnapshot.forEach(doc => {
          if (doc.id === applicationId) {
            currentApplication = { id: doc.id, ...doc.data() };
          }
        });
        
        if (!currentApplication || !currentApplication.interviews) {
          toast.error('Interview not found');
          return;
        }
        
        // Trouver l'index de l'entretien
        const interviewIndexNum = parseInt(interviewIndex);
        const interview = currentApplication.interviews[interviewIndexNum];
        
        if (!interview) {
          toast.error('Interview not found');
          return;
        }
        
        // Mettre à jour la date et l'heure
        const newDate = moment(start).format('YYYY-MM-DD');
        const newTime = moment(start).format('HH:mm');
        
        const updatedInterviews = currentApplication.interviews.map((int: Interview, idx: number) => 
          idx === interviewIndexNum 
            ? { ...int, date: newDate, time: newTime }
            : int
        );
        
        await updateDoc(applicationRef, {
          interviews: updatedInterviews,
          updatedAt: serverTimestamp()
        });
        
        // Mettre à jour l'événement local - utiliser eventEnd calculé plus haut
        setEvents(prev => prev.map(e => 
          e.id === eventId 
            ? { ...e, start, end: eventEnd, resource: { ...e.resource, interview: { ...interview, date: newDate, time: newTime } } }
            : e
        ));
        
        toast.success('Interview date updated');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
      // Recharger les événements en cas d'erreur
      if (currentUser) {
        const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
        const applicationsSnapshot = await getDocs(query(applicationsRef));
        const newEvents: CalendarEvent[] = [];
        
        applicationsSnapshot.forEach((doc) => {
          const application = { id: doc.id, ...doc.data() } as JobApplication;
          
          if (application.appliedDate) {
            const appliedDate = new Date(application.appliedDate);
            newEvents.push({
              id: `app-${application.id}`,
              title: `Applied: ${application.companyName} - ${application.position}`,
              start: appliedDate,
              end: appliedDate,
              allDay: true,
              type: 'application',
              color: '#8b5cf6',
              resource: application
            });
          }
          
          if (application.interviews && application.interviews.length > 0) {
            application.interviews.forEach((interview, index) => {
              if (interview.date) {
                const interviewDate = new Date(interview.date);
                const [hours, minutes] = (interview.time || '09:00').split(':').map(Number);
                interviewDate.setHours(hours, minutes);
                
                const endDate = new Date(interviewDate);
                endDate.setHours(endDate.getHours() + 1);
                
                let color = '#6366f1';
                if (interview.type === 'hr') color = '#ec4899';
                if (interview.type === 'technical') color = '#14b8a6';
                if (interview.type === 'manager') color = '#f59e0b';
                if (interview.type === 'final') color = '#22c55e';
                if (interview.status === 'cancelled') color = '#ef4444';
                
                newEvents.push({
                  id: `int-${application.id}-${index}`,
                  title: `${interview.type.charAt(0).toUpperCase() + interview.type.slice(1)} Interview: ${application.companyName}`,
                  start: interviewDate,
                  end: endDate,
                  allDay: false,
                  type: 'interview',
                  color,
                  resource: { ...application, interview }
                });
              }
            });
          }
        });
        
        setEvents(newEvents);
      }
    }
  };
  
  const handleEventResize = async ({ event, start, end }: any) => {
    if (!currentUser || event.type === 'application') return; // Les applications sont allDay, pas de resize
    
    setIsDragging(false);
    
    try {
      const eventId = event.id;
      const [applicationId, interviewIndex] = eventId.replace('int-', '').split('-');
      const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
      
      const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
      const applicationsSnapshot = await getDocs(query(applicationsRef));
      let currentApplication: any = null;
      
      applicationsSnapshot.forEach(doc => {
        if (doc.id === applicationId) {
          currentApplication = { id: doc.id, ...doc.data() };
        }
      });
      
      if (!currentApplication || !currentApplication.interviews) {
        return;
      }
      
      const interviewIndexNum = parseInt(interviewIndex);
      const interview = currentApplication.interviews[interviewIndexNum];
      
      if (!interview) {
        return;
      }
      
      // Calculer la nouvelle heure de fin
      const newTime = moment(start).format('HH:mm');
      const newDate = moment(start).format('YYYY-MM-DD');
      
      const updatedInterviews = currentApplication.interviews.map((int: Interview, idx: number) => 
        idx === interviewIndexNum 
          ? { ...int, date: newDate, time: newTime }
          : int
      );
      
      await updateDoc(applicationRef, {
        interviews: updatedInterviews,
        updatedAt: serverTimestamp()
      });
      
      setEvents(prev => prev.map(e => 
        e.id === eventId 
          ? { ...e, start, end, resource: { ...e.resource, interview: { ...interview, date: newDate, time: newTime } } }
          : e
      ));
      
      toast.success('Interview duration updated');
    } catch (error) {
      console.error('Error resizing event:', error);
      toast.error('Failed to update interview duration');
    }
  };

  // Filtre des événements selon les types sélectionnés
  const filteredEvents = events.filter(event => 
    (showApplications && event.type === 'application') || 
    (showInterviews && event.type === 'interview')
  );

  // Personnalisation de l'apparence des événements dans le calendrier
  const eventStyleGetter = (event: CalendarEvent) => {
    // Améliorer les couleurs pour dark mode avec plus de saturation
    const baseColor = event.color || '#8b5cf6';
    
    return {
      style: {
        backgroundColor: baseColor,
        borderRadius: '8px',
        opacity: isDragging ? 0.5 : 1,
        color: 'white',
        border: 'none',
        display: 'block',
        fontWeight: 500,
        padding: '0',
        marginBottom: '3px',
        boxShadow: isDragging 
          ? '0 8px 24px rgba(0, 0, 0, 0.4)' 
          : '0 2px 8px rgba(0, 0, 0, 0.25)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'grab',
        transform: isDragging ? 'scale(0.98)' : 'scale(1)',
        minHeight: selectedView === 'month' ? '24px' : '32px',
        overflow: 'hidden',
        position: 'relative' as const,
      }
    };
  };

  // Navigation dans le calendrier
  const navigateToToday = () => {
    setCurrentDate(new Date());
  };

  const navigateToPrevious = () => {
    const newDate = new Date(currentDate);
    if (selectedView === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (selectedView === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateToNext = () => {
    const newDate = new Date(currentDate);
    if (selectedView === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (selectedView === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };


  // Fonction pour ajouter un événement
  const handleAddEvent = async (eventData: any) => {
    if (!currentUser) return;
    
    try {
      if (eventData.eventType === 'application') {
        // Ajouter une nouvelle candidature
        const applicationData = {
          companyName: eventData.companyName,
          position: eventData.position,
          location: eventData.location || '',
          status: 'applied',
          appliedDate: eventData.date,
          url: eventData.url || '',
          notes: eventData.notes || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          statusHistory: [{
            status: 'applied',
            date: eventData.date,
            notes: 'Application created from calendar'
          }]
        };
        
        const docRef = await addDoc(
          collection(db, 'users', currentUser.uid, 'jobApplications'), 
          applicationData
        );
        
        // Ajouter l'événement au state local
        const newEvent: CalendarEvent = {
          id: `app-${docRef.id}`,
          title: `Applied: ${eventData.companyName} - ${eventData.position}`,
          start: new Date(eventData.date),
          end: new Date(eventData.date),
          allDay: true,
          type: 'application',
          color: '#8b5cf6', // purple
          resource: { id: docRef.id, ...applicationData }
        };
        
        setEvents(prev => [...prev, newEvent]);
        toast.success('Job application added successfully');
      } else {
        // Pour un entretien, vérifier si une candidature existe déjà
        let existingApplication: any = null;
        let applicationId: string;
        
        // Si un ID de candidature est fourni (lié depuis le modal), l'utiliser directement
        if (eventData.linkedApplicationId) {
          applicationId = eventData.linkedApplicationId;
          const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
          const applicationDoc = await getDoc(applicationRef);
          if (applicationDoc.exists()) {
            existingApplication = { id: applicationDoc.id, ...applicationDoc.data() };
          }
        } else {
          // Sinon, chercher par nom d'entreprise et poste (comportement existant)
        const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
        const applicationsSnapshot = await getDocs(query(applicationsRef));
        
        applicationsSnapshot.forEach(doc => {
          const app = doc.data() as any;
          if (
            app.companyName?.toLowerCase() === eventData.companyName.toLowerCase() &&
            app.position?.toLowerCase() === eventData.position.toLowerCase()
          ) {
            existingApplication = { id: doc.id, ...app };
          }
        });
        
        if (existingApplication) {
            // Utiliser la candidature existante trouvée
          applicationId = existingApplication.id;
        } else {
          // Créer une nouvelle candidature
          const applicationData = {
            companyName: eventData.companyName,
            position: eventData.position,
            location: eventData.location || '',
            status: 'interview',
            appliedDate: eventData.date, // Using the same date
            notes: eventData.notes || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            statusHistory: [{
              status: 'applied',
              date: eventData.date,
              notes: 'Application created from calendar'
            }, {
              status: 'interview',
              date: eventData.date,
              notes: 'Interview scheduled from calendar'
            }]
          };
          
          const docRef = await addDoc(
            collection(db, 'users', currentUser.uid, 'jobApplications'), 
            applicationData
          );
          
          applicationId = docRef.id;
          
          // Add the application event too
          const newApplicationEvent: CalendarEvent = {
            id: `app-${docRef.id}`,
            title: `Applied: ${eventData.companyName} - ${eventData.position}`,
            start: new Date(eventData.date),
            end: new Date(eventData.date),
            allDay: true,
            type: 'application',
            color: '#8b5cf6', // purple
            resource: { id: docRef.id, ...applicationData }
          };
          
          setEvents(prev => [...prev, newApplicationEvent]);
          }
        }
        
        // Ajouter l'entretien
        const interviewData = {
          id: crypto.randomUUID(),
          date: eventData.date,
          time: eventData.interviewTime,
          type: eventData.interviewType,
          status: 'scheduled',
          location: eventData.location || '',
          notes: eventData.notes || '',
          contactName: eventData.contactName || '',
          contactEmail: eventData.contactEmail || ''
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
              date: eventData.date,
              notes: 'Interview added from calendar'
            }] : 
            [{
              status: 'applied',
              date: eventData.date,
              notes: 'Application created from calendar'
            }, {
              status: 'interview',
              date: eventData.date,
              notes: 'Interview scheduled from calendar'
            }]
        });
        
        // Déterminer la couleur en fonction du type d'entretien
        let color = '#6366f1'; // indigo par défaut
        if (eventData.interviewType === 'hr') color = '#ec4899'; // pink
        if (eventData.interviewType === 'technical') color = '#14b8a6'; // teal
        if (eventData.interviewType === 'manager') color = '#f59e0b'; // amber
        if (eventData.interviewType === 'final') color = '#22c55e'; // green
        
        // Créer la date et l'heure de l'entretien
        const interviewDate = new Date(eventData.date);
        const [hours, minutes] = eventData.interviewTime.split(':').map(Number);
        interviewDate.setHours(hours, minutes);
        
        // Créer une date de fin (par défaut, 1 heure plus tard)
        const endDate = new Date(interviewDate);
        endDate.setHours(endDate.getHours() + 1);
        
        // Ajouter l'événement d'entretien au state local
        const newInterviewEvent: CalendarEvent = {
          id: `int-${applicationId}-${interviewData.id}`,
          title: `${eventData.interviewType.charAt(0).toUpperCase() + eventData.interviewType.slice(1)} Interview: ${eventData.companyName}`,
          start: interviewDate,
          end: endDate,
          allDay: false,
          type: 'interview',
          color,
          resource: { 
            id: applicationId, 
            companyName: eventData.companyName,
            position: eventData.position,
            interview: interviewData
          }
        };
        
        setEvents(prev => [...prev, newInterviewEvent]);
        toast.success('Interview added successfully');
      }
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Failed to add event');
      throw error;
    }
  };

  // Gestion du double-clic sur le calendrier
  const handleSlotSelect = (slotInfo: any) => {
    // Ne pas créer d'événement si on est en train de faire un drag
    if (isDragging) {
      return;
    }
    
    // Vérifier si on a cliqué sur un événement existant
    const clickedEvent = filteredEvents.find(event => {
      const slotStart = moment(slotInfo.start);
      const slotEnd = moment(slotInfo.end || slotInfo.start);
      const eventStart = moment(event.start);
      const eventEnd = moment(event.end);
      
      // Vérifier si le slot sélectionné chevauche avec un événement
      return (slotStart.isSameOrBefore(eventEnd) && slotEnd.isSameOrAfter(eventStart));
    });
    
    // Si on a cliqué sur un événement, ne pas créer de nouvel événement
    if (clickedEvent) {
      return;
    }
    
    // Ne pas créer d'événement si on vient de cliquer sur un événement existant
    if (justSelectedEvent) {
      return;
    }
    
    setSelectedSlot(slotInfo.start);
    setShowAddEventModal(true);
  };

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header avec animation */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-purple-600 dark:text-white mb-2">
            Calendar View
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Visualize and manage your job applications and interviews. Drag events to reschedule them.
          </p>
        </motion.div>

        {/* Contrôles avec animation */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-6"
        >
          {/* View selection */}
          <div className="flex flex-wrap gap-2 bg-gray-50 dark:bg-gray-800/50 p-1 rounded-xl">
            <button
              onClick={() => setSelectedView('month')}
              className={`px-4 py-2 text-sm rounded-lg flex items-center font-medium transition-all duration-200 ${
                selectedView === 'month' 
                ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Month
            </button>
            <button
              onClick={() => setSelectedView('week')}
              className={`px-4 py-2 text-sm rounded-lg flex items-center font-medium transition-all duration-200 ${
                selectedView === 'week' 
                ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Week
            </button>
            <button
              onClick={() => setSelectedView('day')}
              className={`px-4 py-2 text-sm rounded-lg flex items-center font-medium transition-all duration-200 ${
                selectedView === 'day' 
                ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Day
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <motion.label 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-4 py-2 text-sm rounded-lg flex items-center cursor-pointer transition-all duration-200 ${
                showApplications 
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-sm' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <input 
                type="checkbox" 
                checked={showApplications} 
                onChange={() => setShowApplications(!showApplications)} 
                className="sr-only"
              />
              <Briefcase className="w-4 h-4 mr-2" />
              Applications
              {showApplications && <Check className="w-4 h-4 ml-2" />}
            </motion.label>
            <motion.label 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-4 py-2 text-sm rounded-lg flex items-center cursor-pointer transition-all duration-200 ${
                showInterviews 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 shadow-sm' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <input 
                type="checkbox" 
                checked={showInterviews} 
                onChange={() => setShowInterviews(!showInterviews)} 
                className="sr-only" 
              />
              <CalIcon className="w-4 h-4 mr-2" />
              Interviews
              {showInterviews && <Check className="w-4 h-4 ml-2" />}
            </motion.label>
          </div>
        </motion.div>
        
        {/* Calendrier avec navigation améliorée */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg overflow-hidden"
        >
          {/* Contrôles de navigation du calendrier */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-800">
            <div className="flex items-center gap-3">
              <button 
                onClick={navigateToPrevious}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:scale-95"
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={navigateToToday}
                className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors active:scale-95 shadow-sm"
              >
                Today
              </button>
              <button 
                onClick={navigateToNext}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:scale-95"
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold ml-2 text-gray-900 dark:text-gray-100">
                {selectedView === 'month' && moment(currentDate).format('MMMM YYYY')}
                {selectedView === 'week' && `Week of ${moment(currentDate).startOf('week').format('MMM D')} - ${moment(currentDate).endOf('week').format('MMM D, YYYY')}`}
                {selectedView === 'day' && moment(currentDate).format('dddd, MMMM D, YYYY')}
              </h2>
            </div>
            
            {/* Hint pour drag and drop */}
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <GripVertical className="w-4 h-4" />
              <span>Drag events to reschedule</span>
            </div>
          </div>

          {/* Calendrier */}
          <div className="h-[75vh] p-4 bg-white dark:bg-slate-900 rounded-b-2xl">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading calendar...</p>
                </div>
              </div>
            ) : (
              <DragAndDropCalendar
                localizer={localizer}
                events={filteredEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                views={['month', 'week', 'day']}
                view={selectedView}
                date={currentDate}
                onNavigate={(date: Date) => setCurrentDate(date)}
                onView={(view: string) => setSelectedView(view as 'month' | 'week' | 'day')}
                eventPropGetter={eventStyleGetter}
                popup
                tooltipAccessor={(event: CalendarEvent) => `${event.title}`}
                onSelectEvent={(event: CalendarEvent) => {
                  // Ne pas ouvrir le modal si on est en train de faire un drag
                  if (isDragging) {
                    return;
                  }
                  setJustSelectedEvent(true);
                  setSelectedEvent(event);
                  // Réinitialiser le flag après un délai pour éviter les doubles déclenchements
                  setTimeout(() => {
                    setJustSelectedEvent(false);
                  }, 300);
                }}
                selectable={true}
                onSelectSlot={handleSlotSelect}
                draggableAccessor={() => true}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
                resizable
                onDragStart={() => {
                  setIsDragging(true);
                  setJustSelectedEvent(false); // Réinitialiser le flag lors du drag
                }}
                dayPropGetter={(date: Date) => {
                  const today = new Date();
                  const isToday = 
                    date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();
                  
                  // Détecter les weekends (samedi = 6, dimanche = 0)
                  const dayOfWeek = date.getDay();
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  
                  if (isToday) {
                    return {
                      className: 'rbc-today',
                      style: {
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)',
                        borderLeft: '3px solid #8b5cf6',
                      },
                    };
                  }
                  
                  // Légère teinte différente pour les weekends en dark mode
                  if (isWeekend) {
                    return {
                      style: {
                        backgroundColor: 'rgba(30, 41, 59, 0.6)',
                      },
                    };
                  }
                  
                  return {};
                }}
                components={{
                  toolbar: () => null,
                  event: ({ event }: any) => (
                    <div 
                      className="rbc-event-content flex items-center gap-1.5 min-h-[24px] px-2 py-1.5"
                      style={{
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      <GripVertical className="w-3 h-3 opacity-70 flex-shrink-0" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }} />
                      <span className="flex-1 truncate text-xs font-semibold leading-tight" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>
                        {event.title}
                      </span>
                    </div>
                  ),
                  month: {
                    event: ({ event }: any) => (
                      <div 
                        className="rbc-event-content flex items-center gap-1.5 min-h-[24px] px-1.5 py-1 mb-0.5 last:mb-0"
                        style={{
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                        }}
                      >
                        <GripVertical className="w-2.5 h-2.5 opacity-70 flex-shrink-0" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }} />
                        <span className="flex-1 truncate text-xs font-semibold leading-tight" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>
                          {event.title}
                        </span>
                      </div>
                    ),
                  },
                }}
              />
            )}
          </div>
        </motion.div>
        
        {/* Modal pour les détails d'événement */}
        <AnimatePresence>
        {selectedEvent && (
          <EventModal 
            event={selectedEvent} 
            onClose={() => setSelectedEvent(null)} 
          />
        )}
        </AnimatePresence>
        
        {/* Modal pour ajouter un événement */}
        <AnimatePresence>
        {showAddEventModal && selectedSlot && (
          <AddEventModal
            selectedDate={selectedSlot}
            onClose={() => {
              setShowAddEventModal(false);
              setSelectedSlot(null);
            }}
            onAddEvent={handleAddEvent}
          />
        )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
}