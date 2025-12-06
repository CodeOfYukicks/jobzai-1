/**
 * Example Usage: Integration with Kanban Board / Calendar View
 * 
 * This file demonstrates how to integrate the JobDetailPanel
 * into your existing job tracking views.
 */

import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { JobDetailPanel } from './JobDetailPanel';
import { JobApplication } from '../../types/job';
import { toast } from '@/contexts/ToastContext';

// Example 1: Simple Kanban Board Integration
export function KanbanBoardExample() {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Fetch jobs from Firestore
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchJobs = async () => {
      const q = query(collection(db, 'users', currentUser.uid, 'applications'));
      const snapshot = await getDocs(q);
      const jobsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as JobApplication[];
      setJobs(jobsData);
    };

    fetchJobs();
  }, [currentUser]);

  // Handle job card click
  const handleJobClick = (job: JobApplication) => {
    setSelectedJob(job);
    setIsPanelOpen(true);
  };

  // Handle job update
  const handleUpdate = async (updates: Partial<JobApplication>) => {
    if (!currentUser || !selectedJob) return;

    try {
      const jobRef = doc(db, 'users', currentUser.uid, 'applications', selectedJob.id);
      
      // Update in Firestore
      await updateDoc(jobRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      // Update local state
      setJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === selectedJob.id
            ? { ...job, ...updates, updatedAt: new Date().toISOString() }
            : job
        )
      );

      // Update selected job
      setSelectedJob(prev => prev ? { ...prev, ...updates } : null);

      toast.success('Job updated successfully');
    } catch (error) {
      console.error('Error updating job:', error);
      toast.error('Failed to update job');
    }
  };

  // Handle job deletion
  const handleDelete = async () => {
    if (!currentUser || !selectedJob) return;

    try {
      const jobRef = doc(db, 'users', currentUser.uid, 'applications', selectedJob.id);
      await deleteDoc(jobRef);

      // Update local state
      setJobs(prevJobs => prevJobs.filter(job => job.id !== selectedJob.id));

      toast.success('Job deleted successfully');
      setIsPanelOpen(false);
      setSelectedJob(null);
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
    }
  };

  return (
    <div className="p-8">
      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {['applied', 'interview', 'offer', 'rejected'].map(status => (
          <div key={status} className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-4 capitalize">{status}</h3>
            <div className="space-y-3">
              {jobs
                .filter(job => job.status === status)
                .map(job => (
                  <div
                    key={job.id}
                    onClick={() => handleJobClick(job)}
                    className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-all"
                  >
                    <h4 className="font-medium text-gray-900">{job.position}</h4>
                    <p className="text-sm text-gray-600">{job.companyName}</p>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Job Detail Panel */}
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

// Example 2: Calendar View Integration
export function CalendarViewExample() {
  const { currentUser } = useAuth();
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Handle event click from calendar
  const handleEventClick = (event: any) => {
    // Extract job from event
    const job = event.resource?.application || event.resource;
    if (job) {
      setSelectedJob(job);
      setIsPanelOpen(true);
    }
  };

  const handleUpdate = async (updates: Partial<JobApplication>) => {
    if (!currentUser || !selectedJob) return;

    try {
      const jobRef = doc(db, 'users', currentUser.uid, 'applications', selectedJob.id);
      await updateDoc(jobRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      setSelectedJob(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Job updated successfully');
    } catch (error) {
      console.error('Error updating job:', error);
      toast.error('Failed to update job');
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !selectedJob) return;

    try {
      const jobRef = doc(db, 'users', currentUser.uid, 'applications', selectedJob.id);
      await deleteDoc(jobRef);
      toast.success('Job deleted successfully');
      setIsPanelOpen(false);
      setSelectedJob(null);
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
    }
  };

  return (
    <div>
      {/* Your Calendar Component */}
      {/* <BigCalendar onSelectEvent={handleEventClick} ... /> */}

      {/* Job Detail Panel */}
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

// Example 3: Table View Integration
export function TableViewExample() {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleRowClick = (job: JobApplication) => {
    setSelectedJob(job);
    setIsPanelOpen(true);
  };

  const handleUpdate = async (updates: Partial<JobApplication>) => {
    if (!currentUser || !selectedJob) return;

    try {
      const jobRef = doc(db, 'users', currentUser.uid, 'applications', selectedJob.id);
      await updateDoc(jobRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      setJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === selectedJob.id
            ? { ...job, ...updates, updatedAt: new Date().toISOString() }
            : job
        )
      );

      setSelectedJob(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Job updated successfully');
    } catch (error) {
      console.error('Error updating job:', error);
      toast.error('Failed to update job');
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !selectedJob) return;

    try {
      const jobRef = doc(db, 'users', currentUser.uid, 'applications', selectedJob.id);
      await deleteDoc(jobRef);
      setJobs(prevJobs => prevJobs.filter(job => job.id !== selectedJob.id));
      toast.success('Job deleted successfully');
      setIsPanelOpen(false);
      setSelectedJob(null);
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
    }
  };

  return (
    <div className="p-8">
      {/* Table */}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Position
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Company
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Applied
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {jobs.map(job => (
            <tr
              key={job.id}
              onClick={() => handleRowClick(job)}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {job.position}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {job.companyName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 capitalize">
                  {job.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {new Date(job.appliedDate).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Job Detail Panel */}
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

// Example 4: Minimal Integration (Read-only)
export function ReadOnlyExample() {
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <div>
      {/* Your content */}
      
      {/* Read-only panel (no update/delete callbacks) */}
      <JobDetailPanel
        job={selectedJob}
        open={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </div>
  );
}

