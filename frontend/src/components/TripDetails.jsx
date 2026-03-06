import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GetTripByID, DeleteTripById } from '../../wailsjs/go/main/App';
import { TYPE_LABELS } from '../utils';

const TYPE_COLORS = {
	travel: 'bg-sky-100 text-sky-700',
	festival: 'bg-purple-100 text-purple-700',
	roadtrip: 'bg-amber-100 text-amber-700',
	other: 'bg-slate-100 text-slate-600',
};

export default function TripDetails() {
	const navigate = useNavigate();
	const { id } = useParams();
	const tripId = parseInt(id);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [trip, setTrip] = useState(null);
	const [confirmId, setConfirmId] = useState(null);

	const handleDelete = async (id) => {
		setLoading(true);
		await DeleteTripById(id)
			.then(() => navigate('/trips'))
			.catch((err) => setError(err))
			.finally(() => {
				setLoading(false);
			});
	};

	const loadTrip = async () => {
		setLoading(true);
		setError(null);
		await GetTripByID(tripId)
			.then((data) => {
				setTrip(data);
				setError(null);
			})
			.catch((err) => {
				setTrip(null);
				setError(err);
			})
			.finally(() => {
				setLoading(false);
			});
	};

	useEffect(() => {
		loadTrip();
	}, []);

	if (error) {
		return (
			<div className="h-full flex flex-col items-center justify-center gap-4">
				<p className="text-red-500 font-medium">{String(error)}</p>
				<button
					onClick={() => navigate('/trips')}
					className="text-slate-500 hover:text-slate-700 text-sm underline cursor-pointer"
				>
					← Back to Trips
				</button>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="h-full flex items-center justify-center">
				<p className="text-slate-400 text-lg">Loading...</p>
			</div>
		);
	}

	if (!trip) {
		return (
			<div className="h-full flex flex-col items-center justify-center gap-4">
				<p className="text-slate-500">Trip not found.</p>
				<button
					onClick={() => navigate('/trips')}
					className="text-indigo-600 hover:text-indigo-800 text-sm underline cursor-pointer"
				>
					← Back to Trips
				</button>
			</div>
		);
	}

	return (
		<div className="min-h-full bg-slate-50 px-6 py-8">
			<div className="max-w-4xl mx-auto flex flex-col gap-5">

				{/* ── Hero card ── */}
				<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
					<div className="flex items-start justify-between mb-6">
						<span
							className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_COLORS[trip.trip_type] ?? TYPE_COLORS.other}`}
						>
							{TYPE_LABELS[trip.trip_type] ?? trip.trip_type}
						</span>
						<div className="flex gap-2">
							<button
								onClick={() => navigate(`/trips/${tripId}/edit`)}
								className="text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-300 px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
							>
								Edit
							</button>
							<button
								onClick={() => setConfirmId(trip.id)}
								className="text-sm font-medium text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
							>
								Delete
							</button>
						</div>
					</div>

					<h1 className="text-4xl font-bold text-slate-800 mb-4">{trip.name}</h1>

					<div className="flex flex-wrap gap-6 text-slate-500 text-sm">
						<span className="flex items-center gap-1.5">
							<span>📍</span> {trip.destination}
						</span>
						<span className="flex items-center gap-1.5">
							<span>📅</span> {trip.start_date} → {trip.end_date}
						</span>
						{trip.need_visa && (
							<span className="flex items-center gap-1.5 text-amber-600 font-medium">
								<span>🛂</span> Visa required
							</span>
						)}
					</div>

					{/* Delete confirmation */}
					{confirmId === trip.id && (
						<div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
							<p className="text-sm text-red-700 font-medium">
								Delete this trip? This cannot be undone.
							</p>
							<div className="flex gap-2">
								<button
									onClick={() => setConfirmId(null)}
									className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
								>
									Cancel
								</button>
								<button
									onClick={() => handleDelete(trip.id)}
									className="text-sm px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium cursor-pointer"
								>
									Yes, Delete
								</button>
							</div>
						</div>
					)}
				</div>

				{/* ── Photo gallery placeholder ── */}
				<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-base font-semibold text-slate-700">Photos</h2>
						<button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium border border-indigo-200 hover:border-indigo-400 px-3 py-1 rounded-lg transition-colors cursor-pointer">
							+ Add Photos
						</button>
					</div>
					<div className="grid grid-cols-4 gap-3">
						{[0, 1, 2, 3].map((i) => (
							<div
								key={i}
								className="aspect-square bg-slate-100 hover:bg-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 transition-colors cursor-pointer"
							>
								<svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
									<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
									<circle cx="8.5" cy="8.5" r="1.5" />
									<polyline points="21,15 16,10 5,21" />
								</svg>
								<span className="text-xs">Photo</span>
							</div>
						))}
					</div>
				</div>

				{/* ── Itinerary + Expenses ── */}
				<div className="grid grid-cols-2 gap-5">

					{/* Itinerary */}
					<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-3">
						<div className="flex items-center gap-2">
							<svg className="w-5 h-5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
								<polyline points="14,2 14,8 20,8" />
								<line x1="16" y1="13" x2="8" y2="13" />
								<line x1="16" y1="17" x2="8" y2="17" />
							</svg>
							<h2 className="text-base font-semibold text-slate-700">Itinerary</h2>
						</div>
						<div className="flex-1 flex flex-col items-center justify-center py-6 text-center gap-3">
							<p className="text-sm text-slate-400">No itinerary document linked yet.</p>
							<button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium border border-indigo-200 hover:border-indigo-400 px-4 py-2 rounded-lg transition-colors cursor-pointer">
								Link Document
							</button>
						</div>
					</div>

					{/* Expenses */}
					<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-3">
						<div className="flex items-center gap-2">
							<svg className="w-5 h-5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<line x1="12" y1="1" x2="12" y2="23" />
								<path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
							</svg>
							<h2 className="text-base font-semibold text-slate-700">Expenses</h2>
						</div>
						<div className="flex-1 flex flex-col items-center justify-center py-6 text-center gap-3">
							<p className="text-4xl font-bold text-slate-800">$0.00</p>
							<p className="text-sm text-slate-400">No expenses tracked yet.</p>
							<button
								onClick={() => {}}
								className="text-sm text-indigo-600 hover:text-indigo-800 font-medium border border-indigo-200 hover:border-indigo-400 px-4 py-2 rounded-lg transition-colors cursor-pointer"
							>
								View Expenses
							</button>
						</div>
					</div>

				</div>
			</div>
		</div>
	);
}
