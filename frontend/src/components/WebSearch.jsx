import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GenerateAITripPlan } from '../../wailsjs/go/main/App';
import { TYPE_LABELS, toTitleCase, formatDate } from '../utils';
import LoadingSpinner from './LoadingSpinner';

export default function WebSearch() {
	// TODO: state for trips array and a loading boolean
	const [tripId, setTripId] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const navigate = useNavigate();
	const loadingMessages = [
		'Searching flights...',
		'Finding hotels...',
		'Checking visa requirements...',
		'Scouting restaurants...',
		'Building your itinerary...',
	];

	const genAITripPlan = async () => {
		setTripId(0);
		setLoading(true);
		await GenerateAITripPlan()
			.then((data) => {
				const result = data ?? 0;
				setTripId(result);
				setError('');
			})
			.catch((err) => {
				setError(String(err));
				setTripId(0);
			})
			.finally(() => setLoading(false));
	};

	// useEffect(() => {
	// 	loadTrips();
	// }, []);

	// if (error.length !== 0) {
	// 	return (
	// 		<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
	// 			<p className="text-red-600 font-medium">Error: {error}</p>
	// 			<button
	// 				onClick={() => navigate('/')}
	// 				className="text-slate-500 hover:text-slate-700 text-sm underline cursor-pointer"
	// 			>
	// 				Back to Home
	// 			</button>
	// 		</div>
	// 	);
	// }

	if (loading) {
		return (
			<div className="min-h-screen bg-slate-50 flex items-center justify-center">
				<LoadingSpinner messages={loadingMessages} />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50">
			<div className="max-w-2xl mx-auto px-6 py-10">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<div>
						<button
							onClick={() => navigate('/')}
							className="text-slate-400 hover:text-slate-600 text-sm mb-1 flex items-center gap-1 cursor-pointer"
						>
							← Home
						</button>
						<button
							onClick={() => genAITripPlan()}
							className="text-slate-400 hover:text-slate-600 text-sm mb-1 flex items-center gap-1 cursor-pointer"
						>
							Generate AI Trip Plan
						</button>
					</div>
				</div>
				{/* Body */}
				<div className="flex items-center justify-between mb-8">
					{error && (
						<div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
							{error}
						</div>
					)}
					{tripId !== 0 ? (
						<div>
							<h1 className="text-2xl font-bold text-slate-800 mb-6">
								{'Success! AI Trip Generated!'}
							</h1>
							<button
								onClick={() => navigate(`/trips/${tripId}`)}
								className="text-slate-400 hover:text-slate-600 text-sm mb-1 flex items-center gap-1 cursor-pointer"
							>
								View Trip
							</button>
						</div>
					) : (
						<div>
							<h2 className="text-2xl font-bold text-slate-800 mb-6">{'Oops! No trip created!'}</h2>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
