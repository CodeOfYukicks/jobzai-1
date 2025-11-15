/**
 * Premium ATS Analysis Integration
 * Client-side functions to call the premium analyzeCVPremium Cloud Function
 */

/**
 * Convert PDF file to base64-encoded images
 * @param file PDF file to convert
 * @param maxPages Maximum number of pages to convert (default: 3)
 * @param scale Scale factor for image quality (default: 2.0)
 * @returns Array of base64-encoded images
 */
export async function pdfToBase64Images(
  file: File,
  maxPages: number = 3,
  scale: number = 2.0
): Promise<string[]> {
  // Dynamically import pdfjs to avoid SSR issues
  const pdfjsLib = await import('pdfjs-dist');
  
  // Set worker
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = Math.min(pdf.numPages, maxPages);
  const images: string[] = [];
  
  console.log(`📄 Converting PDF to images: ${numPages} pages`);
  
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: context, viewport }).promise;
    
    // Convert to base64 JPEG with quality optimization
    const base64 = canvas.toDataURL('image/jpeg', 0.85);
    images.push(base64);
    
    console.log(`  ✅ Page ${i} converted (${Math.round(base64.length / 1024)} KB)`);
  }
  
  return images;
}

/**
 * Call the premium ATS analysis Cloud Function
 * @param resumeImages Array of base64-encoded resume images
 * @param jobContext Job details for analysis
 * @param userId Firebase Auth user ID
 * @param analysisId Unique analysis ID
 * @returns Premium ATS analysis result
 */
export async function analyzeCVPremium(
  resumeImages: string[],
  jobContext: {
    jobTitle: string;
    company: string;
    jobDescription: string;
    seniority?: string;
    targetRoles?: string[];
    location?: string;
    jobUrl?: string;
  },
  userId: string,
  analysisId: string
): Promise<{
  status: 'success' | 'error';
  analysis?: any;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  analysisId?: string;
  message?: string;
}> {
  // Use the deployed Cloud Run URL directly (CORS is configured)
  const functionUrl = 'https://analyzecvvision-pyozgz4rbq-uc.a.run.app';
  
  console.log('🔗 Using function URL:', functionUrl);
  
  console.log('🎯 Calling Premium ATS Analysis Cloud Function');
  console.log(`   URL: ${functionUrl}`);
  console.log(`   Resume images: ${resumeImages.length}`);
  console.log(`   Job: ${jobContext.jobTitle} at ${jobContext.company}`);
  console.log(`   User ID: ${userId}`);
  console.log(`   Analysis ID: ${analysisId}`);
  
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeImages,
        jobContext,
        userId,
        analysisId,
      }),
    });
    
    console.log(`   Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Premium analysis failed:', errorData);
      
      return {
        status: 'error',
        message: errorData.message || 'Analysis failed',
      };
    }
    
    const data = await response.json();
    console.log('✅ Premium analysis completed successfully');
    
    if (data.usage) {
      console.log(`   Token usage: ${data.usage.total_tokens} tokens (${data.usage.prompt_tokens} prompt + ${data.usage.completion_tokens} completion)`);
      console.log(`   Estimated cost: $${((data.usage.prompt_tokens * 0.000005) + (data.usage.completion_tokens * 0.000015)).toFixed(4)}`);
    }
    
    return data;
  } catch (error: any) {
    console.error('❌ Error calling premium analysis:', error);
    
    return {
      status: 'error',
      message: error.message || 'Network error',
    };
  }
}

/**
 * Convenience function that handles the complete flow:
 * 1. Convert PDF to images
 * 2. Call premium analysis
 * 3. Return formatted result
 */
export async function analyzePDFWithPremiumATS(
  pdfFile: File,
  jobContext: {
    jobTitle: string;
    company: string;
    jobDescription: string;
    seniority?: string;
    targetRoles?: string[];
    location?: string;
    jobUrl?: string;
  },
  userId: string,
  analysisId: string
): Promise<{
  status: 'success' | 'error';
  analysis?: any;
  message?: string;
}> {
  try {
    console.log('📄 Starting premium PDF analysis for:', pdfFile.name);
    
    // Step 1: Convert PDF to images
    console.log('  Step 1: Converting PDF to images...');
    const resumeImages = await pdfToBase64Images(pdfFile, 3, 1.8);
    console.log(`  ✅ PDF converted to ${resumeImages.length} images`);
    
    // Step 2: Call premium analysis
    console.log('  Step 2: Calling premium analysis API...');
    const result = await analyzeCVPremium(
      resumeImages,
      jobContext,
      userId,
      analysisId
    );
    
    if (result.status === 'error') {
      return {
        status: 'error',
        message: result.message || 'Analysis failed',
      };
    }
    
    console.log('  ✅ Premium analysis completed successfully');
    
    return {
      status: 'success',
      analysis: result.analysis,
    };
  } catch (error: any) {
    console.error('❌ Premium PDF analysis failed:', error);
    
    return {
      status: 'error',
      message: error.message || 'Unknown error',
    };
  }
}

