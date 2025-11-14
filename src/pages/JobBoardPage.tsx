'use client';
import React, { useCallback, useEffect, useState } from 'react';
import AuthLayout from '../components/AuthLayout';
import JobSearchBar from '../../components/JobSearchBar';
import JobCard, { Job } from '../../components/JobCard';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, startAfter } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import MatchExplanationModal from '../components/MatchExplanationModal';

function Header() {
	return (
		<header className="py-8">
			<h1 className="text-4xl font-extrabold tracking-tight">
				<span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
					Job Board
				</span>
			</h1>
			<p className="mt-2 text-[15px] leading-6 text-gray-600 dark:text-gray-300">
				Discover opportunities tailored to your profile. Use search and filters to refine results.
			</p>
			<div className="mt-4 h-px w-24 rounded-full bg-gradient-to-r from-purple-600/70 to-indigo-600/70" />
		</header>
	);
}

function timeAgo(date: Date): string {
	const diffMs = Date.now() - date.getTime();
	const sec = Math.floor(diffMs / 1000);
	const min = Math.floor(sec / 60);
	const hr = Math.floor(min / 60);
	const day = Math.floor(hr / 24);
	if (day > 0) return `${day} day${day > 1 ? 's' : ''} ago`;
	if (hr > 0) return `${hr} hour${hr > 1 ? 's' : ''} ago`;
	if (min > 0) return `${min} minute${min > 1 ? 's' : ''} ago`;
	return 'just now';
}

export default function JobBoardPage() {
	const { currentUser } = useAuth();
	const PAGE_SIZE = 20;
	const [mode, setMode] = useState<'explore' | 'matches'>('explore');
	const [jobs, setJobs] = useState<Job[]>([]);
	const [lastDoc, setLastDoc] = useState<any>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [titleQuery, setTitleQuery] = useState<string>('');
	const [locationQuery, setLocationQuery] = useState<string>('');
	const [matchRows, setMatchRows] = useState<Array<{ job: Job; score: number }>>([]);
	const [matchesLoaded, setMatchesLoaded] = useState<boolean>(false);
	const [userProfile, setUserProfile] = useState<any>(null);
	const [explainOpen, setExplainOpen] = useState<boolean>(false);
	const [selectedJob, setSelectedJob] = useState<Job | null>(null);

	const loadInitial = useCallback(async () => {
		setLoading(true);
		try {
			const q = query(collection(db, 'jobs'), orderBy('postedAt', 'desc'), limit(PAGE_SIZE));
			const snap = await getDocs(q);
			const docs = snap.docs;
			const items: Job[] = docs.map((d) => {
				const data: any = d.data();
				const postedAt = data.postedAt?.toDate ? data.postedAt.toDate() : new Date();
				return {
					id: d.id,
					title: data.title || '',
					company: data.company || '',
					logoUrl: data.companyLogo || data.logoUrl || '',
					location: data.location || '',
					tags: Array.isArray(data.skills) ? data.skills : [],
					published: timeAgo(postedAt),
					applyUrl: data.applyUrl || '',
				} as Job & { applyUrl?: string };
			});
			setJobs(items);
			setLastDoc(docs[docs.length - 1] || null);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadInitial();
	}, []);
	useEffect(() => {
		(async () => {
			if (!currentUser?.uid) return;
			try {
				const uref = doc(db, 'users', currentUser.uid);
				const usnap = await getDoc(uref);
				if (usnap.exists()) setUserProfile(usnap.data());
			} catch {}
		})();
	}, [currentUser?.uid]);

	async function handleLoadMore() {
		if (!lastDoc || loading) return;
		setLoading(true);
		try {
			const q = query(
				collection(db, 'jobs'),
				orderBy('postedAt', 'desc'),
				startAfter(lastDoc),
				limit(PAGE_SIZE)
			);
			const snap = await getDocs(q);
			const docs = snap.docs;
			const items: Job[] = docs.map((d) => {
				const data: any = d.data();
				const postedAt = data.postedAt?.toDate ? data.postedAt.toDate() : new Date();
				return {
					id: d.id,
					title: data.title || '',
					company: data.company || '',
					logoUrl: data.companyLogo || data.logoUrl || '',
					location: data.location || '',
					tags: Array.isArray(data.skills) ? data.skills : [],
					published: timeAgo(postedAt),
					applyUrl: data.applyUrl || '',
				} as Job & { applyUrl?: string };
			});
			setJobs((prev) => [...prev, ...items]);
			setLastDoc(docs[docs.length - 1] || null);
		} finally {
			setLoading(false);
		}
	}

	async function ensureMatchesLoaded() {
		if (matchesLoaded || !currentUser?.uid) return;
		setLoading(true);
		try {
			const msnap = await getDocs(query(collection(db, 'matches'), orderBy('score', 'desc'), limit(200)));
			const mine = msnap.docs
				.map((d) => ({ id: d.id, ...(d.data() as any) }))
				.filter((m) => m.userId === currentUser.uid);
			const rows: Array<{ job: Job; score: number }> = [];
			for (const m of mine) {
				const jRef = doc(db, 'jobs', m.jobId);
				const jSnap = await getDoc(jRef);
				if (jSnap.exists()) {
					const data: any = jSnap.data();
					const postedAt = data.postedAt?.toDate ? data.postedAt.toDate() : new Date();
					rows.push({
						score: m.score,
						job: {
							id: jSnap.id,
							title: data.title || '',
							company: data.company || '',
								logoUrl: data.companyLogo || data.logoUrl || '',
							location: data.location || '',
								tags: Array.isArray(data.skills) ? data.skills : [],
							published: timeAgo(postedAt),
							applyUrl: data.applyUrl || '',
						} as Job & { applyUrl?: string },
					});
				}
			}
			setMatchRows(rows);
			setMatchesLoaded(true);
		} finally {
			setLoading(false);
		}
	}

	return (
		<AuthLayout>
			<div className="p-6">
				<Header />
				<div className="mb-4 flex items-center gap-3">
					<div className="inline-flex rounded-full border border-gray-200 p-1 dark:border-gray-700">
						<button
							type="button"
							onClick={() => setMode('explore')}
							className={`rounded-full px-3 py-1.5 text-sm ${
								mode === 'explore'
									? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
									: 'text-gray-700 dark:text-gray-300'
							}`}
						>
							Explore
						</button>
						<button
							type="button"
							onClick={() => {
								setMode('matches');
								void ensureMatchesLoaded();
							}}
							className={`rounded-full px-3 py-1.5 text-sm ${
								mode === 'matches'
									? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
									: 'text-gray-700 dark:text-gray-300'
							}`}
						>
							Pour toi
						</button>
					</div>
				</div>
				<div className="mb-6">
					<JobSearchBar
						onSearch={({ title, location }) => {
							setTitleQuery(title || '');
							setLocationQuery(location || '');
						}}
					/>
				</div>
				{/* Filters temporarily disabled */}
				{mode === 'explore' ? (
					<>
						<section aria-label="Job list" className="space-y-4">
							{jobs
								.filter((j) => (titleQuery ? j.title.toLowerCase().includes(titleQuery.toLowerCase()) : true) && (locationQuery ? j.location.toLowerCase().includes(locationQuery.toLowerCase()) : true))
								.map((job) => (
									<JobCard
										key={job.id}
										job={job}
										onApply={(jb) => {
											const url = (jb as any).applyUrl || '#';
											if (url && typeof window !== 'undefined') window.open(url, '_blank');
										}}
										onSave={() => {}}
									/>
								))}
						</section>
						<div className="mt-6 flex justify-center">
							<button
								type="button"
								onClick={handleLoadMore}
								disabled={loading || !lastDoc}
								className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-800 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
							>
								{lastDoc ? (loading ? 'Loading…' : 'Load more') : 'No more results'}
							</button>
						</div>
					</>
				) : (
					<section aria-label="Matches list" className="space-y-4">
						{!currentUser && <p className="text-gray-600 dark:text-gray-300">Sign in to see personalized matches.</p>}
						{currentUser &&
							matchRows.map(({ job }) => (
								<JobCard
									key={job.id}
									job={job}
									onApply={(jb) => {
										const url = (jb as any).applyUrl || '#';
										if (url && typeof window !== 'undefined') window.open(url, '_blank');
									}}
									onSave={() => {}}
									onExplain={(jb) => {
										setSelectedJob(jb);
										setExplainOpen(true);
									}}
								/>
							))}
					</section>
				)}
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
			</div>
		</AuthLayout>
	);
}


