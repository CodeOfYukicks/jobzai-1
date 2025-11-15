'use client';
import { useEffect } from "react";
import { X } from "lucide-react";
import DOMPurify from "dompurify";

type Props = {
  job: any;
  onClose: () => void;
};

export default function JobSidePanel({ job, onClose }: Props) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!job) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm">
      <div className="relative h-full w-full max-w-xl animate-slide-left overflow-y-auto border-l bg-white shadow-xl dark:bg-neutral-900">
        <button
          className="absolute right-4 top-4 text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={24} />
        </button>

        <div className="space-y-6 p-6">
          <div className="flex items-center gap-4">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt={job.company}
                className="h-14 w-14 rounded-xl border object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-200 text-xl font-bold">
                {job.company?.[0] || "?"}
              </div>
            )}

            <div>
              <h1 className="text-2xl font-semibold">{job.title}</h1>
              <p className="text-gray-600 dark:text-gray-300">{job.company}</p>
              <p className="text-sm text-gray-500">{job.location}</p>
            </div>
          </div>

          {Array.isArray(job.skills) && job.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill: string, i: number) => (
                <span
                  key={i}
                  className="rounded-md bg-gray-100 px-2 py-1 text-sm dark:bg-neutral-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          <a
            href={job.applyUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Apply now
          </a>

          <div
            className="prose mt-6 max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(job.description || ""),
            }}
          />
        </div>
      </div>

      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} />
    </div>
  );
}




