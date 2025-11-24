import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'job_title' | 'company' | 'skill' | 'location' | 'popular';
  icon?: string;
}

// Popular searches and tech stacks
const POPULAR_SEARCHES = [
  { text: 'React Developer', type: 'popular' as const },
  { text: 'Full Stack Engineer', type: 'popular' as const },
  { text: 'Product Manager', type: 'popular' as const },
  { text: 'Data Scientist', type: 'popular' as const },
  { text: 'UX Designer', type: 'popular' as const },
  { text: 'DevOps Engineer', type: 'popular' as const },
  { text: 'Software Engineer', type: 'popular' as const },
  { text: 'Frontend Developer', type: 'popular' as const },
];

const POPULAR_SKILLS = [
  'React', 'Python', 'AWS', 'Node.js', 'TypeScript', 'Docker', 'Kubernetes',
  'Java', 'Go', 'PostgreSQL', 'GraphQL', 'Machine Learning'
];

const POPULAR_LOCATIONS = [
  'Remote', 'New York', 'San Francisco', 'London', 'Paris', 'Berlin',
  'Austin', 'Seattle', 'Boston', 'Los Angeles'
];

export function useSearchSuggestions(searchInput: string) {
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [cached, setCached] = useState(false);

  // Fetch unique job titles and companies from Firestore (once)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (cached) return;
      
      setLoading(true);
      try {
        const jobsQuery = query(collection(db, 'jobs'), limit(200));
        const snapshot = await getDocs(jobsQuery);
        
        const titlesSet = new Set<string>();
        const companiesSet = new Set<string>();
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.title) titlesSet.add(data.title);
          if (data.company) companiesSet.add(data.company);
        });
        
        setJobTitles(Array.from(titlesSet));
        setCompanies(Array.from(companiesSet));
        setCached(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [cached]);

  // Generate suggestions based on input
  const suggestions = useMemo(() => {
    if (!searchInput.trim()) return [];

    const input = searchInput.toLowerCase().trim();
    const results: SearchSuggestion[] = [];

    // Match job titles
    jobTitles
      .filter(title => title.toLowerCase().includes(input))
      .slice(0, 5)
      .forEach(title => {
        results.push({
          id: `job-${title}`,
          text: title,
          type: 'job_title',
        });
      });

    // Match companies
    companies
      .filter(company => company.toLowerCase().includes(input))
      .slice(0, 3)
      .forEach(company => {
        results.push({
          id: `company-${company}`,
          text: company,
          type: 'company',
        });
      });

    // Match skills
    POPULAR_SKILLS
      .filter(skill => skill.toLowerCase().includes(input))
      .slice(0, 3)
      .forEach(skill => {
        results.push({
          id: `skill-${skill}`,
          text: skill,
          type: 'skill',
        });
      });

    // Match locations
    POPULAR_LOCATIONS
      .filter(location => location.toLowerCase().includes(input))
      .slice(0, 3)
      .forEach(location => {
        results.push({
          id: `location-${location}`,
          text: location,
          type: 'location',
        });
      });

    // Limit total suggestions
    return results.slice(0, 10);
  }, [searchInput, jobTitles, companies]);

  return {
    suggestions,
    popularSearches: POPULAR_SEARCHES,
    loading,
  };
}

