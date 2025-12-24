/**
 * Job Title Synonyms Dictionary
 * Used to expand user-provided job titles with similar roles
 * to increase search coverage and avoid missing relevant prospects
 */

export const JOB_TITLE_SYNONYMS: Record<string, string[]> = {
    // Engineering / Development
    'Software Engineer': ['Software Developer', 'Developer', 'SWE', 'Programmer', 'Application Developer', 'Full Stack Developer', 'Backend Developer', 'Frontend Developer'],
    'Software Developer': ['Software Engineer', 'Developer', 'Programmer', 'Application Developer'],
    'Full Stack Developer': ['Fullstack Developer', 'Full-Stack Developer', 'Software Engineer', 'Web Developer'],
    'Frontend Developer': ['Front-End Developer', 'Front End Developer', 'UI Developer', 'React Developer', 'JavaScript Developer'],
    'Backend Developer': ['Back-End Developer', 'Back End Developer', 'Server Developer', 'API Developer'],
    'Web Developer': ['Website Developer', 'Frontend Developer', 'Full Stack Developer'],
    'Mobile Developer': ['iOS Developer', 'Android Developer', 'Mobile Engineer', 'App Developer'],
    'iOS Developer': ['iOS Engineer', 'Swift Developer', 'Mobile Developer', 'Apple Developer'],
    'Android Developer': ['Android Engineer', 'Mobile Developer', 'Kotlin Developer', 'Java Developer'],
    'DevOps Engineer': ['DevOps', 'Site Reliability Engineer', 'SRE', 'Platform Engineer', 'Infrastructure Engineer', 'Cloud Engineer'],
    'Site Reliability Engineer': ['SRE', 'DevOps Engineer', 'Platform Engineer', 'Reliability Engineer'],
    'Cloud Engineer': ['Cloud Architect', 'AWS Engineer', 'Azure Engineer', 'GCP Engineer', 'DevOps Engineer'],
    'Data Engineer': ['Data Pipeline Engineer', 'ETL Developer', 'Big Data Engineer', 'Data Platform Engineer'],
    'Machine Learning Engineer': ['ML Engineer', 'AI Engineer', 'Deep Learning Engineer', 'Data Scientist'],
    'QA Engineer': ['Quality Assurance Engineer', 'Test Engineer', 'SDET', 'Software Tester', 'QA Analyst'],
    'Security Engineer': ['Security Analyst', 'Cybersecurity Engineer', 'InfoSec Engineer', 'Application Security Engineer'],

    // Data & Analytics
    'Data Scientist': ['Data Science', 'ML Engineer', 'Machine Learning Engineer', 'Data Analyst', 'Applied Scientist'],
    'Data Analyst': ['Business Analyst', 'BI Analyst', 'Analytics Analyst', 'Reporting Analyst', 'Data Science'],
    'Business Analyst': ['BA', 'Data Analyst', 'Systems Analyst', 'Requirements Analyst', 'Product Analyst'],
    'BI Analyst': ['Business Intelligence Analyst', 'BI Developer', 'Data Analyst', 'Reporting Analyst'],

    // Product & Design
    'Product Manager': ['PM', 'Product Owner', 'Product Lead', 'Senior Product Manager', 'Associate Product Manager', 'APM'],
    'Product Owner': ['PO', 'Product Manager', 'Product Lead', 'Agile Product Owner'],
    'Product Designer': ['UX Designer', 'UI Designer', 'UX/UI Designer', 'Product Design', 'Experience Designer'],
    'UX Designer': ['User Experience Designer', 'Product Designer', 'Interaction Designer', 'UX/UI Designer'],
    'UI Designer': ['User Interface Designer', 'Visual Designer', 'Product Designer', 'UX/UI Designer'],
    'Graphic Designer': ['Visual Designer', 'Creative Designer', 'Brand Designer', 'Marketing Designer'],

    // Management & Leadership
    'Engineering Manager': ['Engineering Lead', 'Tech Lead', 'Development Manager', 'Software Engineering Manager', 'Team Lead'],
    'Tech Lead': ['Technical Lead', 'Lead Engineer', 'Engineering Lead', 'Staff Engineer', 'Principal Engineer'],
    'CTO': ['Chief Technology Officer', 'VP Engineering', 'Technical Director', 'Head of Engineering'],
    'VP Engineering': ['VP of Engineering', 'Vice President Engineering', 'Engineering VP', 'Head of Engineering', 'CTO'],
    'CEO': ['Chief Executive Officer', 'Founder', 'Co-Founder', 'Managing Director', 'President'],
    'CFO': ['Chief Financial Officer', 'Finance Director', 'VP Finance', 'Head of Finance'],
    'COO': ['Chief Operating Officer', 'Operations Director', 'VP Operations', 'Head of Operations'],

    // Marketing & Sales
    'Marketing Manager': ['Marketing Lead', 'Head of Marketing', 'Digital Marketing Manager', 'Growth Manager'],
    'Digital Marketing Manager': ['Online Marketing Manager', 'Growth Manager', 'Performance Marketing Manager'],
    'Content Manager': ['Content Marketing Manager', 'Content Strategist', 'Content Lead', 'Editorial Manager'],
    'Sales Manager': ['Sales Lead', 'Account Executive', 'Business Development Manager', 'Sales Director'],
    'Account Executive': ['AE', 'Sales Representative', 'Sales Manager', 'Business Development Representative'],
    'SDR': ['Sales Development Representative', 'BDR', 'Business Development Representative', 'Inside Sales Representative'],
    'BDR': ['Business Development Representative', 'SDR', 'Sales Development Representative', 'Inside Sales'],

    // Human Resources & Recruiting
    'HR Manager': ['Human Resources Manager', 'People Manager', 'HR Lead', 'Head of HR', 'People Operations'],
    'Recruiter': ['Talent Acquisition', 'Technical Recruiter', 'Recruitment Specialist', 'Hiring Manager', 'Talent Partner'],
    'Technical Recruiter': ['Tech Recruiter', 'Engineering Recruiter', 'IT Recruiter', 'Talent Acquisition'],
    'HR Business Partner': ['HRBP', 'HR Partner', 'People Partner', 'People Business Partner'],

    // Finance & Operations
    'Financial Analyst': ['Finance Analyst', 'FP&A Analyst', 'Business Analyst', 'Investment Analyst'],
    'Accountant': ['Staff Accountant', 'Senior Accountant', 'Financial Accountant', 'Management Accountant'],
    'Controller': ['Financial Controller', 'Accounting Manager', 'Finance Manager', 'Comptroller'],
    'Operations Manager': ['Ops Manager', 'Business Operations Manager', 'Operations Lead', 'General Manager'],

    // Customer Success & Support
    'Customer Success Manager': ['CSM', 'Account Manager', 'Client Success Manager', 'Customer Experience Manager'],
    'Support Engineer': ['Technical Support Engineer', 'Support Specialist', 'Customer Support Engineer', 'Solutions Engineer'],
    'Solutions Engineer': ['Sales Engineer', 'Pre-Sales Engineer', 'Technical Solutions', 'Solutions Architect'],

    // Consulting & Strategy
    'Consultant': ['Management Consultant', 'Strategy Consultant', 'Business Consultant', 'Senior Consultant'],
    'Strategy Manager': ['Strategy Consultant', 'Corporate Strategy', 'Business Strategy Manager', 'Planning Manager'],
    'Project Manager': ['PM', 'Technical Project Manager', 'Program Manager', 'Delivery Manager', 'Scrum Master'],
    'Scrum Master': ['Agile Coach', 'Agile Project Manager', 'Delivery Lead', 'Project Manager'],
};

/**
 * Expand a list of job titles with synonyms
 * @param titles Original job titles provided by user
 * @returns Expanded list including original titles and synonyms (deduped)
 */
export function expandJobTitles(titles: string[]): string[] {
    const expanded = new Set<string>();

    for (const title of titles) {
        // Add original title
        expanded.add(title);

        // Check for exact match in synonyms
        const synonyms = JOB_TITLE_SYNONYMS[title];
        if (synonyms) {
            synonyms.forEach(syn => expanded.add(syn));
        }

        // Check for case-insensitive match
        const titleLower = title.toLowerCase();
        for (const [key, syns] of Object.entries(JOB_TITLE_SYNONYMS)) {
            if (key.toLowerCase() === titleLower) {
                syns.forEach(syn => expanded.add(syn));
                break;
            }
        }
    }

    return Array.from(expanded);
}

/**
 * Check if a title has synonyms available
 */
export function hasSynonyms(title: string): boolean {
    const titleLower = title.toLowerCase();
    return Object.keys(JOB_TITLE_SYNONYMS).some(
        key => key.toLowerCase() === titleLower
    );
}

/**
 * Get synonyms count for display
 */
export function getSynonymsCount(titles: string[]): number {
    const expanded = expandJobTitles(titles);
    return expanded.length - titles.length;
}
