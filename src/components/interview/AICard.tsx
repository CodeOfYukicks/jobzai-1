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
				'rounded-2xl p-8',
				'bg-white dark:bg-[#1E1F22]',
				'shadow-sm dark:shadow-none',
				'border border-gray-100 dark:border-[#2A2A2E]',
				'flex flex-col',
				'transition-all duration-200',
				'hover:shadow-md dark:hover:border-[#353539]',
				className
			].join(' ')}
		>
			<div className="flex items-start gap-5 mb-6">
				<div className="h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 ring-1 ring-indigo-100 dark:ring-indigo-900/50">
					<Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
				</div>
				<div className="min-w-0 flex-1">
					<div className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2 tracking-tight">
						AI-Powered Job Analysis
					</div>
					<div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
						Paste a job posting URL and let our AI extract key requirements, skills, and tailored questions.
					</div>
				</div>
			</div>

			<div className="mt-2">
				<div className="flex items-stretch gap-3">
					<div className="flex-1 flex items-center rounded-xl border border-gray-200 dark:border-[#2A2A2E] bg-gray-50/50 dark:bg-[#1A1A1D] px-4 py-1 transition-all focus-within:border-indigo-300 dark:focus-within:border-indigo-700 focus-within:bg-white dark:focus-within:bg-[#1E1F22]">
						<div className="p-2 rounded-lg bg-white dark:bg-[#26262B] mr-3 shadow-sm">
							<Link2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
						</div>
						<input
							type="url"
							value={jobUrl}
							onChange={(e) => onJobUrlChange(e.target.value)}
							placeholder="https://careers.company.com/job/..."
							className="flex-1 py-3 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
						/>
					</div>
					<button
						onClick={onAnalyze}
						disabled={isAnalyzing || !jobUrl}
						className={[
							'inline-flex items-center justify-center whitespace-nowrap',
							'px-6 py-3 rounded-xl text-sm font-semibold',
							'text-white bg-indigo-600 hover:bg-indigo-700',
							'disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500',
							'transition-all duration-200',
							'shadow-sm hover:shadow-md',
							'disabled:cursor-not-allowed disabled:hover:shadow-sm'
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
								Analyze with AI
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}

export default AICard;


