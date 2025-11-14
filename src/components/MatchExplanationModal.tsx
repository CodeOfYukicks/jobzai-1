import React, { useEffect, useState } from 'react';

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

type JobDoc = {
  title: string;
  company: string;
  location: string;
  description: string;
  skills: string[];
  applyUrl: string;
  ats: 'greenhouse' | 'lever' | 'smartrecruiters' | 'workday';
} | null;

type Props = {
  open: boolean;
  onClose: () => void;
  user: UserProfile;
  job: JobDoc;
};

export default function MatchExplanationModal({ open, onClose, user, job }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState<string>('');

  useEffect(() => {
    if (!open) {
      setLoading(false);
      setError(null);
      setText('');
      return;
    }
    if (!user || !job) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch('/api/explainMatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user, job }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setText(data.explanation || '');
      } catch (e: any) {
        setError(e?.message || 'Failed to generate explanation');
      } finally {
        setLoading(false);
      }
    })();
  }, [open, user?.email, job?.title]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-lg">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">Why this job matches you</h3>
          <button
            type="button"
            className="rounded p-2 text-gray-600 hover:bg-gray-100"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="mt-4">
          {loading && <p className="text-gray-600">Generating explanation…</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && !error && text && (
            <div className="prose max-w-none whitespace-pre-wrap">{text}</div>
          )}
        </div>
      </div>
    </div>
  );
}



