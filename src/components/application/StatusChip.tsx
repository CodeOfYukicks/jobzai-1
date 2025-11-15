import React from 'react';

type StatusType =
  | 'applied'
  | 'interview'
  | 'pending_decision'
  | 'offer'
  | 'rejected'
  | 'archived';

export function StatusChip({ status, className = '' }: { status: StatusType; className?: string }) {
  const map: Record<
    StatusType,
    { label: string; bg: string; text: string; border: string }
  > = {
    applied: {
      label: 'Applied',
      bg: 'bg-[#E8F1FD]',
      text: 'text-[#2563EB]',
      border: 'border-[#D7E6FB]',
    },
    interview: {
      label: 'Interview',
      bg: 'bg-[#E8F1FD]',
      text: 'text-[#2563EB]',
      border: 'border-[#D7E6FB]',
    },
    pending_decision: {
      label: 'Pending',
      bg: 'bg-[#FEF9C3]',
      text: 'text-[#F59E0B]',
      border: 'border-[#FDE68A]',
    },
    offer: {
      label: 'Offer',
      bg: 'bg-[#DCFCE7]',
      text: 'text-[#22C55E]',
      border: 'border-[#BBF7D0]',
    },
    rejected: {
      label: 'Rejected',
      bg: 'bg-[#FFE4E8]',
      text: 'text-[#F43F5E]',
      border: 'border-[#FECDD3]',
    },
    archived: {
      label: 'Archived',
      bg: 'bg-[#F3F4F6]',
      text: 'text-[#6B7280]',
      border: 'border-[#E5E7EB]',
    },
  };

  const s = map[status];

  return (
    <span
      className={[
        'inline-flex items-center rounded-full border text-[11px] font-medium px-2.5 py-1',
        'transition-colors',
        s.bg,
        s.text,
        s.border,
        className,
      ].join(' ')}
      aria-label={`Status: ${s.label}`}
    >
      {s.label}
    </span>
  );
}




