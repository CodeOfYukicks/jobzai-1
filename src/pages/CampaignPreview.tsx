import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import CampaignForm from '../components/CampaignForm';
import { TemplateSelector } from '../components/TemplateSelector'; // Updated import
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

interface CampaignPreviewProps {
  onBack: () => void;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
}

interface FormData {
  title: string;
  jobTitle: string;
  industry: string;
  jobType: string;
  location: string;
  description: string;
  blacklistedCompanies: { id: string; name: string }[];
  credits: number;
  cv?: File | null;
  templateId: string;
}

export default function CampaignPreview({ onBack }: CampaignPreviewProps) {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState<'details' | 'template'>('details');
  const [formData, setFormData] = useState<FormData>({
    title: '',
    jobTitle: '',
    industry: '',
    jobType: '',
    location: '',
    description: '',
    blacklistedCompanies: [],
    credits: 0,
    cv: null,
    templateId: '',
  });
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const isStepValid = (step: 'details' | 'template') => {
    if (step === 'details') {
      return validateForm();
    }
    return selectedTemplate !== null;
  };

  const validateForm = () => {
    const requiredFields: (keyof FormData)[] = [
      'title',
      'jobTitle',
      'industry',
      'jobType',
      'location',
      'description',
      'credits',
    ];
    return requiredFields.every((field) => formData[field]);
  };

  const handleCreateCampaign = async () => {
    if (!currentUser || !selectedTemplate) {
      toast.error('Please select an email template');
      return;
    }

    try {
      setIsCreating(true);

      let cvUrl = formData.cv;
      
      // Si c'est un fichier, on l'upload
      if (formData.cv instanceof File) {
        const storageRef = ref(storage, `users/${currentUser.uid}/cvs/${formData.cv.name}`);
        await uploadBytes(storageRef, formData.cv);
        cvUrl = await getDownloadURL(storageRef);
      }

      const campaignData = {
        ...formData,
        cv: cvUrl, // Utiliser l'URL du CV (soit existante, soit nouvellement uploadée)
        status: 'pending',
        emailsSent: 0,
        responses: 0,
        createdAt: serverTimestamp(),
        templateId: selectedTemplate.id,
        template: {
          id: selectedTemplate.id,
          name: selectedTemplate.name,
          subject: selectedTemplate.subject,
          content: selectedTemplate.content,
        }
      };

      console.log("Creating campaign with template:", campaignData);

      const campaignsCollection = collection(db, 'users', currentUser.uid, 'campaigns');
      await addDoc(campaignsCollection, campaignData);

      toast.success('Campaign created successfully!');
      onBack();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Campaign</h1>
          <p className="mt-1 text-sm text-gray-500">
            Set up your new job application campaign
          </p>
        </div>
      </div>

      {/* Content */}
      {currentStep === 'details' ? (
        <CampaignForm
          formData={formData}
          onFormChange={setFormData}
          onNext={() => {
            if (validateForm()) {
              setCurrentStep('template');
            } else {
              toast.error('Please fill in all required fields.');
            }
          }}
        />
      ) : (
        <div className="space-y-6">
          <TemplateSelector
            onSelect={setSelectedTemplate}
            selectedTemplateId={selectedTemplate?.id}
          />

          {/* Create Campaign Button */}
          <div className="flex justify-end">
            <button
              onClick={handleCreateCampaign}
              disabled={isCreating || !selectedTemplate}
              className="flex items-center px-6 py-2 bg-[#8D75E6] text-white rounded-lg hover:bg-[#8D75E6]/90 transition-colors disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Creating Campaign...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  <span>Create Campaign</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
