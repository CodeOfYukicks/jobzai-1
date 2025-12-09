import React, { useState } from 'react';
import { Clock, FileEdit, Briefcase, Linkedin, Mail, Target, Copy, Check } from 'lucide-react';
import type { ActionPlan48H } from '../../types/premiumATS';
import { notify } from '@/lib/notify';

interface ActionPlan48HProps {
  actionPlan: ActionPlan48H;
}

interface ActionListProps {
  title: string;
  items: string[];
  icon: React.ReactNode;
  color: string;
}

function ActionList({ title, items, icon, color }: ActionListProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
          {icon}
        </div>
        <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
      </div>
      <ul className="space-y-2 ml-10">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300"
          >
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400 mt-0.5">
              {index + 1}
            </div>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MessageCard({ title, message, icon }: { title: string; message: string; icon: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    notify.success('Message copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#635BFF]/10 dark:bg-[#635BFF]/20 flex items-center justify-center">
          {icon}
        </div>
        <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
      </div>
      <div className="ml-10 relative group">
        <div className="p-4 bg-gray-50/80 dark:bg-gray-900/30 rounded-lg border border-gray-200/60 dark:border-gray-800/60">
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {message}
          </p>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm border border-gray-200/60 dark:border-gray-700/60 opacity-0 group-hover:opacity-100 transition-all duration-200"
            title="Copy message"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ActionPlan48H({ actionPlan }: ActionPlan48HProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#635BFF]/5 to-[#7c75ff]/5 dark:from-[#635BFF]/10 dark:to-[#7c75ff]/10 rounded-xl border border-[#635BFF]/20 dark:border-[#635BFF]/30">
        <Clock className="w-6 h-6 text-[#635BFF] dark:text-[#a5a0ff]" />
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">48-Hour Action Plan</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Complete these actions to maximize your application impact
          </p>
        </div>
      </div>

      {/* Action Lists */}
      <div className="grid gap-6">
        <ActionList
          title="CV Edits"
          items={actionPlan.cv_edits}
          icon={<FileEdit className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
          color="bg-blue-100 dark:bg-blue-950/30"
        />

        <ActionList
          title="Portfolio Items"
          items={actionPlan.portfolio_items}
          icon={<Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          color="bg-emerald-100 dark:bg-emerald-950/30"
        />

        <ActionList
          title="LinkedIn Updates"
          items={actionPlan.linkedin_updates}
          icon={<Linkedin className="w-4 h-4 text-blue-700 dark:text-blue-400" />}
          color="bg-blue-100 dark:bg-blue-950/30"
        />

        {actionPlan.message_to_recruiter && (
          <MessageCard
            title="Message to Recruiter"
            message={actionPlan.message_to_recruiter}
            icon={<Mail className="w-4 h-4 text-[#635BFF] dark:text-[#a5a0ff]" />}
          />
        )}

        {actionPlan.job_specific_positioning && (
          <MessageCard
            title="Job-Specific Positioning"
            message={actionPlan.job_specific_positioning}
            icon={<Target className="w-4 h-4 text-[#635BFF] dark:text-[#a5a0ff]" />}
          />
        )}
      </div>
    </div>
  );
}

