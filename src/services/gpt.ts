interface GPTRecommendation {
  type: 'target-companies' | 'application-timing' | 'salary-insights' | 'keyword-optimization';
  prompt: string;
  userData: any;
  result?: any;
}

export const getGPTRecommendation = async (
  type: GPTRecommendation['type'], 
  prompt: string, 
  userData: any
): Promise<any> => {
  // Implémentation à venir avec vos prompts
}; 