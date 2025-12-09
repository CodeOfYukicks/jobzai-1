'use client';
import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import AuthLayout from '../components/AuthLayout';
import { collection, getDocs, limit, orderBy, query, startAfter } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { JobFilterBar } from '../components/job-board/JobFilterBar';
import { JobFiltersModal } from '../components/job-board/JobFiltersModal';
import { JobDetailView } from '../components/job-board/JobDetailView';
import { JobCard } from '../components/job-board/JobCard';
import { JobSkeleton } from '../components/job-board/JobSkeleton';
import { FilterState, Job } from '../types/job-board';
import { GoogleLoader } from '../components/ui/GoogleLoader';
import { useScrollCollapse } from '../hooks/useScrollCollapse';
import { useJobInteractions } from '../hooks/useJobInteractions';
import { notify } from '@/lib/notify';
import { parseSearchQuery, toSearchAPIParams } from '../lib/searchParser';
import '../components/job-board/premium-search.css';

function timeAgo(date: Date): string {
	const diffMs = Date.now() - date.getTime();
	const diffMins = Math.floor(diffMs / (1000 * 60));
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
	const diffMonths = Math.floor(diffDays / 30);

	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;

	// For dates older than 30 days, show months
	if (diffDays >= 30) {
		if (diffMonths === 1) return 'Over a month ago';
		if (diffMonths < 12) return `${diffMonths} months ago`;
		const years = Math.floor(diffMonths / 12);
		return years === 1 ? 'Over a year ago' : `${years} years ago`;
	}

	// For dates between 7-30 days, show weeks
	if (diffDays >= 7) {
		const weeks = Math.floor(diffDays / 7);
		return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
	}

	return `${diffDays}d ago`;
}

const mapJobFromDoc = (d: any) => {
	const data = d.data();
	return {
		id: d.id,
		...data,
		postedAt: data.postedAt?.toDate ? data.postedAt.toDate() : new Date(),
		published: timeAgo(data.postedAt?.toDate ? data.postedAt.toDate() : new Date()),
		title: data.title || '',
		company: data.company || '',
		logoUrl: data.companyLogo || data.logoUrl || '',
		location: data.location || '',
		tags: Array.isArray(data.skills) ? data.skills : [],
		applyUrl: data.applyUrl || '',
		description: data.description || data.summary || '',
		seniority: data.seniority || data.level || '',
		type: data.type || data.employmentType || '',
		salaryRange: data.salaryRange || data.compensation || '',
		remote: data.remote || data.remotePolicy || '',
		ats: data.ats || 'workday',
	} as Job;
};

export default function JobBoardPage() {
	const { currentUser } = useAuth();
	const PAGE_SIZE = 20;

	// Job Interactions Hook (V5.0 - Feedback Loop)
	const { 
		savedJobs, 
		dismissedJobs, 
		toggleSave, 
		dismissJob, 
		isJobSaved, 
		isJobDismissed,
		trackClick 
	} = useJobInteractions();

	// State
	const [mode, setMode] = useState<'explore' | 'matches'>('explore');
	const [jobs, setJobs] = useState<Job[]>([]);
	const [lastDoc, setLastDoc] = useState<any>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [initialLoading, setInitialLoading] = useState<boolean>(true);
	const [selectedJob, setSelectedJob] = useState<Job | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
	const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
	const [hasMore, setHasMore] = useState(true);
	const [profileIncomplete, setProfileIncomplete] = useState(false);

	// Search & Filter State - Unified Search Input
	const [searchInput, setSearchInput] = useState('');
	const [filters, setFilters] = useState<FilterState>({
		employmentType: [],
		workLocation: [],
		experienceLevel: [],
		datePosted: 'any',
		industries: [],
		technologies: [],
		skills: [],
	});

	// Tech Filter State
	const [techSearch, setTechSearch] = useState('');
	const popularTechs = [
		'React', 'Python', 'AWS', 'Node.js', 'TypeScript', 'Docker', 'Kubernetes',
		'Java', 'Go', 'Rust', 'C++', 'C#', 'PHP', 'Ruby', 'Swift', 'Kotlin',
		'Salesforce', 'Oracle', 'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'Figma'
	];
	const filteredTechs = popularTechs.filter(t => t.toLowerCase().includes(techSearch.toLowerCase()));

	// Skill Filter State
	const [skillSearch, setSkillSearch] = useState('');
	const popularSkills = [
		'Agile', 'Scrum', 'Communication', 'Leadership', 'Project Management',
		'Problem Solving', 'Teamwork', 'Git', 'Jira', 'Rest API', 'GraphQL',
		'CI/CD', 'TDD', 'Unit Testing', 'System Design', 'Architecture',
		'English', 'French', 'Spanish', 'German'
	];
	const filteredSkills = popularSkills.filter(s => s.toLowerCase().includes(skillSearch.toLowerCase()));

	// Debounce Search
	const [debouncedSearch, setDebouncedSearch] = useState('');

	const hasFilters = useMemo(() =>
		filters.employmentType.length > 0 ||
		filters.workLocation.length > 0 ||
		filters.experienceLevel.length > 0 ||
		filters.industries.length > 0 ||
		filters.technologies.length > 0 ||
		filters.skills.length > 0 ||
		filters.datePosted !== 'any' ||
		debouncedSearch !== '',
		[filters, debouncedSearch]);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchInput);
		}, 500);
		return () => clearTimeout(timer);
	}, [searchInput]);

	// Load Matched Jobs (For You mode)
	const loadMatchedJobs = useCallback(async () => {
		if (!currentUser?.uid) {
			notify.error('Please sign in to see personalized job matches');
			return;
		}

		setLoading(true);
		setInitialLoading(true);
		setError(null);
		setProfileIncomplete(false);

		try {
			const apiUrl = `https://us-central1-jobzai.cloudfunctions.net/getMatchedJobs?userId=${currentUser.uid}`;
			const response = await fetch(apiUrl);
			const data = await response.json();

			if (data.profileIncomplete) {
				setProfileIncomplete(true);
				setJobs([]);
				notify.info('Complete your profile to see personalized job matches', {
					action: {
						label: 'Go to Profile',
						onClick: () => window.location.href = '/profile'
					}
				});
			} else if (data.success && Array.isArray(data.jobs)) {
				const mappedJobs: Job[] = data.jobs.map((job: any) => ({
					...job,
					postedAt: job.postedAt ? new Date(job.postedAt._seconds * 1000) : new Date(),
					published: timeAgo(job.postedAt ? new Date(job.postedAt._seconds * 1000) : new Date()),
					tags: job.tags || job.technologies?.slice(0, 5) || [],
					matchScore: job.matchScore,
					matchDetails: job.matchDetails
				}));
				setJobs(mappedJobs);
				setVisibleCount(PAGE_SIZE);
				// Enable infinite scroll if there are more jobs than PAGE_SIZE
				setHasMore(mappedJobs.length > PAGE_SIZE);
				if (mappedJobs.length > 0) setSelectedJob(mappedJobs[0]);
			} else {
				setJobs([]);
			}
		} catch (err) {
			console.error('Error loading matched jobs:', err);
			setError('Failed to load matched jobs');
			notify.error('Failed to load personalized matches');
		} finally {
			setLoading(false);
			setInitialLoading(false);
		}
	}, [currentUser?.uid]);

	// Load Initial Jobs
	const loadJobs = useCallback(async (isSearch = false) => {
		setLoading(true);
		if (!isSearch) setInitialLoading(true);
		setError(null);
		setVisibleCount(PAGE_SIZE);
		setHasMore(true);
		setProfileIncomplete(false);

		try {
			if (hasFilters && mode === 'explore') {
				const params = new URLSearchParams();
				
				// Use the smart parser to extract structured data from search input
				const parsed = parseSearchQuery(debouncedSearch);
				const apiParams = toSearchAPIParams(parsed);
				
				// Add parsed parameters to URL
				if (apiParams.keyword) params.append('keyword', apiParams.keyword);
				if (apiParams.locations) params.append('locations', apiParams.locations);
				if (apiParams.technologies) params.append('technologies', apiParams.technologies);
				if (apiParams.workLocation) params.append('workLocation', apiParams.workLocation);
				if (apiParams.employmentType) params.append('employmentType', apiParams.employmentType);
				if (apiParams.roleFunction) params.append('roleFunction', apiParams.roleFunction);
				if (apiParams.experienceLevel) params.append('experienceLevel', apiParams.experienceLevel);

				// Employment Type filters from UI (merge with parsed)
				if (filters.employmentType.includes('full-time') && !apiParams.employmentType) params.append('fullTime', 'true');
				if (filters.employmentType.includes('contract')) params.append('jobType', 'contract');
				if (filters.employmentType.includes('part-time')) params.append('jobType', 'part-time');
				if (filters.employmentType.includes('internship')) params.append('jobType', 'internship');

				// Work Location filters from UI (merge with parsed)
				if (filters.workLocation.includes('remote') && !apiParams.workLocation) params.append('remote', 'true');

				// Experience Level filters from UI
				if (filters.experienceLevel.includes('internship') && !apiParams.experienceLevel) params.append('experienceLevel', 'internship');
				if (filters.experienceLevel.includes('entry') && !apiParams.experienceLevel) params.append('experienceLevel', 'entry level');
				if (filters.experienceLevel.includes('senior') && !apiParams.experienceLevel) params.append('senior', 'true');

				// Date Posted filter
				if (filters.datePosted === 'past24h') params.append('last24h', 'true');

				// Industries filter (merge with any from UI)
				if (filters.industries.length > 0) params.append('industries', filters.industries.join(','));

				// Technologies filter from UI (merge with parsed - add to existing if any)
				if (filters.technologies.length > 0) {
					const existingTechs = apiParams.technologies ? apiParams.technologies.split(',') : [];
					const allTechs = [...new Set([...existingTechs, ...filters.technologies])];
					// Override with merged list
					params.delete('technologies');
					params.append('technologies', allTechs.join(','));
				}

				// Skills filter
				if (filters.skills.length > 0) params.append('skills', filters.skills.join(','));

				// Log parsed query for debugging
				if (process.env.NODE_ENV === 'development') {
					console.log('🔍 Smart Search:', { 
						query: debouncedSearch, 
						parsed, 
						apiParams,
						finalParams: params.toString() 
					});
				}

				// Use deployed function with correct project ID
				const apiUrl = `https://us-central1-jobzai.cloudfunctions.net/searchJobs?${params.toString()}`;

				const response = await fetch(apiUrl);
				const data = await response.json();

				if (data.success && Array.isArray(data.jobs)) {
					const mappedJobs = data.jobs.map((job: any) => ({
						...job,
						postedAt: job.postedAt ? new Date(job.postedAt._seconds * 1000) : new Date(), // Handle Firestore timestamp
						published: timeAgo(job.postedAt ? new Date(job.postedAt._seconds * 1000) : new Date())
					}));
					setJobs(mappedJobs);
					setLastDoc(null);
					if (!selectedJob && mappedJobs.length > 0) setSelectedJob(mappedJobs[0]);
				} else {
					setJobs([]);
				}
			} else {
				// Default Firestore Fetch (Recent Jobs)
				const q = query(collection(db, 'jobs'), orderBy('postedAt', 'desc'), limit(PAGE_SIZE));
				const snap = await getDocs(q);
				const items = snap.docs.map(mapJobFromDoc);
				setJobs(items);
				setLastDoc(snap.docs[snap.docs.length - 1]);
				if (items.length < PAGE_SIZE) setHasMore(false);
				if (!selectedJob && items.length > 0) setSelectedJob(items[0]);
			}
		} catch (err) {
			console.error('Error loading jobs:', err);
			setError('Failed to load jobs');
		} finally {
			setLoading(false);
			setInitialLoading(false);
		}
	}, [debouncedSearch, filters, mode, selectedJob, hasFilters]);

	// Load More
	const loadMore = useCallback(async () => {
		if (loading) return;

		// In-memory pagination for matches mode (For You)
		if (mode === 'matches') {
			if (visibleCount < jobs.length) {
				setVisibleCount(prev => prev + PAGE_SIZE);
			} else {
				setHasMore(false);
			}
			return;
		}

		if (hasFilters && mode === 'explore') {
			// In-memory pagination for search results
			if (visibleCount < jobs.length) {
				setVisibleCount(prev => prev + PAGE_SIZE);
			} else {
				setHasMore(false);
			}
		} else if (lastDoc) {
			// Firestore pagination for default view
			setLoading(true);
			try {
				const q = query(collection(db, 'jobs'), orderBy('postedAt', 'desc'), startAfter(lastDoc), limit(PAGE_SIZE));
				const snap = await getDocs(q);

				if (snap.empty) {
					setHasMore(false);
					setLoading(false);
					return;
				}

				const newItems = snap.docs.map(mapJobFromDoc);
				setJobs(prev => [...prev, ...newItems]);
				setLastDoc(snap.docs[snap.docs.length - 1]);
				setVisibleCount(prev => prev + PAGE_SIZE);
			} catch (err) {
				console.error('Error loading more jobs:', err);
			} finally {
				setLoading(false);
			}
		}
	}, [loading, mode, hasFilters, jobs.length, visibleCount, lastDoc]);

	// Trigger load on filter/search change (only in explore mode)
	useEffect(() => {
		if (mode === 'explore') {
			loadJobs(true);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedSearch, filters]);

	// Handle mode change
	useEffect(() => {
		if (mode === 'matches') {
			loadMatchedJobs();
		} else {
			loadJobs();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode]);

	// Initial Load
	useEffect(() => {
		loadJobs();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Observer for Infinite Scroll
	const observerTarget = useRef(null);
	
	// Scroll collapse detection
	const jobListScrollRef = useRef<HTMLDivElement>(null);
	const isHeaderCollapsed = useScrollCollapse(jobListScrollRef, { threshold: 80 });
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !loading) {
					loadMore();
				}
			},
			{ threshold: 0.1 }
		);
		if (observerTarget.current) observer.observe(observerTarget.current);
		return () => observer.disconnect();
	}, [hasMore, loading, loadMore]);


	const toggleArrayFilter = (category: keyof FilterState, value: string) => {
		if (category === 'datePosted') return;
		setFilters(prev => {
			const list = prev[category] as string[];
			return {
				...prev,
				[category]: list.includes(value)
					? list.filter(v => v !== value)
					: [...list, value]
			};
		});
	};

	const setDatePostedFilter = (value: 'past24h' | 'pastWeek' | 'pastMonth' | 'any') => {
		setFilters(prev => ({ ...prev, datePosted: value }));
	};

	const clearFilters = () => {
		setFilters({
			employmentType: [],
			workLocation: [],
			experienceLevel: [],
			datePosted: 'any',
			industries: [],
			technologies: [],
			skills: [],
		});
		setSearchInput('');
		setTechSearch('');
		setSkillSearch('');
	};

	const handleSearch = () => {
		// Force immediate load when search button is clicked
		loadJobs(true);
	};

	const displayedJobs = jobs.slice(0, visibleCount);

	return (
		<AuthLayout>
			<div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50 dark:bg-[#333234] overflow-hidden overflow-x-hidden">

				<JobFilterBar
					searchInput={searchInput}
					onSearchChange={setSearchInput}
					onSearch={handleSearch}
					filters={filters}
					toggleArrayFilter={toggleArrayFilter}
					clearFilters={clearFilters}
					onOpenMoreFilters={() => setIsFiltersModalOpen(true)}
					mode={mode}
					setMode={setMode}
					isCollapsed={isHeaderCollapsed}
				/>

				<div className="flex-1 flex overflow-hidden">

					{/* Job List Panel */}
					<div className="w-full lg:w-[450px] xl:w-[500px] flex flex-col border-r border-gray-200 dark:border-[#3d3c3e] bg-white dark:bg-[#242325] relative">
						{/* Google Loader for Search Updates */}
						{loading && !initialLoading && (
							<div className="absolute top-0 left-0 right-0 z-20">
								<GoogleLoader />
							</div>
						)}

						<div className="p-4 border-b border-gray-200 dark:border-[#3d3c3e] flex justify-between items-center bg-white dark:bg-[#242325] sticky top-0 z-10">
							<span className="text-sm font-medium text-gray-500 dark:text-gray-400">
								{loading && initialLoading 
									? (mode === 'matches' ? 'Finding your matches...' : 'Searching...') 
									: mode === 'matches' 
										? `${jobs.length} personalized matches` 
										: `${jobs.length} jobs found`}
							</span>
							<div className="flex items-center gap-2">
								<span className="text-xs text-gray-400">Sort by:</span>
								<select className="text-sm font-medium bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white cursor-pointer">
									{mode === 'matches' ? (
										<option>Best Match</option>
									) : (
										<>
											<option>Most Recent</option>
											<option>Relevance</option>
										</>
									)}
								</select>
							</div>
						</div>

						<div ref={jobListScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
							{loading && initialLoading ? (
								<>
									<JobSkeleton />
									<JobSkeleton />
									<JobSkeleton />
									<JobSkeleton />
								</>
							) : displayedJobs.length === 0 ? (
								<div className="flex flex-col items-center justify-center h-64 text-center px-4">
									{mode === 'matches' && profileIncomplete ? (
										<>
											<div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
												<svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
												</svg>
											</div>
											<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Complete your profile</h3>
											<p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
												Add your skills, location preferences, and career objectives to see personalized job matches.
											</p>
											<a
												href="/profile"
												className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium text-white transition-colors"
											>
												Go to Profile
											</a>
										</>
									) : (
										<>
											<div className="w-16 h-16 bg-gray-100 dark:bg-[#2b2a2c] rounded-full flex items-center justify-center mb-4">
												<svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
												</svg>
											</div>
											<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No jobs found</h3>
											<p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
												{mode === 'matches' 
													? 'No matches found based on your profile. Try exploring all jobs instead.'
													: 'Try adjusting your search or filters to find what you\'re looking for.'}
											</p>
											<button
												onClick={mode === 'matches' ? () => setMode('explore') : clearFilters}
												className="mt-4 px-4 py-2 bg-white dark:bg-[#2b2a2c] border border-gray-300 dark:border-[#3d3c3e] rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#3d3c3e] transition-colors"
											>
												{mode === 'matches' ? 'Explore all jobs' : 'Clear filters'}
											</button>
										</>
									)}
								</div>
							) : (
								<>
									{displayedJobs
										.filter(job => !isJobDismissed(job.id))
										.map((job, index) => (
										<JobCard
											key={job.id}
											job={job}
											isSelected={selectedJob?.id === job.id}
											onClick={() => {
												setSelectedJob(job);
												trackClick(job.id, { 
													source: mode === 'matches' ? 'for_you' : 'explore',
													matchScore: job.matchScore,
													position: index
												});
											}}
											showMatchScore={mode === 'matches'}
											isSaved={isJobSaved(job.id)}
											onSave={(jobId) => {
												toggleSave(jobId, {
													source: mode === 'matches' ? 'for_you' : 'explore',
													matchScore: job.matchScore
												});
											}}
											onDismiss={(jobId) => {
												dismissJob(jobId, {
													source: mode === 'matches' ? 'for_you' : 'explore',
													matchScore: job.matchScore
												});
												notify.success('Job hidden from your feed');
											}}
										/>
									))}

									{/* Infinite Scroll Trigger */}
									<div ref={observerTarget} className="h-4 w-full flex items-center justify-center py-4">
										{loading && !initialLoading && (
											<div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
										)}
									</div>
								</>
							)}
						</div>
					</div>

					{/* Job Detail View (Right Panel) */}
					<div className="hidden lg:flex flex-1 overflow-hidden">
						<JobDetailView 
							job={selectedJob} 
							onDismiss={(jobId) => {
								dismissJob(jobId, {
									source: mode === 'matches' ? 'for_you' : 'explore',
									matchScore: selectedJob?.matchScore
								});
								// Select next job if current one is dismissed
								const currentIndex = jobs.findIndex(j => j.id === jobId);
								const nextJob = jobs.find((j, i) => i > currentIndex && !isJobDismissed(j.id));
								setSelectedJob(nextJob || null);
							}}
						/>
					</div>
				</div>
			</div>

			<JobFiltersModal
				isOpen={isFiltersModalOpen}
				onClose={() => setIsFiltersModalOpen(false)}
				filters={filters}
				toggleArrayFilter={toggleArrayFilter}
				setDatePostedFilter={setDatePostedFilter}
				techSearch={techSearch}
				setTechSearch={setTechSearch}
				filteredTechs={filteredTechs}
				skillSearch={skillSearch}
				setSkillSearch={setSkillSearch}
				filteredSkills={filteredSkills}
			/>
		</AuthLayout >
	);
}
