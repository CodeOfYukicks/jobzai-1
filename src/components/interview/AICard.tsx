import React from 'react';
import { Loader2, ArrowRight } from 'lucide-react';

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
		<div className={`w-full ${className}`}>
			{/* Minimal container with subtle border */}
			<div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-5">
				
				{/* Single row layout */}
				<div className="flex flex-col lg:flex-row lg:items-center gap-4">
					
					{/* Label + Icon */}
					<div className="flex items-center gap-3 flex-shrink-0">
						<div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 dark:bg-white">
							<svg 
								className="w-4 h-4 text-white dark:text-slate-900" 
								viewBox="0 0 24 24" 
								fill="none" 
								stroke="currentColor" 
								strokeWidth="2"
							>
								<path d="M12 3L14.5 8.5L21 9.5L16.5 14L17.5 21L12 18L6.5 21L7.5 14L3 9.5L9.5 8.5L12 3Z" />
							</svg>
						</div>
						<span className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
							AI Analysis
						</span>
					</div>

					{/* Input - Minimal underline style */}
					<div className="flex-1 relative group">
						<input
							type="url"
							value={jobUrl}
							onChange={(e) => onJobUrlChange(e.target.value)}
							placeholder="Paste job posting URL..."
							className="
								w-full py-2 px-0
								bg-transparent 
								border-0 border-b border-slate-200 dark:border-slate-700
								text-sm text-slate-900 dark:text-white
								placeholder:text-slate-400 dark:placeholder:text-slate-500
								focus:outline-none focus:border-slate-900 dark:focus:border-white
								transition-colors duration-200
							"
						/>
					</div>

					{/* Analyze Button - Minimal dark */}
					<button
						onClick={onAnalyze}
						disabled={isAnalyzing || !jobUrl}
						className="
							inline-flex items-center justify-center gap-2
							px-5 py-2.5 rounded-lg
							text-sm font-medium
							bg-slate-900 dark:bg-white
							text-white dark:text-slate-900
							hover:bg-slate-800 dark:hover:bg-slate-100
							disabled:opacity-40 disabled:cursor-not-allowed
							transition-all duration-200
							flex-shrink-0
						"
					>
						{isAnalyzing ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin" />
								<span>Analyzing</span>
							</>
						) : (
							<>
								<span>Analyze</span>
								<ArrowRight className="w-4 h-4" />
							</>
						)}
					</button>
				</div>

				{/* Helper text */}
				<p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
					Extract requirements, skills, and prepare interview questions from any job posting
				</p>
			</div>
		</div>
	);
}

export default AICard;
