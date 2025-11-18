interface TagProps {
  label: string;
}

export function Tag({ label }: TagProps) {
  return (
    <span className="inline-flex items-center rounded-[6px] bg-black/[0.04] px-3 py-1 text-[12px] font-medium tracking-wide text-neutral-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:bg-white/10 dark:text-neutral-200">
      {label}
    </span>
  );
}

