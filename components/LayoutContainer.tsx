'use client';
import React from 'react';

type Props = {
	children: React.ReactNode;
	className?: string;
};

export default function LayoutContainer({ children, className }: Props) {
	return (
		<div className={`mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 ${className || ''}`}>
			{children}
		</div>
	);
}




