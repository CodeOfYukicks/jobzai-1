'use client';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import AuthLayout from '../components/AuthLayout';
import type { Job } from '../../components/JobCard';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, startAfter } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import MatchExplanationModal from '../components/MatchExplanationModal';
import { AnimatePresence, motion } from 'framer-motion';

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

type ExtendedJob = Job & {
	applyUrl?: string;
	description?: string;
	seniority?: string;
	type?: string;
	salaryRange?: string;
	remote?: string;
	ats?: string;
};

export default function JobBoardPage() {
	const { currentUser } = useAuth();
	const PAGE_SIZE = 20;

	const [mode, setMode] = useState<'explore' | 'matches'>('explore');
	const [jobs, setJobs] = useState<ExtendedJob[]>([]);
	const [lastDoc, setLastDoc] = useState<any>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [initialLoading, setInitialLoading] = useState<boolean>(true);
	const [titleQuery, setTitleQuery] = useState<string>('');
	const [locationQuery, setLocationQuery] = useState<string>('');
	const [matchRows, setMatchRows] = useState<Array<{ job: ExtendedJob; score: number }>>([]);
	const [matchesLoaded, setMatchesLoaded] = useState<boolean>(false);
	const [userProfile, setUserProfile] = useState<any>(null);
	const [explainOpen, setExplainOpen] = useState<boolean>(false);
	const [selectedJob, setSelectedJob] = useState<ExtendedJob | null>(null);
	const [error, setError] = useState<string | null>(null);
	
	// Filter states
	const [activeFilters, setActiveFilters] = useState<string[]>([]);
	const [showMoreFilters, setShowMoreFilters] = useState<boolean>(false);
	const moreFiltersRef = useRef<HTMLDivElement>(null);

	const mapJob = (id: string, data: any): ExtendedJob => {
		const postedAt = data.postedAt?.toDate ? data.postedAt.toDate() : new Date();
		return {
			id,
			title: data.title || '',
			company: data.company || '',
			logoUrl: data.companyLogo || data.logoUrl || '',
			location: data.location || '',
			tags: Array.isArray(data.skills) ? data.skills : [],
			published: timeAgo(postedAt),
			applyUrl: data.applyUrl || '',
			description: data.description || data.summary || '',
			seniority: data.seniority || data.level || '',
			type: data.type || data.employmentType || '',
			salaryRange: data.salaryRange || data.compensation || '',
			remote: data.remote || data.remotePolicy || '',
			ats: data.ats || 'workday',
		};
	};

	const loadInitial = useCallback(async () => {
		setLoading(true);
		setInitialLoading(true);
		setError(null);
		try {
			const q = query(collection(db, 'jobs'), orderBy('postedAt', 'desc'), limit(PAGE_SIZE));
			const snap = await getDocs(q);
			const docs = snap.docs;
			const items: ExtendedJob[] = docs.map((d) => mapJob(d.id, d.data()));
			setJobs(items);
			setLastDoc(docs[docs.length - 1] || null);
			if (!selectedJob && items.length > 0) {
				setSelectedJob(items[0]);
			}
			
			// Check if Firestore is empty (only if no active search/filters)
			if (items.length === 0 && titleQuery.trim() === '' && locationQuery.trim() === '' && activeFilters.length === 0) {
				setError('empty');
				console.warn('⚠️ No jobs found in Firestore. The database may be empty.');
				console.log('💡 To populate with test data:');
				console.log('   1. Start emulators: firebase emulators:start');
				console.log('   2. Run seed script: cd functions && npm run seed:emulator');
				console.log('   Or fetch from ATS: cd functions && npm run fetch:local');
			}
		} catch (err: any) {
			console.error('❌ Error loading jobs:', err);
			setError('connection');
			if (err.code === 'unavailable' || err.code === 'failed-precondition') {
				console.error('   → Firestore connection error. Check if:');
				console.error('     - Firebase is properly configured');
				console.error('     - Emulators are running (if using emulator)');
				console.error('     - Network connection is stable');
			}
		} finally {
			setLoading(false);
			setInitialLoading(false);
		}
		// we intentionally omit selectedJob from deps to avoid refetch loop
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		loadInitial();
	}, [loadInitial]);

	useEffect(() => {
		(async () => {
			if (!currentUser?.uid) return;
			try {
				const uref = doc(db, 'users', currentUser.uid);
				const usnap = await getDoc(uref);
				if (usnap.exists()) setUserProfile(usnap.data());
			} catch {
				// no-op
			}
		})();
	}, [currentUser?.uid]);

	// Click outside to close more filters dropdown
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (moreFiltersRef.current && !moreFiltersRef.current.contains(event.target as Node)) {
				setShowMoreFilters(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const toggleFilter = (filter: string) => {
		setActiveFilters(prev => 
			prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
		);
	};

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
			const items: ExtendedJob[] = docs.map((d) => mapJob(d.id, d.data()));
			setJobs((prev) => {
				const combined = [...prev, ...items];
				if (!selectedJob && combined.length > 0) {
					setSelectedJob(combined[0]);
				}
				return combined;
			});
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
			const rows: Array<{ job: ExtendedJob; score: number }> = [];
			for (const m of mine) {
				const jRef = doc(db, 'jobs', m.jobId);
				const jSnap = await getDoc(jRef);
				if (jSnap.exists()) {
					const data: any = jSnap.data();
					const job = mapJob(jSnap.id, data);
					rows.push({
						score: m.score,
						job,
					});
				}
			}
			setMatchRows(rows);
			setMatchesLoaded(true);
			if (!selectedJob && rows.length > 0) {
				setSelectedJob(rows[0].job);
			}
		} finally {
			setLoading(false);
		}
	}

	const filteredJobs = useMemo(() => {
		const list = mode === 'explore' ? jobs : matchRows.map((m) => m.job);
		if (!titleQuery && !locationQuery) return list;
		return list.filter((j) => {
			const titleMatch = titleQuery
				? j.title.toLowerCase().includes(titleQuery.toLowerCase())
				: true;
			const locationMatch = locationQuery
				? j.location.toLowerCase().includes(locationQuery.toLowerCase())
				: true;
			return titleMatch && locationMatch;
		});
	}, [jobs, matchRows, mode, titleQuery, locationQuery]);

	const matchScoreById = useMemo(() => {
		const map = new Map<string, number>();
		matchRows.forEach((row) => {
			map.set(row.job.id, row.score);
		});
		return map;
	}, [matchRows]);

	const handleSelectJob = (job: ExtendedJob) => {
		setSelectedJob(job);
	};

	const handleApply = (job: ExtendedJob | null) => {
		if (!job) return;
		const url = job.applyUrl || '#';
		if (url && typeof window !== 'undefined') {
			window.open(url, '_blank');
		}
	};

	const handleSearch = async () => {
		if (mode === 'matches') {
			// Don't perform global search in matches mode
			return;
		}

		setLoading(true);
		setInitialLoading(true);
		setSelectedJob(null);

		try {
			// Build query parameters
			const params = new URLSearchParams();
			
			if (titleQuery.trim()) {
				params.append('keyword', titleQuery.trim());
			}
			
			if (locationQuery.trim()) {
				params.append('location', locationQuery.trim());
			}

			// Add active filters
			if (activeFilters.includes('remote')) {
				params.append('remote', 'true');
			}
			
			if (activeFilters.includes('full-time')) {
				params.append('fullTime', 'true');
			}
			
			if (activeFilters.includes('senior')) {
				params.append('senior', 'true');
			}
			
			if (activeFilters.includes('last-24h')) {
				params.append('last24h', 'true');
			}

			// Experience level filters
			if (activeFilters.includes('internship')) {
				params.append('experienceLevel', 'internship');
			} else if (activeFilters.includes('entry level')) {
				params.append('experienceLevel', 'entry level');
			} else if (activeFilters.includes('mid-senior')) {
				params.append('experienceLevel', 'mid-senior');
			} else if (activeFilters.includes('director')) {
				params.append('experienceLevel', 'director');
			} else if (activeFilters.includes('executive')) {
				params.append('experienceLevel', 'executive');
			}

			// Job type filters
			if (activeFilters.includes('contract')) {
				params.append('jobType', 'contract');
			} else if (activeFilters.includes('part-time')) {
				params.append('jobType', 'part-time');
			} else if (activeFilters.includes('temporary')) {
				params.append('jobType', 'temporary');
			} else if (activeFilters.includes('volunteer')) {
				params.append('jobType', 'volunteer');
			}

			// Determine API URL based on environment
			const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
			const apiUrl = isDev 
				? `http://localhost:5001/jobzai-39f7e/us-central1/searchJobs?${params.toString()}`
				: `/api/jobs?${params.toString()}`;

			console.log('🔍 Searching jobs with URL:', apiUrl);

			const response = await fetch(apiUrl, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(`Search failed: ${response.statusText}`);
			}

			const data = await response.json();

			if (data.success && Array.isArray(data.jobs)) {
				console.log(`✅ Found ${data.jobs.length} jobs`);
				
				// Map the response to ExtendedJob format
				const searchResults: ExtendedJob[] = data.jobs.map((job: any) => {
					const postedAt = job.postedAt?.toDate 
						? job.postedAt.toDate() 
						: job.postedAt 
							? new Date(job.postedAt._seconds * 1000) 
							: new Date();
					
					return {
						id: job.id,
						title: job.title || '',
						company: job.company || '',
						logoUrl: job.logoUrl || '',
						location: job.location || '',
						tags: Array.isArray(job.tags) ? job.tags : [],
						published: timeAgo(postedAt),
						applyUrl: job.applyUrl || '',
						description: job.description || '',
						seniority: job.seniority || '',
						type: job.type || '',
						salaryRange: job.salaryRange || '',
						remote: job.remote || '',
						ats: job.ats || 'workday',
					};
				});

				// Replace current jobs with search results
				setJobs(searchResults);
				setLastDoc(null); // Disable pagination for search results
				
				// Select first job if available
				if (searchResults.length > 0) {
					setSelectedJob(searchResults[0]);
				} else {
					setSelectedJob(null);
				}
			} else {
				console.error('Invalid response from search API:', data);
				// Show empty results
				setJobs([]);
				setSelectedJob(null);
			}
		} catch (error) {
			console.error('Error searching jobs:', error);
			// On error, keep existing jobs or show empty
			setJobs([]);
			setSelectedJob(null);
		} finally {
			setLoading(false);
			setInitialLoading(false);
		}
	};

	const handleClearSearch = () => {
		setTitleQuery('');
		setLocationQuery('');
		setActiveFilters([]);
		loadInitial(); // Reload initial jobs
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !loading && mode === 'explore') {
			handleSearch();
		}
	};

	const showMatchesEmptyState = mode === 'matches' && currentUser && !initialLoading && filteredJobs.length === 0;
	const hasActiveSearch = titleQuery.trim() !== '' || locationQuery.trim() !== '' || activeFilters.length > 0;

	// Helper functions for company logos (same as CVAnalysisPage)
	const getDomainFromCompanyName = (name?: string | null) => {
		if (!name) return null;
		try {
			const slug = name
				.toLowerCase()
				.replace(/&/g, 'and')
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, '');
			if (!slug) return null;
			return `${slug}.com`;
		} catch {
			return null;
		}
	};

	const getCompanyLogoUrl = (company?: string | null) => {
		const placeholder = '/images/logo-placeholder.svg';
		const domain = getDomainFromCompanyName(company || '');
		if (domain) {
			return `https://logo.clearbit.com/${domain}`;
		}
		return placeholder;
	};

	const getCompanyInitials = (company: string) => {
		return (company || '?')
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0])
			.join('')
			.toUpperCase();
	};

	return (
		<AuthLayout>
			{/* Premium Container with Maximum Breathing Room - Dark Mode Friendly */}
			<div className="min-h-screen bg-gradient-to-br from-[#FAFAFB] via-white to-[#F8F9FA] dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-3 py-3">
				
				{/* LINKEDIN-STYLE SEARCH & FILTER SECTION */}
				<motion.div 
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
					className="w-full mb-4"
				>
					{/* Main Search Bar Container */}
					<div className="bg-white dark:bg-gray-900/60 rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-[#E5E7EB]/50 dark:border-gray-800/80 backdrop-blur-sm p-4">
						
						{/* Mode Selector + Search Inputs Row */}
						<div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 mb-4">
							
							{/* Segmented Control - Browse / For You */}
							<div className="inline-flex items-center rounded-[12px] bg-[#F3F4F6] dark:bg-gray-800/60 p-1 text-sm font-medium">
						<button
							type="button"
							onClick={() => {
								setMode('explore');
								// If coming from matches mode and no search is active, reload initial jobs
								if (mode === 'matches' && !hasActiveSearch) {
									loadInitial();
								}
							}}
									className={`
										relative rounded-[10px] px-5 py-2.5 transition-all duration-200
										${mode === 'explore' 
											? 'bg-white dark:bg-gray-700 text-[#111111] dark:text-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.4)]' 
											: 'text-[#6B6B6F] dark:text-gray-400 hover:text-[#111111] dark:hover:text-gray-200'
										}
									`}
						>
										Browse
						</button>
						<button
							type="button"
							onClick={() => {
								setMode('matches');
								void ensureMatchesLoaded();
							}}
									className={`
										relative rounded-[10px] px-5 py-2.5 transition-all duration-200
										${mode === 'matches' 
											? 'bg-white dark:bg-gray-700 text-[#111111] dark:text-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.4)]' 
											: 'text-[#6B6B6F] dark:text-gray-400 hover:text-[#111111] dark:hover:text-gray-200'
										}
									`}
						>
										For you
						</button>
					</div>

							{/* Divider */}
							<div className="hidden lg:block h-10 w-px bg-[#E5E7EB] dark:bg-gray-700" />

							{/* Search Inputs - LinkedIn Style */}
							<div className="flex-1 flex flex-col sm:flex-row gap-3 w-full">
								{/* Job Title Input */}
								<div className="relative flex-1">
									<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
										<svg className="h-5 w-5 text-[#6B6B6F] dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
										</svg>
								</div>
									<input
										type="text"
										placeholder="Job title, keywords, or company"
										value={titleQuery}
										onChange={(e) => setTitleQuery(e.target.value)}
										onKeyPress={handleKeyPress}
										className="
											w-full pl-12 pr-4 py-3 
											bg-[#F7F7F9] dark:bg-gray-800/60 border border-[#E5E7EB] dark:border-gray-700 
											rounded-[12px] 
											text-[15px] text-[#111111] dark:text-gray-100 placeholder-[#6B6B6F] dark:placeholder-gray-400
											transition-all duration-200
											hover:border-[#D1D1D6] dark:hover:border-gray-600 hover:bg-white dark:hover:bg-gray-800
											focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white dark:focus:bg-gray-800
										"
									/>
				</div>

								{/* Location Input */}
								<div className="relative flex-1">
									<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
										<svg className="h-5 w-5 text-[#6B6B6F] dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
										</svg>
				</div>
									<input
										type="text"
										placeholder="City, state, or remote"
										value={locationQuery}
										onChange={(e) => setLocationQuery(e.target.value)}
										onKeyPress={handleKeyPress}
										className="
											w-full pl-12 pr-4 py-3 
											bg-[#F7F7F9] dark:bg-gray-800/60 border border-[#E5E7EB] dark:border-gray-700 
											rounded-[12px] 
											text-[15px] text-[#111111] dark:text-gray-100 placeholder-[#6B6B6F] dark:placeholder-gray-400
											transition-all duration-200
											hover:border-[#D1D1D6] dark:hover:border-gray-600 hover:bg-white dark:hover:bg-gray-800
											focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white dark:focus:bg-gray-800
										"
					/>
				</div>

							{/* Search Button */}
							<button
								type="button"
								onClick={handleSearch}
								disabled={loading || mode === 'matches'}
								className="
									px-8 py-3 
									bg-gradient-to-r from-indigo-600 to-violet-600 text-white 
									rounded-[12px] 
									font-semibold text-[15px]
									shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/30
									transition-all duration-200
									hover:from-indigo-700 hover:to-violet-700 hover:shadow-indigo-500/30 dark:hover:shadow-indigo-900/40
									hover:scale-[1.02]
									active:scale-[0.98]
									disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
									whitespace-nowrap
								"
							>
								{loading ? 'Searching...' : 'Search'}
							</button>
							</div>

							{/* Results Count & Clear Search */}
							<div className="hidden xl:flex items-center gap-3">
								<div className="text-sm font-medium text-[#6B6B6F] dark:text-gray-400 whitespace-nowrap">
									{initialLoading ? 'Loading...' : `${filteredJobs.length} roles`}
								</div>
								{hasActiveSearch && mode === 'explore' && !initialLoading && (
									<button
										type="button"
									onClick={handleClearSearch}
									className="
										text-sm font-medium text-indigo-600 dark:text-indigo-400
										hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors duration-150
										whitespace-nowrap
									"
									>
										Clear search
									</button>
								)}
							</div>
						</div>

						{/* Filter Chips Row - LinkedIn Style */}
						<div className="flex flex-wrap items-center gap-2">
							{/* Quick Filter Chips */}
							<button
								type="button"
								onClick={() => toggleFilter('remote')}
								className={`
									inline-flex items-center gap-2 px-4 py-2 
									rounded-full text-sm font-medium
									border transition-all duration-200
									${activeFilters.includes('remote')
										? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/30'
										: 'bg-white dark:bg-gray-800/60 text-[#111111] dark:text-gray-200 border-[#E5E7EB] dark:border-gray-700 hover:border-[#D1D1D6] dark:hover:border-gray-600 hover:bg-[#F7F7F9] dark:hover:bg-gray-800 hover:shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.3)]'
									}
								`}
							>
								{activeFilters.includes('remote') && (
									<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
									</svg>
								)}
								Remote
							</button>

							<button
								type="button"
								onClick={() => toggleFilter('full-time')}
								className={`
									inline-flex items-center gap-2 px-4 py-2 
									rounded-full text-sm font-medium
									border transition-all duration-200
									${activeFilters.includes('full-time')
										? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/30'
										: 'bg-white dark:bg-gray-800/60 text-[#111111] dark:text-gray-200 border-[#E5E7EB] dark:border-gray-700 hover:border-[#D1D1D6] dark:hover:border-gray-600 hover:bg-[#F7F7F9] dark:hover:bg-gray-800 hover:shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.3)]'
									}
								`}
							>
								{activeFilters.includes('full-time') && (
									<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
									</svg>
								)}
								Full-time
							</button>

							<button
								type="button"
								onClick={() => toggleFilter('senior')}
								className={`
									inline-flex items-center gap-2 px-4 py-2 
									rounded-full text-sm font-medium
									border transition-all duration-200
									${activeFilters.includes('senior')
										? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/30'
										: 'bg-white dark:bg-gray-800/60 text-[#111111] dark:text-gray-200 border-[#E5E7EB] dark:border-gray-700 hover:border-[#D1D1D6] dark:hover:border-gray-600 hover:bg-[#F7F7F9] dark:hover:bg-gray-800 hover:shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.3)]'
									}
								`}
							>
								{activeFilters.includes('senior') && (
									<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
									</svg>
								)}
								Senior
							</button>

							<button
								type="button"
								onClick={() => toggleFilter('last-24h')}
								className={`
									inline-flex items-center gap-2 px-4 py-2 
									rounded-full text-sm font-medium
									border transition-all duration-200
									${activeFilters.includes('last-24h')
										? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/30'
										: 'bg-white dark:bg-gray-800/60 text-[#111111] dark:text-gray-200 border-[#E5E7EB] dark:border-gray-700 hover:border-[#D1D1D6] dark:hover:border-gray-600 hover:bg-[#F7F7F9] dark:hover:bg-gray-800 hover:shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.3)]'
									}
								`}
							>
								{activeFilters.includes('last-24h') && (
									<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
									</svg>
								)}
								Last 24 hours
							</button>

							{/* More Filters Dropdown */}
							<div className="relative" ref={moreFiltersRef}>
								<button
									type="button"
									onClick={() => setShowMoreFilters(!showMoreFilters)}
									className="
										inline-flex items-center gap-2 px-4 py-2 
										rounded-full text-sm font-medium
										bg-white dark:bg-gray-800/60 text-[#111111] dark:text-gray-200 border border-[#E5E7EB] dark:border-gray-700
										hover:border-[#D1D1D6] dark:hover:border-gray-600 hover:bg-[#F7F7F9] dark:hover:bg-gray-800 hover:shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.3)]
										transition-all duration-200
									"
								>
									More filters
									<svg 
										className={`w-4 h-4 transition-transform duration-200 ${showMoreFilters ? 'rotate-180' : ''}`} 
										fill="none" 
										viewBox="0 0 24 24" 
										stroke="currentColor"
									>
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
									</svg>
								</button>

								{/* Dropdown Menu */}
								<AnimatePresence>
									{showMoreFilters && (
										<motion.div
											initial={{ opacity: 0, y: -8, scale: 0.95 }}
											animate={{ opacity: 1, y: 0, scale: 1 }}
											exit={{ opacity: 0, y: -8, scale: 0.95 }}
											transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
											className="
												absolute top-full left-0 mt-2 w-72
												bg-white dark:bg-gray-900 rounded-[14px] 
												shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)] 
												border border-[#E5E7EB] dark:border-gray-800
												overflow-hidden z-50
											"
										>
											{/* Dropdown Header */}
											<div className="px-5 py-4 border-b border-[#F3F4F6] dark:border-gray-800">
												<h3 className="text-[15px] font-semibold text-[#111111] dark:text-gray-100">All filters</h3>
											</div>

											{/* Filter Options */}
											<div className="p-3 max-h-80 overflow-y-auto">
												{/* Experience Level */}
												<div className="mb-4">
													<p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6B6B6F] dark:text-gray-400 px-2 mb-2">
														Experience Level
													</p>
													<div className="space-y-1">
														{['Internship', 'Entry level', 'Mid-Senior', 'Director', 'Executive'].map((level) => (
															<label
																key={level}
																className="
																	flex items-center gap-3 px-2 py-2 rounded-[10px]
																	hover:bg-[#F7F7F9] dark:hover:bg-gray-800 cursor-pointer
																	transition-colors duration-150
																"
															>
																<input
																	type="checkbox"
																	checked={activeFilters.includes(level.toLowerCase())}
																	onChange={() => toggleFilter(level.toLowerCase())}
																	className="
																		w-5 h-5 rounded-md border-2 border-[#D1D1D6] dark:border-gray-700
																		text-indigo-600 dark:text-indigo-500
																		focus:ring-2 focus:ring-indigo-500/20 focus:ring-offset-0
																		transition-colors cursor-pointer
																		dark:bg-gray-800
																	"
																/>
																<span className="text-sm text-[#111111] dark:text-gray-200">{level}</span>
															</label>
														))}
													</div>
												</div>

												{/* Job Type */}
												<div className="mb-4">
													<p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6B6B6F] dark:text-gray-400 px-2 mb-2">
														Job Type
													</p>
													<div className="space-y-1">
														{['Contract', 'Part-time', 'Temporary', 'Volunteer'].map((type) => (
															<label
																key={type}
																className="
																	flex items-center gap-3 px-2 py-2 rounded-[10px]
																	hover:bg-[#F7F7F9] dark:hover:bg-gray-800 cursor-pointer
																	transition-colors duration-150
																"
															>
																<input
																	type="checkbox"
																	checked={activeFilters.includes(type.toLowerCase())}
																	onChange={() => toggleFilter(type.toLowerCase())}
																	className="
																		w-5 h-5 rounded-md border-2 border-[#D1D1D6] dark:border-gray-700
																		text-indigo-600 dark:text-indigo-500
																		focus:ring-2 focus:ring-indigo-500/20 focus:ring-offset-0
																		transition-colors cursor-pointer
																		dark:bg-gray-800
																	"
																/>
																<span className="text-sm text-[#111111] dark:text-gray-200">{type}</span>
															</label>
														))}
													</div>
												</div>
											</div>

											{/* Dropdown Footer with Actions */}
											<div className="px-4 py-3 border-t border-[#F3F4F6] dark:border-gray-800 flex items-center justify-between gap-3">
												<button
													type="button"
													onClick={() => setActiveFilters([])}
													className="
														text-sm font-medium text-[#6B6B6F] dark:text-gray-400
														hover:text-[#111111] dark:hover:text-gray-200 transition-colors duration-150
													"
												>
													Clear all
												</button>
											<button
												type="button"
												onClick={() => setShowMoreFilters(false)}
												className="
													px-6 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white 
													rounded-[10px] text-sm font-semibold
													shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/30
													hover:from-indigo-700 hover:to-violet-700
													transition-all duration-150
												"
											>
												Apply
											</button>
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>

							{/* Clear Filters */}
							{activeFilters.length > 0 && (
								<motion.button
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.9 }}
									type="button"
									onClick={() => setActiveFilters([])}
									className="
										inline-flex items-center gap-1.5 px-3 py-2 
										text-sm font-medium text-[#6B6B6F] dark:text-gray-400
										hover:text-[#111111] dark:hover:text-gray-200 transition-colors duration-150
									"
								>
									<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
									Clear all
								</motion.button>
							)}
						</div>
					</div>
				</motion.div>

				{/* Premium Split Layout Container */}
				<div className="w-full flex flex-col lg:flex-row gap-4 h-[calc(100vh-160px)] min-h-[600px]">
					
					{/* LEFT PANEL - Job List (38% width) */}
					<motion.section
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
						aria-label="Job list"
						className="lg:w-[38%] flex flex-col bg-white dark:bg-gray-900/60 rounded-[16px] shadow-[0_2px_6px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.3)] border border-[#E5E7EB]/50 dark:border-gray-800/80 backdrop-blur-sm"
					>
						{/* Job Cards List - Scrollable */}
						<div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
							{initialLoading ? (
								// Premium Skeleton Loading
								<div className="space-y-3">
									{Array.from({ length: 6 }).map((_, idx) => (
										<div
											key={idx}
											className="animate-pulse rounded-[14px] border border-[#F3F4F6] dark:border-gray-800 bg-white dark:bg-gray-800/60 p-6"
										>
											<div className="flex gap-4">
												<div className="h-14 w-14 rounded-[12px] bg-[#F3F4F6] dark:bg-gray-700" />
												<div className="flex-1 space-y-3">
													<div className="h-4 w-3/4 rounded-full bg-[#F3F4F6] dark:bg-gray-700" />
													<div className="h-3 w-1/2 rounded-full bg-[#F3F4F6] dark:bg-gray-700" />
													<div className="flex gap-2 mt-3">
														<div className="h-6 w-16 rounded-full bg-[#F3F4F6] dark:bg-gray-700" />
														<div className="h-6 w-20 rounded-full bg-[#F3F4F6] dark:bg-gray-700" />
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							) : filteredJobs.length === 0 ? (
								// Empty State
								<div className="mt-12 text-center px-6">
									<div className="mx-auto w-16 h-16 rounded-[16px] bg-[#F3F4F6] dark:bg-gray-800 flex items-center justify-center mb-4">
										<svg className="w-8 h-8 text-[#6B6B6F] dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
										</svg>
									</div>
									<h3 className="text-[17px] font-semibold text-[#111111] dark:text-gray-100">
										{error === 'empty' ? 'No jobs available' : error === 'connection' ? 'Connection error' : 'No roles found'}
									</h3>
									<p className="mt-2 text-sm text-[#6B6B6F] dark:text-gray-400 max-w-xs mx-auto">
										{error === 'empty' 
											? 'The job database is currently empty. Jobs are fetched daily from ATS sources. For local development, you can seed test data.'
											: error === 'connection'
											? 'Unable to connect to Firestore. Please check your connection and try again.'
											: 'Try adjusting your search criteria or browse all available opportunities.'
										}
									</p>
									{(error === 'empty' || error === 'connection') && (
										<div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
											<button
												type="button"
												onClick={() => {
													setError(null);
													loadInitial();
												}}
												className="
													inline-flex items-center gap-2 px-4 py-2 
													bg-gradient-to-r from-indigo-600 to-violet-600 text-white 
													rounded-[10px] text-sm font-medium
													shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/30
													hover:from-indigo-700 hover:to-violet-700
													transition-all duration-150
												"
											>
												<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
												</svg>
												Refresh
											</button>
											{error === 'empty' && (
												<a
													href="https://console.firebase.google.com/project/jobzai/firestore"
													target="_blank"
													rel="noopener noreferrer"
													className="
														inline-flex items-center gap-2 px-4 py-2 
														border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800/60 
														text-[#111111] dark:text-gray-200 rounded-[10px] text-sm font-medium
														hover:bg-[#F3F4F6] dark:hover:bg-gray-800
														transition-all duration-150
													"
												>
													<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
													</svg>
													Check Firebase Console
												</a>
											)}
										</div>
									)}
								</div>
							) : (
								// Job Cards
								filteredJobs.map((job) => {
									const isSelected = selectedJob?.id === job.id;
									const matchScore = matchScoreById.get(job.id);

									return (
										<motion.button
										key={job.id}
											type="button"
											onClick={() => handleSelectJob(job)}
											initial={false}
											whileHover={{ scale: 1.01 }}
											transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
											className={`
												group relative w-full rounded-[14px] border p-6 text-left
												transition-all duration-200
												${isSelected 
													? 'border-indigo-600 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 dark:from-indigo-950/30 dark:to-violet-950/30 shadow-[0_0_0_3px_rgba(99,102,241,0.12)] dark:shadow-[0_0_0_3px_rgba(139,92,246,0.25)]' 
													: 'border-[#E5E7EB] dark:border-gray-800 bg-white dark:bg-gray-800/60 hover:border-[#D1D1D6] dark:hover:border-gray-700 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]'
												}
											`}
										>
											<div className="flex items-start gap-4">
												{/* Company Logo/Initial */}
												<div className="flex-shrink-0 w-14 h-14 rounded-[12px] bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] dark:from-gray-700 dark:to-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
													<img
														src={getCompanyLogoUrl(job.company)}
														onError={(e) => {
															const target = e.currentTarget as HTMLImageElement;
															target.style.display = 'none';
															const parent = target.parentElement;
															if (parent && !parent.querySelector('.company-initials')) {
																const initialsDiv = document.createElement('div');
																initialsDiv.className = 'company-initials text-[15px] font-semibold text-[#111111] dark:text-gray-100';
																initialsDiv.textContent = getCompanyInitials(job.company);
																parent.appendChild(initialsDiv);
															}
														}}
														alt={`${job.company} logo`}
														className="w-12 h-12 object-contain"
													/>
												</div>

												{/* Job Info */}
												<div className="flex-1 min-w-0">
													<div className="flex items-start justify-between gap-3 mb-2">
														<div className="flex-1 min-w-0">
															<h3 className="text-[17px] font-semibold text-[#111111] dark:text-gray-100 truncate">
																{job.title}
															</h3>
															<p className="text-[15px] text-[#6B6B6F] dark:text-gray-400 mt-0.5">
																{job.company}
															</p>
														</div>

													{/* Match Score Badge */}
															{matchScore !== undefined && (
														<span className="flex-shrink-0 inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
															{Math.round(matchScore)}% match
																</span>
															)}
														</div>

													{/* Location & Time */}
													<div className="flex items-center gap-2 text-sm text-[#6B6B6F] dark:text-gray-400 mb-3">
														<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
														</svg>
														<span>{job.location || 'Remote'}</span>
														<span className="text-[#D1D1D6] dark:text-gray-600">•</span>
														<span>{job.published}</span>
													</div>

													{/* Tags */}
													{job.tags && job.tags.length > 0 && (
														<div className="flex flex-wrap gap-2">
															{job.tags.slice(0, 3).map((tag) => (
																<span
																	key={tag}
																	className="inline-flex items-center rounded-[8px] bg-[#F3F4F6] dark:bg-gray-700/60 px-2.5 py-1 text-xs font-medium text-[#444448] dark:text-gray-300"
																>
																	{tag}
																</span>
															))}
															{job.tags.length > 3 && (
																<span className="inline-flex items-center rounded-[8px] bg-[#F3F4F6] dark:bg-gray-700/60 px-2.5 py-1 text-xs font-medium text-[#6B6B6F] dark:text-gray-400">
																	+{job.tags.length - 3} more
																</span>
															)}
														</div>
													)}
												</div>
											</div>

											{/* Selected Indicator */}
											{isSelected && (
												<div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-indigo-600 to-violet-600 rounded-r-full shadow-md" />
											)}
										</motion.button>
									);
								})
							)}

							{/* Load More Button */}
							{mode === 'explore' && filteredJobs.length > 0 && (
								<div className="pt-4 pb-2 flex justify-center">
									<button
										type="button"
										onClick={handleLoadMore}
										disabled={loading || !lastDoc}
										className="
											inline-flex items-center rounded-[12px] border border-[#E5E7EB] 
											bg-white px-6 py-3 text-sm font-medium text-[#111111] 
											shadow-[0_1px_2px_rgba(0,0,0,0.04)]
											transition-all duration-200
											hover:bg-[#F3F4F6] hover:border-[#D1D1D6]
											disabled:opacity-50 disabled:cursor-not-allowed
										"
									>
										{lastDoc ? (loading ? 'Loading...' : 'Load more roles') : 'All roles loaded'}
									</button>
								</div>
							)}
						</div>
					</motion.section>

					{/* RIGHT PANEL - Job Detail (62% width) */}
					<motion.section
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
						className="flex-1 lg:w-[62%] flex flex-col bg-white dark:bg-gray-900/60 rounded-[16px] shadow-[0_2px_6px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.3)] border border-[#E5E7EB]/50 dark:border-gray-800/80 overflow-hidden backdrop-blur-sm"
					>
						<AnimatePresence mode="wait">
							{selectedJob ? (
								<motion.div
									key={selectedJob.id}
									initial={{ x: 32, opacity: 0 }}
									animate={{ x: 0, opacity: 1 }}
									exit={{ x: -32, opacity: 0 }}
									transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
									className="flex flex-col h-full"
								>
									{/* Sticky Header with Apply Button */}
									<div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-[#F3F4F6] dark:border-gray-800 px-8 py-6">
										<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
											<div className="flex-1">
											<p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-600 dark:text-indigo-400 mb-3">
												{mode === 'matches' ? '✨ Recommended for you' : 'Position Details'}
											</p>
												<h2 className="text-[32px] font-semibold tracking-[-0.02em] text-[#111111] dark:text-gray-100 leading-tight mb-3">
													{selectedJob.title}
												</h2>
												<div className="flex items-center gap-3 text-[16px] text-[#6B6B6F] dark:text-gray-400">
													<span className="font-medium text-[#111111] dark:text-gray-100">{selectedJob.company}</span>
													<span className="text-[#D1D1D6] dark:text-gray-600">•</span>
													<div className="flex items-center gap-1.5">
														<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
														</svg>
														<span>{selectedJob.location || 'Remote'}</span>
											</div>
													<span className="text-[#D1D1D6] dark:text-gray-600">•</span>
													<span>{selectedJob.published}</span>
												</div>
											</div>

											{/* Action Buttons */}
											<div className="flex items-center gap-3">
												{mode === 'matches' && (
													<button
														type="button"
														onClick={() => setExplainOpen(true)}
														className="
															inline-flex items-center gap-2 rounded-[12px] 
															border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800/60 px-5 py-3 
															text-sm font-medium text-[#111111] dark:text-gray-200
															transition-all duration-200
															hover:bg-[#F3F4F6] dark:hover:bg-gray-800 hover:border-[#D1D1D6] dark:hover:border-gray-600
														"
													>
														<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
														</svg>
														Why this match
													</button>
												)}
												<button
													type="button"
													onClick={() => handleApply(selectedJob)}
												className="
													inline-flex items-center gap-2 rounded-[12px] 
													bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-3 text-[15px] font-semibold text-white
													shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/30
													transition-all duration-200
													hover:from-indigo-700 hover:to-violet-700 hover:shadow-indigo-500/30 dark:hover:shadow-indigo-900/40
													hover:scale-[1.02]
													active:scale-[0.98]
												"
												>
													Apply now
												<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
												</svg>
												</button>
											</div>
										</div>
									</div>

									{/* Scrollable Content */}
									<div className="flex-1 overflow-y-auto px-8 py-8 space-y-10">
										{/* Job Metadata Grid */}
										{(selectedJob.type || selectedJob.seniority || selectedJob.salaryRange || selectedJob.remote) && (
											<div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-8 rounded-[14px] bg-gradient-to-br from-[#FAFAFB] to-[#F3F4F6] dark:from-gray-800/60 dark:to-gray-900/60 border border-[#E5E7EB]/50 dark:border-gray-800">
												{selectedJob.type && (
													<div>
														<p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B6B6F] dark:text-gray-400 mb-2">
															Contract Type
														</p>
														<p className="text-[16px] font-medium text-[#111111] dark:text-gray-100">{selectedJob.type}</p>
													</div>
												)}
												{selectedJob.seniority && (
													<div>
														<p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B6B6F] dark:text-gray-400 mb-2">
															Experience Level
														</p>
														<p className="text-[16px] font-medium text-[#111111] dark:text-gray-100">{selectedJob.seniority}</p>
													</div>
												)}
												{selectedJob.salaryRange && (
													<div>
														<p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B6B6F] dark:text-gray-400 mb-2">
															Compensation
														</p>
														<p className="text-[16px] font-medium text-[#111111] dark:text-gray-100">{selectedJob.salaryRange}</p>
													</div>
												)}
												{selectedJob.remote && (
													<div>
														<p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B6B6F] dark:text-gray-400 mb-2">
															Work Model
														</p>
														<p className="text-[16px] font-medium text-[#111111] dark:text-gray-100">{selectedJob.remote}</p>
													</div>
												)}
											</div>
										)}

										{/* Job Description */}
										<div>
											<h3 className="text-[20px] font-semibold text-[#111111] dark:text-gray-100 mb-4">
												About the Role
											</h3>
											<div className="prose prose-lg max-w-none">
												<p className="text-[17px] leading-[1.7] text-[#444448] dark:text-gray-300">
												{selectedJob.description
													? selectedJob.description
														: 'This role offers an exciting opportunity to contribute to meaningful work in a collaborative environment. While detailed information is limited, the position aligns with the skills and experience outlined above.'}
											</p>
											</div>
										</div>

										{/* Skills Section */}
										{selectedJob.tags && selectedJob.tags.length > 0 && (
											<div>
												<h3 className="text-[20px] font-semibold text-[#111111] dark:text-gray-100 mb-5">
													Required Skills & Technologies
												</h3>
												<div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
													{selectedJob.tags.map((tag) => (
														<div
															key={tag}
															className="
																flex items-center gap-3 rounded-[12px] 
																bg-white dark:bg-gray-800/60 border border-[#E5E7EB] dark:border-gray-700
																px-4 py-3.5 
																transition-all duration-200
																hover:border-indigo-600/30 hover:bg-gradient-to-br hover:from-indigo-50/50 hover:to-violet-50/50 dark:hover:from-indigo-950/20 dark:hover:to-violet-950/20
															"
														>
															<div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600" />
															<span className="text-[15px] font-medium text-[#111111] dark:text-gray-200">{tag}</span>
														</div>
													))}
												</div>
											</div>
										)}

										{/* Info Footer */}
										<div className="rounded-[14px] border border-[#E5E7EB] dark:border-gray-800 bg-gradient-to-br from-[#FAFAFB]/50 to-white dark:from-gray-800/50 dark:to-gray-900/50 p-6">
											<div className="flex gap-4">
												<div className="flex-shrink-0 w-10 h-10 rounded-[10px] bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30 flex items-center justify-center">
													<svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
													</svg>
												</div>
												<div className="flex-1">
													<p className="text-[15px] leading-relaxed text-[#6B6B6F] dark:text-gray-400">
														Recommendations are personalized based on your profile, experience, and career preferences. 
														Keep your profile updated to receive the most relevant opportunities.
													</p>
												</div>
											</div>
										</div>
									</div>
								</motion.div>
							) : (
								// Empty State - No Job Selected
								<motion.div
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.95 }}
									transition={{ duration: 0.3 }}
									className="flex flex-col items-center justify-center h-full px-12 text-center"
								>
									<div className="w-24 h-24 rounded-[20px] bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] dark:from-gray-700 dark:to-gray-800 flex items-center justify-center mb-6 shadow-sm">
										<svg className="w-12 h-12 text-[#6B6B6F] dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
										</svg>
									</div>
									<h2 className="text-[28px] font-semibold text-[#111111] dark:text-gray-100 mb-3">
										Select a role to begin
									</h2>
									<p className="text-[17px] text-[#6B6B6F] dark:text-gray-400 max-w-md leading-relaxed">
										Choose any position from the list to view comprehensive details, requirements, and apply instantly.
									</p>
								</motion.div>
							)}
						</AnimatePresence>

						{/* Matches Empty State Overlay */}
						{showMatchesEmptyState && (
							<div className="absolute inset-x-0 bottom-0 p-8">
								<div className="rounded-[14px] border border-dashed border-[#E5E7EB] dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl p-6 shadow-lg dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
									<div className="flex gap-4">
										<div className="flex-shrink-0 w-10 h-10 rounded-[10px] bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30 flex items-center justify-center">
											<svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
											</svg>
										</div>
										<div>
											<h3 className="text-[16px] font-semibold text-[#111111] dark:text-gray-100 mb-1">
												No personalized matches yet
											</h3>
											<p className="text-sm text-[#6B6B6F] dark:text-gray-400 leading-relaxed">
												Complete your profile and start applying to roles. We'll generate tailored recommendations based on your activity.
											</p>
										</div>
									</div>
								</div>
							</div>
						)}
					</motion.section>
				</div>
				</div>

			{/* Match Explanation Modal */}
				<MatchExplanationModal
					open={explainOpen}
					onClose={() => setExplainOpen(false)}
					user={userProfile}
					job={
						selectedJob
							? {
									title: selectedJob.title,
									company: selectedJob.company,
									location: selectedJob.location,
									description: selectedJob.description || '',
									skills: selectedJob.tags || [],
									applyUrl: selectedJob.applyUrl || '',
									ats:
										(selectedJob.ats as 'workday' | 'greenhouse' | 'lever' | 'smartrecruiters') ||
										'workday',
							  }
							: null
					}
				/>
		</AuthLayout>
	);
}


