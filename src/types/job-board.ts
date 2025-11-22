export interface FilterState {
    employmentType: string[];
    workLocation: string[];
    experienceLevel: string[];
    datePosted: 'any' | 'past24h' | 'pastWeek' | 'pastMonth';
    industries: string[];
    technologies: string[];
    skills: string[];
}

export interface Job {
    id: string;
    title: string;
    company: string;
    logoUrl?: string;
    location: string;
    type?: string;
    postedAt?: any;
    published?: string; // Formatted date
    description?: string;
    summary?: string;
    applyUrl?: string;
    salaryRange?: string;
    remote?: string;
    seniority?: string;
    skills?: string[];
    industries?: string[];
    technologies?: string[];
}
