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
import { TYPE_LABELS } from '../utils';

export default function TripList() {
	// TODO: state for trips array and a loading boolean
	const [trips, setTrips] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [confirmId, setConfirmId] = useState(null);
	const navigate = useNavigate();

	const loadTrips = async () => {
		setLoading(true);
		await GetAllTrips()
			.then((data) => {
				const result = data ?? [];
				setTrips(result);
				console.log(`Trips: ${result.length === 0 ? 'no trips' : result}`);
				setError('');
			})
			.catch((err) => setError(err))
			.finally(() => setLoading(false));
	};

	// TODO: useEffect — load all trips on mount, set loading false when done
	useEffect(() => {
		loadTrips();
		console.log('LOG SOMETHING!!!');
	}, []);

	// TODO: handleDelete(id)
	//   - confirm with the user before deleting
	//   - call DeleteTrip(id)
	//   - remove the deleted trip from local state (no need to re-fetch)

	const handleDelete = async (id) => {
		setLoading(true);
		await DeleteTripById(id)
			.catch((err) => setError(err))
			.finally(() => {
				setLoading(false);
			});

		loadTrips();
	};

	// TODO: render
	//   - while loading: show a loading message
	//   - heading + "New Trip" button
	//   - empty state message if trips.length === 0
	//   - list of trip cards with name, destination, type label, Edit + Delete buttons
	//

	if (error.length !== 0) {
		return (
			<div>
				<h1>Error: {error}</h1>
				<button onClick={() => navigate('/')}>Back to Home</button>
			</div>
		);
	}

	if (loading) {
		return (
			<div>
				<h1>Loading...</h1>
			</div>
		);
	}

	return (
		<div>
			<button onClick={() => navigate('/')}>Back to Home</button>
			<button onClick={() => navigate('/trips/new')}>Create New Trip</button>
			{trips.length === 0 && <h1>No trips yet, click the button above to create one!</h1>}
			<ul>
				{trips.map((trip) => (
					<div key={trip.id}>
						<li>
							{trip.name}, {trip.destination}, {trip.start_date}, {trip.end_date}
						</li>
						<button onClick={() => setConfirmId(trip.id)}>Delete Trip</button>
						{confirmId === trip.id && (
							<div className="modal">
								<p>Are you sure you want to delete this trip? This cannot be undone.</p>
								<button onClick={() => handleDelete(trip.id)}>Yes, Delete</button>
								<button onClick={() => setShowConfirm(false)}>Cancel</button>
							</div>
						)}
					</div>
				))}
			</ul>
		</div>
	);
}
