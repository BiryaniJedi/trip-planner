export function formatDate(dateStr) {
	if (!dateStr) return 'TBD';
	const date = new Date(dateStr + 'T00:00:00');
	return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function toTitleCase(str) {
	return str
		.toLowerCase()
		.split(' ')
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(' ');
}

export function tripDuration(start, end) {
	if (!start || !end) return '';
	const diff = new Date(end + 'T00:00:00') - new Date(start + 'T00:00:00');
	const days = Math.round(diff / 86400000);
	if (days <= 0) return '';
	return days === 1 ? '1 day' : `${days} days`;
}

// Amount is stored as integer cents (e.g. $45.99 → 4599).
export function formatCents(cents, currency) {
	try {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency,
			minimumFractionDigits: 2,
		}).format(cents / 100);
	} catch {
		return `${currency} ${(cents / 100).toFixed(2)}`;
	}
}

// Parse a decimal string like "45.99" into integer cents (4599).
export function parseCents(str) {
	const n = parseFloat(str);
	if (isNaN(n) || n < 0) return 0;
	return Math.round(n * 100);
}

export function googleFlightsURL(destination, date) {
	const q = date ? `flights to ${destination} ${date}` : `flights to ${destination}`;
	return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

export function googleHotelsURL(destination) {
	return `https://www.google.com/travel/hotels/s/${encodeURIComponent(destination)}`;
}

export function bookingURL(destination) {
	return `https://www.booking.com/search.html?ss=${encodeURIComponent(destination)}`;
}

export const CURRENCIES = ['USD', 'EUR', 'GBP'];

export const CATEGORY_ICONS = {
	flight: '✈️',
	hotel: '🏨',
	car: '🚗',
	festival: '🎵',
	food: '🍽️',
	activity: '🎯',
	other: '📦',
};

export const CATEGORY_LABELS = {
	flight: 'Flight',
	hotel: 'Hotel',
	car: 'Car',
	festival: 'Festival',
	food: 'Food',
	activity: 'Activity',
	other: 'Other',
};

export const TYPE_LABELS = {
	travel: '✈️ Travel',
	festival: '🎵 Festival',
	roadtrip: '🚗 Road Trip',
	other: '📍 Other',
};
