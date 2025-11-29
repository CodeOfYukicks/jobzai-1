import { queryPerplexity } from '../lib/perplexity';

export interface AnswerAnalysis {
    questionText: string;
    userAnswer: string;
    score: number; // 0-100
    strengths: string[];
    weaknesses: string[];
    detailedFeedback: string;
    suggestions: string[];
    highlights: {
        text: string;
        type: 'good' | 'bad' | 'neutral';
        comment: string;
    }[];
}

export interface InterviewAnalysisResult {
    overallScore: number; // 0-100
    passed: boolean;
    passThreshold: number;
    overallGrade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
    performanceMetrics: {
        clarity: number;
        contentRelevance: number;
        confidence: number;
        structuredThinking: number;
        technicalAccuracy: number;
    };
    overallFeedback: string;
    keyStrengths: string[];
    areasForImprovement: string[];
    answers: AnswerAnalysis[];
    expertAdvice: string;
}

/**
 * Analyzes interview performance using expert-level AI (GPT-4)
 */
export async function analyzeInterviewPerformance(
    jobContext: {
        position: string;
        company?: string;
        description?: string;
        requiredSkills?: string[];
    },
    questions: Array<{ text: string; category?: string }>,
    answers: string[]
): Promise<InterviewAnalysisResult> {

    const prompt = `You are the world's best HR expert and interview coach with 20+ years of experience at top tech companies (Google, Meta, Amazon, Microsoft). You have helped thousands of candidates ace their interviews.

Your task is to provide an EXCEPTIONALLY DETAILED, ACTIONABLE, and CONSTRUCTIVE analysis of a candidate's interview performance.

**JOB CONTEXT:**
- Position: ${jobContext.position}
- Company: ${jobContext.company || 'Not specified'}
- Description: ${jobContext.description || 'Not provided'}
- Required Skills: ${jobContext.requiredSkills?.join(', ') || 'Not specified'}

**INTERVIEW DATA:**
${questions.map((q, i) => `
Question ${i + 1} (${q.category || 'General'}): ${q.text}
Candidate's Answer: ${answers[i] || 'No answer provided'}
`).join('\n')}

**YOUR ANALYSIS MUST INCLUDE:**

1. **Overall Performance Metrics** (score each 0-100):
   - Clarity & Pace: How clear and well-paced were the answers?
   - Content Relevance: How relevant and on-topic were the responses?
   - Confidence: Did the candidate demonstrate confidence?
   - Structured Thinking: Were answers well-organized (STAR method, frameworks)?
   - Technical Accuracy: Were technical details correct and impressive?

2. **For EACH answer, provide**:
   - Score (0-100)
   - 2-3 specific strengths 
   - 1-3 specific weaknesses
   - Detailed feedback (100-150 words) analyzing structure, content, delivery
   - 2-3 actionable suggestions for improvement
   - Highlighted portions of the answer (mark what was GOOD 🟢, what was BAD 🔴, what was OK 🟡)

3. **Overall Assessment**:
   - Overall score (weighted average)
   - Letter grade (A+, A, B+, B, C+, C, D, F)
   - Pass/Fail (Pass if >= 70)
   - 3-5 key strengths
   - 3-5 areas for improvement
   - Expert advice (200 words) on how to dramatically improve

4. **Be SPECIFIC**: Instead of "good communication", say "Your use of the STAR method in question 2 made your answer 40% more compelling"

5. **Be ENCOURAGING but HONEST**: Balance praise with constructive criticism

**IMPORTANT RULES:**
- Be BRUTALLY HONEST but CONSTRUCTIVE
- Provide SPECIFIC examples from their answers
- Use NUMBERS and METRICS when possible
- Compare to industry standards
- Give ACTIONABLE advice, not vague platitudes
- If answer is weak, explain WHY and HOW to fix it
- If answer is strong, explain what made it effective

Return your analysis as a JSON object with this EXACT structure:
{
  "overallScore": number,
  "passed": boolean,
  "passThreshold": 70,
  "overallGrade": "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "F",
  "performanceMetrics": {
    "clarity": number,
    "contentRelevance": number,
    "confidence": number,
    "structuredThinking": number,
    "technicalAccuracy": number
  },
  "overallFeedback": "string (200-250 words)",
  "keyStrengths": ["strength1", "strength2", "strength3"],
  "areasForImprovement": ["area1", "area2", "area3"],
  "answers": [
    {
      "questionText": "string",
      "userAnswer": "string",
      "score": number,
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "detailedFeedback": "string (100-150 words)",
      "suggestions": ["suggestion1", "suggestion2"],
      "highlights": [
        {
          "text": "portion of answer",
          "type": "good" | "bad" | "neutral",
          "comment": "Why this is good/bad"
        }
      ]
    }
  ],
  "expertAdvice": "string (200 words)"
}

Be exceptionally thorough. This analysis should be worth $500 in coaching value.`;

    try {
        // Use Perplexity or OpenAI for analysis - Updated to GPT-5.1 (Nov 2025)
        const response = await queryPerplexity(prompt, {
            model: 'gpt-5.1', // Updated from gpt-4-turbo-preview (Nov 2025)
            temperature: 0.3, // Lower for more consistent analysis
            max_tokens: 4000,
            reasoning_effort: 'high', // GPT-5.1 feature for thorough interview analysis
        });

        // Parse the JSON response
        const analysis = JSON.parse(response);

        // Validate the response has all required fields
        if (!analysis.overallScore || !analysis.answers) {
            throw new Error('Invalid analysis response format');
        }

        return analysis as InterviewAnalysisResult;

    } catch (error) {
        console.error('Error analyzing interview:', error);

        // Return fallback analysis if AI fails
        return generateFallbackAnalysis(jobContext, questions, answers);
    }
}

/**
 * Generates a basic fallback analysis if AI call fails
 */
function generateFallbackAnalysis(
    jobContext: any,
    questions: any[],
    answers: string[]
): InterviewAnalysisResult {
    const answeredCount = answers.filter(a => a && a.trim().length > 10).length;
    const baseScore = (answeredCount / questions.length) * 100;

    return {
        overallScore: Math.round(baseScore),
        passed: baseScore >= 70,
        passThreshold: 70,
        overallGrade: baseScore >= 90 ? 'A' : baseScore >= 80 ? 'B+' : baseScore >= 70 ? 'B' : baseScore >= 60 ? 'C' : 'D',
        performanceMetrics: {
            clarity: Math.round(baseScore * 0.9),
            contentRelevance: Math.round(baseScore * 0.85),
            confidence: Math.round(baseScore * 0.8),
            structuredThinking: Math.round(baseScore * 0.75),
            technicalAccuracy: Math.round(baseScore * 0.8),
        },
        overallFeedback: `You answered ${answeredCount} out of ${questions.length} questions. Your responses show potential, but there's room for improvement. Focus on providing more structured answers using frameworks like STAR method, and ensure you're addressing all parts of each question.`,
        keyStrengths: [
            'Participated in the interview process',
            'Provided responses to questions',
        ],
        areasForImprovement: [
            'Provide more detailed and structured answers',
            'Use specific examples and metrics',
            'Practice the STAR method for behavioral questions',
        ],
        answers: questions.map((q, i) => ({
            questionText: q.text,
            userAnswer: answers[i] || 'No answer provided',
            score: answers[i] && answers[i].length > 10 ? Math.round(baseScore) : 0,
            strengths: answers[i] ? ['You attempted to answer the question'] : [],
            weaknesses: answers[i] && answers[i].length > 10 ? ['Answer could be more detailed', 'Consider using more specific examples'] : ['No answer was provided'],
            detailedFeedback: answers[i] && answers[i].length > 10
                ? 'Your answer addresses the question but could benefit from more structure and specific examples. Consider using the STAR method to organize your response.'
                : 'No answer was recorded for this question. Make sure you provide a response to every question during your interview.',
            suggestions: [
                'Use the STAR method (Situation, Task, Action, Result)',
                'Include specific metrics and outcomes',
                'Practice your answer out loud before the interview',
            ],
            highlights: [],
        })),
        expertAdvice: 'To significantly improve your interview performance, focus on three key areas: 1) Structure your answers using proven frameworks like STAR, 2) Include specific examples with quantifiable results, and 3) Practice your responses out loud to improve delivery and confidence. Consider recording yourself and reviewing the recordings to identify areas for improvement.',
    };
}

/**
 * Calculates letter grade from numerical score
 */
function calculateGrade(score: number): InterviewAnalysisResult['overallGrade'] {
    if (score >= 97) return 'A+';
    if (score >= 93) return 'A';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 77) return 'C+';
    if (score >= 73) return 'C';
    if (score >= 60) return 'D';
    return 'F';
}
