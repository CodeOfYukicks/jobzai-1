import pdf from 'pdf-parse';

export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    const data = await pdf(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
} 