export interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content?: string; // For the full article page later
    category: string;
    author: string;
    date: string;
    readTime: string;
    image: string;
    featured?: boolean;
}

export const BLOG_POSTS: BlogPost[] = [
    {
        id: '1',
        slug: 'future-of-ai-job-search',
        title: "The Future of AI in Job Searching: How to Stay Ahead",
        excerpt: "Artificial Intelligence is reshaping how companies hire and how candidates find jobs. Discover the strategies you need to leverage AI for your career growth without losing the human touch.",
        category: "Career Advice",
        author: "Sarah J.",
        date: "Oct 24, 2025",
        readTime: "5 min read",
        image: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        featured: true
    },
    {
        id: '2',
        slug: 'common-interview-mistakes',
        title: "10 Common Interview Mistakes (And How to Avoid Them)",
        excerpt: "Even the most prepared candidates make these slipping errors. Learn what they are and how to present your best self.",
        category: "Interview Prep",
        author: "Marc D.",
        date: "Oct 22, 2025",
        readTime: "4 min read",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
        id: '3',
        slug: 'linkedin-optimization',
        title: "Optimize Your LinkedIn Profile for Recruiter Visibility",
        excerpt: "Unlock the hidden features of LinkedIn that will make your profile stand out to headhunters and talent acquisition managers.",
        category: "Job Search",
        author: "Emma W.",
        date: "Oct 18, 2025",
        readTime: "6 min read",
        image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
        id: '4',
        slug: 'ats-keywords',
        title: "Mastering the ATS: Keywords that Matter",
        excerpt: "Applicant Tracking Systems filter out 75% of resumes before a human sees them. Here is how to beat the bot.",
        category: "Resume Tips",
        author: "Alex R.",
        date: "Oct 15, 2025",
        readTime: "3 min read",
        image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
        id: '5',
        slug: 'cubbbe-v2',
        title: "Introducing Cubbbe V2: Smarter, Faster, Better",
        excerpt: "We have rebuilt our core engine to provide even more accurate job matches and personalized career coaching.",
        category: "Product Updates",
        author: "Team Cubbbe",
        date: "Oct 10, 2025",
        readTime: "2 min read",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
        id: '6',
        slug: 'remote-work-2026',
        title: "Remote Work Trends in 2026",
        excerpt: "Is remote work here to stay? We analyzed data from over 50,000 job postings to find out where the market is heading.",
        category: "Career Advice",
        author: "Sarah J.",
        date: "Oct 05, 2025",
        readTime: "7 min read",
        image: "https://images.unsplash.com/photo-1593642632823-8f78536788c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    }
];

export const CATEGORIES = ['All', ...new Set(BLOG_POSTS.map(post => post.category))];
