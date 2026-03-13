import { useState, useEffect } from 'react';

export default function LoadingSpinner({ messages }: { messages: string[] }) {
	const [msgIndex, setMsgIndex] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setMsgIndex((i) => (i + 1) % messages.length);
		}, 2000);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className="flex flex-col items-center gap-10">
			<div className="w-20 h-20 rounded-full border-[3px] border-white/20 border-t-white animate-spin" />
			<div className="w-72 text-center">
				<p className="text-white text-lg font-light tracking-widest">{messages[msgIndex]}</p>
			</div>
		</div>
	);
}
