import React, { useEffect, useRef } from 'react';

export interface TabItem {
	id: string;
	label: string;
	icon?: React.ReactNode;
}

export interface TabPillsProps {
	items: TabItem[];
	activeId: string;
	onChange: (id: string) => void;
	className?: string;
}

export function TabPills({ items, activeId, onChange, className = '' }: TabPillsProps) {
	const activeIndex = items.findIndex(item => item.id === activeId);
	const tabWidth = 100 / items.length;
	const indicatorRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (indicatorRef.current) {
			indicatorRef.current.style.left = `${activeIndex * tabWidth}%`;
			indicatorRef.current.style.width = `calc(${tabWidth}% - 4px)`;
		}
	}, [activeIndex, tabWidth]);

	return (
		<div className={['w-full', className].join(' ')}>
			{/* Container avec background subtil type Notion/Apple */}
			<div className="relative rounded-lg border border-indigo-200/40 bg-indigo-50/30 p-1 dark:border-indigo-500/20 dark:bg-indigo-500/5">
				{/* Indicateur de sélection animé avec CSS transitions */}
				<div 
					ref={indicatorRef}
					className="absolute top-1 bottom-1 rounded-md border border-indigo-200/60 bg-white shadow-sm shadow-indigo-600/5 transition-all duration-300 ease-out dark:border-indigo-500/30 dark:bg-[#1c1c1e]"
					style={{
						marginLeft: '2px',
						marginRight: '2px',
						left: `${activeIndex * tabWidth}%`,
						width: `calc(${tabWidth}% - 4px)`,
					}}
				/>
				
				{/* Boutons */}
				<div className="relative flex w-full">
					{items.map((item) => {
						const isActive = activeId === item.id;
						return (
							<button
								key={item.id}
								onClick={() => onChange(item.id)}
								className={[
									'relative z-10 flex flex-1 items-center justify-center gap-2',
									'rounded-md px-4 py-2.5 text-[13px] font-medium transition-all duration-200',
									isActive
										? 'text-indigo-700 dark:text-indigo-300'
										: 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
								].join(' ')}
							>
								{item.icon && (
									<span 
										className={[
											'transition-all duration-200',
											isActive 
												? 'scale-105 text-indigo-600 dark:text-indigo-400' 
												: 'scale-100 text-neutral-500 dark:text-neutral-500'
										].join(' ')}
									>
										{item.icon}
									</span>
								)}
								<span className="whitespace-nowrap">{item.label}</span>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}

export default TabPills;


