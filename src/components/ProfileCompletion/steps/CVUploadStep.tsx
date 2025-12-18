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
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Upload Your CV</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Upload your CV to help us match you with the right opportunities
        </p>
      </div>

      {uploadedCvUrl && uploadedCvName ? (
        <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700
          shadow-sm dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-[#8D75E6] dark:text-[#A78BFA]" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{uploadedCvName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">CV uploaded successfully</p>
              </div>
            </div>

            <label className="flex items-center px-4 py-2 text-sm font-medium text-[#8D75E6] dark:text-[#A78BFA]
              bg-[#8D75E6]/10 dark:bg-[#8D75E6]/20 rounded-lg cursor-pointer 
              hover:bg-[#8D75E6]/20 dark:hover:bg-[#8D75E6]/30 
              transition-all duration-200
              shadow-sm dark:shadow-[0_2px_4px_rgba(141,117,230,0.2)]
              hover:shadow-md dark:hover:shadow-[0_4px_8px_rgba(141,117,230,0.3)]">
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Change CV
                </>
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

          <div className="mt-4 flex items-center space-x-4 text-sm">
            <a
              href={uploadedCvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8D75E6] dark:text-[#A78BFA] hover:underline flex items-center"
            >
              <FileText className="w-4 h-4 mr-1" />
              View CV
            </a>
          </div>

          {/* Show extraction progress */}
          {isExtractingProfile && (
            <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">
                  Auto-filling your profile...
                </span>
              </div>
              <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                Extracting skills, education, languages and more from your CV
              </p>
            </div>
          )}

          {/* Show extracted experiences summary */}
          {uploadedExperiences.length > 0 && !isExtractingProfile && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <Briefcase className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {uploadedExperiences.length} experience{uploadedExperiences.length > 1 ? 's' : ''} extracted
                </span>
              </div>
              <div className="mt-2 space-y-1">
                {uploadedExperiences.slice(0, 3).map((exp, idx) => (
                  <p key={idx} className="text-xs text-green-600 dark:text-green-400">
                    • {exp.title} at {exp.company}
                  </p>
                ))}
                {uploadedExperiences.length > 3 && (
                  <p className="text-xs text-green-500 dark:text-green-500 italic">
                    +{uploadedExperiences.length - 3} more...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Show full profile extraction success */}
          {fullProfileData && !isExtractingProfile && (
            <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Profile auto-filled!
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {fullProfileData.skills.length > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-800/50 text-purple-700 dark:text-purple-300 rounded-full">
                    {fullProfileData.skills.length} skills
                  </span>
                )}
                {fullProfileData.tools.length > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-800/50 text-purple-700 dark:text-purple-300 rounded-full">
                    {fullProfileData.tools.length} tools
                  </span>
                )}
                {fullProfileData.languages.length > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-800/50 text-purple-700 dark:text-purple-300 rounded-full">
                    {fullProfileData.languages.length} languages
                  </span>
                )}
                {fullProfileData.educations.length > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-800/50 text-purple-700 dark:text-purple-300 rounded-full">
                    {fullProfileData.educations.length} educations
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center w-full">
          <label
            className={`flex flex-col w-full h-32 border-2 border-dashed 
            rounded-lg cursor-pointer 
            transition-all duration-200 bg-white dark:bg-gray-800
            shadow-sm dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)]
            ${isDragging
                ? 'border-[#8D75E6] bg-[#8D75E6]/10 dark:bg-[#8D75E6]/20 shadow-md dark:shadow-[0_4px_8px_rgba(141,117,230,0.3)]'
                : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-[#8D75E6]/50 dark:hover:border-[#8D75E6]/50 hover:shadow-md dark:hover:shadow-[0_4px_8px_rgba(0,0,0,0.3)]'
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {isUploading ? (
                <>
                  <Loader2 className="w-8 h-8 mb-3 text-gray-400 dark:text-gray-500 animate-spin" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Uploading...</p>
                </>
              ) : (
                <>
                  <Upload className={`w-8 h-8 mb-3 ${isDragging ? 'text-[#8D75E6] dark:text-[#A78BFA]' : 'text-gray-400 dark:text-gray-500'}`} />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">PDF or Word (MAX. 5MB)</p>
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

      {/* Info box about CV importance */}
      {!uploadedCvUrl && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                Why upload your CV?
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Your CV helps our AI understand your experience, skills, and background to provide more relevant job recommendations and personalized suggestions.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium"
        >
          Back
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNext({ cvUrl: '', cvName: '' })}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium
              border border-gray-300 dark:border-gray-600 rounded-lg
              hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200"
          >
            Do it later
          </button>
          <button
            onClick={() => uploadedCvUrl && uploadedCvName && onNext({
              cvUrl: uploadedCvUrl,
              cvName: uploadedCvName,
              cvText: uploadedCvText,
              cvTechnologies: uploadedCvTechnologies,
              cvSkills: uploadedCvSkills,
              professionalHistory: uploadedExperiences.length > 0 ? uploadedExperiences : undefined,
              // Include full profile data if available
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
            className="px-8 py-2 bg-[#8D75E6] dark:bg-[#7C3AED] text-white rounded-lg font-medium
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:bg-[#7D65D6] dark:hover:bg-[#6D28D9] transition-all duration-200
              shadow-md dark:shadow-[0_4px_8px_rgba(141,117,230,0.3)]
              hover:shadow-lg dark:hover:shadow-[0_6px_12px_rgba(141,117,230,0.4)]
              flex items-center gap-2"
          >
            {isExtractingProfile ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Extracting...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
