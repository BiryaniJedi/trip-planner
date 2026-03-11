import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GetWebSearchTrip } from '../../wailsjs/go/main/App';
import { TYPE_LABELS, toTitleCase, formatDate } from '../utils';

export default function WebSearch() {
	// TODO: state for trips array and a loading boolean
	const [webSearch, setWebSearch] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const navigate = useNavigate();

	const loadWebSearch = async () => {
		setWebSearch(null);
		setLoading(true);
		await GetWebSearchTrip()
			.then((data) => {
				const result = data ?? [];
				setWebSearch(result);
				setError('');
			})
			.catch((err) => {
				setError(err);
				setWebSearch(null);
			})
			.finally(() => setLoading(false));
	};

	// useEffect(() => {
	// 	loadTrips();
	// }, []);

	if (error.length !== 0) {
		return (
			<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
				<p className="text-red-600 font-medium">Error: {error}</p>
				<button
					onClick={() => navigate('/')}
					className="text-slate-500 hover:text-slate-700 text-sm underline cursor-pointer"
				>
					Back to Home
				</button>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-slate-50 flex items-center justify-center">
				<p className="text-slate-400 text-lg">Loading...</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50">
			<div className="max-w-2xl mx-auto px-6 py-10">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<div>
						<button
							onClick={() => navigate('/')}
							className="text-slate-400 hover:text-slate-600 text-sm mb-1 flex items-center gap-1 cursor-pointer"
						>
							← Home
						</button>
						<button
							onClick={() => loadWebSearch()}
							className="text-slate-400 hover:text-slate-600 text-sm mb-1 flex items-center gap-1 cursor-pointer"
						>
							Generate Web Search
						</button>
						<h1 className="text-3xl font-bold text-slate-800">My Trips</h1>
					</div>
				</div>

				{/* Empty state */}
				{!webSearch ? (
					<div className="text-center py-20 text-slate-400">
						<p className="text-5xl mb-4">🗺️</p>
						<p className="text-lg font-medium text-slate-500">Web search not loaded.</p>
						<p className="text-sm mt-1">Hit "Generate Web Search" to generate a new web search.</p>
					</div>
				) : (
					<div>
						<h2 className="text-lg font-semibold text-slate-800 truncate">
							{toTitleCase('RawText:')}
						</h2>
						<p className="text-slate-500 text-sm mt-0.5">{webSearch.RawText}</p>
						<h2 className="text-lg font-semibold text-slate-800 truncate">
							{toTitleCase('Sources:')}
						</h2>
						{webSearch.Sources.length === 0 ? (
							<div className="text-center py-20 text-slate-400">
								<p className="text-5xl mb-4">🗺️</p>
								<p className="text-lg font-medium text-slate-500">No sources.</p>
							</div>
						) : (
							<div>
								{webSearch.Sources.map((source) => (
									<div
										key={source}
										className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between gap-4"
									>
										<div>
											<p>{source}</p>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
