import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import TripList from './components/TripList';
// import TripDetail from './components/TripDetail';
import TripForm from './components/TripForm';

function App() {
	// TODO: render a HashRouter containing Routes with these four paths:
	//   /               → TripList
	//   /trips/new      → TripForm
	//   /trips/:id      → TripDetail
	//   /trips/:id/edit → TripForm

	return (
		<HashRouter>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/trips" element={<TripList />} />
				<Route path="/trips/new" element={<TripForm />} />
				{/* <Route path="/trips/:id" element={<TripDetail />} /> */}
				{/* <Route path="/trips/:id/edit" element={<TripForm />} /> */}
			</Routes>
		</HashRouter>
	);
}

export default App;
