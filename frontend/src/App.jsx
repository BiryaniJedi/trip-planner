import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import TripList from './components/TripList';
import TripDetails from './components/TripDetails';
import TripForm from './components/TripForm';
import Expenses from './components/Expenses';
import TripItinerary from './components/TripItinerary';
import TripNotes from './components/TripNotes';
import TripLinks from './components/TripLinks';
import WebSearch from './components/WebSearch';

function App() {
	const [zoom, setZoom] = useState(() =>
		parseFloat(localStorage.getItem('zoom') ?? '1')
	);

	// Apply zoom to the document root so h-screen / vh units stay correct
	useEffect(() => {
		document.documentElement.style.zoom = String(zoom);
	}, [zoom]);

	// Ctrl + / Ctrl - / Ctrl 0  →  zoom in / out / reset
	useEffect(() => {
		const onKey = (e) => {
			if (!(e.ctrlKey || e.metaKey)) return;
			if (e.key === '=' || e.key === '+') {
				e.preventDefault();
				setZoom((z) => { const n = +Math.min(2.0, z + 0.1).toFixed(1); localStorage.setItem('zoom', n); return n; });
			} else if (e.key === '-') {
				e.preventDefault();
				setZoom((z) => { const n = +Math.max(0.5, z - 0.1).toFixed(1); localStorage.setItem('zoom', n); return n; });
			} else if (e.key === '0') {
				e.preventDefault();
				localStorage.setItem('zoom', '1');
				setZoom(1);
			}
		};
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, []);

	return (
		<ThemeProvider>
			<HashRouter>
				<div className="flex h-screen overflow-hidden bg-[var(--c-bg)]">
					<Sidebar />
					<main className="flex-1 overflow-y-auto min-w-0">
						<Routes>
							<Route path="/" element={<Home />} />
							<Route path="/trips" element={<TripList />} />
							<Route path="/trips/new" element={<TripForm />} />
							<Route path="/trips/:id" element={<TripDetails />} />
							<Route path="/trips/:id/edit" element={<TripForm />} />
							<Route path="/trips/:id/expenses" element={<Expenses />} />
							<Route path="/trips/:id/itinerary" element={<TripItinerary />} />
							<Route path="/trips/:id/notes" element={<TripNotes />} />
							<Route path="/trips/:id/links" element={<TripLinks />} />
							<Route path="/websearch" element={<WebSearch />} />
						</Routes>
					</main>
				</div>
			</HashRouter>
		</ThemeProvider>
	);
}

export default App;
