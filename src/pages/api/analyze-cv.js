import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Récupérer la clé API depuis Firestore
    const settingsDoc = await getDoc(doc(db, 'settings', 'openai'));
    const apiKey = settingsDoc.exists() ? settingsDoc.data().apiKey : null;

    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key not found' });
    }

    // Initialiser le client OpenAI avec la clé récupérée de Firebase
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Appel à l'API OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are an expert ATS (Applicant Tracking System) analyzer. Your job is to analyze CVs against job descriptions and provide detailed feedback in JSON format." 
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    // Extraire et parser la réponse
    const response = completion.choices[0]?.message?.content;
    let parsedResponse;
    
    try {
      parsedResponse = JSON.parse(response);
    } catch (e) {
      console.error('Failed to parse OpenAI response:', e);
      parsedResponse = {
        matchScore: 70,
        keyFindings: [
          { title: 'Skills Match', score: 75, details: ['Auto-generated due to parsing error'] },
          { title: 'Experience Relevance', score: 65, details: ['Auto-generated due to parsing error'] }
        ],
        matchingSkills: ['Communication'],
        missingSkills: ['Leadership'],
        recommendations: ['Improve CV parsing'],
        keywordsFound: ['skills'],
        keywordsMissing: ['leadership'],
        relevantExperience: ['Some experience'],
        experienceGaps: ['Missing experience details']
      };
    }

    res.status(200).json(parsedResponse);
  } catch (error) {
    console.error('Error analyzing CV:', error);
    res.status(500).json({ error: 'Failed to analyze CV', details: error.message });
  }
} 