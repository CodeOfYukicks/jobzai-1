import React from 'react';
import { Sparkles, Link2, Loader2 } from 'lucide-react';

export interface AICardProps {
	jobUrl: string;
	onJobUrlChange: (value: string) => void;
	isAnalyzing: boolean;
	onAnalyze: () => void;
	className?: string;
}

export function AICard({
	jobUrl,
	onJobUrlChange,
	isAnalyzing,
	onAnalyze,
	className = ''
}: AICardProps) {
	return (
		<div
			className={[
				'rounded-xl p-5',
				'bg-white dark:bg-[#1A1B1E]', // Premium dark gray
				'shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]', // Subtle shadow
				'border border-gray-200/60 dark:border-[#2E2F33]',
				'flex flex-col',
				'transition-all duration-300',
				'hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:hover:border-[#3E3F45]',
				className
			].join(' ')}
		>
			<div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
				<div className="h-10 w-10 rounded-lg flex-shrink-0 flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-100 dark:ring-indigo-500/20 transition-colors">
					<Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
				</div>
				<div className="min-w-0 flex-1">
					<div className="text-base font-semibold text-gray-900 dark:text-white mb-1 tracking-tight">
						AI-Powered Job Analysis
					</div>
					<div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl">
						Paste a job posting URL and let our AI extract key requirements, skills, and tailored questions.
					</div>
				</div>
			</div>

			<div className="mt-0">
				<div className="flex flex-col sm:flex-row items-stretch gap-3">
					<div className="flex-1 flex items-center rounded-lg border border-gray-200 dark:border-[#2E2F33] bg-gray-50 dark:bg-[#131416] px-3 py-1 transition-all focus-within:border-indigo-500/50 dark:focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 dark:focus-within:ring-indigo-500/20 focus-within:bg-white dark:focus-within:bg-[#131416]">
						<div className="p-1.5 rounded-md bg-white dark:bg-[#1F2023] mr-2 shadow-sm border border-gray-100 dark:border-[#2A2B30]">
							<Link2 className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
						</div>
						<input
							type="url"
							value={jobUrl}
							onChange={(e) => onJobUrlChange(e.target.value)}
							placeholder="https://careers.company.com/job/..."
							className="flex-1 py-2 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600"
						/>
					</div>
					<button
						onClick={onAnalyze}
						disabled={isAnalyzing || !jobUrl}
						className={[
							'inline-flex items-center justify-center whitespace-nowrap',
							'px-5 py-2 rounded-lg text-sm font-medium',
							'text-white',
							'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500',
							'disabled:opacity-50 disabled:cursor-not-allowed',
							'transition-all duration-200',
							'shadow-sm hover:shadow-indigo-500/25 dark:hover:shadow-indigo-500/10',
							'border border-transparent'
						].join(' ')}
					>
						{isAnalyzing ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								Analyzing...
							</>
						) : (
							<>
								<Sparkles className="w-4 h-4 mr-2" />
								Analyze
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}

export default AICard;
