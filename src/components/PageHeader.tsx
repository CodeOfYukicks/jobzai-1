interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="text-center mt-12 mb-8">
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
        <span className="bg-gradient-to-b from-neutral-900 via-neutral-800 to-neutral-900 dark:from-white dark:via-neutral-100 dark:to-white bg-clip-text text-transparent">
          {title}
        </span>
      </h1>
      <div className="mx-auto mt-2 h-[2px] w-12 bg-neutral-300 dark:bg-neutral-600 rounded-full"></div>
      {subtitle && (
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-3 px-4">
          {subtitle}
        </p>
      )}
    </div>
  );
}

