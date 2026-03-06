import { useNavigate, useLocation } from 'react-router-dom';

function NavBtn({ onClick, label, active, children }) {
	return (
		<button
			onClick={onClick}
			title={label}
			className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
				active
					? 'bg-indigo-100 text-indigo-600'
					: 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
			}`}
		>
			{children}
		</button>
	);
}

export default function Sidebar() {
	const navigate = useNavigate();
	const { pathname } = useLocation();

	return (
		<div className="w-14 h-screen bg-white border-r border-slate-200 flex flex-col items-center py-3 gap-1 shrink-0">
			{/* Home / logo placeholder */}
			<NavBtn onClick={() => navigate('/')} label="Home" active={pathname === '/'}>
				<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
					<polyline points="9,22 9,12 15,12 15,22" />
				</svg>
			</NavBtn>

			<div className="flex-1" />

			{/* New trip */}
			<NavBtn onClick={() => navigate('/trips/new')} label="New Trip" active={pathname === '/trips/new'}>
				<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<circle cx="12" cy="12" r="10" />
					<line x1="12" y1="8" x2="12" y2="16" />
					<line x1="8" y1="12" x2="16" y2="12" />
				</svg>
			</NavBtn>

			{/* View trips */}
			<NavBtn onClick={() => navigate('/trips')} label="My Trips" active={pathname === '/trips'}>
				<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<line x1="8" y1="6" x2="21" y2="6" />
					<line x1="8" y1="12" x2="21" y2="12" />
					<line x1="8" y1="18" x2="21" y2="18" />
					<line x1="3" y1="6" x2="3.01" y2="6" />
					<line x1="3" y1="12" x2="3.01" y2="12" />
					<line x1="3" y1="18" x2="3.01" y2="18" />
				</svg>
			</NavBtn>
		</div>
	);
}
