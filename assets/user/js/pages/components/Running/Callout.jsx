import React from 'react';

const VARIANTS = {
	info: 'bg-blue-50 border-blue-200 text-blue-900',
	warn: 'bg-amber-50 border-amber-200 text-amber-900',
	success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
}

export function Callout ({ variant = 'info', children, className = '' }) {
	return <div className={`border rounded-lg px-4 py-3 text-sm leading-relaxed ${VARIANTS[variant]} ${className}`}>
		{children}
	</div>
}
