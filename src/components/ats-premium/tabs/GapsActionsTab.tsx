import React, { useState } from 'react';
import { ChevronDown, ExternalLink, Copy, Check, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { PremiumATSAnalysis, Gap, LearningResource } from '../../../types/premiumATS';
import { notify } from '@/lib/notify';

interface GapsActionsTabProps {
  analysis: PremiumATSAnalysis;
}

// Severity indicator dot
function SeverityDot({ severity }: { severity: Gap['severity'] }) {
  const colors = {
    High: 'bg-rose-500',
    Medium: 'bg-amber-500',
    Low: 'bg-blue-500'
  };
  return <div className={`w-2 h-2 rounded-full ${colors[severity]}`} />;
}

// Severity icon
function SeverityIcon({ severity }: { severity: Gap['severity'] }) {
  const iconClass = "w-4 h-4";
  switch (severity) {
    case 'High':
      return <AlertTriangle className={`${iconClass} text-rose-500`} />;
    case 'Medium':
      return <AlertCircle className={`${iconClass} text-amber-500`} />;
    case 'Low':
      return <Info className={`${iconClass} text-blue-500`} />;
  }
}

// Gap item component
function GapItem({ gap, index }: { gap: Gap; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const severityLabel = {
    High: 'High Priority',
    Medium: 'Medium Priority',
    Low: 'Low Priority'
  };

  const severityTextColor = {
    High: 'text-rose-600 dark:text-rose-400',
    Medium: 'text-amber-600 dark:text-amber-400',
    Low: 'text-blue-600 dark:text-blue-400'
  };

  return (
    <div className="py-4 border-b border-gray-200 dark:border-[#3d3c3e] last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start justify-between gap-4 text-left"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <SeverityIcon severity={gap.severity} />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {gap.name}
            </span>
            <span className={`ml-2 text-xs ${severityTextColor[gap.severity]}`}>
              {severityLabel[gap.severity]}
            </span>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="mt-3 ml-7 space-y-3">
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Why it matters
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {gap.why_it_matters}
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-[#242325] rounded-lg">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              How to fix
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {gap.how_to_fix}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Copyable message component
function CopyableMessage({ title, message }: { title: string; message: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    notify.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative">
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
        {title}
      </div>
      <div className="p-4 bg-gray-50 dark:bg-[#242325] rounded-lg relative">
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line pr-8">
          {message}
        </p>
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-1.5 rounded-md bg-white dark:bg-[#3d3c3e] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copy"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
}

// Learning resource item
function ResourceItem({ resource }: { resource: LearningResource }) {
  const typeIcon = {
    video: '▶',
    course: '📚',
    article: '📄',
    documentation: '📖'
  };

  return (
    <a
      href={resource.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50 transition-colors group"
    >
      <span className="text-sm mt-0.5">{typeIcon[resource.type]}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {resource.name}
          </span>
          <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {resource.why_useful}
        </p>
      </div>
    </a>
  );
}

export default function GapsActionsTab({ analysis }: GapsActionsTabProps) {
  // Sort gaps by severity
  const sortedGaps = [...analysis.top_gaps].sort((a, b) => {
    const order = { High: 0, Medium: 1, Low: 2 };
    return order[a.severity] - order[b.severity];
  });

  const actionPlan = analysis.action_plan_48h;
  const learningPath = analysis.learning_path;
  const opportunityFit = analysis.opportunity_fit;

  return (
    <div className="space-y-10">
      {/* Gaps Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Gaps to Address
          </h2>
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <SeverityDot severity="High" /> High
            </span>
            <span className="flex items-center gap-1.5">
              <SeverityDot severity="Medium" /> Medium
            </span>
            <span className="flex items-center gap-1.5">
              <SeverityDot severity="Low" /> Low
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-[#2b2a2c] rounded-xl border border-gray-200 dark:border-[#3d3c3e] px-4">
          {sortedGaps.map((gap, index) => (
            <GapItem key={index} gap={gap} index={index} />
          ))}
        </div>
      </section>

      {/* 48H Action Plan */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          48-Hour Action Plan
        </h2>
        <div className="space-y-6">
          {/* CV Edits */}
          {actionPlan.cv_edits.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                CV Edits
              </div>
              <ul className="space-y-2">
                {actionPlan.cv_edits.map((edit, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-[#3d3c3e] flex items-center justify-center text-xs text-gray-500 flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{edit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Portfolio Items */}
          {actionPlan.portfolio_items.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Portfolio Items
              </div>
              <ul className="space-y-2">
                {actionPlan.portfolio_items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-[#3d3c3e] flex items-center justify-center text-xs text-gray-500 flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* LinkedIn Updates */}
          {actionPlan.linkedin_updates.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                LinkedIn Updates
              </div>
              <ul className="space-y-2">
                {actionPlan.linkedin_updates.map((update, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-[#3d3c3e] flex items-center justify-center text-xs text-gray-500 flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{update}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Messages */}
          {actionPlan.message_to_recruiter && (
            <CopyableMessage
              title="Message to Recruiter"
              message={actionPlan.message_to_recruiter}
            />
          )}
          {actionPlan.job_specific_positioning && (
            <CopyableMessage
              title="Job-Specific Positioning"
              message={actionPlan.job_specific_positioning}
            />
          )}
        </div>
      </section>

      {/* Learning Path */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Learning Path
        </h2>
        {learningPath.one_sentence_plan && (
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            {learningPath.one_sentence_plan}
          </p>
        )}
        {learningPath.resources.length > 0 && (
          <div className="bg-white dark:bg-[#2b2a2c] rounded-xl border border-gray-200 dark:border-[#3d3c3e] divide-y divide-gray-100 dark:divide-[#3d3c3e]">
            {learningPath.resources.map((resource, i) => (
              <ResourceItem key={i} resource={resource} />
            ))}
          </div>
        )}
      </section>

      {/* Opportunity Fit */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Opportunity Fit
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Why You'll Succeed */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Why You'll Succeed
              </span>
            </div>
            <ul className="space-y-2">
              {opportunityFit.why_you_will_succeed.map((reason, i) => (
                <li key={i} className="text-sm text-gray-700 dark:text-gray-300 pl-4 border-l-2 border-emerald-200 dark:border-emerald-800">
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          {/* Risks & Mitigation */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Potential Risks
              </span>
            </div>
            <ul className="space-y-3">
              {opportunityFit.risks.map((risk, i) => (
                <li key={i} className="text-sm">
                  <div className="text-gray-700 dark:text-gray-300 mb-1">{risk}</div>
                  {opportunityFit.mitigation[i] && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 pl-3 border-l border-gray-200 dark:border-[#3d3c3e]">
                      → {opportunityFit.mitigation[i]}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

