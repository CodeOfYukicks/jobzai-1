/**
 * JobDetailPanel Demo
 * 
 * Standalone demo showcasing the panel with sample data
 * Use this to preview the component without integrating it
 */

import { useState } from 'react';
import { JobDetailPanel } from './JobDetailPanel';
import { JobApplication } from '../../types/job';

// Sample job data
const sampleJob: JobApplication = {
  id: 'job-001',
  companyName: 'Apple Inc.',
  position: 'Senior Software Engineer - SwiftUI',
  location: 'Cupertino, CA',
  status: 'interview',
  appliedDate: '2024-11-01T00:00:00Z',
  createdAt: '2024-11-01T10:30:00Z',
  updatedAt: '2024-11-10T14:22:00Z',
  url: 'https://jobs.apple.com/en-us/details/senior-software-engineer',
  contactName: 'Sarah Chen',
  contactEmail: 'sarah.chen@apple.com',
  contactPhone: '+1 (408) 555-0123',
  salary: '$180,000 - $250,000',
  notes: `This is an exciting opportunity to work on next-generation UI frameworks at Apple.

Key Responsibilities:
• Design and implement SwiftUI components for macOS and iOS
• Collaborate with design teams to create delightful user experiences
• Optimize performance for smooth 120Hz animations
• Mentor junior engineers and contribute to technical documentation

Requirements:
• 5+ years of iOS/macOS development experience
• Deep understanding of SwiftUI and UIKit
• Strong CS fundamentals and system design skills
• Excellent communication and collaboration abilities

Company Culture:
Apple values innovation, attention to detail, and a passion for creating products that change people's lives. The team is collaborative, fast-paced, and focused on excellence.

Interview Process:
1. Initial phone screen with recruiter
2. Technical phone interview
3. Virtual onsite (4-5 rounds)
4. Final interview with hiring manager`,
  interviews: [
    {
      id: 'int-001',
      date: '2024-11-15T00:00:00Z',
      time: '10:00 AM PST',
      type: 'technical',
      interviewers: ['John Appleseed', 'Jane Developer'],
      status: 'scheduled',
      notes: 'Technical deep dive on SwiftUI architecture and performance optimization. Prepare to discuss recent projects and system design.',
      location: 'Zoom Meeting',
    },
    {
      id: 'int-002',
      date: '2024-11-05T00:00:00Z',
      time: '2:00 PM PST',
      type: 'hr',
      interviewers: ['Sarah Chen'],
      status: 'completed',
      notes: 'Went well! Discussed background, motivation, and career goals. Sarah mentioned the team culture and growth opportunities.',
      location: 'Phone Call',
    },
  ],
  statusHistory: [
    {
      status: 'interview',
      date: '2024-11-08T00:00:00Z',
      notes: 'Moved to interview stage after successful phone screen. Technical interview scheduled for next week.',
    },
    {
      status: 'applied',
      date: '2024-11-01T00:00:00Z',
      notes: 'Applied through Apple careers website. Submitted resume, cover letter, and portfolio.',
    },
  ],
};

const sampleJob2: JobApplication = {
  id: 'job-002',
  companyName: 'Notion Labs',
  position: 'Frontend Engineer',
  location: 'San Francisco, CA (Hybrid)',
  status: 'offer',
  appliedDate: '2024-10-20T00:00:00Z',
  createdAt: '2024-10-20T09:15:00Z',
  updatedAt: '2024-11-12T16:45:00Z',
  url: 'https://www.notion.so/careers/frontend-engineer',
  contactName: 'Ivan Zhao',
  contactEmail: 'careers@notion.so',
  salary: '$160,000 - $220,000 + equity',
  notes: `Join Notion's mission to make software toolmaking ubiquitous.

About the Role:
• Build beautiful, performant UI components in React and TypeScript
• Work on Notion's editor and collaboration features
• Optimize for speed and smooth interactions
• Shape product decisions and technical architecture

Why Notion:
• Work on a product used by millions
• Collaborative and design-focused culture
• Competitive compensation with significant equity
• Flexible work arrangements

Tech Stack:
React, TypeScript, Next.js, Tailwind CSS, Node.js`,
  interviews: [
    {
      id: 'int-003',
      date: '2024-11-10T00:00:00Z',
      time: '11:00 AM PST',
      type: 'final',
      interviewers: ['Ivan Zhao'],
      status: 'completed',
      notes: 'Final round with founder. Discussed vision, values, and long-term goals. Very positive conversation!',
      location: 'Notion HQ, SF',
    },
    {
      id: 'int-004',
      date: '2024-11-03T00:00:00Z',
      time: '3:00 PM PST',
      type: 'technical',
      interviewers: ['Alex Thompson', 'Maria Garcia'],
      status: 'completed',
      notes: 'System design round - designed a collaborative editing system. Good discussion about CRDTs and operational transforms.',
      location: 'Google Meet',
    },
    {
      id: 'int-005',
      date: '2024-10-28T00:00:00Z',
      time: '1:00 PM PST',
      type: 'technical',
      interviewers: ['Chris Lee'],
      status: 'completed',
      notes: 'Live coding session - built a rich text editor component. Went well, completed all requirements.',
      location: 'CodePair',
    },
  ],
  statusHistory: [
    {
      status: 'offer',
      date: '2024-11-12T00:00:00Z',
      notes: 'Received offer! Base: $190k, Equity: $150k over 4 years, $10k sign-on. Need to respond by Nov 19th.',
    },
    {
      status: 'interview',
      date: '2024-10-25T00:00:00Z',
      notes: 'Moved to interview stage. Scheduled for 3 technical rounds over 2 weeks.',
    },
    {
      status: 'applied',
      date: '2024-10-20T00:00:00Z',
      notes: 'Applied via referral from college friend. Submitted custom cover letter highlighting Notion usage.',
    },
  ],
};

const sampleJob3: JobApplication = {
  id: 'job-003',
  companyName: 'Linear',
  position: 'Full-Stack Engineer',
  location: 'Remote',
  status: 'rejected',
  appliedDate: '2024-10-15T00:00:00Z',
  createdAt: '2024-10-15T11:00:00Z',
  updatedAt: '2024-11-05T10:30:00Z',
  url: 'https://linear.app/careers',
  notes: `Linear is looking for talented engineers to help build the future of issue tracking.

Unfortunately did not move forward after technical screen. Feedback was positive but they decided to go with candidates with more experience in their specific tech stack (GraphQL subscriptions, Postgres, React Native).

Key Takeaways:
• Need to strengthen GraphQL knowledge
• Practice more system design for real-time systems
• Consider building a project with their tech stack

Will reapply in 6-12 months after gaining more experience.`,
  interviews: [
    {
      id: 'int-006',
      date: '2024-10-22T00:00:00Z',
      time: '9:00 AM PST',
      type: 'technical',
      interviewers: ['Tuomas Artman'],
      status: 'completed',
      notes: 'Technical phone screen. Discussed architecture and past projects. Good conversation but didn\'t move forward.',
      location: 'Phone Call',
    },
  ],
  statusHistory: [
    {
      status: 'rejected',
      date: '2024-11-05T00:00:00Z',
      notes: 'Received rejection email. Recruiter was kind and offered to keep in touch for future opportunities.',
    },
    {
      status: 'interview',
      date: '2024-10-20T00:00:00Z',
      notes: 'Phone screen scheduled.',
    },
    {
      status: 'applied',
      date: '2024-10-15T00:00:00Z',
      notes: 'Cold application. Linear is dream company - amazing product and engineering culture.',
    },
  ],
};

export function JobDetailPanelDemo() {
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const jobs = [sampleJob, sampleJob2, sampleJob3];

  const handleJobClick = (job: JobApplication) => {
    setSelectedJob(job);
    setIsPanelOpen(true);
  };

  const handleUpdate = async (updates: Partial<JobApplication>) => {
    console.log('Update job:', updates);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setSelectedJob(prev => prev ? { ...prev, ...updates } : null);
  };

  const handleDelete = async () => {
    console.log('Delete job');
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            JobDetailPanel Demo
          </h1>
          <p className="text-gray-600">
            Click on any job card to open the premium slide-over panel
          </p>
        </div>

        {/* Job Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {jobs.map(job => (
            <div
              key={job.id}
              onClick={() => handleJobClick(job)}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 border border-gray-200 hover:border-blue-300 hover:-translate-y-1 group"
            >
              {/* Status Badge */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide ${
                    job.status === 'offer'
                      ? 'bg-green-100 text-green-700'
                      : job.status === 'interview'
                      ? 'bg-purple-100 text-purple-700'
                      : job.status === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {job.status}
                </span>
                <span className="text-xs text-gray-500">
                  {Math.floor(
                    (new Date().getTime() - new Date(job.appliedDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}d ago
                </span>
              </div>

              {/* Company Logo Placeholder */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl mb-4 flex items-center justify-center text-white font-bold text-xl group-hover:scale-110 transition-transform">
                {job.companyName.charAt(0)}
              </div>

              {/* Job Info */}
              <h3 className="font-semibold text-gray-900 text-lg mb-2 group-hover:text-blue-600 transition-colors">
                {job.position}
              </h3>
              <p className="text-gray-600 font-medium mb-1">{job.companyName}</p>
              <p className="text-sm text-gray-500 mb-4">{job.location}</p>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>🗓️ {job.interviews?.length || 0} interviews</span>
                <span>📝 {job.statusHistory?.length || 0} updates</span>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h2 className="font-semibold text-blue-900 mb-2">
            ✨ Features to try:
          </h2>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Click the <strong>Edit</strong> button to modify job details inline</li>
            <li>• Switch between <strong>Overview</strong>, <strong>Interviews</strong>, and <strong>Activity</strong> tabs</li>
            <li>• Change the <strong>status</strong> with the dropdown selector</li>
            <li>• Check out the <strong>Quick Stats</strong> in the sidebar</li>
            <li>• Notice the <strong>smooth animations</strong> and Apple-inspired design</li>
            <li>• Try the <strong>backdrop blur</strong> effect on the overlay</li>
          </ul>
        </div>

        {/* Tech Stack */}
        <div className="mt-6 bg-white rounded-2xl p-6 border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-3">
            🛠️ Built with:
          </h2>
          <div className="flex flex-wrap gap-2">
            {['React', 'TypeScript', 'TailwindCSS', 'HeadlessUI', 'Framer Motion', 'Lucide Icons', 'date-fns'].map(
              tech => (
                <span
                  key={tech}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                >
                  {tech}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* The Slide-over Panel */}
      <JobDetailPanel
        job={selectedJob}
        open={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default JobDetailPanelDemo;

