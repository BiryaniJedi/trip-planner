import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateTrip } from '../../wailsjs/go/main/App';
import { TYPE_LABELS } from '../utils';

export default function TripForm() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [name, setName] = useState('');
	const [dest, setDest] = useState('');
	const [start, setStart] = useState('');
	const [end, setEnd] = useState('');
	const [tripType, setTripType] = useState('travel');
	const [needVisa, setNeedVisa] = useState(false);

	const navigate = useNavigate();

	const resetStates = () => {
		setName('');
		setDest('');
		setStart('');
		setEnd('');
		setTripType('travel');
		setNeedVisa(false);
	};

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
		await CreateTrip({
			name: name,
			destination: dest,
			start_date: start,
			end_date: end,
			trip_type: tripType,
			need_visa: needVisa,
		})
			.then(() => {
				resetStates();
				navigate('/trips'); //replace with trips/${returnedId} after implementing TripDetail
			})
			.catch((err) => {
				setError(err);
			})
			.finally(() => setLoading(false));
	};

	const labelClass = 'block text-sm font-medium text-slate-600 mb-1';
	const inputClass =
		'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition';

	return (
		<div className="min-h-full bg-slate-50 flex items-start justify-center px-6 py-12">
			<div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
				<h1 className="text-2xl font-bold text-slate-800 mb-6">New Trip</h1>

				{error && (
					<div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
						{error}
					</div>
				)}

				<div className="flex flex-col gap-4">
					<div>
						<label className={labelClass}>Name</label>
						<input
							id="name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className={inputClass}
							placeholder="e.g. Coachella 2025"
							required
						/>
					</div>

					<div>
						<label className={labelClass}>Destination</label>
						<input
							id="dest"
							type="text"
							value={dest}
							onChange={(e) => setDest(e.target.value)}
							className={inputClass}
							placeholder="e.g. Indio, CA"
							required
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
								<option key={value} value={value}>
									{label}
								</option>
							))}
						</select>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className={labelClass}>Start Date</label>
							<input
								id="start"
								type="date"
								value={start}
								onChange={(e) => setStart(e.target.value)}
								className={inputClass}
								required
							/>
						</div>
						<div>
							<label className={labelClass}>End Date</label>
							<input
								id="end"
								type="date"
								value={end}
								onChange={(e) => setEnd(e.target.value)}
								className={inputClass}
								required
							/>
						</div>
					</div>

					<label className="flex items-center gap-2.5 cursor-pointer select-none">
						<input
							type="checkbox"
							checked={needVisa}
							onChange={(e) => setNeedVisa(e.target.checked)}
							className="w-4 h-4 rounded border-slate-300 accent-indigo-600"
						/>
						<span className="text-sm text-slate-600">Visa required</span>
					</label>
				</div>

				<div className="flex gap-3 mt-8">
					<button
						onClick={() => navigate(-1)}
						className="flex-1 text-sm font-medium text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 py-2.5 rounded-xl transition-colors cursor-pointer"
					>
						Cancel
					</button>
					<button
						onClick={handleSubmit}
						disabled={loading}
						className="flex-1 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-xl transition-colors cursor-pointer"
					>
						{loading ? 'Creating...' : 'Create Trip'}
					</button>
				</div>
			</div>
		</div>
	);
}
