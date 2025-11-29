import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { CVData, CVEditorSavedState } from '../types/cvEditor';
import { generateId } from './cvEditorUtils';

/**
 * Convert structured data from CV rewrite to our CVData format
 */
function convertStructuredDataToCVData(structuredData: any): CVData {
  console.log('Converting structured data to CVData format:', structuredData);
  
  return {
    personalInfo: {
      firstName: structuredData.personalInfo?.firstName || '',
      lastName: structuredData.personalInfo?.lastName || '',
      email: structuredData.personalInfo?.email || '',
      phone: structuredData.personalInfo?.phone || '',
      location: structuredData.personalInfo?.location || '',
      linkedin: structuredData.personalInfo?.linkedin || '',
      portfolio: structuredData.personalInfo?.portfolio || '',
      github: structuredData.personalInfo?.github || '',
      title: structuredData.personalInfo?.title || structuredData.personalInfo?.jobTitle || ''
    },
    summary: structuredData.summary || '',
    // Note: experiences is plural in structured_data
    experiences: (structuredData.experiences || []).map((exp: any) => ({
      id: exp.id || generateId(),
      title: exp.title || exp.position || '',
      company: exp.company || '',
      location: exp.location || '',
      startDate: exp.startDate || exp.start_date || '',
      endDate: exp.endDate || exp.end_date || '',
      current: exp.current || exp.endDate === 'Present',
      description: exp.description || '',
      bullets: exp.bullets || exp.achievements || []
    })),
    // Note: educations is plural in structured_data
    education: (structuredData.educations || structuredData.education || []).map((edu: any) => ({
      id: edu.id || generateId(),
      degree: edu.degree || '',
      field: edu.field || edu.major || '',
      institution: edu.institution || edu.school || '',
      location: edu.location || '',
      startDate: edu.startDate || edu.start_date || '',
      endDate: edu.endDate || edu.end_date || edu.graduationYear || '',
      gpa: edu.gpa || '',
      honors: edu.honors || [],
      coursework: edu.coursework || []
    })),
    skills: Array.isArray(structuredData.skills) 
      ? structuredData.skills.map((skill: string | any) => ({
          id: generateId(),
          name: typeof skill === 'string' ? skill : (skill.name || skill),
          category: typeof skill === 'object' ? (skill.category || 'technical') : 'technical'
        }))
      : [],
    certifications: (structuredData.certifications || []).map((cert: any) => ({
      id: cert.id || generateId(),
      name: cert.name || cert.title || '',
      issuer: cert.issuer || cert.organization || '',
      date: cert.date || cert.issue_date || '',
      expiryDate: cert.expiryDate || cert.expiry_date || '',
      credentialId: cert.credentialId || cert.credential_id || '',
      url: cert.url || ''
    })),
    projects: (structuredData.projects || []).map((project: any) => ({
      id: project.id || generateId(),
      name: project.name || project.title || '',
      description: project.description || '',
      technologies: project.technologies || [],
      url: project.url || project.link || '',
      startDate: project.startDate || project.start_date || '',
      endDate: project.endDate || project.end_date || '',
      highlights: project.highlights || project.achievements || []
    })),
    languages: (structuredData.languages || []).map((lang: any) => ({
      id: lang.id || generateId(),
      name: typeof lang === 'string' ? lang : (lang.name || lang.language || ''),
      proficiency: typeof lang === 'object' ? (lang.proficiency || lang.level || 'intermediate') : 'intermediate'
    })),
    sections: [
      { id: 'personal', type: 'personal', title: 'Personal Information', enabled: true, order: 0 },
      { id: 'summary', type: 'summary', title: 'Professional Summary', enabled: !!structuredData.summary, order: 1 },
      { id: 'experience', type: 'experience', title: 'Work Experience', enabled: (structuredData.experiences || []).length > 0, order: 2 },
      { id: 'education', type: 'education', title: 'Education', enabled: (structuredData.educations || structuredData.education || []).length > 0, order: 3 },
      { id: 'skills', type: 'skills', title: 'Skills', enabled: (structuredData.skills || []).length > 0, order: 4 },
      { id: 'certifications', type: 'certifications', title: 'Certifications', enabled: (structuredData.certifications || []).length > 0, order: 5 },
      { id: 'projects', type: 'projects', title: 'Projects', enabled: (structuredData.projects || []).length > 0, order: 6 },
      { id: 'languages', type: 'languages', title: 'Languages', enabled: (structuredData.languages || []).length > 0, order: 7 }
    ]
  };
}

/**
 * Initialize CV data for a user if it doesn't exist
 */
export async function initializeCVData(
  userId: string,
  analysisId?: string,
  userData?: any
): Promise<CVData> {
  const defaultCVData: CVData = {
    personalInfo: {
      firstName: userData?.firstName || '',
      lastName: userData?.lastName || '',
      email: userData?.email || '',
      phone: userData?.phone || '',
      location: userData?.location || '',
      linkedin: userData?.linkedin || '',
      portfolio: userData?.portfolio || '',
      github: userData?.github || '',
      title: userData?.currentPosition || userData?.jobTitle || ''
    },
    summary: userData?.summary || userData?.bio || '',
    experiences: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [],
    languages: [],
    sections: [
      { id: 'personal', type: 'personal', title: 'Personal Information', enabled: true, order: 0 },
      { id: 'summary', type: 'summary', title: 'Professional Summary', enabled: true, order: 1 },
      { id: 'experience', type: 'experience', title: 'Work Experience', enabled: true, order: 2 },
      { id: 'education', type: 'education', title: 'Education', enabled: true, order: 3 },
      { id: 'skills', type: 'skills', title: 'Skills', enabled: true, order: 4 },
      { id: 'certifications', type: 'certifications', title: 'Certifications', enabled: false, order: 5 },
      { id: 'projects', type: 'projects', title: 'Projects', enabled: false, order: 6 },
      { id: 'languages', type: 'languages', title: 'Languages', enabled: false, order: 7 }
    ]
  };

  // Add experiences if available
  if (userData?.experiences && Array.isArray(userData.experiences)) {
    defaultCVData.experiences = userData.experiences.map((exp: any) => ({
      id: exp.id || generateId(),
      title: exp.title || exp.position || '',
      company: exp.company || exp.employer || '',
      location: exp.location || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || (exp.current ? 'Present' : ''),
      current: exp.current || exp.endDate === 'Present',
      description: exp.description || '',
      bullets: exp.achievements || exp.bullets || exp.responsibilities || []
    }));
  }

  // Add education if available
  if (userData?.education && Array.isArray(userData.education)) {
    defaultCVData.education = userData.education.map((edu: any) => ({
      id: edu.id || generateId(),
      degree: edu.degree || '',
      field: edu.field || edu.major || '',
      institution: edu.institution || edu.school || '',
      location: edu.location || '',
      startDate: edu.startDate || '',
      endDate: edu.endDate || edu.graduationYear || '',
      gpa: edu.gpa || '',
      honors: edu.honors || [],
      coursework: edu.coursework || []
    }));
  }

  // Add skills if available
  if (userData?.skills && Array.isArray(userData.skills)) {
    defaultCVData.skills = userData.skills.map((skill: string | any) => ({
      id: generateId(),
      name: typeof skill === 'string' ? skill : skill.name,
      category: typeof skill === 'object' ? skill.category : 'technical'
    }));
  }

  // If we have an analysisId, try to create a cvRewrite document
  if (analysisId) {
    try {
      const cvRewriteRef = doc(db, 'users', userId, 'cvRewrites', analysisId);
      const cvRewriteDoc = await getDoc(cvRewriteRef);
      
      if (!cvRewriteDoc.exists()) {
        // Create a new CV rewrite document
        await setDoc(cvRewriteRef, {
          analysisId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          structured_data: defaultCVData,
          status: 'initialized'
        });
        
        console.log('Created new CV rewrite document for analysis:', analysisId);
      }
    } catch (error) {
      console.error('Error creating CV rewrite document:', error);
    }
  }

  return defaultCVData;
}

/**
 * Load or initialize CV data for the editor
 */
export async function loadOrInitializeCVData(
  userId: string,
  analysisId?: string
): Promise<{ 
  cvData: CVData; 
  jobContext?: any; 
  editorState?: CVEditorSavedState;
  /** Original CV markdown for before/after comparison (deprecated, use originalStructuredData) */
  initialCVMarkdown?: string;
  /** Original CV parsed into structured format for accurate before/after comparison */
  originalStructuredData?: {
    personalInfo: any;
    summary: string;
    experiences: Array<{
      id: string;
      title: string;
      company: string;
      startDate: string;
      endDate: string;
      location?: string;
      bullets: string[];
    }>;
    educations: Array<{
      id: string;
      degree: string;
      institution: string;
      startDate?: string;
      endDate?: string;
      year?: string;
    }>;
    skills: string[];
  };
}> {
  let cvData: CVData;
  let jobContext: any = undefined;
  let editorState: CVEditorSavedState | undefined = undefined;
  let initialCVMarkdown: string | undefined = undefined;
  let originalStructuredData: any = undefined;

  if (analysisId) {
    try {
      // Load the analysis document which contains both cv_rewrite and job context
      const analysisRef = doc(db, 'users', userId, 'analyses', analysisId);
      const analysisDoc = await getDoc(analysisRef);
      
      if (analysisDoc.exists()) {
        const analysisData = analysisDoc.data();
        console.log('Analysis document found:', analysisData);
        
        // Extract job context from analysis
        jobContext = {
          jobTitle: analysisData.jobTitle || '',
          company: analysisData.company || '',
          jobDescription: analysisData.jobDescription || '',
          keywords: analysisData.skillsMatch?.missing?.map((s: any) => s.name) || [],
          strengths: analysisData.keyFindings?.filter((f: string) => 
            f.toLowerCase().includes('strong') || f.toLowerCase().includes('good')
          ) || [],
          gaps: analysisData.keyFindings?.filter((f: string) => 
            f.toLowerCase().includes('missing') || f.toLowerCase().includes('gap')
          ) || []
        };
        console.log('Job context loaded from analysis');
        
        // Check if cv_rewrite exists in the analysis
        if (analysisData.cv_rewrite) {
          const cvRewriteData = analysisData.cv_rewrite;
          console.log('CV Rewrite found in analysis:', cvRewriteData);
          
          // Capture original structured data for before/after comparison (PREFERRED)
          if (cvRewriteData.original_structured_data) {
            originalStructuredData = cvRewriteData.original_structured_data;
            console.log('Using original_structured_data for comparison (best source)');
          }
          
          // Fallback: raw markdown for legacy data
          if (analysisData.originalCV) {
            initialCVMarkdown = analysisData.originalCV;
            console.log('Fallback: Using originalCV from analysis for comparison');
          } else if (cvRewriteData.initial_cv) {
            initialCVMarkdown = cvRewriteData.initial_cv;
            console.log('Fallback: Using initial_cv from cv_rewrite for comparison');
          }
          
          // Load editor state if it exists
          if (cvRewriteData.editor_state) {
            editorState = cvRewriteData.editor_state;
            console.log('Editor state loaded:', editorState);
          }
          
          // Check if structured_data exists
          if (cvRewriteData.structured_data) {
            console.log('Found structured_data, converting to CVData format');
            cvData = convertStructuredDataToCVData(cvRewriteData.structured_data);
            console.log('Converted CV data:', cvData);
            return { cvData, jobContext, editorState, initialCVMarkdown, originalStructuredData };
          }
          
          // If no structured_data but has initial_cv, parse it
          if (cvRewriteData.initial_cv) {
            console.log('No structured_data, parsing initial_cv');
            const { parseCVData } = await import('./cvSectionAI');
            const parsedData = await parseCVData(cvRewriteData);
            cvData = parsedData;
            
            // Save the structured data back to the analysis for future use
            await updateDoc(analysisRef, {
              'cv_rewrite.structured_data': cvData
            });
            
            console.log('Parsed and saved structured CV data');
            return { cvData, jobContext, editorState, initialCVMarkdown, originalStructuredData };
          }
        }
        
        // Fallback: check for original CV in analysis
        if (analysisData.originalCV) {
          console.log('No cv_rewrite, parsing originalCV from analysis');
          // Use originalCV as the initial_cv for comparison
          initialCVMarkdown = analysisData.originalCV;
          const { parseCVData } = await import('./cvSectionAI');
          const parsedData = await parseCVData({ initial_cv: analysisData.originalCV });
          cvData = parsedData;
          console.log('Parsed original CV data');
          return { cvData, jobContext, editorState, initialCVMarkdown, originalStructuredData };
        }
      }
      
      // Old logic for backward compatibility - check cvRewrites collection
      const cvRewriteRef = doc(db, 'users', userId, 'cvRewrites', analysisId);
      const cvRewriteDoc = await getDoc(cvRewriteRef);
      
      if (cvRewriteDoc.exists()) {
        const data = cvRewriteDoc.data();
        console.log('Found data in cvRewrites collection (legacy):', data);
        
        // Load editor state if it exists
        if (data.editor_state) {
          editorState = data.editor_state;
          console.log('Editor state loaded from cvRewrites:', editorState);
        }
        
        // Check different possible data structures
        if (data.structured_data) {
          cvData = data.structured_data;
          console.log('Loaded structured_data from CV rewrite');
        } else if (data.rewrittenCV || data.cv_rewrite) {
          // Parse the rewritten CV text into structured format
          const cvText = data.rewrittenCV || data.cv_rewrite;
          console.log('Parsing CV text into structured format...');
          
          const { parseCVData } = await import('./cvSectionAI');
          const parsedData = await parseCVData(cvText);
          
          // Merge with existing data
          const userDoc = await getDoc(doc(db, 'users', userId));
          const userData = userDoc.data();
          
          cvData = {
            personalInfo: {
              firstName: parsedData.personalInfo?.firstName || userData?.firstName || '',
              lastName: parsedData.personalInfo?.lastName || userData?.lastName || '',
              email: parsedData.personalInfo?.email || userData?.email || '',
              phone: parsedData.personalInfo?.phone || userData?.phone || '',
              location: parsedData.personalInfo?.location || userData?.location || '',
              linkedin: parsedData.personalInfo?.linkedin || userData?.linkedin || '',
              portfolio: parsedData.personalInfo?.portfolio || userData?.portfolio || '',
              github: parsedData.personalInfo?.github || userData?.github || '',
              title: parsedData.personalInfo?.title || userData?.currentPosition || userData?.jobTitle || ''
            },
            summary: parsedData.summary || '',
            experiences: parsedData.experiences || [],
            education: parsedData.education || [],
            skills: parsedData.skills || [],
            certifications: parsedData.certifications || [],
            projects: parsedData.projects || [],
            languages: parsedData.languages || [],
            sections: [
              { id: 'personal', type: 'personal', title: 'Personal Information', enabled: true, order: 0 },
              { id: 'summary', type: 'summary', title: 'Professional Summary', enabled: true, order: 1 },
              { id: 'experience', type: 'experience', title: 'Work Experience', enabled: true, order: 2 },
              { id: 'education', type: 'education', title: 'Education', enabled: true, order: 3 },
              { id: 'skills', type: 'skills', title: 'Skills', enabled: true, order: 4 },
              { id: 'certifications', type: 'certifications', title: 'Certifications', enabled: parsedData.certifications?.length > 0, order: 5 },
              { id: 'projects', type: 'projects', title: 'Projects', enabled: parsedData.projects?.length > 0, order: 6 },
              { id: 'languages', type: 'languages', title: 'Languages', enabled: parsedData.languages?.length > 0, order: 7 }
            ]
          };
          
          // Save the structured data back for future use
          await setDoc(cvRewriteRef, {
            ...data,
            structured_data: cvData,
            updatedAt: new Date().toISOString()
          }, { merge: true });
          
          console.log('CV parsed and structured data saved');
        } else {
          // Initialize with user data
          const userDoc = await getDoc(doc(db, 'users', userId));
          cvData = await initializeCVData(userId, analysisId, userDoc.data());
        }
      } else {
        console.log('No CV rewrite found, loading analysis and user data...');
        
        // Load both analysis and user data
        const [analysisDoc, userDoc] = await Promise.all([
          getDoc(doc(db, 'users', userId, 'analyses', analysisId)),
          getDoc(doc(db, 'users', userId))
        ]);
        
        const userData = userDoc.data();
        
        if (analysisDoc.exists()) {
          const analysisData = analysisDoc.data();
          console.log('Analysis data:', analysisData);
          
          // Extract job context
          jobContext = {
            jobTitle: analysisData.jobTitle || '',
            company: analysisData.company || '',
            jobDescription: analysisData.jobDescription || '',
            keywords: analysisData.skillsMatch?.missing?.map((s: any) => s.name) || [],
            strengths: analysisData.keyFindings?.filter((f: string) => 
              f.toLowerCase().includes('strong') || f.toLowerCase().includes('good')
            ) || [],
            gaps: analysisData.keyFindings?.filter((f: string) => 
              f.toLowerCase().includes('missing') || f.toLowerCase().includes('gap')
            ) || []
          };
          
          // Check if there's CV data in the analysis
          if (analysisData.originalCV) {
            console.log('Found original CV in analysis, parsing...');
            const { parseCVData } = await import('./cvSectionAI');
            const parsedData = await parseCVData(analysisData.originalCV);
            
            cvData = {
              personalInfo: {
                firstName: parsedData.personalInfo?.firstName || userData?.firstName || '',
                lastName: parsedData.personalInfo?.lastName || userData?.lastName || '',
                email: parsedData.personalInfo?.email || userData?.email || '',
                phone: parsedData.personalInfo?.phone || userData?.phone || '',
                location: parsedData.personalInfo?.location || userData?.location || '',
                linkedin: parsedData.personalInfo?.linkedin || userData?.linkedin || '',
                portfolio: parsedData.personalInfo?.portfolio || userData?.portfolio || '',
                github: parsedData.personalInfo?.github || userData?.github || '',
                title: parsedData.personalInfo?.title || userData?.currentPosition || userData?.jobTitle || ''
              },
              summary: parsedData.summary || userData?.summary || '',
              experiences: parsedData.experiences?.length > 0 ? parsedData.experiences : 
                (userData?.experiences || []).map((exp: any) => ({
                  id: exp.id || generateId(),
                  title: exp.title || exp.position || '',
                  company: exp.company || exp.employer || '',
                  location: exp.location || '',
                  startDate: exp.startDate || '',
                  endDate: exp.endDate || (exp.current ? 'Present' : ''),
                  current: exp.current || exp.endDate === 'Present',
                  description: exp.description || '',
                  bullets: exp.achievements || exp.bullets || exp.responsibilities || []
                })),
              education: parsedData.education?.length > 0 ? parsedData.education :
                (userData?.education || []).map((edu: any) => ({
                  id: edu.id || generateId(),
                  degree: edu.degree || '',
                  field: edu.field || edu.major || '',
                  institution: edu.institution || edu.school || '',
                  location: edu.location || '',
                  startDate: edu.startDate || '',
                  endDate: edu.endDate || edu.graduationYear || '',
                  gpa: edu.gpa || '',
                  honors: edu.honors || [],
                  coursework: edu.coursework || []
                })),
              skills: parsedData.skills?.length > 0 ? parsedData.skills :
                (userData?.skills || []).map((skill: string | any) => ({
                  id: generateId(),
                  name: typeof skill === 'string' ? skill : skill.name,
                  category: typeof skill === 'object' ? skill.category : 'technical'
                })),
              certifications: parsedData.certifications || [],
              projects: parsedData.projects || [],
              languages: parsedData.languages || [],
              sections: [
                { id: 'personal', type: 'personal', title: 'Personal Information', enabled: true, order: 0 },
                { id: 'summary', type: 'summary', title: 'Professional Summary', enabled: true, order: 1 },
                { id: 'experience', type: 'experience', title: 'Work Experience', enabled: true, order: 2 },
                { id: 'education', type: 'education', title: 'Education', enabled: true, order: 3 },
                { id: 'skills', type: 'skills', title: 'Skills', enabled: true, order: 4 },
                { id: 'certifications', type: 'certifications', title: 'Certifications', enabled: false, order: 5 },
                { id: 'projects', type: 'projects', title: 'Projects', enabled: false, order: 6 },
                { id: 'languages', type: 'languages', title: 'Languages', enabled: false, order: 7 }
              ]
            };
            
            // Create the CV rewrite document with parsed data
            await setDoc(doc(db, 'users', userId, 'cvRewrites', analysisId), {
              analysisId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              structured_data: cvData,
              originalCV: analysisData.originalCV,
              status: 'initialized'
            });
            
            console.log('Created CV rewrite with parsed data');
          } else {
            // No CV in analysis, use user data
            cvData = await initializeCVData(userId, analysisId, userData);
          }
        } else {
          // No analysis found, just use user data
          cvData = await initializeCVData(userId, analysisId, userData);
        }
      }
    } catch (error) {
      console.error('Error loading CV data:', error);
      // Fallback to user data
      const userDoc = await getDoc(doc(db, 'users', userId));
      cvData = await initializeCVData(userId, undefined, userDoc.data());
    }
  } else {
    // No analysis ID, just load user profile
    const userDoc = await getDoc(doc(db, 'users', userId));
    cvData = await initializeCVData(userId, undefined, userDoc.data());
  }

  return { cvData, jobContext, editorState, initialCVMarkdown, originalStructuredData };
}
