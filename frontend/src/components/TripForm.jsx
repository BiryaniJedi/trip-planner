import { useEffect, useState } from 'react';
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

	return (
		<div>
			<button onClick={() => navigate('/')}>Back to Home</button>
			<form onSubmit={handleSubmit}>
				{error.length !== 0 && (
					<div>
						<p>{error}</p>
					</div>
				)}
				<div>
					<label>Name</label>
					<input
						id="name"
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
				</div>
				<div>
					<label>Destination</label>
					<input
						id="dest"
						type="text"
						value={dest}
						onChange={(e) => setDest(e.target.value)}
						required
					/>
				</div>
				<div>
					<label>Trip Type</label>
					<select value={tripType} onChange={(e) => setTripType(e.target.value)}>
						{Object.entries(TYPE_LABELS).map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</div>
				<div>
					<label>Start Date</label>
					<input
						id="start"
						type="date"
						value={start}
						onChange={(e) => setStart(e.target.value)}
						required
					/>
				</div>
				<div>
					<label>End Date</label>
					<input
						id="end"
						type="date"
						value={end}
						onChange={(e) => setEnd(e.target.value)}
						required
					/>
				</div>
				<div>
					<label>Need Visa</label>
					<input
						type="checkbox"
						checked={needVisa}
						onChange={(e) => setNeedVisa(e.target.checked)}
					/>
				</div>
				<button type="submit">Submit</button>
			</form>
		</div>
	);
}
