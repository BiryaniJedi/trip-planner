import { useNavigate } from 'react-router-dom';

export default function Home() {
	const navigate = useNavigate();
	return (
		<div className="h-full min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
			<div className="text-center mb-2">
				<h1 className="text-5xl font-bold text-slate-800 tracking-tight">Trip Planner</h1>
				<p className="text-slate-500 mt-3 text-lg">Plan trips, track expenses, stay organized.</p>
			</div>
			<button
				onClick={() => navigate('/trips')}
				className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-8 py-3 rounded-xl transition-colors shadow-sm cursor-pointer"
			>
				View My Trips
			</button>
		</div>
	);
}
