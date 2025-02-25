import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Récupérer la clé API depuis Firestore
    const settingsDoc = await getDoc(doc(db, 'settings', 'openai'));
    const apiKey = settingsDoc.data()?.apiKey;

    if (!apiKey) {
      throw new Error('OpenAI API key not found');
    }

    const openai = new OpenAI({
      apiKey: apiKey
    });

    const { cvContent, jobTitle, company, jobDescription } = req.body;

    if (!cvContent) {
      return res.status(400).json({ message: 'CV content is required' });
    }

    const prompt = `
      Analyze this CV for the position of ${jobTitle} at ${company}.
      
      Job Description:
      ${jobDescription}
      
      CV Content:
      ${cvContent}
      
      Provide a detailed analysis including:
      1. Overall match score (0-100)
      2. Key findings with scores for different aspects (experience, skills, education, etc.)
      3. Matching and missing skills
      4. Specific recommendations for improvement
      
      Format the response as a structured JSON object with the following structure:
      {
        "matchScore": number,
        "keyFindings": [
          {
            "title": string,
            "score": number,
            "details": string[]
          }
        ],
        "matchingSkills": string[],
        "missingSkills": string[],
        "recommendations": string[]
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert ATS system and career advisor. Analyze CVs and provide detailed, actionable feedback."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    const formattedAnalysis = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      jobTitle,
      company,
      matchScore: analysis.matchScore,
      keyFindings: analysis.keyFindings.map((finding: any) => ({
        title: finding.title,
        score: finding.score,
        details: finding.details
      })),
      skillsMatch: {
        matching: analysis.matchingSkills,
        missing: analysis.missingSkills
      },
      recommendations: analysis.recommendations
    };

    return res.status(200).json(formattedAnalysis);
  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ message: 'Analysis failed' });
  }
} 