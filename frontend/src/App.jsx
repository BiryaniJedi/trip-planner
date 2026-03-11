import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import TripList from './components/TripList';
import TripDetails from './components/TripDetails';
import TripForm from './components/TripForm';
import Expenses from './components/Expenses';
import TripItinerary from './components/TripItinerary';
import WebSearch from './components/WebSearch';

function App() {
	return (
		<ThemeProvider>
			<HashRouter>
				<div className="flex h-screen overflow-hidden bg-[var(--c-bg)]">
					<Sidebar />
					<main className="flex-1 overflow-y-auto">
						<Routes>
							<Route path="/" element={<Home />} />
							<Route path="/trips" element={<TripList />} />
							<Route path="/trips/new" element={<TripForm />} />
							<Route path="/trips/:id" element={<TripDetails />} />
							<Route path="/trips/:id/edit" element={<TripForm />} />
							<Route path="/trips/:id/expenses" element={<Expenses />} />
							<Route path="/trips/:id/itinerary" element={<TripItinerary />} />
							<Route path="/websearch" element={<WebSearch />} />
						</Routes>
					</main>
				</div>
			</HashRouter>
		</ThemeProvider>
	);
}

export default App;
