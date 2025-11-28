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
				'bg-white dark:bg-[#90A5D0]', // Premium periwinkle blue
				'shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.15)]', // Subtle shadow
				'border border-gray-200/60 dark:border-[#a0b3da]',
				'flex flex-col',
				'transition-all duration-300',
				'hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:hover:border-[#b0c3ea]',
				className
			].join(' ')}
		>
			<div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
				<div className="h-10 w-10 rounded-lg flex-shrink-0 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/40 ring-1 ring-indigo-100 dark:ring-indigo-800/50 transition-colors">
					<Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-900" />
				</div>
				<div className="min-w-0 flex-1">
					<div className="text-base font-semibold text-gray-900 dark:text-gray-900 mb-1 tracking-tight">
						AI-Powered Job Analysis
					</div>
					<div className="text-sm text-gray-500 dark:text-gray-700 leading-relaxed max-w-2xl">
						Paste a job posting URL and let our AI extract key requirements, skills, and tailored questions.
					</div>
				</div>
			</div>

			<div className="mt-0">
				<div className="flex flex-col sm:flex-row items-stretch gap-3">
					{/* Premium Input with Glow Effect */}
					<div className="flex-1 relative group/input">
						{/* Primary glow layer */}
						<div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover/input:opacity-50 group-focus-within/input:opacity-75 blur-lg transition-opacity duration-500 ease-out" />
						{/* Outer soft glow */}
						<div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-indigo-400/60 via-purple-400/60 to-indigo-400/60 opacity-0 group-hover/input:opacity-30 group-focus-within/input:opacity-50 blur-2xl transition-opacity duration-500 ease-out" />
						{/* Input container */}
						<div className="relative flex items-center rounded-lg border border-gray-200 dark:border-white/30 bg-gray-50 dark:bg-white/95 px-3 py-1 transition-all duration-300 group-focus-within/input:border-indigo-400/70 dark:group-focus-within/input:border-white/60 group-focus-within/input:bg-white dark:group-focus-within/input:bg-white">
							<div className="p-1.5 rounded-md bg-white dark:bg-indigo-100 mr-2 shadow-sm border border-gray-100 dark:border-indigo-200/50 transition-all duration-300 group-focus-within/input:shadow-md group-focus-within/input:border-indigo-200 dark:group-focus-within/input:border-indigo-300">
								<Link2 className="w-3.5 h-3.5 text-gray-400 dark:text-indigo-600 transition-colors duration-300 group-focus-within/input:text-indigo-500 dark:group-focus-within/input:text-indigo-700" />
							</div>
							<input
								type="url"
								value={jobUrl}
								onChange={(e) => onJobUrlChange(e.target.value)}
								placeholder="https://careers.company.com/job/..."
								className="flex-1 py-2 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-900 placeholder:text-gray-400 dark:placeholder:text-gray-500"
							/>
						</div>
					</div>
					{/* Analyze Button */}
					<button
						onClick={onAnalyze}
						disabled={isAnalyzing || !jobUrl}
						className={[
							'inline-flex items-center justify-center whitespace-nowrap',
							'px-5 py-2 rounded-lg text-sm font-medium',
							'text-white',
							'bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600',
							'disabled:opacity-50 disabled:cursor-not-allowed',
							'transition-all duration-200',
							'shadow-sm hover:shadow-md',
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
