export interface StarStory {
  situation: string;
  action: string;
  result: string;
}

export interface StarStoryGenerationResult {
  success: boolean;
  story?: StarStory;
  message?: string;
  error?: string;
}

export interface GenerateStarStoryParams {
  userId: string;
  skill: string;
  jobDescription?: string;
  position?: string;
  companyName?: string;
}

/**
 * Generates a STAR story using AI based on user profile and CV data
 */
export async function generateStarStory(
  params: GenerateStarStoryParams
): Promise<StarStoryGenerationResult> {
  try {
    console.log('📡 Calling /api/generate-star-story with:', {
      userId: params.userId,
      skill: params.skill,
      hasJobDescription: !!params.jobDescription,
      position: params.position,
      companyName: params.companyName,
    });

    const response = await fetch('/api/generate-star-story', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: params.userId,
        skill: params.skill,
        jobDescription: params.jobDescription,
        position: params.position,
        companyName: params.companyName,
      }),
    });

    console.log('📥 Response status:', response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        console.error('❌ API error response:', errorData);
      } catch (parseError) {
        const errorText = await response.text().catch(() => '');
        console.error('❌ Failed to parse error response:', errorText);
        errorMessage = errorText || errorMessage;
      }
      
      // Provide helpful error messages
      if (response.status === 404) {
        errorMessage = 'API endpoint not found. Please make sure the server is running on port 3000.';
      } else if (response.status === 500) {
        errorMessage = `Server error: ${errorMessage}. Check server logs for details.`;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();

    if (data.status === 'no_experience') {
      return {
        success: false,
        message: data.message || 'No relevant experience found for this skill.',
      };
    }

    if (data.status === 'error') {
      return {
        success: false,
        error: data.message || 'Failed to generate STAR story',
      };
    }

    if (data.status === 'success' && data.story) {
      return {
        success: true,
        story: {
          situation: data.story.situation || '',
          action: data.story.action || '',
          result: data.story.result || '',
        },
      };
    }

    return {
      success: false,
      error: 'Unexpected response format',
    };
  } catch (error: any) {
    console.error('❌ Network/fetch error generating STAR story:', error);
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    
    // Provide more helpful error messages
    let errorMessage = 'Failed to generate STAR story';
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      errorMessage = 'Cannot connect to server. Please make sure the server is running on port 3000.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

