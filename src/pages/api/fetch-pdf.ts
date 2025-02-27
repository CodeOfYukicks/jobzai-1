import { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { pdfUrl } = req.body;
    
    console.log('Fetching PDF from URL:', pdfUrl);

    // Télécharger directement le PDF depuis l'URL fournie
    const response = await fetch(pdfUrl);
    
    if (!response.ok) {
      console.error(`PDF fetch failed with status: ${response.status}`);
      return res.status(response.status).json({ 
        message: `Failed to fetch PDF: ${response.statusText}` 
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log('PDF downloaded successfully, size:', arrayBuffer.byteLength);

    // Renvoyer le contenu du PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('Error fetching PDF:', error);
    res.status(500).json({ message: `Failed to fetch PDF: ${error.message}` });
  }
} 