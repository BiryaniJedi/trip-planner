import { useState, useEffect } from 'react';

export default function LoadingSpinner({ messages }) {
	const [msgIndex, setMsgIndex] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setMsgIndex((i) => (i + 1) % messages.length);
		}, 2000);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6">
			<div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-slate-600 animate-spin" />
			<p className="text-slate-500 text-sm font-medium transition-all">{messages[msgIndex]}</p>
		</div>
	);
}
