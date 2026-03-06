import { createContext, useContext, useEffect, useState } from 'react';

export const THEMES = {
	indigo: {
		name: 'Indigo',
		preview: '#4f46e5',
		vars:     { '--c-p1': '#e0e7ff', '--c-p2': '#c7d2fe', '--c-p3': '#a5b4fc', '--c-p4': '#818cf8', '--c-p6': '#4f46e5', '--c-p7': '#4338ca', '--c-p8': '#3730a3' },
		darkVars: { '--c-p1': '#1e1b4b', '--c-p2': '#312e81' },
	},
	emerald: {
		name: 'Emerald',
		preview: '#059669',
		vars:     { '--c-p1': '#d1fae5', '--c-p2': '#a7f3d0', '--c-p3': '#6ee7b7', '--c-p4': '#34d399', '--c-p6': '#059669', '--c-p7': '#047857', '--c-p8': '#065f46' },
		darkVars: { '--c-p1': '#022c22', '--c-p2': '#064e3b' },
	},
	rose: {
		name: 'Rose',
		preview: '#e11d48',
		vars:     { '--c-p1': '#ffe4e6', '--c-p2': '#fecdd3', '--c-p3': '#fda4af', '--c-p4': '#fb7185', '--c-p6': '#e11d48', '--c-p7': '#be123c', '--c-p8': '#9f1239' },
		darkVars: { '--c-p1': '#4c0519', '--c-p2': '#881337' },
	},
	amber: {
		name: 'Amber',
		preview: '#d97706',
		vars:     { '--c-p1': '#fef3c7', '--c-p2': '#fde68a', '--c-p3': '#fcd34d', '--c-p4': '#fbbf24', '--c-p6': '#d97706', '--c-p7': '#b45309', '--c-p8': '#92400e' },
		darkVars: { '--c-p1': '#451a03', '--c-p2': '#78350f' },
	},
	violet: {
		name: 'Violet',
		preview: '#7c3aed',
		vars:     { '--c-p1': '#ede9fe', '--c-p2': '#ddd6fe', '--c-p3': '#c4b5fd', '--c-p4': '#a78bfa', '--c-p6': '#7c3aed', '--c-p7': '#6d28d9', '--c-p8': '#5b21b6' },
		darkVars: { '--c-p1': '#2e1065', '--c-p2': '#3b0764' },
	},
};

function applyVars(vars) {
	const root = document.documentElement;
	Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

const ThemeContext = createContext({ theme: 'indigo', darkMode: false, setTheme: () => {}, toggleDark: () => {} });

export function ThemeProvider({ children }) {
	const [theme, setThemeState]   = useState(() => localStorage.getItem('theme')    || 'indigo');
	const [darkMode, setDarkState] = useState(() => localStorage.getItem('darkMode') === 'true');

	useEffect(() => {
		const t = THEMES[theme] ?? THEMES.indigo;
		applyVars(t.vars);
		if (darkMode) applyVars(t.darkVars);
		document.documentElement.classList.toggle('dark', darkMode);
	}, [theme, darkMode]);

	const setTheme = (key) => { localStorage.setItem('theme', key); setThemeState(key); };
	const toggleDark = () => {
		const next = !darkMode;
		localStorage.setItem('darkMode', String(next));
		setDarkState(next);
	};

	return (
		<ThemeContext.Provider value={{ theme, darkMode, setTheme, toggleDark }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	return useContext(ThemeContext);
}
