import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Loader2, Info, Briefcase, Sparkles } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from '../../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { notify } from '@/lib/notify';
import { pdfToImages } from '../../../lib/pdfToImages';
import { extractCVTextAndTags, ExtractedExperience } from '../../../lib/cvTextExtraction';
import { extractFullProfileFromText } from '../../../lib/cvExperienceExtractor';

interface CVUploadStepProps {
  cvUrl?: string;
  cvName?: string;
  onNext: (data: {
    cvUrl: string;
    cvName: string;
    cvText?: string;
    cvTechnologies?: string[];
    cvSkills?: string[];
    professionalHistory?: ExtractedExperience[];
    // Full profile extraction data
    skills?: string[];
    tools?: string[];
    languages?: Array<{ language: string; level: string }>;
    educations?: any[];
    professionalSummary?: string;
    profileTags?: string[];
  }) => void;
  onBack: () => void;
}

interface FullProfileData {
  skills: string[];
  tools: string[];
  languages: Array<{ language: string; level: string }>;
  educations: any[];
  professionalSummary: string;
  profileTags: string[];
}

export default function CVUploadStep({ cvUrl, cvName, onNext, onBack }: CVUploadStepProps) {
  const { currentUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isExtractingProfile, setIsExtractingProfile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadedCvUrl, setUploadedCvUrl] = useState<string>(cvUrl || '');
  const [uploadedCvName, setUploadedCvName] = useState<string>(cvName || '');
  const [uploadedCvText, setUploadedCvText] = useState<string>('');
  const [uploadedCvTechnologies, setUploadedCvTechnologies] = useState<string[]>([]);
  const [uploadedCvSkills, setUploadedCvSkills] = useState<string[]>([]);
  const [uploadedExperiences, setUploadedExperiences] = useState<ExtractedExperience[]>([]);
  const [fullProfileData, setFullProfileData] = useState<FullProfileData | null>(null);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  // Update local state when props change
  useEffect(() => {
    setUploadedCvUrl(cvUrl || '');
    setUploadedCvName(cvName || '');
  }, [cvUrl, cvName]);

  const handleFileUpload = async (selectedFile: File) => {
    if (!selectedFile || !currentUser) return;

    // Validate file size (5MB limit)
    if (selectedFile.size > 5 * 1024 * 1024) {
      notify.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(selectedFile.type)) {
      notify.error('Please upload a PDF or Word document');
      return;
    }

    try {
      setIsUploading(true);
      setFile(selectedFile);

      // Upload to Firebase Storage
      const cvRef = ref(storage, `cvs/${currentUser.uid}/${selectedFile.name}`);
      await uploadBytes(cvRef, selectedFile);
      const downloadUrl = await getDownloadURL(cvRef);

      // Store in local state
      setUploadedCvUrl(downloadUrl);
      setUploadedCvName(selectedFile.name);

      // Extract text, tags, and experiences
      try {
        notify.info('Analyzing your CV...');
        const images = await pdfToImages(selectedFile, 2, 1.5);
        const { text, technologies, skills, experiences } = await extractCVTextAndTags(images);

        setUploadedCvText(text);
        setUploadedCvTechnologies(technologies);
        setUploadedCvSkills(skills);
        if (experiences && experiences.length > 0) {
          setUploadedExperiences(experiences);
        }

        const expCount = experiences?.length || 0;
        notify.success(`CV analyzed! Found ${technologies.length} technologies, ${skills.length} skills${expCount > 0 ? `, and ${expCount} experiences` : ''}`);

        // Run full profile extraction in the background to populate ProfessionalProfile
        if (text && text.length > 100) {
          setIsExtractingProfile(true);
          try {
            console.log('🔄 Starting full profile extraction from CV...');
            const extractedProfile = await extractFullProfileFromText(text);

            // Prepare the full profile data
            const profileData: FullProfileData = {
              skills: extractedProfile.skills || [],
              tools: extractedProfile.tools || [],
              languages: extractedProfile.languages || [],
              educations: extractedProfile.educations || [],
              professionalSummary: extractedProfile.summary || '',
              profileTags: extractedProfile.profileTags || [],
            };

            setFullProfileData(profileData);

            // Save full profile data directly to Firestore (don't wait for user to visit profile page)
            if (currentUser) {
              const userRef = doc(db, 'users', currentUser.uid);
              const updateData: Record<string, any> = {
                // Basic CV data
                cvText: text,
                cvTechnologies: technologies || [],
                cvSkills: skills || [],
              };

              // Add experiences if extracted
              if (experiences && experiences.length > 0) {
                // Convert to professionalHistory format
                const formattedExperiences = experiences.map(exp => ({
                  title: exp.title,
                  company: exp.company,
                  companyLogo: '',
                  startDate: exp.startDate,
                  endDate: exp.endDate,
                  current: exp.current,
                  industry: exp.industry || '',
                  contractType: exp.contractType || 'full-time',
                  location: exp.location || '',
                  responsibilities: exp.responsibilities?.length > 0 ? exp.responsibilities : [''],
                  achievements: []
                }));
                updateData.professionalHistory = formattedExperiences;
              }

              // Add full profile extraction data
              if (extractedProfile.personalInfo?.firstName) {
                updateData.firstName = extractedProfile.personalInfo.firstName;
              }
              if (extractedProfile.personalInfo?.lastName) {
                updateData.lastName = extractedProfile.personalInfo.lastName;
              }
              if (extractedProfile.personalInfo?.city) {
                updateData.city = extractedProfile.personalInfo.city;
              }
              if (extractedProfile.personalInfo?.country) {
                updateData.country = extractedProfile.personalInfo.country;
              }
              if (extractedProfile.personalInfo?.headline) {
                updateData.targetPosition = extractedProfile.personalInfo.headline;
                updateData.headline = extractedProfile.personalInfo.headline;
              }

              // Skills & Tools
              if (extractedProfile.skills?.length > 0) {
                updateData.skills = extractedProfile.skills;
              }
              if (extractedProfile.tools?.length > 0) {
                updateData.tools = extractedProfile.tools;
              }

              // Languages
              if (extractedProfile.languages?.length > 0) {
                updateData.languages = extractedProfile.languages;
              }

              // Educations
              if (extractedProfile.educations?.length > 0) {
                updateData.educations = extractedProfile.educations;
                // Also set legacy fields
                const firstEdu = extractedProfile.educations[0];
                if (firstEdu) {
                  updateData.educationLevel = firstEdu.degree;
                  updateData.educationField = firstEdu.field;
                  updateData.educationInstitution = firstEdu.institution;
                  if (firstEdu.endDate) {
                    updateData.graduationYear = firstEdu.endDate.split('-')[0];
                  }
                }
              }

              // Summary & Tags
              if (extractedProfile.summary) {
                updateData.professionalSummary = extractedProfile.summary;
              }
              if (extractedProfile.profileTags?.length > 0) {
                updateData.profileTags = extractedProfile.profileTags;
              }

              // Save to Firestore
              await updateDoc(userRef, {
                ...updateData,
                lastUpdated: new Date().toISOString()
              });

              console.log('✅ Full profile data saved to Firestore:', Object.keys(updateData));

              // Build success message
              const counts = [];
              if (extractedProfile.experiences?.length) counts.push(`${extractedProfile.experiences.length} experiences`);
              if (extractedProfile.educations?.length) counts.push(`${extractedProfile.educations.length} educations`);
              if (extractedProfile.skills?.length) counts.push(`${extractedProfile.skills.length} skills`);
              if (extractedProfile.tools?.length) counts.push(`${extractedProfile.tools.length} tools`);
              if (extractedProfile.languages?.length) counts.push(`${extractedProfile.languages.length} languages`);

              if (counts.length > 0) {
                notify.success(`Profile auto-filled! Extracted ${counts.join(', ')}`);
              }
            }
          } catch (profileError) {
            console.error('Full profile extraction failed:', profileError);
            // Don't show error to user, basic extraction succeeded
          } finally {
            setIsExtractingProfile(false);
          }
        }
      } catch (extractionError) {
        console.error('CV extraction failed:', extractionError);
        notify.warning('CV uploaded but analysis failed');
      }

    } catch (error) {
      console.error('Error uploading CV:', error);
      notify.error('Failed to upload CV');
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await handleFileUpload(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="space-y-6">
      {uploadedCvUrl && uploadedCvName ? (
        <div className="p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{uploadedCvName}</p>
                <p className="text-xs text-green-600 dark:text-green-400">Uploaded successfully</p>
              </div>
            </div>

            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors">
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Change'
              )}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>
          </div>

          {/* Show extraction progress */}
          {isExtractingProfile && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Sparkles className="w-4 h-4 animate-pulse text-purple-500" />
              <span>Analyzing your CV...</span>
            </div>
          )}

          {/* Show extracted data summary */}
          {fullProfileData && !isExtractingProfile && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {fullProfileData.skills.length > 0 && (
                <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded-full">
                  {fullProfileData.skills.length} skills
                </span>
              )}
              {fullProfileData.tools.length > 0 && (
                <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded-full">
                  {fullProfileData.tools.length} tools
                </span>
              )}
              {uploadedExperiences.length > 0 && (
                <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded-full">
                  {uploadedExperiences.length} experiences
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center w-full">
          <label
            className={`flex flex-col w-full py-10 border border-dashed rounded-lg cursor-pointer transition-colors
            ${isDragging
                ? 'border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-white/[0.03]'
                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center">
              {isUploading ? (
                <>
                  <Loader2 className="w-6 h-6 mb-2 text-gray-400 animate-spin" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Uploading...</p>
                </>
              ) : (
                <>
                  <Upload className={`w-6 h-6 mb-2 ${isDragging ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`} />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PDF or Word · Max 5MB</p>
                </>
              )}
            </div>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        </div>
      )}

      {/* Subtle hint */}
      {!uploadedCvUrl && (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          Your CV helps us personalize your experience
        </p>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-6">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Back
        </button>

        <div className="flex items-center gap-3">
          {!uploadedCvUrl && (
            <button
              onClick={() => setShowSkipConfirm(true)}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Skip for now
            </button>
          )}
          <button
            onClick={() => uploadedCvUrl && uploadedCvName && onNext({
              cvUrl: uploadedCvUrl,
              cvName: uploadedCvName,
              cvText: uploadedCvText,
              cvTechnologies: uploadedCvTechnologies,
              cvSkills: uploadedCvSkills,
              professionalHistory: uploadedExperiences.length > 0 ? uploadedExperiences : undefined,
              ...(fullProfileData ? {
                skills: fullProfileData.skills,
                tools: fullProfileData.tools,
                languages: fullProfileData.languages,
                educations: fullProfileData.educations,
                professionalSummary: fullProfileData.professionalSummary,
                profileTags: fullProfileData.profileTags,
              } : {})
            })}
            disabled={!uploadedCvUrl || !uploadedCvName || isExtractingProfile}
            className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium
              disabled:opacity-40 disabled:cursor-not-allowed
              hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors
              flex items-center gap-2"
          >
            {isExtractingProfile ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </div>

      {/* Skip Confirmation Modal */}
      {showSkipConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowSkipConfirm(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-xl"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Skip CV upload?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Your CV helps auto-fill your profile, personalize job recommendations, and improve your applications. You can always upload it later.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSkipConfirm(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900
                  hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Upload CV
              </button>
              <button
                onClick={() => {
                  setShowSkipConfirm(false);
                  onNext({ cvUrl: '', cvName: '' });
                }}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/10
                  hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
              >
                Skip anyway
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
