// Shows all trips. Each trip displays its name, destination, and type.
// Clicking the name navigates to /trips/:id.
// Has Edit and Delete buttons per trip.
// Has a "New Trip" button that navigates to /trips/new.
// Shows a friendly empty state when there are no trips.
//
// Wails note: GetAllTrips() returns null (not []) when the DB is empty.
//             Use `data ?? []` when setting state.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GetAllTrips, DeleteTripById } from '../../wailsjs/go/main/App';
import { TYPE_LABELS, toTitleCase, formatDate } from '../utils';

const TYPE_COLORS = {
	travel: 'bg-sky-100 text-sky-700',
	festival: 'bg-purple-100 text-purple-700',
	roadtrip: 'bg-amber-100 text-amber-700',
	other: 'bg-slate-100 text-slate-600',
};

export default function TripList() {
	// TODO: state for trips array and a loading boolean
	const [trips, setTrips] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const navigate = useNavigate();

	const loadTrips = async () => {
		setLoading(true);
		await GetAllTrips()
			.then((data) => {
				const result = data ?? [];
				setTrips(result);
				setError('');
			})
			.catch((err) => setError(err))
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		loadTrips();
	}, []);

	if (error.length !== 0) {
		return (
			<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
				<p className="text-red-600 font-medium">Error: {error}</p>
				<button
					onClick={() => navigate('/')}
					className="text-slate-500 hover:text-slate-700 text-sm underline cursor-pointer"
				>
					Back to Home
				</button>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-slate-50 flex items-center justify-center">
				<p className="text-slate-400 text-lg">Loading...</p>
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
						<h1 className="text-3xl font-bold text-slate-800">My Trips</h1>
					</div>
					<button
						onClick={() => navigate('/trips/new')}
						className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer"
					>
						+ New Trip
					</button>
				</div>

				{/* Empty state */}
				{trips.length === 0 && (
					<div className="text-center py-20 text-slate-400">
						<p className="text-5xl mb-4">🗺️</p>
						<p className="text-lg font-medium text-slate-500">No trips yet</p>
						<p className="text-sm mt-1">Hit "+ New Trip" to plan your first adventure.</p>
					</div>
				)}

				{/* Trip cards */}
				<div className="flex flex-col gap-4">
					{trips.map((trip) => (
						<div
							key={trip.id}
							className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
						>
							<div className="flex items-start justify-between gap-4">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1">
										<span
											className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${TYPE_COLORS[trip.trip_type] ?? TYPE_COLORS.other}`}
										>
											{TYPE_LABELS[trip.trip_type] ?? trip.trip_type}
										</span>
									</div>
									<h2 className="text-lg font-semibold text-slate-800 truncate">
										{toTitleCase(trip.name)}
									</h2>
									<p className="text-slate-500 text-sm mt-0.5">{trip.destination}</p>
									<p className="text-slate-400 text-xs mt-1">
										{trip.start_date && trip.end_date
											? `${formatDate(trip.start_date)} → ${formatDate(trip.end_date)}`
											: formatDate(trip.start_date) || 'Dates TBD'}
									</p>
								</div>
								<button
									onClick={() => navigate(`/trips/${trip.id}`)}
									className="shrink-0 text-indigo-600 hover:text-indigo-800 font-medium text-sm border border-indigo-200 hover:border-indigo-400 px-4 py-2 rounded-lg transition-colors cursor-pointer"
								>
									View →
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
