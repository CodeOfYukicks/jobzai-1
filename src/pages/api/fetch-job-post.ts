import axios from 'axios';
import * as cheerio from 'cheerio';

interface RequestBody {
  url: string;
}

interface ResponseData {
  status: 'success' | 'error';
  content?: string;
  title?: string;
  description?: string;
  url?: string;
  message?: string;
}

/**
 * API endpoint to fetch and extract content from job postings
 * 
 * This should be deployed as a serverless function to avoid CORS issues
 */
export default async function handler(
  req: { method: string; body: RequestBody },
  res: { status: (code: number) => { json: (data: ResponseData) => void } }
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ status: 'error', message: 'URL is required' });
  }

  try {
    // Fetch the HTML content from the URL
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract job post content - tailored for common job sites
    // This is a simplified version; in practice, you'd need to handle different sites differently
    let jobContent = '';

    // LinkedIn
    if (url.includes('linkedin.com')) {
      jobContent = $('.description__text').text() || 
                  $('.show-more-less-html__markup').text() || 
                  $('.jobs-description__content').text();
    } 
    // Indeed
    else if (url.includes('indeed.com')) {
      jobContent = $('#jobDescriptionText').text();
    }
    // Glassdoor
    else if (url.includes('glassdoor.com')) {
      jobContent = $('.jobDescriptionContent').text() || 
                  $('.desc').text();
    }
    // General fallback - look for common job description containers
    else {
      // Try to find job content in common containers
      const possibleSelectors = [
        '.job-description', 
        '#job-description',
        '.job-details',
        '.description',
        'article',
        '[data-test="job-description"]',
        '.posting-requirements'
      ];

      for (const selector of possibleSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          jobContent = element.text();
          break;
        }
      }

      // If no specific container found, get the content of the main tag or body
      if (!jobContent) {
        jobContent = $('main').text() || $('body').text();
      }
    }

    // Clean up the text: remove extra spaces and line breaks
    jobContent = jobContent
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();

    // Extract title if available
    const title = $('title').text() || '';

    // Extract meta description if available
    const description = $('meta[name="description"]').attr('content') || '';

    return res.status(200).json({
      status: 'success',
      content: jobContent,
      title,
      description,
      url
    });
  } catch (error: unknown) {
    console.error('Error fetching job post:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch job post content';
    return res.status(500).json({ 
      status: 'error', 
      message: errorMessage
    });
  }
} 