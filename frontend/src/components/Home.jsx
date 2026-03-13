import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GetAllTrips } from '../../wailsjs/go/main/App';
import { TYPE_LABELS, formatDate, tripDuration } from '../utils';

const TYPE_COLORS = {
	travel:   'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
	festival: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
	roadtrip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
	other:    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

// Colored left-border accent per trip type
const TYPE_ACCENT = {
	travel:   'border-l-sky-400',
	festival: 'border-l-purple-400',
	roadtrip: 'border-l-amber-400',
	other:    'border-l-[var(--c-border2)]',
};

function greeting() {
	const h = new Date().getHours();
	if (h < 5)  return ['🌙', 'Good night'];
	if (h < 12) return ['☀️', 'Good morning'];
	if (h < 17) return ['🌤', 'Good afternoon'];
	return ['🌆', 'Good evening'];
}

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

function StatCard({ value, label, icon }) {
	return (
		<div className="bg-[var(--c-card)] rounded-2xl border border-[var(--c-border)] p-5 flex items-center gap-4 shadow-sm">
			<div className="w-11 h-11 rounded-xl bg-[var(--c-p1)] flex items-center justify-center text-xl shrink-0">
				{icon}
			</div>
			<div>
				<p className="text-2xl font-bold text-[var(--c-text)] leading-none">{value}</p>
				<p className="text-xs text-[var(--c-muted)] mt-1">{label}</p>
			</div>
		</div>
	);
}

function TripCard({ trip, navigate, compact = false }) {
	const duration = tripDuration(trip.start_date, trip.end_date);
	const accent = TYPE_ACCENT[trip.trip_type] ?? TYPE_ACCENT.other;

	if (compact) {
		return (
			<div
				onClick={() => navigate(`/trips/${trip.id}`)}
				className={`flex items-center gap-3 px-4 py-3 bg-[var(--c-card)] border border-[var(--c-border)] border-l-4 ${accent} rounded-xl hover:border-[var(--c-border2)] hover:shadow-sm transition-all duration-150 cursor-pointer`}
			>
				<span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${TYPE_COLORS[trip.trip_type] ?? TYPE_COLORS.other}`}>
					{TYPE_LABELS[trip.trip_type] ?? trip.trip_type}
				</span>
				<p className="flex-1 text-sm font-medium text-[var(--c-text2)] truncate">{trip.name}</p>
				<p className="text-xs text-[var(--c-muted)] shrink-0">{formatDate(trip.end_date)}</p>
			</div>
		);
	}

	return (
		<div
			onClick={() => navigate(`/trips/${trip.id}`)}
			className={`bg-[var(--c-card)] border border-[var(--c-border)] border-l-4 ${accent} rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[var(--c-border2)] transition-all duration-150 cursor-pointer`}
		>
			<div className="flex items-start justify-between gap-3 mb-3">
				<span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_COLORS[trip.trip_type] ?? TYPE_COLORS.other}`}>
					{TYPE_LABELS[trip.trip_type] ?? trip.trip_type}
				</span>
				{trip.need_visa && (
					<span className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
						Visa required
					</span>
				)}
			</div>
			<h3 className="text-base font-semibold text-[var(--c-text)] mb-1 leading-snug">{trip.name}</h3>
			<p className="text-sm text-[var(--c-text3)] mb-2">📍 {trip.destination}</p>
			<div className="flex items-center gap-3 text-xs text-[var(--c-muted)]">
				<span>📅 {formatDate(trip.start_date)} → {formatDate(trip.end_date)}</span>
				{duration && <span>· {duration}</span>}
			</div>
		</div>
	);
}

function SparklesIcon() {
	return (
		<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
			<path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
			<path d="M19 15l1.09 3.26L23 19l-2.91.74L19 23l-1.09-3.26L15 19l2.91-.74L19 15z" opacity="0.6" />
			<path d="M5 15l1.09 3.26L9 19l-2.91.74L5 23l-1.09-3.26L1 19l2.91-.74L5 15z" opacity="0.4" />
		</svg>
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

	if (loading) return <PageSpinner />;

	const today    = new Date().toISOString().split('T')[0];
	const upcoming = trips
		.filter((t) => !t.end_date || t.end_date >= today)
		.sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? ''));
	const past = trips
		.filter((t) => t.end_date && t.end_date < today)
		.sort((a, b) => b.end_date.localeCompare(a.end_date));

	const [greetIcon, greetText] = greeting();

	return (
		<div className="min-h-full bg-[var(--c-bg)] px-8 py-8 page-in">
			<div className="max-w-4xl mx-auto flex flex-col gap-7">

				{/* ── Header ── */}
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="text-[var(--c-muted)] text-sm mb-0.5">{greetIcon}</p>
						<h1 className="text-3xl font-bold text-[var(--c-text)] tracking-tight">{greetText}</h1>
						<p className="text-[var(--c-muted)] mt-1 text-sm">
							{trips.length === 0
								? 'No trips yet — start planning!'
								: `${upcoming.length} upcoming · ${past.length} past`}
						</p>
					</div>
				</div>

				{/* ── AI Trip Planner banner ── */}
				<div className="bg-[var(--c-p1)] border border-[var(--c-p2)] rounded-2xl p-5 flex items-center justify-between gap-4">
					<div className="flex items-center gap-4">
						<div className="w-10 h-10 rounded-xl bg-[var(--c-p6)] flex items-center justify-center shrink-0 text-white">
							<SparklesIcon />
						</div>
						<div>
							<p className="text-sm font-semibold text-[var(--c-p6)]">AI Trip Planner</p>
							<p className="text-xs text-[var(--c-text2)] mt-0.5">
								Describe your dream trip and let AI build the full itinerary, expenses, and notes.
							</p>
						</div>
					</div>
					<button
						onClick={() => navigate('/websearch')}
						className="shrink-0 text-sm font-semibold bg-[var(--c-p6)] hover:bg-[var(--c-p7)] text-white px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm shadow-[var(--c-p6)]/20"
					>
						Try it →
					</button>
				</div>

				{/* ── Stats ── */}
				{trips.length > 0 && (
					<div className="grid grid-cols-3 gap-4">
						<StatCard value={trips.length}    label="Total trips"    icon="✈️" />
						<StatCard value={upcoming.length} label="Upcoming"        icon="📅" />
						<StatCard value={past.length}     label="Past adventures" icon="📖" />
					</div>
				)}

				{/* ── Empty state ── */}
				{trips.length === 0 && (
					<div className="bg-[var(--c-card)] rounded-2xl border border-[var(--c-border)] shadow-sm p-14 text-center">
						<p className="text-6xl mb-5">🗺️</p>
						<h2 className="text-xl font-semibold text-[var(--c-text2)] mb-2">No trips yet</h2>
						<p className="text-[var(--c-muted)] text-sm mb-7 max-w-xs mx-auto">
							Plan your first adventure and start tracking everything in one place.
						</p>
						<div className="flex gap-3 justify-center">
							<button
								onClick={() => navigate('/trips/new')}
								className="bg-[var(--c-p6)] hover:bg-[var(--c-p7)] text-white font-medium px-6 py-2.5 rounded-xl transition-colors cursor-pointer text-sm"
							>
								Create a Trip
							</button>
							<button
								onClick={() => navigate('/websearch')}
								className="border border-[var(--c-p2)] text-[var(--c-p6)] hover:bg-[var(--c-p1)] font-medium px-6 py-2.5 rounded-xl transition-colors cursor-pointer text-sm"
							>
								Use AI Planner
							</button>
						</div>
					</div>
				)}

				{/* ── Upcoming trips ── */}
				{upcoming.length > 0 && (
					<section>
						<div className="flex items-center justify-between mb-3">
							<h2 className="text-xs font-semibold text-[var(--c-muted)] uppercase tracking-widest">
								Upcoming
							</h2>
							{upcoming.length > 4 && (
								<button
									onClick={() => navigate('/trips')}
									className="text-xs text-[var(--c-p6)] hover:text-[var(--c-p7)] cursor-pointer font-medium"
								>
									+{upcoming.length - 4} more →
								</button>
							)}
						</div>
						<div className={`grid gap-3 ${upcoming.slice(0, 4).length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
							{upcoming.slice(0, 4).map((trip) => (
								<TripCard key={trip.id} trip={trip} navigate={navigate} />
							))}
						</div>
					</section>
				)}

				{/* ── Past trips ── */}
				{past.length > 0 && (
					<section>
						<div className="flex items-center justify-between mb-3">
							<h2 className="text-xs font-semibold text-[var(--c-muted)] uppercase tracking-widest">
								Past
							</h2>
							{past.length > 5 && (
								<button
									onClick={() => navigate('/trips')}
									className="text-xs text-[var(--c-p6)] hover:text-[var(--c-p7)] cursor-pointer font-medium"
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
