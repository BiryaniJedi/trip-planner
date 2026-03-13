import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CreateTrip, GetTripByID, UpdateTripById } from '../../wailsjs/go/main/App';
import { TYPE_LABELS } from '../utils';

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

export default function TripForm() {
	const { id } = useParams();
	const tripId = id ? parseInt(id) : null;
	const isEdit = tripId !== null;

	const [loading, setLoading] = useState(false);
	const [initLoading, setInitLoading] = useState(isEdit);
	const [error, setError] = useState('');
	const [name, setName] = useState('');
	const [dest, setDest] = useState('');
	const [start, setStart] = useState('');
	const [end, setEnd] = useState('');
	const [tripType, setTripType] = useState('travel');
	const [needVisa, setNeedVisa] = useState(false);

	const navigate = useNavigate();

	useEffect(() => {
		if (!isEdit) return;
		GetTripByID(tripId)
			.then((trip) => {
				setName(trip.name);
				setDest(trip.destination);
				setStart(trip.start_date);
				setEnd(trip.end_date);
				setTripType(trip.trip_type);
				setNeedVisa(trip.need_visa);
			})
			.catch((err) => setError(String(err)))
			.finally(() => setInitLoading(false));
	}, [tripId]);

	const handleSubmit = async () => {
		setError('');
		if (!name || !dest || !start || !end) {
			setError('All fields are required');
			return;
		}
		if (end < start) {
			setError('End date cannot be before start date');
			return;
		}
		setLoading(true);
		const input = { name, destination: dest, start_date: start, end_date: end, trip_type: tripType, need_visa: needVisa };
		try {
			if (isEdit) {
				await UpdateTripById(tripId, input);
				navigate(`/trips/${tripId}`);
			} else {
				const newId = await CreateTrip(input);
				navigate(`/trips/${newId}`);
			}
		} catch (err) {
			setError(String(err));
		} finally {
			setLoading(false);
		}
	};

	const labelClass = 'block text-sm font-medium text-[var(--c-text2)] mb-1';
	const inputClass =
		'w-full border border-[var(--c-border)] rounded-xl px-3 py-2 text-sm text-[var(--c-text)] bg-[var(--c-card)] focus:outline-none focus:ring-2 focus:ring-[var(--c-p3)] focus:border-[var(--c-p4)] transition placeholder:text-[var(--c-muted)]';

	if (initLoading) return <PageSpinner />;

	return (
		<div className="min-h-full bg-[var(--c-bg)] flex items-start justify-center px-6 py-12 page-in">
			<div className="w-full max-w-md bg-[var(--c-card)] rounded-2xl border border-[var(--c-border)] shadow-sm p-8">
				<h1 className="text-2xl font-bold text-[var(--c-text)] mb-6">{isEdit ? 'Edit Trip' : 'New Trip'}</h1>

				{error && (
					<div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
						{error}
					</div>
				)}

				<div className="flex flex-col gap-4">
					<div>
						<label className={labelClass}>Name</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className={inputClass}
							placeholder="e.g. Coachella 2025"
						/>
					</div>

					<div>
						<label className={labelClass}>Destination</label>
						<input
							type="text"
							value={dest}
							onChange={(e) => setDest(e.target.value)}
							className={inputClass}
							placeholder="e.g. Indio, CA"
						/>
					</div>

					<div>
						<label className={labelClass}>Trip Type</label>
						<select
							value={tripType}
							onChange={(e) => setTripType(e.target.value)}
							className={inputClass}
						>
							{Object.entries(TYPE_LABELS).map(([value, label]) => (
								<option key={value} value={value}>{label}</option>
							))}
						</select>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className={labelClass}>Start Date</label>
							<input
								type="date"
								value={start}
								onChange={(e) => setStart(e.target.value)}
								className={inputClass}
							/>
						</div>
						<div>
							<label className={labelClass}>End Date</label>
							<input
								type="date"
								value={end}
								onChange={(e) => setEnd(e.target.value)}
								className={inputClass}
							/>
						</div>
					</div>

					<label className="flex items-center gap-2.5 cursor-pointer select-none">
						<input
							type="checkbox"
							checked={needVisa}
							onChange={(e) => setNeedVisa(e.target.checked)}
							className="w-4 h-4 rounded border-[var(--c-border2)]"
							style={{ accentColor: 'var(--c-p6)' }}
						/>
						<span className="text-sm text-[var(--c-text2)]">Visa required</span>
					</label>
				</div>

				<div className="flex gap-3 mt-8">
					<button
						onClick={() => navigate(-1)}
						className="flex-1 text-sm font-medium text-[var(--c-text2)] border border-[var(--c-border)] hover:border-[var(--c-border2)] hover:bg-[var(--c-hover)] py-2.5 rounded-xl transition-colors cursor-pointer"
					>
						Cancel
					</button>
					<button
						onClick={handleSubmit}
						disabled={loading}
						className="flex-1 text-sm font-medium bg-[var(--c-p6)] hover:bg-[var(--c-p7)] disabled:opacity-50 text-white py-2.5 rounded-xl transition-colors cursor-pointer"
					>
						{loading ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Update Trip' : 'Create Trip')}
					</button>
				</div>
			</div>
		</div>
	);
}
