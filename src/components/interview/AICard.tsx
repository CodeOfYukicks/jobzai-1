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
				'rounded-xl p-6',
				'bg-white dark:bg-[#1E1F22]',
				'shadow-sm dark:shadow-none',
				'border border-gray-200 dark:border-[#2A2A2E]',
				'flex flex-col',
				className
			].join(' ')}
		>
			<div className="flex items-start gap-4 mb-4">
				<div className="h-10 w-10 rounded-lg flex items-center justify-center bg-[#F3F4F6] dark:bg-[#26262B]">
					<Sparkles className="w-5 h-5 text-[#6D28D9]" />
				</div>
				<div className="min-w-0">
					<div className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-1">AI-Powered Job Analysis</div>
					<div className="text-[14px] text-gray-600 dark:text-gray-400 leading-relaxed">
						Paste a job posting URL and let our AI extract key requirements, skills, and tailored questions.
					</div>
				</div>
			</div>

			<div className="mt-4">
				<div className="flex items-stretch gap-2">
					<div className="flex-1 flex items-center rounded-lg border border-gray-200 dark:border-[#2A2A2E] bg-white dark:bg-[#1E1F22] px-3">
						<div className="p-1.5 rounded-md bg-[#F9FAFB] dark:bg-[#26262B] mr-2">
							<Link2 className="w-4 h-4 text-[#6B7280] dark:text-gray-400" />
						</div>
						<input
							type="url"
							value={jobUrl}
							onChange={(e) => onJobUrlChange(e.target.value)}
							placeholder="Paste job posting URL..."
							className="flex-1 py-2 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
						/>
					</div>
					<button
						onClick={onAnalyze}
						disabled={isAnalyzing || !jobUrl}
						className={[
							'inline-flex items-center justify-center whitespace-nowrap',
							'px-4 py-2 rounded-lg text-sm font-semibold',
							'text-white bg-[#4F46E5] hover:bg-[#4338CA] disabled:bg-gray-400',
							'transition-colors'
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


