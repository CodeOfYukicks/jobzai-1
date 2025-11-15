'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import JobCard from './JobCard';
import JobSidePanel from './JobSidePanel';
import type { Job } from '../../../types/job';

type Props = {
  allJobs: Job[];
  matching: Job[];
};

export default function JobBoardClient({ allJobs, matching }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Open panel on refresh when ?job=id is in URL
  useEffect(() => {
    const id = search?.get('job');
    if (!id) {
      setSelectedJob(null);
      return;
    }
    const fromList = [...allJobs, ...matching].find((j) => j.id === id) || null;
    setSelectedJob(fromList);
  }, [search, allJobs, matching]);

  const onOpen = (job: Job) => {
    setSelectedJob(job);
    router.push(`/jobs?job=${encodeURIComponent(job.id)}`, { scroll: false });
  };

  const onClose = () => {
    setSelectedJob(null);
    router.push('/jobs', { scroll: false });
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Job Board</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
        Explore all jobs and a first version of recommended jobs for you.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            All jobs
          </h2>
          <div className="grid gap-4">
            {allJobs.map((job) => (
              <JobCard key={job.id} job={job as any} onOpen={onOpen} />
            ))}
            {allJobs.length === 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-300">No jobs yet.</p>
            )}
          </div>
        </div>
        <aside className="lg:col-span-1">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Recommended for you
          </h2>
          <div className="grid gap-4">
            {matching.map((job) => (
              <JobCard key={job.id} job={job as any} onOpen={onOpen} />
            ))}
            {matching.length === 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-300">No matches yet.</p>
            )}
          </div>
        </aside>
      </div>

      <JobSidePanel job={selectedJob} onClose={onClose} />
    </div>
  );
}




