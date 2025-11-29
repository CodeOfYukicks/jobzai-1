import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import OpenAI from 'openai';
import axios from 'axios';

interface GenerateStarStoryRequest {
  userId: string;
  skill: string;
  jobDescription?: string;
  position?: string;
  companyName?: string;
}

interface StarStoryResponse {
  status: 'success' | 'error' | 'no_experience';
  story?: {
    situation: string;
    action: string;
    result: string;
  };
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StarStoryResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    const { userId, skill, jobDescription, position, companyName } = req.body as GenerateStarStoryRequest;

    if (!userId || !skill) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'userId and skill are required' 
      });
    }

    // Fetch user profile data from Firestore
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'User not found' 
      });
    }

    const userData = userDoc.data();

    // Extract comprehensive profile data from ProfessionalProfilePage structure
    const profileData = {
      // Personal Information
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      
      // Professional History (detailed)
      professionalHistory: userData.professionalHistory || [],
      
      // Skills & Expertise
      skills: userData.skills || [],
      tools: userData.tools || [],
      softSkills: userData.softSkills || [],
      yearsOfExperience: userData.yearsOfExperience || 0,
      
      // Education
      education: {
        level: userData.educationLevel || '',
        field: userData.educationField || '',
        institution: userData.educationInstitution || '',
        major: userData.educationMajor || '',
        graduationYear: userData.graduationYear || '',
      },
      
      // Languages
      languages: userData.languages || [],
      
      // Certifications
      certifications: userData.certifications || [],
      
      // Career Drivers
      careerPriorities: userData.careerPriorities || [],
      primaryMotivator: userData.primaryMotivator || '',
      
      // Management Experience
      managementExperience: userData.managementExperience || { hasExperience: false },
      mentoringExperience: userData.mentoringExperience || false,
      recruitingExperience: userData.recruitingExperience || false,
    };

    // Get CV content - prioritize extracted text, then try to fetch from URL
    let cvContent = '';
    let cvTechnologies: string[] = [];
    let cvSkills: string[] = [];
    
    // First, try to get extracted CV text (already processed)
    if (userData.cvText) {
      cvContent = userData.cvText;
      console.log(`✓ Using extracted CV text from Firestore (${cvContent.length} characters)`);
    } else {
      console.log('⚠ No CV text found in Firestore');
    }
    
    // Also get CV-extracted technologies and skills
    if (userData.cvTechnologies && Array.isArray(userData.cvTechnologies)) {
      cvTechnologies = userData.cvTechnologies;
      console.log(`✓ Found ${cvTechnologies.length} CV-extracted technologies`);
    }
    if (userData.cvSkills && Array.isArray(userData.cvSkills)) {
      cvSkills = userData.cvSkills;
      console.log(`✓ Found ${cvSkills.length} CV-extracted skills`);
    }
    
    // If no CV text but we have CV URL, log it for debugging
    if (!cvContent && userData.cvUrl) {
      console.log(`⚠ CV URL available (${userData.cvUrl.substring(0, 50)}...) but cvText not found in Firestore`);
      console.log('   Note: CV text should be extracted and stored in Firestore when CV is uploaded');
    }
    
    // Log data summary for debugging
    console.log('📊 Data summary for STAR generation:');
    console.log(`   - Professional history entries: ${(profileData.professionalHistory || []).length}`);
    console.log(`   - Skills: ${(profileData.skills || []).length}`);
    console.log(`   - Tools: ${(profileData.tools || []).length}`);
    console.log(`   - CV text length: ${cvContent.length} characters`);
    console.log(`   - CV technologies: ${cvTechnologies.length}`);
    console.log(`   - CV skills: ${cvSkills.length}`);

    // Build comprehensive user experience summary
    const experienceSummary = profileData.professionalHistory && profileData.professionalHistory.length > 0
      ? profileData.professionalHistory
          .map((exp: any) => {
            const responsibilities = Array.isArray(exp.responsibilities) 
              ? exp.responsibilities.join('; ') 
              : exp.responsibilities || '';
            const achievements = Array.isArray(exp.achievements) 
              ? exp.achievements.join('; ') 
              : exp.achievements || '';
            const industry = exp.industry || '';
            const contractType = exp.contractType || '';
            const location = exp.location || '';
            
            return `Position: ${exp.title || 'N/A'} at ${exp.company || 'N/A'}
Duration: ${exp.startDate || 'N/A'} - ${exp.endDate || 'Present'}${exp.current ? ' (Current)' : ''}
Industry: ${industry}
Contract Type: ${contractType}
Location: ${location}
Responsibilities: ${responsibilities || 'N/A'}
Achievements: ${achievements || 'N/A'}`;
          })
          .join('\n\n---\n\n')
      : 'No professional history available.';

    // Build comprehensive skills list (combine all sources)
    const allSkills = [
      ...(profileData.skills || []),
      ...(profileData.tools || []),
      ...(profileData.softSkills || []),
      ...(cvTechnologies || []),
      ...(cvSkills || []),
    ].filter((skill, index, self) => skill && self.indexOf(skill) === index); // Remove duplicates

    // Build languages summary
    const languagesSummary = profileData.languages && profileData.languages.length > 0
      ? profileData.languages.map((lang: any) => {
          if (typeof lang === 'string') return lang;
          return `${lang.language} (${lang.level || 'N/A'})`;
        }).join(', ')
      : 'No languages specified';

    // Build certifications summary
    const certificationsSummary = profileData.certifications && profileData.certifications.length > 0
      ? profileData.certifications.map((cert: any) => {
          if (typeof cert === 'string') return cert;
          return `${cert.name || cert}${cert.issuer ? ` from ${cert.issuer}` : ''}${cert.year ? ` (${cert.year})` : ''}`;
        }).join(', ')
      : 'No certifications listed';

    // Get API key (try OpenAI first, then Claude)
    const openaiSettingsDoc = await getDoc(doc(db, 'settings', 'openai'));
    const openaiApiKey = openaiSettingsDoc.exists() ? openaiSettingsDoc.data().apiKey : null;

    const anthropicSettingsDoc = await getDoc(doc(db, 'settings', 'anthropic'));
    const anthropicApiKey = anthropicSettingsDoc.exists() ? anthropicSettingsDoc.data().apiKey : null;

    if (!openaiApiKey && !anthropicApiKey) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'No AI API key found' 
      });
    }

    // Build the prompt with comprehensive user data
    const prompt = `You are an expert career coach helping a candidate prepare for interviews. Your task is to create an authentic STAR (Situation, Task, Action, Result) story for the skill "${skill}".

CRITICAL RULES:
1. ONLY use real experiences from the user's profile data provided below
2. NEVER invent, fabricate, or make up experiences
3. If no relevant experience exists for this skill, respond with: {"status": "no_experience", "message": "Based on your profile, we couldn't find relevant experience for ${skill}. Consider gaining experience or focusing on transferable skills."}
4. Be honest and authentic - it's better to say there's no match than to invent something
5. You can combine multiple experiences if they relate to the skill
6. Focus on the most relevant and impactful experience

=== COMPREHENSIVE USER PROFILE ===

PROFESSIONAL EXPERIENCE:
${experienceSummary}

SKILLS & EXPERTISE:
- Technical Skills: ${(profileData.skills || []).join(', ') || 'None listed'}
- Tools & Technologies: ${(profileData.tools || []).join(', ') || 'None listed'}
- Soft Skills: ${(profileData.softSkills || []).join(', ') || 'None listed'}
- CV-Extracted Technologies: ${cvTechnologies.length > 0 ? cvTechnologies.join(', ') : 'None'}
- CV-Extracted Skills: ${cvSkills.length > 0 ? cvSkills.join(', ') : 'None'}
- All Skills Combined: ${allSkills.length > 0 ? allSkills.join(', ') : 'None listed'}

EXPERIENCE LEVEL:
- Years of Experience: ${profileData.yearsOfExperience || 0}
- Management Experience: ${profileData.managementExperience?.hasExperience ? `Yes (Team size: ${profileData.managementExperience.teamSize || 'N/A'}, Type: ${profileData.managementExperience.teamType || 'N/A'})` : 'No'}
- Mentoring Experience: ${profileData.mentoringExperience ? 'Yes' : 'No'}
- Recruiting Experience: ${profileData.recruitingExperience ? 'Yes' : 'No'}

EDUCATION:
- Level: ${profileData.education.level || 'Not specified'}
- Field: ${profileData.education.field || 'Not specified'}
- Institution: ${profileData.education.institution || 'Not specified'}
- Major: ${profileData.education.major || 'Not specified'}
- Graduation Year: ${profileData.education.graduationYear || 'Not specified'}

LANGUAGES:
${languagesSummary}

CERTIFICATIONS:
${certificationsSummary}

CAREER CONTEXT:
- Career Priorities: ${(profileData.careerPriorities || []).join(', ') || 'None specified'}
- Primary Motivator: ${profileData.primaryMotivator || 'Not specified'}

${cvContent ? `\n=== COMPLETE CV CONTENT (Extracted Text) ===\n${cvContent}\n` : '\n=== CV CONTENT ===\nNo CV text available in database.\n'}

${jobDescription ? `\n=== JOB CONTEXT ===\nPosition: ${position || 'N/A'} at ${companyName || 'N/A'}\nJob Description:\n${jobDescription}\n` : ''}

TASK: Create a STAR story for "${skill}" using ONLY real experiences from the profile above.

If you find relevant experience, respond with JSON:
{
  "status": "success",
  "story": {
    "situation": "Brief context and challenge (2-3 sentences)",
    "action": "Specific actions you took, tools/technologies used (3-4 sentences)",
    "result": "Quantifiable outcomes, impact, lessons learned (2-3 sentences)"
  }
}

If NO relevant experience exists, respond with:
{
  "status": "no_experience",
  "message": "Based on your profile, we couldn't find relevant experience for ${skill}. Consider gaining experience or focusing on transferable skills."
}

Respond ONLY with valid JSON, no markdown, no explanations.`;

    let starStory: StarStoryResponse;

    // Try OpenAI first, then Claude
    if (openaiApiKey) {
      try {
        const openai = new OpenAI({ apiKey: openaiApiKey });
        const completion = await openai.chat.completions.create({
          model: 'gpt-5.1', // Updated from gpt-4-turbo (Nov 2025)
          messages: [
            {
              role: 'system',
              content: 'You are an expert career coach. Always respond with valid JSON matching the exact format requested. Never invent experiences.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3, // Lower temperature for more factual responses
          max_tokens: 2000, // Increased for more detailed responses
          reasoning_effort: 'medium', // GPT-5.1 feature for STAR story generation
        });

        const responseText = completion.choices[0]?.message?.content || '';
        starStory = JSON.parse(responseText);
      } catch (error) {
        console.error('OpenAI error:', error);
        // Fall through to Claude
        if (!anthropicApiKey) throw error;
      }
    }

    // Use Claude if OpenAI failed or wasn't available
    if (!starStory && anthropicApiKey) {
      const claudeResponse = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      const content = claudeResponse.data.content[0].text;
      // Extract JSON from response (Claude might wrap it in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        starStory = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse Claude response');
      }
    }

    if (!starStory) {
      throw new Error('Failed to generate STAR story');
    }

    // Validate response structure
    if (starStory.status === 'no_experience') {
      return res.status(200).json(starStory);
    }

    if (starStory.status === 'success' && starStory.story) {
      // Validate story has all required fields
      if (starStory.story.situation && starStory.story.action && starStory.story.result) {
        return res.status(200).json(starStory);
      }
    }

    // If we get here, something went wrong
    return res.status(200).json({
      status: 'no_experience',
      message: `Based on your profile, we couldn't find relevant experience for ${skill}. Consider gaining experience or focusing on transferable skills.`
    });

  } catch (error: any) {
    console.error('Error generating STAR story:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to generate STAR story'
    });
  }
}

