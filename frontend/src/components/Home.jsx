import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GetAllTrips } from '../../wailsjs/go/main/App';
import { TYPE_LABELS, formatDate, tripDuration } from '../utils';

const TYPE_COLORS = {
	travel: 'bg-sky-100 text-sky-700',
	festival: 'bg-purple-100 text-purple-700',
	roadtrip: 'bg-amber-100 text-amber-700',
	other: 'bg-slate-100 text-slate-600',
};

function greeting() {
	const h = new Date().getHours();
	if (h < 12) return 'Good morning';
	if (h < 18) return 'Good afternoon';
	return 'Good evening';
}

function StatCard({ value, label }) {
	return (
		<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-1">
			<p className="text-3xl font-bold text-slate-800">{value}</p>
			<p className="text-sm text-slate-400">{label}</p>
		</div>
	);
}

function TripCard({ trip, navigate, compact = false }) {
	const duration = tripDuration(trip.start_date, trip.end_date);

	if (compact) {
		return (
			<div
				onClick={() => navigate(`/trips/${trip.id}`)}
				className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer"
			>
				<span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${TYPE_COLORS[trip.trip_type] ?? TYPE_COLORS.other}`}>
					{TYPE_LABELS[trip.trip_type] ?? trip.trip_type}
				</span>
				<p className="flex-1 text-sm font-medium text-slate-700 truncate">{trip.name}</p>
				<p className="text-xs text-slate-400 shrink-0">{formatDate(trip.end_date)}</p>
			</div>
		);
	}

	return (
		<div
			onClick={() => navigate(`/trips/${trip.id}`)}
			className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
		>
			<div className="flex items-start justify-between gap-3 mb-3">
				<span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_COLORS[trip.trip_type] ?? TYPE_COLORS.other}`}>
					{TYPE_LABELS[trip.trip_type] ?? trip.trip_type}
				</span>
				{trip.need_visa && (
					<span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">Visa required</span>
				)}
			</div>
			<h3 className="text-lg font-semibold text-slate-800 mb-1">{trip.name}</h3>
			<p className="text-sm text-slate-500 mb-2">📍 {trip.destination}</p>
			<div className="flex items-center gap-3 text-xs text-slate-400">
				<span>📅 {formatDate(trip.start_date)} → {formatDate(trip.end_date)}</span>
				{duration && <span>· {duration}</span>}
			</div>
		</div>
	);
}

export default function Home() {
	const navigate = useNavigate();
	const [trips, setTrips] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		GetAllTrips()
			.then((data) => setTrips(data ?? []))
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	const today = new Date().toISOString().split('T')[0];
	const upcoming = trips
		.filter((t) => !t.end_date || t.end_date >= today)
		.sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? ''));
	const past = trips
		.filter((t) => t.end_date && t.end_date < today)
		.sort((a, b) => b.end_date.localeCompare(a.end_date));

	return (
		<div className="min-h-full bg-slate-50 px-6 py-8">
			<div className="max-w-2xl mx-auto flex flex-col gap-6">

				{/* Header */}
				<div className="flex items-start justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold text-slate-800">{greeting()}</h1>
						<p className="text-slate-400 mt-1 text-sm">
							{loading
								? 'Loading your trips…'
								: trips.length === 0
								? 'No trips yet. Start planning!'
								: `${upcoming.length} upcoming · ${past.length} past`}
						</p>
					</div>
					<button
						onClick={() => navigate('/trips/new')}
						className="shrink-0 bg-[var(--c-p6)] hover:bg-[var(--c-p7)] text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer text-sm"
					>
						+ New Trip
					</button>
				</div>

				{/* Stats */}
				{trips.length > 0 && (
					<div className="grid grid-cols-3 gap-4">
						<StatCard value={trips.length} label="Trips planned" />
						<StatCard value={upcoming.length} label="Upcoming" />
						<StatCard value={past.length} label="Past trips" />
					</div>
				)}

				{/* Empty state */}
				{!loading && trips.length === 0 && (
					<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
						<p className="text-5xl mb-4">🗺️</p>
						<h2 className="text-xl font-semibold text-slate-700 mb-2">No trips yet</h2>
						<p className="text-slate-400 text-sm mb-6">
							Plan your first adventure and start tracking expenses, photos, notes, and links.
						</p>
						<button
							onClick={() => navigate('/trips/new')}
							className="bg-[var(--c-p6)] hover:bg-[var(--c-p7)] text-white font-medium px-6 py-2.5 rounded-xl transition-colors cursor-pointer text-sm"
						>
							Plan a Trip
						</button>
					</div>
				)}

				{/* Upcoming trips */}
				{upcoming.length > 0 && (
					<section>
						<div className="flex items-center justify-between mb-3">
							<h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Upcoming</h2>
							{upcoming.length > 3 && (
								<button
									onClick={() => navigate('/trips')}
									className="text-xs text-[var(--c-p6)] hover:text-[var(--c-p8)] cursor-pointer"
								>
									+{upcoming.length - 3} more →
								</button>
							)}
						</div>
						<div className="flex flex-col gap-3">
							{upcoming.slice(0, 3).map((trip) => (
								<TripCard key={trip.id} trip={trip} navigate={navigate} />
							))}
						</div>
					</section>
				)}

				{/* Past trips */}
				{past.length > 0 && (
					<section>
						<div className="flex items-center justify-between mb-3">
							<h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Past</h2>
							{past.length > 5 && (
								<button
									onClick={() => navigate('/trips')}
									className="text-xs text-[var(--c-p6)] hover:text-[var(--c-p8)] cursor-pointer"
								>
									View all {past.length} →
								</button>
							)}
						</div>
						<div className="flex flex-col gap-2">
							{past.slice(0, 5).map((trip) => (
								<TripCard key={trip.id} trip={trip} navigate={navigate} compact />
							))}
						</div>
					</section>
				)}

			</div>
		</div>
	);
}
