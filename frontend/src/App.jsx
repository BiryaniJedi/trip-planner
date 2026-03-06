import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import TripList from './components/TripList';
import TripDetails from './components/TripDetails';
import TripForm from './components/TripForm';
import Expenses from './components/Expenses';

function App() {
	return (
		<HashRouter>
			<div className="flex h-screen overflow-hidden bg-slate-50">
				<Sidebar />
				<main className="flex-1 overflow-y-auto">
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/trips" element={<TripList />} />
						<Route path="/trips/new" element={<TripForm />} />
						<Route path="/trips/:id" element={<TripDetails />} />
						<Route path="/trips/:id/edit" element={<TripForm />} />
						<Route path="/trips/:id/expenses" element={<Expenses />} />
					</Routes>
				</main>
			</div>
		</HashRouter>
	);
}

export default App;
