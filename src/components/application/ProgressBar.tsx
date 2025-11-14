import React from 'react';

type StatusType =
  | 'applied'
  | 'interview'
  | 'pending_decision'
  | 'offer'
  | 'rejected'
  | 'archived';

export function ProgressBar({ status }: { status: StatusType }) {
  // Map status to step index for visual progress (0..3)
  const stepMap: Record<StatusType, number> = {
    applied: 0,
    interview: 1,
    pending_decision: 2,
    offer: 3,
    rejected: 3, // terminal state, show full bar but we recolor slightly
    archived: 3, // terminal
  };
  const step = stepMap[status];
  const percent = Math.max(0, Math.min(100, ((step + 1) / 4) * 100));

  const isNegative = status === 'rejected';
  const isNeutral = status === 'archived';

  const track = 'h-1.5 w-full rounded-full bg-[#E5E7EB] dark:bg-gray-700 overflow-hidden';
  const primaryFill = 'bg-[#2563EB]';
  const successFill = 'bg-[#22C55E]';
  const warningFill = 'bg-[#FACC15]';
  const dangerFill = 'bg-[#F43F5E]';
  const neutralFill = 'bg-[#6B7280]';

  let fillColor = primaryFill;
  if (status === 'offer') fillColor = successFill;
  else if (status === 'pending_decision') fillColor = warningFill;
  else if (isNegative) fillColor = dangerFill;
  else if (isNeutral) fillColor = neutralFill;

  return (
    <div className={track} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={['h-full transition-all duration-500', fillColor].join(' ')}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}


