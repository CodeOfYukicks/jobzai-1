/**
 * Experience Rewriter
 * Rewrites individual experiences for ATS optimization
 */

interface ExperienceRewriteInput {
  experience: {
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  };
  jobContext: {
    jobTitle: string;
    company: string;
    jobDescription: string;
    keywords: string[];
  };
  allExperiences: any[]; // Pour éviter duplication
}

/**
 * Call OpenAI API via server endpoint
 */
async function callOpenAIForRewrite(prompt: string): Promise<any> {
  const response = await fetch('/api/chatgpt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
      type: 'experience-rewrite',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Server error' }));
    throw new Error(errorData.message || 'Failed to rewrite experience');
  }

  const data = await response.json();
  
  if (data.status === 'error') {
    throw new Error(data.message || 'Experience rewrite failed');
  }
  
  // Extract content
  let content = data.content;
  
  // If content is a string, parse it as JSON
  if (typeof content === 'string') {
    try {
      content = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse experience rewrite response:', content);
      throw new Error('Failed to parse experience rewrite response as JSON');
    }
  }
  
  return content;
}

/**
 * Rewrite a single experience for ATS optimization
 */
export async function rewriteSingleExperience(
  input: ExperienceRewriteInput
): Promise<{ bullets: string[] }> {
  const prompt = `
You are an elite CV strategist rewriting ONE specific work experience for maximum ATS impact and recruiter appeal.

TARGET JOB:
- Position: ${input.jobContext.jobTitle}
- Company: ${input.jobContext.company}
- Job Description (excerpt): ${input.jobContext.jobDescription.substring(0, 500)}

EXPERIENCE TO REWRITE:
Title: ${input.experience.title}
Company: ${input.experience.company}
Period: ${input.experience.startDate} - ${input.experience.endDate}
Current bullets:
${input.experience.bullets.map(b => `- ${b}`).join('\n')}

OTHER EXPERIENCES IN CV (for context, avoid duplication):
${input.allExperiences.map(e => `- ${e.title} at ${e.company}`).join('\n') || 'None'}

KEYWORDS TO INTEGRATE NATURALLY: ${input.jobContext.keywords.slice(0, 10).join(', ')}

REQUIREMENTS:
1. Generate 4-6 powerful bullet points (optimal: 5)
2. Each bullet: [Strong Action Verb] + [What you did] + [Quantified Impact/Result]
3. Integrate 2-3 keywords naturally from the list above
4. Avoid duplicating wording from other experiences
5. Keep factual - don't invent metrics, but emphasize existing ones
6. Make it senior-level: emphasize leadership, strategy, impact
7. Each bullet should be ≤ 22 words
8. Use present tense if current role, past tense if previous role

EXAMPLES OF POWERFUL BULLETS:
- "Architected scalable microservices platform using Node.js and Kubernetes, reducing deployment time by 60% and supporting 2M+ daily active users"
- "Led cross-functional team of 8 engineers, delivering $2M+ revenue-generating features 3 weeks ahead of schedule"
- "Optimized database queries and caching strategies, improving API response time by 73% and reducing infrastructure costs by $150K annually"

RETURN JSON ONLY:
{
  "bullets": [
    "Bullet point 1 with action verb and quantified impact.",
    "Bullet point 2 with keywords integrated naturally.",
    "Bullet point 3 demonstrating senior-level thinking.",
    "Bullet point 4 showing business impact.",
    "Bullet point 5 highlighting leadership or innovation."
  ]
}

CRITICAL: Return ONLY the JSON object. No markdown, no explanations, no code blocks.
`;

  try {
    const response = await callOpenAIForRewrite(prompt);
    
    // Handle different response formats
    if (response.bullets && Array.isArray(response.bullets)) {
      return { bullets: response.bullets };
    }
    
    // Fallback: try to extract bullets from string response
    if (typeof response === 'string') {
      try {
        const parsed = JSON.parse(response);
        if (parsed.bullets) {
          return { bullets: parsed.bullets };
        }
      } catch {
        // If parsing fails, return original bullets as fallback
        console.warn('Failed to parse experience rewrite response, using original bullets');
        return { bullets: input.experience.bullets };
      }
    }
    
    // If no bullets found, return original
    console.warn('No bullets found in experience rewrite response, using original bullets');
    return { bullets: input.experience.bullets };
  } catch (error: any) {
    console.error('Error rewriting experience:', error);
    // Return original bullets on error
    return { bullets: input.experience.bullets };
  }
}

