import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GetAllTrips } from '../../wailsjs/go/main/App';
import { TYPE_LABELS, toTitleCase, formatDate, tripDuration } from '../utils';

const TYPE_COLORS = {
	travel:   'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
	festival: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
	roadtrip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
	other:    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

const TYPE_ACCENT = {
	travel:   'border-l-sky-400',
	festival: 'border-l-purple-400',
	roadtrip: 'border-l-amber-400',
	other:    'border-l-[var(--c-border2)]',
};

function PageSpinner() {
	return (
		<div className="h-full flex items-center justify-center">
			<div className="flex flex-col items-center gap-3">
				<div className="w-8 h-8 rounded-full border-2 border-[var(--c-border)] border-t-[var(--c-p6)] animate-spin" />
				<p className="text-sm text-[var(--c-muted)]">Loading…</p>
			</div>
		</div>
	);
}

export default function TripList() {
	const [trips, setTrips] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const navigate = useNavigate();

	const loadTrips = async () => {
		setLoading(true);
		await GetAllTrips()
			.then((data) => { setTrips(data ?? []); setError(''); })
			.catch((err) => setError(err))
			.finally(() => setLoading(false));
	};

	useEffect(() => { loadTrips(); }, []);

	if (error.length !== 0) {
		return (
			<div className="min-h-full bg-[var(--c-bg)] flex flex-col items-center justify-center gap-4">
				<p className="text-red-500 font-medium">Error: {error}</p>
				<button
					onClick={() => navigate('/')}
					className="text-[var(--c-muted)] hover:text-[var(--c-text2)] text-sm underline cursor-pointer"
				>
					Back to Home
				</button>
			</div>
		);
	}

	if (loading) return <PageSpinner />;

	return (
		<div className="min-h-full bg-[var(--c-bg)] page-in">
			<div className="max-w-4xl mx-auto px-8 py-8">

				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<div>
						<button
							onClick={() => navigate('/')}
							className="text-[var(--c-muted)] hover:text-[var(--c-text2)] text-sm mb-1.5 flex items-center gap-1 cursor-pointer transition-colors"
						>
							← Home
						</button>
						<h1 className="text-3xl font-bold text-[var(--c-text)] tracking-tight">My Trips</h1>
						{trips.length > 0 && (
							<p className="text-sm text-[var(--c-muted)] mt-1">{trips.length} trip{trips.length !== 1 ? 's' : ''}</p>
						)}
					</div>
					<button
						onClick={() => navigate('/trips/new')}
						className="bg-[var(--c-p6)] hover:bg-[var(--c-p7)] text-white font-medium px-5 py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer text-sm"
					>
						+ New Trip
					</button>
				</div>

				{/* Empty state */}
				{trips.length === 0 && (
					<div className="text-center py-24">
						<p className="text-6xl mb-5">🗺️</p>
						<p className="text-lg font-semibold text-[var(--c-text2)]">No trips yet</p>
						<p className="text-sm text-[var(--c-muted)] mt-1">Hit "+ New Trip" to plan your first adventure.</p>
					</div>
				)}

				{/* Trip cards */}
				<div className="grid grid-cols-2 gap-4">
					{trips.map((trip) => {
						const duration = tripDuration(trip.start_date, trip.end_date);
						const accent = TYPE_ACCENT[trip.trip_type] ?? TYPE_ACCENT.other;
						return (
							<div
								key={trip.id}
								className={`bg-[var(--c-card)] border border-[var(--c-border)] border-l-4 ${accent} rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[var(--c-border2)] transition-all duration-150 cursor-pointer`}
								onClick={() => navigate(`/trips/${trip.id}`)}
							>
								<div className="flex items-start justify-between gap-3 mb-3">
									<span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${TYPE_COLORS[trip.trip_type] ?? TYPE_COLORS.other}`}>
										{TYPE_LABELS[trip.trip_type] ?? trip.trip_type}
									</span>
									{trip.need_visa && (
										<span className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full shrink-0">
											Visa req.
										</span>
									)}
								</div>
								<h2 className="text-base font-semibold text-[var(--c-text)] truncate mb-1">
									{toTitleCase(trip.name)}
								</h2>
								<p className="text-sm text-[var(--c-text3)] mb-2 truncate">📍 {trip.destination}</p>
								<div className="flex items-center gap-2 text-xs text-[var(--c-muted)]">
									<span>
										{trip.start_date && trip.end_date
											? `${formatDate(trip.start_date)} → ${formatDate(trip.end_date)}`
											: formatDate(trip.start_date) || 'Dates TBD'}
									</span>
									{duration && <span>· {duration}</span>}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
