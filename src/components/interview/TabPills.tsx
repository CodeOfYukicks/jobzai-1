import React, { useEffect, useRef, useState } from 'react';

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
	const containerRef = useRef<HTMLDivElement>(null);
	const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

	// Calculate indicator position based on active tab
	useEffect(() => {
		if (containerRef.current) {
			const activeButton = containerRef.current.querySelector(`[data-tab-id="${activeId}"]`) as HTMLButtonElement;
			if (activeButton) {
				const containerRect = containerRef.current.getBoundingClientRect();
				const buttonRect = activeButton.getBoundingClientRect();
				setIndicatorStyle({
					left: buttonRect.left - containerRect.left,
					width: buttonRect.width,
				});
			}
		}
	}, [activeId, items]);

	return (
		<div className={`w-full max-w-7xl mx-auto ${className}`}>
			{/* Full-width container with centered content */}
			<div className="relative" ref={containerRef}>
				{/* Tab buttons - evenly distributed */}
				<nav className="flex items-center justify-center border-b border-slate-200 dark:border-slate-800">
					{items.map((item) => {
						const isActive = activeId === item.id;
						return (
							<button
								key={item.id}
								data-tab-id={item.id}
								onClick={() => onChange(item.id)}
								className={`
									relative flex items-center justify-center gap-2.5
									px-8 py-4
									text-sm font-medium
									transition-all duration-200
									border-b-2 -mb-px
									${isActive
										? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
										: 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
									}
								`}
							>
								{item.icon && (
									<span 
										className={`
											transition-colors duration-200
											${isActive 
												? 'text-blue-600 dark:text-blue-400' 
												: 'text-slate-400 dark:text-slate-500'
											}
										`}
									>
										{item.icon}
									</span>
								)}
								<span>{item.label}</span>
							</button>
						);
					})}
				</nav>
			</div>
		</div>
	);
}

export default TabPills;
