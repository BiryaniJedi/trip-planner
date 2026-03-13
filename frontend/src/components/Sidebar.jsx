import { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { THEMES, useTheme } from '../ThemeContext';

function NavBtn({ onClick, label, active, children, accent = false }) {
	return (
		<button
			onClick={onClick}
			title={label}
			className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer ${
				accent
					? active
						? 'bg-[var(--c-p6)] text-white shadow-md shadow-[var(--c-p6)]/30'
						: 'bg-[var(--c-p1)] text-[var(--c-p6)] hover:bg-[var(--c-p2)]'
					: active
					? 'bg-[var(--c-p1)] text-[var(--c-p6)] shadow-sm'
					: 'text-[var(--c-muted)] hover:bg-[var(--c-hover)] hover:text-[var(--c-text2)]'
			}`}
		>
			{children}
		</button>
	);
}

function Divider() {
	return <div className="w-6 h-px bg-[var(--c-border)] my-0.5 self-center" />;
}

export default function Sidebar() {
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const { theme, darkMode, setTheme, toggleDark } = useTheme();
	const [showPicker, setShowPicker] = useState(false);
	const pickerRef = useRef(null);

	useEffect(() => {
		if (!showPicker) return;
		const handler = (e) => {
			if (pickerRef.current && !pickerRef.current.contains(e.target)) {
				setShowPicker(false);
			}
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [showPicker]);

	return (
		<div className="w-14 h-screen bg-[var(--c-card)] border-r border-[var(--c-border)] flex flex-col items-center py-3 gap-1 shrink-0 relative">

			{/* App icon */}
			<div className="w-9 h-9 rounded-xl bg-[var(--c-p6)] flex items-center justify-center mb-1 shrink-0">
				<svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
					<path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16z"/>
				</svg>
			</div>

			<Divider />

			{/* ── Navigation ── */}

			{/* Home */}
			<NavBtn onClick={() => navigate('/')} label="Home" active={pathname === '/'}>
				<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
					<polyline points="9,22 9,12 15,12 15,22" />
				</svg>
			</NavBtn>

			{/* My Trips */}
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

			{/* AI Trip Planner */}
			<NavBtn onClick={() => navigate('/websearch')} label="AI Trip Planner" active={pathname === '/websearch'}>
				<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
					<path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
					<path d="M19 15l1.09 3.26L23 19l-2.91.74L19 23l-1.09-3.26L15 19l2.91-.74L19 15z" opacity="0.6" />
					<path d="M5 15l1.09 3.26L9 19l-2.91.74L5 23l-1.09-3.26L1 19l2.91-.74L5 15z" opacity="0.4" />
				</svg>
			</NavBtn>

			{/* Spacer */}
			<div className="flex-1" />

			{/* New Trip — primary action, accent styled */}
			<NavBtn
				onClick={() => navigate('/trips/new')}
				label="New Trip"
				active={pathname === '/trips/new'}
				accent
			>
				<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
					<line x1="12" y1="5" x2="12" y2="19" />
					<line x1="5" y1="12" x2="19" y2="12" />
				</svg>
			</NavBtn>

			<Divider />

			{/* Dark mode toggle */}
			<NavBtn onClick={toggleDark} label={darkMode ? 'Light mode' : 'Dark mode'} active={false}>
				{darkMode ? (
					<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<circle cx="12" cy="12" r="5" />
						<line x1="12" y1="1" x2="12" y2="3" />
						<line x1="12" y1="21" x2="12" y2="23" />
						<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
						<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
						<line x1="1" y1="12" x2="3" y2="12" />
						<line x1="21" y1="12" x2="23" y2="12" />
						<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
						<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
					</svg>
				) : (
					<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
					</svg>
				)}
			</NavBtn>

			{/* Theme picker */}
			<div ref={pickerRef} className="relative">
				<NavBtn onClick={() => setShowPicker((v) => !v)} label="Change theme" active={showPicker}>
					<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z" />
						<circle cx="6.5" cy="11.5" r="1.5" fill="currentColor" stroke="none" />
						<circle cx="9.5" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
						<circle cx="14.5" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
					</svg>
				</NavBtn>

				{showPicker && (
					<div className="absolute left-12 bottom-0 bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl shadow-xl p-3 flex flex-col gap-1 w-36 z-50">
						<p className="text-xs font-semibold text-[var(--c-muted)] uppercase tracking-wide px-1 mb-1">
							Theme
						</p>
						{Object.entries(THEMES).map(([key, t]) => (
							<button
								key={key}
								onClick={() => { setTheme(key); setShowPicker(false); }}
								className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors cursor-pointer text-left ${
									theme === key ? 'bg-[var(--c-hover)]' : 'hover:bg-[var(--c-hover)]'
								}`}
							>
								<span
									className="w-4 h-4 rounded-full shrink-0"
									style={{
										backgroundColor: t.preview,
										outline: theme === key ? `2px solid ${t.preview}` : '2px solid transparent',
										outlineOffset: '2px',
									}}
								/>
								<span className="text-sm text-[var(--c-text)]">{t.name}</span>
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
