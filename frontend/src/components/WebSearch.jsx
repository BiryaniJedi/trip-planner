import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GenerateAITripPlan } from '../../wailsjs/go/main/App';
import LoadingSpinner from './LoadingSpinner';

const MONTHS = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December',
];
const TRAVELER_TYPES = ['solo', 'couple', 'family', 'friends', 'group'];
const DIETARY_OPTIONS = [
	'no restrictions', 'vegetarian', 'vegan', 'halal', 'kosher', 'gluten-free', 'dairy-free',
];
const MOBILITY_OPTIONS = [
	'no restrictions', 'some limitations', 'wheelchair accessible required',
];
const INTERESTS = [
	'food', 'culture', 'hiking', 'temples', 'beaches', 'shopping',
	'nightlife', 'art', 'history', 'nature', 'anime', 'music',
	'sports', 'adventure', 'photography', 'architecture',
];
const currentYear = new Date().getFullYear();
const YEARS = [currentYear, currentYear + 1, currentYear + 2];

const loadingMessages = [
	'Searching the web...',
	'Finding flights...',
	'Discovering hotels...',
	'Checking visa requirements...',
	'Scouting restaurants...',
	'Researching local attractions...',
	'Building your itinerary...',
	'Almost there...',
];

export default function WebSearch() {
	const [tripId, setTripId] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const navigate = useNavigate();

	const [form, setForm] = useState({
		TripName: '',
		Destination: '',
		StartingAirport: '',
		DurationDays: '',
		Month: '',
		Year: '',
		TravelerCount: '',
		TravelerType: '',
		Budget: '',
		Interests: [],
		DietaryNeeds: '',
		Mobility: '',
		PassportCountry: '',
	});

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const toggleInterest = (interest) => {
		setForm((prev) => ({
			...prev,
			Interests: prev.Interests.includes(interest)
				? prev.Interests.filter((i) => i !== interest)
				: [...prev.Interests, interest],
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (form.Interests.length === 0) {
			setError('Please select at least one interest.');
			return;
		}
		const req = {
			TripName: form.TripName,
			Destination: form.Destination,
			StartingAirport: form.StartingAirport.toUpperCase(),
			DurationDays: parseInt(form.DurationDays, 10),
			Month: form.Month,
			Year: parseInt(form.Year, 10),
			TravelerCount: parseInt(form.TravelerCount, 10),
			TravelerType: form.TravelerType,
			Budget: form.Budget,
			Interests: form.Interests,
			DietaryNeeds: form.DietaryNeeds,
			Mobility: form.Mobility,
			PassportCountry: form.PassportCountry,
		};
		setTripId(0);
		setLoading(true);
		setError('');
		await GenerateAITripPlan(req)
			.then((data) => setTripId(data ?? 0))
			.catch((err) => {
				setError(String(err));
				setTripId(0);
			})
			.finally(() => setLoading(false));
	};

	const inputClass =
		'w-full px-3 py-2 rounded-lg border border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-p4)] focus:border-transparent transition-colors placeholder:text-[var(--c-muted)]';
	const labelClass = 'block text-xs font-semibold text-[var(--c-muted)] uppercase tracking-wide mb-1.5';

	if (tripId !== 0) {
		return (
			<div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center">
				<div className="text-center max-w-md px-6">
					<div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--c-p1)] flex items-center justify-center">
						<svg className="w-8 h-8 text-[var(--c-p6)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
							<polyline points="22,4 12,14.01 9,11.01" />
						</svg>
					</div>
					<h1 className="text-2xl font-bold text-[var(--c-text)] mb-2">Trip Generated!</h1>
					<p className="text-[var(--c-muted)] mb-6">Your AI-powered trip plan is ready to explore.</p>
					<div className="flex gap-3 justify-center">
						<button
							onClick={() => navigate(`/trips/${tripId}`)}
							className="px-5 py-2.5 rounded-xl bg-[var(--c-p6)] text-white font-medium text-sm hover:bg-[var(--c-p7)] transition-colors cursor-pointer"
						>
							View Trip →
						</button>
						<button
							onClick={() => { setTripId(0); setError(''); }}
							className="px-5 py-2.5 rounded-xl border border-[var(--c-border)] text-[var(--c-text2)] font-medium text-sm hover:bg-[var(--c-hover)] transition-colors cursor-pointer"
						>
							Generate Another
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<>
			{/* Full-screen overlay during loading — covers sidebar too, blocks all interactions */}
			{loading && (
				<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
					<LoadingSpinner messages={loadingMessages} />
				</div>
			)}

			<div className="min-h-screen bg-[var(--c-bg)] page-in">
				<div className="max-w-3xl mx-auto px-6 py-10">
					{/* Header */}
					<div className="mb-8">
						<button
							onClick={() => navigate('/')}
							className="text-[var(--c-muted)] hover:text-[var(--c-text2)] text-sm mb-4 flex items-center gap-1 cursor-pointer transition-colors"
						>
							← Home
						</button>
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-[var(--c-p1)] flex items-center justify-center shrink-0">
								<SparklesIcon className="w-5 h-5 text-[var(--c-p6)]" />
							</div>
							<div>
								<h1 className="text-2xl font-bold text-[var(--c-text)]">AI Trip Planner</h1>
								<p className="text-sm text-[var(--c-muted)]">Tell us about your dream trip and we'll handle the rest</p>
							</div>
						</div>
					</div>

					{error && (
						<div className="mb-6 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-4">
						{/* Trip Details */}
						<Section title="Trip Details" icon={<MapPinIcon />}>
							<div className="grid grid-cols-2 gap-4">
								<div className="col-span-2">
									<label className={labelClass}>Trip Name</label>
									<input
										type="text"
										name="TripName"
										value={form.TripName}
										onChange={handleChange}
										placeholder="Tokyo Spring Adventure"
										required
										className={inputClass}
									/>
								</div>
								<div className="col-span-2">
									<label className={labelClass}>Destination</label>
									<input
										type="text"
										name="Destination"
										value={form.Destination}
										onChange={handleChange}
										placeholder="Tokyo, Japan"
										required
										className={inputClass}
									/>
								</div>
								<div>
									<label className={labelClass}>Departing Airport</label>
									<input
										type="text"
										name="StartingAirport"
										value={form.StartingAirport}
										onChange={handleChange}
										placeholder="JFK"
										required
										maxLength={4}
										className={inputClass + ' uppercase'}
									/>
								</div>
								<div>
									<label className={labelClass}>Duration (days)</label>
									<input
										type="number"
										name="DurationDays"
										value={form.DurationDays}
										onChange={handleChange}
										placeholder="10"
										required
										min={1}
										max={90}
										className={inputClass}
									/>
								</div>
							</div>
						</Section>

						{/* When & Who */}
						<Section title="When & Who" icon={<CalendarIcon />}>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className={labelClass}>Month</label>
									<select
										name="Month"
										value={form.Month}
										onChange={handleChange}
										required
										className={inputClass}
									>
										<option value="">Select month</option>
										{MONTHS.map((m) => (
											<option key={m} value={m}>{m}</option>
										))}
									</select>
								</div>
								<div>
									<label className={labelClass}>Year</label>
									<select
										name="Year"
										value={form.Year}
										onChange={handleChange}
										required
										className={inputClass}
									>
										<option value="">Select year</option>
										{YEARS.map((y) => (
											<option key={y} value={y}>{y}</option>
										))}
									</select>
								</div>
								<div>
									<label className={labelClass}>Number of Travelers</label>
									<input
										type="number"
										name="TravelerCount"
										value={form.TravelerCount}
										onChange={handleChange}
										placeholder="2"
										required
										min={1}
										max={50}
										className={inputClass}
									/>
								</div>
								<div>
									<label className={labelClass}>Group Type</label>
									<select
										name="TravelerType"
										value={form.TravelerType}
										onChange={handleChange}
										required
										className={inputClass}
									>
										<option value="">Select type</option>
										{TRAVELER_TYPES.map((t) => (
											<option key={t} value={t}>
												{t.charAt(0).toUpperCase() + t.slice(1)}
											</option>
										))}
									</select>
								</div>
							</div>
						</Section>

						{/* Budget */}
						<Section title="Budget" icon={<WalletIcon />}>
							<label className={labelClass}>Total Budget</label>
							<input
								type="text"
								name="Budget"
								value={form.Budget}
								onChange={handleChange}
								placeholder="$5000 total"
								required
								className={inputClass}
							/>
							<p className="mt-1.5 text-xs text-[var(--c-muted)]">
								Include currency and scope, e.g. "$3000 total" or "€200/day per person"
							</p>
						</Section>

						{/* Interests */}
						<Section title="Interests" icon={<HeartIcon />}>
							<p className="text-xs text-[var(--c-muted)] mb-3">Select all that apply (at least one required)</p>
							<div className="flex flex-wrap gap-2">
								{INTERESTS.map((interest) => {
									const active = form.Interests.includes(interest);
									return (
										<button
											key={interest}
											type="button"
											onClick={() => toggleInterest(interest)}
											className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
												active
													? 'bg-[var(--c-p6)] text-white border-[var(--c-p6)]'
													: 'bg-transparent text-[var(--c-text2)] border-[var(--c-border)] hover:border-[var(--c-p4)] hover:text-[var(--c-p6)]'
											}`}
										>
											{interest.charAt(0).toUpperCase() + interest.slice(1)}
										</button>
									);
								})}
							</div>
						</Section>

						{/* Preferences */}
						<Section title="Preferences" icon={<SettingsIcon />}>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className={labelClass}>Dietary Needs</label>
									<select
										name="DietaryNeeds"
										value={form.DietaryNeeds}
										onChange={handleChange}
										required
										className={inputClass}
									>
										<option value="">Select option</option>
										{DIETARY_OPTIONS.map((d) => (
											<option key={d} value={d}>
												{d.charAt(0).toUpperCase() + d.slice(1)}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className={labelClass}>Mobility</label>
									<select
										name="Mobility"
										value={form.Mobility}
										onChange={handleChange}
										required
										className={inputClass}
									>
										<option value="">Select option</option>
										{MOBILITY_OPTIONS.map((m) => (
											<option key={m} value={m}>
												{m.charAt(0).toUpperCase() + m.slice(1)}
											</option>
										))}
									</select>
								</div>
								<div className="col-span-2">
									<label className={labelClass}>Passport Country</label>
									<input
										type="text"
										name="PassportCountry"
										value={form.PassportCountry}
										onChange={handleChange}
										placeholder="United States"
										required
										className={inputClass}
									/>
								</div>
							</div>
						</Section>

						{/* Submit */}
						<button
							type="submit"
							disabled={loading}
							className="w-full py-3 px-6 rounded-xl bg-[var(--c-p6)] hover:bg-[var(--c-p7)] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
						>
							<SparklesIcon className="w-4 h-4" />
							Generate AI Trip Plan
						</button>
					</form>

					<p className="text-center text-xs text-[var(--c-muted)] mt-4">
						Powered by OpenAI · This may take 30–60 seconds
					</p>
				</div>
			</div>
		</>
	);
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, icon, children }) {
	return (
		<div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl p-5">
			<div className="flex items-center gap-2 mb-4">
				<span className="text-[var(--c-p6)]">{icon}</span>
				<h2 className="text-sm font-semibold text-[var(--c-text)]">{title}</h2>
			</div>
			{children}
		</div>
	);
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function SparklesIcon({ className = 'w-5 h-5' }) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="currentColor">
			<path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" opacity="1" />
			<path d="M19 15l1.09 3.26L23 19l-2.91.74L19 23l-1.09-3.26L15 19l2.91-.74L19 15z" opacity="0.65" />
			<path d="M5 15l1.09 3.26L9 19l-2.91.74L5 23l-1.09-3.26L1 19l2.91-.74L5 15z" opacity="0.4" />
		</svg>
	);
}

function MapPinIcon() {
	return (
		<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
			<circle cx="12" cy="10" r="3" />
		</svg>
	);
}

function CalendarIcon() {
	return (
		<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
			<line x1="16" y1="2" x2="16" y2="6" />
			<line x1="8" y1="2" x2="8" y2="6" />
			<line x1="3" y1="10" x2="21" y2="10" />
		</svg>
	);
}

function WalletIcon() {
	return (
		<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M21 12V7H5a2 2 0 010-4h14v4" />
			<path d="M3 5v14a2 2 0 002 2h16v-5" />
			<path d="M18 12a2 2 0 000 4h4v-4z" />
		</svg>
	);
}

function HeartIcon() {
	return (
		<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
		</svg>
	);
}

function SettingsIcon() {
	return (
		<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<circle cx="12" cy="12" r="3" />
			<path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
		</svg>
	);
}
