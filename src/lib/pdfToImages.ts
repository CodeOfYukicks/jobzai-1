import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker to use local file from public folder
// This avoids CORS issues and 404 errors from CDN
if (typeof window !== 'undefined') {
  // Use worker from public folder (copied from node_modules)
  // This ensures the worker is always available without CORS issues
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

/**
 * Convert PDF pages to images (base64 encoded JPEG)
 * Optimized for GPT-4o Vision analysis
 * 
 * @param file PDF file to convert
 * @param maxPages Maximum number of pages to convert (default: 2)
 * @param scale Scale factor for rendering (default: 1.5 for optimal quality/size)
 * @returns Array of base64 encoded images (without data URL prefix)
 */
export async function pdfToImages(
  file: File,
  maxPages: number = 2,
  scale: number = 1.5
): Promise<string[]> {
  try {
    console.log('📄 Starting PDF to images conversion...');
    console.log(`   File: ${file.name}, Size: ${(file.size / 1024).toFixed(1)} KB`);
    
    const arrayBuffer = await file.arrayBuffer();
    console.log(`   PDF loaded into memory, size: ${arrayBuffer.byteLength} bytes`);
    
    // Load PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log(`   PDF loaded successfully: ${pdf.numPages} page(s)`);
    
    const images: string[] = [];
    const pagesToProcess = Math.min(pdf.numPages, maxPages);
    
    console.log(`   Processing ${pagesToProcess} page(s) with scale ${scale}...`);
    
    for (let i = 1; i <= pagesToProcess; i++) {
      console.log(`   Rendering page ${i}/${pagesToProcess}...`);
      
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      
      // Create canvas element
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Failed to get canvas context');
      }
      
      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Convert canvas to JPEG base64 (85% quality for optimal size/quality balance)
      const base64 = canvas.toDataURL('image/jpeg', 0.85);
      
      // Extract base64 content (remove data URL prefix)
      const base64Content = base64.split(',')[1];
      images.push(base64Content);
      
      console.log(`   ✓ Page ${i} converted, size: ${(base64Content.length / 1024).toFixed(1)} KB`);
    }
    
    console.log(`✅ PDF conversion completed: ${images.length} image(s) generated`);
    return images;
    
  } catch (error) {
    console.error('❌ Error converting PDF to images:', error);
    throw new Error(
      `Failed to convert PDF to images: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get PDF page count
 * @param file PDF file
 * @returns Number of pages in the PDF
 */
export async function getPDFPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    return pdf.numPages;
  } catch (error) {
    console.error('Error getting PDF page count:', error);
    throw error;
  }
}

