import type { Metadata } from 'next';
import { getAllJobs, getMatchingJobs } from '../../lib/getJobs';
import JobBoardClient from './components/JobBoardClient';

export const metadata: Metadata = {
  title: 'Jobs',
};

const userProfile = {
  role: 'technology consultant',
  skills: ['cloud', 'ai', 'backend', 'node', 'typescript'],
  targetCompanies: ['google', 'openai', 'figma', 'notion'],
  targetRoles: ['software engineer', 'ai engineer', 'backend developer'],
};

export default async function JobsPage() {
  const [allJobs, matching] = await Promise.all([getAllJobs(), getMatchingJobs(userProfile)]);
  return <JobBoardClient allJobs={allJobs} matching={matching} />;
}

'use client';
import React, { useMemo, useState } from 'react';
import LayoutContainer from '../../components/LayoutContainer';
import JobSearchBar from '../../components/JobSearchBar';
import JobFilters from '../../components/JobFilters';
import JobCard, { Job } from '../../components/JobCard';

function Header() {
	return (
		<header className="py-8">
			<h1 className="text-3xl font-semibold text-gray-900">Rechercher des emplois</h1>
			<p className="mt-2 text-gray-600">
				Explorez des opportunités adaptées à votre profil. Utilisez la recherche et les filtres pour affiner les résultats.
			</p>
		</header>
	);
}

const MOCK_JOBS: Job[] = [
	{
		id: '1',
		title: 'Développeur Frontend React',
		company: 'TechNova',
		logoUrl: '',
		location: 'Paris, France',
		tags: ['React', 'TypeScript', 'TailwindCSS'],
		published: 'il y a 2 jours',
	},
	{
		id: '2',
		title: 'Ingénieur Backend Node.js',
		company: 'DataForge',
		logoUrl: '',
		location: 'Remote',
		tags: ['Node.js', 'PostgreSQL', 'Docker'],
		published: 'il y a 4 jours',
	},
	{
		id: '3',
		title: 'Fullstack TypeScript',
		company: 'CloudBridge',
		logoUrl: '',
		location: 'Lyon, France',
		tags: ['Next.js', 'Prisma', 'AWS'],
		published: 'il y a 1 jour',
	},
	{
		id: '4',
		title: 'Product Designer',
		company: 'Designly',
		logoUrl: '',
		location: 'Marseille, France',
		tags: ['Figma', 'UX', 'UI'],
		published: 'il y a 5 jours',
	},
	{
		id: '5',
		title: 'Data Scientist',
		company: 'Insight AI',
		logoUrl: '',
		location: 'Remote',
		tags: ['Python', 'TensorFlow', 'Pandas'],
		published: 'il y a 3 jours',
	},
];

export default function JobsPage() {
	const [visible, setVisible] = useState<number>(5);
	const jobs = useMemo(() => MOCK_JOBS, []);

	function handleLoadMore() {
		setVisible((v) => v + 5);
	}

	return (
		<LayoutContainer>
			<Header />
			<div className="mb-6">
				<JobSearchBar onSearch={() => { /* no-op for now */ }} />
			</div>
			<div className="mb-6">
				<JobFilters />
			</div>

			<section aria-label="Job list" className="space-y-4">
				{jobs.slice(0, visible).map((job) => (
					<JobCard
						key={job.id}
						job={job}
						onShowDetails={() => {}}
						onSave={() => {}}
						onApply={() => {}}
					/>
				))}
			</section>

			<div className="mt-6 flex justify-center">
				<button
					type="button"
					onClick={handleLoadMore}
					className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-800 hover:bg-gray-50"
				>
					Charger plus
				</button>
			</div>
		</LayoutContainer>
	);
}


