import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import pdf from 'pdf-parse';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = new formidable.IncomingForm();
    
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to parse form' });
      }

      const file = files.file;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      try {
        const buffer = fs.readFileSync(file.filepath);
        const data = await pdf(buffer);
        
        res.status(200).json({ text: data.text });
      } catch (error) {
        console.error('Error extracting PDF text:', error);
        res.status(500).json({ error: 'Failed to extract text from PDF' });
      }
    });
  } catch (error) {
    console.error('Error handling PDF extraction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 