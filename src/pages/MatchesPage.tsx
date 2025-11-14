'use client';
import React, { useEffect, useMemo, useState } from 'react';
import AuthLayout from '../components/AuthLayout';
import JobSearchBar from '../../components/JobSearchBar';
import JobFilters from '../../components/JobFilters';
import JobCard, { Job } from '../../components/JobCard';
import { collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import MatchExplanationModal from '../components/MatchExplanationModal';

function Header() {
	return (
		<header className="py-8">
			<h1 className="text-4xl font-extrabold tracking-tight">
				<span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
					Your Matches
				</span>
			</h1>
			<p className="mt-2 text-[15px] leading-6 text-gray-600 dark:text-gray-300">
				Personalized jobs ordered by best fit.
			</p>
			<div className="mt-4 h-px w-24 rounded-full bg-gradient-to-r from-purple-600/70 to-indigo-600/70" />
		</header>
	);
}

function formatSince(ts?: any): string {
	try {
		if (!ts) return '';
		const d = ts?.toDate ? ts.toDate() as Date : new Date(ts);
		const diff = Date.now() - d.getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 60) return `${mins} min ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours} hours ago`;
		const days = Math.floor(hours / 24);
		return `${days} days ago`;
	} catch {
		return '';
	}
}

type FirestoreJob = {
	title: string;
	company: string;
	location: string;
	description?: string;
	skills?: string[];
	applyUrl?: string;
	postedAt?: any;
	logoUrl?: string;
};

type FirestoreMatch = {
	userId: string;
	jobId: string;
	score: number;
};

export default function MatchesPage() {
	const { currentUser } = useAuth();
	const [visible, setVisible] = useState<number>(20);
	const [items, setItems] = useState<Array<{ job: Job; score: number }>>([]);
	const [queryTitle, setQueryTitle] = useState<string>('');
	const [queryLocation, setQueryLocation] = useState<string>('');
	const [userProfile, setUserProfile] = useState<any>(null);
	const [explainOpen, setExplainOpen] = useState<boolean>(false);
	const [selectedJob, setSelectedJob] = useState<Job | null>(null);

	useEffect(() => {
		if (!currentUser?.uid) return;
		(async () => {
			try {
				// load user profile
				try {
					const uref = doc(db, 'users', currentUser.uid);
					const usnap = await getDoc(uref);
					if (usnap.exists()) setUserProfile(usnap.data());
				} catch {}
				const q = query(collection(db, 'matches'), where('userId', '==', currentUser.uid), orderBy('score', 'desc'));
				const snap = await getDocs(q);
				const rows: Array<{ job: Job; score: number }> = [];
				for (const d of snap.docs) {
					const m = d.data() as FirestoreMatch;
					const jRef = doc(db, 'jobs', m.jobId);
					const jDoc = await getDoc(jRef);
					if (jDoc.exists()) {
						const j = jDoc.data() as FirestoreJob;
						rows.push({
							score: m.score,
							job: {
								id: jDoc.id,
								title: j.title || '',
								company: j.company || '',
								logoUrl: j.logoUrl,
								location: j.location || '',
								tags: (j.skills || []).slice(0, 10),
								published: formatSince(j.postedAt),
							},
						});
					}
				}
				setItems(rows);
			} catch (e) {
				console.error('Failed loading matches', e);
			}
		})();
	}, [currentUser?.uid]);

	function handleLoadMore() {
		setVisible((v) => v + 20);
	}

	return (
		<AuthLayout>
			<div className="p-6">
				<Header />
				<div className="mb-6">
					<JobSearchBar
						onSearch={({ title, location }) => {
							setQueryTitle(title.trim().toLowerCase());
							setQueryLocation(location.trim().toLowerCase());
							setVisible(20);
						}}
					/>
				</div>
				<div className="mb-6">
					<JobFilters />
				</div>
				<section aria-label="Matches list" className="space-y-4">
					{items
						.filter((x) => (queryTitle ? x.job.title.toLowerCase().includes(queryTitle) : true))
						.filter((x) => (queryLocation ? x.job.location.toLowerCase().includes(queryLocation) : true))
						.slice(0, visible)
						.map(({ job, score }) => (
							<JobCard
								key={job.id}
								job={job}
								rightExtra={<span>{Math.round(score * 100)}%</span>}
								onShowDetails={() => {}}
								onSave={() => {}}
								onApply={() => {}}
								onExplain={(jb) => {
									setSelectedJob(jb);
									setExplainOpen(true);
								}}
							/>
						))}
				</section>
				<MatchExplanationModal
					open={explainOpen}
					onClose={() => setExplainOpen(false)}
					user={userProfile}
					job={selectedJob ? {
						title: selectedJob.title,
						company: selectedJob.company,
						location: selectedJob.location,
						description: '',
						skills: selectedJob.tags || [],
						applyUrl: selectedJob.applyUrl || '',
						ats: 'workday'
					} : null}
				/>
				<div className="mt-6 flex justify-center">
					<button
						type="button"
						onClick={handleLoadMore}
						className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
					>
						Load more
					</button>
				</div>
			</div>
		</AuthLayout>
	);
}


