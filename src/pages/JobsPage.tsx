import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import JobCard from '../components/JobCard';
import MatchExplanationModal from '../components/MatchExplanationModal';
import Navbar from '../components/Navbar';
import PageHeader from '../components/PageHeader';

type MatchDoc = {
  userId: string;
  jobId: string;
  score: number;
  viewed: boolean;
};

type JobDoc = {
  title: string;
  company: string;
  location: string;
  description: string;
  skills: string[];
  applyUrl: string;
  ats: 'greenhouse' | 'lever' | 'smartrecruiters' | 'workday';
  postedAt?: any;
};

type UserProfile = {
  name: string;
  email: string;
  currentRole: string;
  skills: string[];
  yearsExperience: number;
  location: string;
  preferences: {
    remote: boolean;
    seniority: string[];
    domains: string[];
  };
} | null;

export default function JobsPage() {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile>(null);
  const [items, setItems] = useState<Array<{ id: string; match: MatchDoc; job: JobDoc }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [explainOpen, setExplainOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<{ match: MatchDoc; job: JobDoc } | null>(null);
  const [titleInput, setTitleInput] = useState<string>('');
  const [locationInput, setLocationInput] = useState<string>('');
  const [activeTitle, setActiveTitle] = useState<string>('');
  const [activeLocation, setActiveLocation] = useState<string>('');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'explore' | 'matches'>('explore');

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let unsubSaved: (() => void) | undefined;
    (async () => {
      if (!currentUser?.uid) {
        setItems([]);
        setUserProfile(null);
        setLoading(false);
        setSavedIds(new Set());
        return;
      }
      setLoading(true);
      try {
        const uRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(uRef);
        if (snap.exists()) {
          setUserProfile(snap.data() as any);
        }
      } catch {
        // ignore
      }
      const q = query(
        collection(db, 'matches'),
        where('userId', '==', currentUser.uid),
        orderBy('score', 'desc')
      );
      unsub = onSnapshot(q, async (snap) => {
        const matches = snap.docs.map((d) => ({ id: d.id, ...(d.data() as MatchDoc) }));
        const list: Array<{ id: string; match: MatchDoc; job: JobDoc }> = [];
        await Promise.all(matches.map(async (m) => {
          try {
            const jRef = doc(db, 'jobs', m.jobId);
            const jSnap = await getDoc(jRef);
            if (jSnap.exists()) {
              list.push({ id: m.id, match: m, job: jSnap.data() as JobDoc });
            }
          } catch {
            // ignore
          }
        }));
        setItems(list);
        setLoading(false);
      });
      const savedQ = query(collection(db, 'savedJobs'), where('userId', '==', currentUser.uid));
      unsubSaved = onSnapshot(savedQ, (snap) => {
        const next = new Set<string>();
        snap.docs.forEach((d) => {
          const data = d.data() as any;
          if (data?.jobId) next.add(String(data.jobId));
        });
        setSavedIds(next);
      });
    })();
    return () => {
      if (unsub) unsub();
      if (unsubSaved) unsubSaved();
    };
  }, [currentUser?.uid]);

  const filteredItems = useMemo(() => {
    const t = activeTitle.trim().toLowerCase();
    const l = activeLocation.trim().toLowerCase();
    if (!t && !l) return items;
    return items.filter(({ job }) => {
      const titleOk =
        !t ||
        [job.title, job.company]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(t));
      const locationOk = !l || String(job.location || '').toLowerCase().includes(l);
      return titleOk && locationOk;
    });
  }, [items, activeTitle, activeLocation]);

  function handleSearch() {
    setActiveTitle(titleInput);
    setActiveLocation(locationInput);
  }

  async function toggleSave(jobId: string, next: boolean) {
    if (!currentUser?.uid) return;
    const id = `${currentUser.uid}_${jobId}`;
    const ref = doc(db, 'savedJobs', id);
    try {
      if (next) {
        await setDoc(ref, { id, userId: currentUser.uid, jobId, savedAt: serverTimestamp() });
      } else {
        await deleteDoc(ref);
      }
    } catch {
      // ignore
    }
  }

  if (!currentUser) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-6xl p-6">
          <div className="mt-4 mb-6">
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Job Board</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Discover opportunities tailored to your profile.
            </p>
          </div>
          <div className="h-px w-full bg-gray-200 dark:bg-[#2A2A2E] mb-6" />
          <p className="text-gray-600 dark:text-gray-400">
            Please sign in to view your personalized job matches.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-6xl p-6">
        <div className="mt-4 mb-6">
          <PageHeader 
            title="Job Board"
            subtitle="Discover opportunities tailored to your profile. Use search and filters to refine results."
          />
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'explore'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#26262B]'
            }`}
          >
            Explore
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'matches'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#26262B]'
            }`}
          >
            Pour toi
          </button>
        </div>

        <div className="rounded-xl border shadow-sm p-6 mb-6 bg-white dark:bg-[#1E1F22] dark:border-[#2A2A2E]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
                JOB TITLE
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 5.25 5.25a7.5 7.5 0 0 0 11.4 11.4Z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  className="w-full rounded-lg border px-10 py-2 text-sm text-gray-900 placeholder:text-gray-400 dark:bg-[#26262B] dark:border-[#3A3A3D] dark:text-gray-100"
                  placeholder="e.g. Frontend Developer"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
                LOCATION
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  className="w-full rounded-lg border px-10 py-2 text-sm text-gray-900 placeholder:text-gray-400 dark:bg-[#26262B] dark:border-[#3A3A3D] dark:text-gray-100"
                  placeholder="e.g. Paris, Remote"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSearch}
              className="inline-flex items-center rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:from-purple-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-purple-500/60 focus:ring-offset-2 dark:focus:ring-offset-[#1E1F22]"
            >
              Search
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-600 dark:text-gray-400">Loading matches…</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No matches found. Try adjusting filters.</p>
        ) : (
          <div className="space-y-4">
            {filteredItems.map(({ id, job, match }) => {
              const jobKey = job.applyUrl || id;
              const logo = (job as any).logoUrl || (job as any).companyLogoUrl || null;
              return (
                <JobCard
                  key={id}
                  id={jobKey}
                  title={job.title}
                  company={job.company}
                  location={job.location}
                  logoUrl={logo}
                  postedAt={job.postedAt}
                  type={(job as any).type || null}
                  seniority={(job as any).seniority || null}
                  category={(job as any).category || null}
                  score={typeof match.score === 'number' ? match.score : null}
                  applyUrl={job.applyUrl}
                  isSaved={savedIds.has(jobKey)}
                  onToggleSave={(jobId, next) => toggleSave(jobId, next)}
                  onShowDetails={() => {
                    setSelected({ job, match });
                    setExplainOpen(true);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
      <MatchExplanationModal
        open={explainOpen}
        onClose={() => {
          setExplainOpen(false);
          setSelected(null);
        }}
        user={userProfile}
        job={selected?.job || null}
      />
    </>
  );
}



