import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAssistant, PageContext } from '../contexts/AssistantContext';

interface QuickAction {
  label: string;
  prompt: string;
  icon?: string;
}

interface PageContextConfig {
  pageName: string;
  pageDescription: string;
  quickActions: QuickAction[];
}

const PAGE_CONTEXTS: Record<string, PageContextConfig> = {
  '/dashboard': {
    pageName: 'Dashboard',
    pageDescription: 'Overview of job search activity, applications, and recommendations',
    quickActions: [
      { label: 'Summarize my activity', prompt: 'Summarize my recent job search activity and key metrics' },
      { label: 'What should I focus on?', prompt: 'Based on my current job search progress, what should I focus on next?' },
      { label: 'Get personalized tips', prompt: 'Give me personalized tips to improve my job search based on my profile' },
    ],
  },
  '/hub': {
    pageName: 'Hub',
    pageDescription: 'Central hub for all job search features and quick actions',
    quickActions: [
      { label: 'Summarize', prompt: 'Summarize my current job search status and what I should focus on' },
      { label: 'Write a cover letter', prompt: 'Help me write a professional cover letter for a job application' },
      { label: 'Make a table of ideas about', prompt: 'Create a table of job search strategies and ideas for my profile' },
      { label: 'Brainstorm ideas for headlines', prompt: 'Help me brainstorm compelling headlines for my professional profile' },
      { label: 'Give me feedback', prompt: 'Give me feedback on my job search approach and profile' },
    ],
  },
  '/applications': {
    pageName: 'Job Applications',
    pageDescription: 'Track and manage job applications with status updates',
    quickActions: [
      { label: 'Help me follow up', prompt: 'Help me write a follow-up email for one of my applications' },
      { label: 'Analyze response rate', prompt: 'Analyze my application response rate and suggest improvements' },
      { label: 'Prioritize applications', prompt: 'Help me prioritize which applications to focus on' },
    ],
  },
  '/jobs': {
    pageName: 'Job Board',
    pageDescription: 'Browse and search for job opportunities',
    quickActions: [
      { label: 'Is this job a good fit?', prompt: 'Analyze if the current job posting is a good fit for my profile' },
      { label: 'Help me apply', prompt: 'Help me prepare my application for this job' },
      { label: 'Refine my search', prompt: 'Help me refine my job search criteria' },
    ],
  },
  '/cv-optimizer': {
    pageName: 'CV Optimizer',
    pageDescription: 'Optimize your CV/resume for ATS systems and recruiters',
    quickActions: [
      { label: 'Improve my CV', prompt: 'Analyze my CV and suggest improvements' },
      { label: 'Tailor for a job', prompt: 'Help me tailor my CV for a specific job posting' },
      { label: 'ATS score tips', prompt: 'How can I improve my CV\'s ATS compatibility score?' },
    ],
  },
  '/ats-analysis': {
    pageName: 'CV Analysis Detail',
    pageDescription: 'Detailed view of a specific CV analysis with recommendations',
    quickActions: [
      { label: 'Missing skills', prompt: 'What skills am I missing for this specific job? List them all.' },
      { label: 'Top recommendations', prompt: 'What are the top priority recommendations I should implement for this analysis?' },
      { label: 'Explain my scores', prompt: 'Explain my category scores and how I can improve each one' },
      { label: 'Compare to my other analyses', prompt: 'How does this analysis compare to my other CV analyses?' },
    ],
  },
  '/cv-analysis': {
    pageName: 'CV Analysis',
    pageDescription: 'Overview of all your CV analyses and performance trends',
    quickActions: [
      { label: 'Compare my analyses', prompt: 'Compare my CV analyses and show me which roles I match best with' },
      { label: 'Identify patterns', prompt: 'What patterns do you see across all my CV analyses? What should I improve?' },
      { label: 'Which analysis to prioritize?', prompt: 'Based on my scores, which job applications should I prioritize?' },
      { label: 'Industry trends', prompt: 'Show me how I perform across different industries based on my analyses' },
    ],
  },
  '/cv-creator': {
    pageName: 'CV Creator',
    pageDescription: 'Create a new professional CV from scratch',
    quickActions: [
      { label: 'Write summary', prompt: 'Help me write a compelling professional summary' },
      { label: 'Describe experience', prompt: 'Help me describe my work experience more effectively' },
      { label: 'List skills', prompt: 'Help me identify and list my key skills' },
    ],
  },
  '/email-templates': {
    pageName: 'Email Templates',
    pageDescription: 'Create and manage email templates for job applications',
    quickActions: [
      { label: 'Create template', prompt: 'Help me create a new professional email template' },
      { label: 'Improve template', prompt: 'Help me improve my existing email template' },
      { label: 'Personalization tips', prompt: 'Give me tips for personalizing my email templates' },
    ],
  },
  '/campaigns': {
    pageName: 'AutoPilot Campaigns',
    pageDescription: 'Automated job application campaigns',
    quickActions: [
      { label: 'Start a campaign', prompt: 'Help me set up an effective job application campaign' },
      { label: 'Campaign performance', prompt: 'Analyze my campaign performance and suggest optimizations' },
      { label: 'Target companies', prompt: 'Help me identify target companies for my campaign' },
    ],
  },
  '/recommendations': {
    pageName: 'AI Recommendations',
    pageDescription: 'Personalized AI-powered career recommendations',
    quickActions: [
      { label: 'Career advice', prompt: 'Give me personalized career advice based on my profile' },
      { label: 'Market insights', prompt: 'What are the current market trends for my field?' },
      { label: 'Salary insights', prompt: 'What salary range should I target based on my experience?' },
    ],
  },
  '/upcoming-interviews': {
    pageName: 'Upcoming Interviews',
    pageDescription: 'Manage and prepare for scheduled interviews',
    quickActions: [
      { label: 'Interview prep', prompt: 'Help me prepare for my upcoming interview' },
      { label: 'Common questions', prompt: 'What questions should I expect in my interview?' },
      { label: 'Questions to ask', prompt: 'What questions should I ask the interviewer?' },
    ],
  },
  '/mock-interview': {
    pageName: 'Mock Interview',
    pageDescription: 'Practice interviews with AI feedback',
    quickActions: [
      { label: 'Practice tips', prompt: 'Give me tips to improve my interview performance' },
      { label: 'Build confidence', prompt: 'Help me build confidence for my interviews' },
      { label: 'Analyze performance', prompt: 'Analyze my mock interview performance' },
    ],
  },
  '/professional-profile': {
    pageName: 'Professional Profile',
    pageDescription: 'Manage your professional profile and career information',
    quickActions: [
      { label: 'Profile review', prompt: 'Review my profile and suggest improvements' },
      { label: 'Bio writing', prompt: 'Help me write a compelling professional bio' },
      { label: 'Skills assessment', prompt: 'Help me assess and list my professional skills' },
    ],
  },
  '/settings': {
    pageName: 'Settings',
    pageDescription: 'Account settings and preferences',
    quickActions: [
      { label: 'Help with settings', prompt: 'Explain the different settings and what they do' },
      { label: 'Privacy tips', prompt: 'Give me tips for managing my privacy settings' },
      { label: 'Notification setup', prompt: 'Help me configure my notification preferences' },
    ],
  },
  '/billing': {
    pageName: 'Billing',
    pageDescription: 'Manage subscription and credits',
    quickActions: [
      { label: 'Explain plans', prompt: 'Explain the different subscription plans and their features' },
      { label: 'Credit usage', prompt: 'Help me understand how credits work and how to use them efficiently' },
      { label: 'Best plan for me', prompt: 'Which plan would be best for my job search needs?' },
    ],
  },
};

// Default context for pages not explicitly defined
const DEFAULT_CONTEXT: PageContextConfig = {
  pageName: 'Jobz.ai',
  pageDescription: 'AI-powered job search platform',
  quickActions: [
    { label: 'Summarize', prompt: 'Summarize my current job search status and what I should focus on' },
    { label: 'Write a cover letter', prompt: 'Help me write a professional cover letter for a job application' },
    { label: 'Make a table of ideas about', prompt: 'Create a table of job search strategies and ideas for my profile' },
    { label: 'Brainstorm ideas for headlines', prompt: 'Help me brainstorm compelling headlines for my professional profile' },
    { label: 'Give me feedback', prompt: 'Give me feedback on my job search approach and profile' },
  ],
};

export function usePageContext() {
  const location = useLocation();
  const { setCurrentPageContext } = useAssistant();

  const pageContext = useMemo((): PageContext => {
    const pathname = location.pathname;
    
    // Find the matching page context
    // First try exact match, then try prefix match for dynamic routes
    let config = PAGE_CONTEXTS[pathname];
    
    if (!config) {
      // Special handling for CV editor routes (e.g., /ats-analysis/:id/cv-editor)
      if (pathname.includes('/cv-editor')) {
        config = {
          pageName: 'CV Editor',
          pageDescription: 'Edit and tailor your CV for a specific job',
          quickActions: [
            { label: 'Add keywords', prompt: 'What keywords should I add to my CV for this specific job?' },
            { label: 'Improve my summary', prompt: 'Help me improve my professional summary for this job' },
            { label: 'Tailor my experience', prompt: 'How should I tailor my work experience section for this job?' },
            { label: 'Address gaps', prompt: 'How can I address the identified gaps in my CV for this role?' },
          ],
        };
      }
      // Try prefix matching for dynamic routes like /cv-optimizer/:id or /ats-analysis/:id
      else {
        for (const [route, ctx] of Object.entries(PAGE_CONTEXTS)) {
          if (pathname.startsWith(route) && route !== '/') {
            config = ctx;
            break;
          }
        }
      }
    }
    
    // Fall back to default context
    if (!config) {
      config = DEFAULT_CONTEXT;
    }

    return {
      pageName: config.pageName,
      pageDescription: config.pageDescription,
      suggestedActions: config.quickActions.map(a => a.label),
      relevantData: {
        quickActions: config.quickActions,
        pathname,
      },
    };
  }, [location.pathname]);

  // Update the context in the AssistantContext
  useEffect(() => {
    setCurrentPageContext(pageContext);
  }, [pageContext, setCurrentPageContext]);

  return pageContext;
}

export function getQuickActionsForPage(pathname: string): QuickAction[] {
  let config = PAGE_CONTEXTS[pathname];
  
  if (!config) {
    // Special handling for CV editor routes
    if (pathname.includes('/cv-editor')) {
      return [
        { label: 'Add keywords', prompt: 'What keywords should I add to my CV for this specific job?' },
        { label: 'Improve my summary', prompt: 'Help me improve my professional summary for this job' },
        { label: 'Tailor my experience', prompt: 'How should I tailor my work experience section for this job?' },
        { label: 'Address gaps', prompt: 'How can I address the identified gaps in my CV for this role?' },
      ];
    }
    
    for (const [route, ctx] of Object.entries(PAGE_CONTEXTS)) {
      if (pathname.startsWith(route) && route !== '/') {
        config = ctx;
        break;
      }
    }
  }
  
  return config?.quickActions || DEFAULT_CONTEXT.quickActions;
}

