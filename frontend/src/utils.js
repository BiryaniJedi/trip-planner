// formatDate(dateStr)
// Takes a "YYYY-MM-DD" string and returns a human-readable date like "Jan 2, 2026".
// Return "TBD" if dateStr is empty.
// Hint: new Date(dateStr + 'T00:00:00').toLocaleDateString(...)
//

export function formatDate(dateStr) {
	const date = new Date(dateStr + 'T00:00:00');
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
}

// toTitleCase(str)
// Take a string and returns title case
export function toTitleCase(str) {
	return str
		.toLowerCase()
		.split(' ')
		.map(function (word) {
			return word.charAt(0).toUpperCase() + word.slice(1);
		})
		.join(' ');
}
// tripDuration(start, end)
// Takes two "YYYY-MM-DD" strings and returns e.g. "5 days" or "1 day".
// Return "" if either is missing.
export function tripDuration(start, end) {
	// TODO
}

// googleFlightsURL(destination, date)
// Returns a Google search URL for flights to the destination.
// date is optional ("YYYY-MM-DD") — include it in the query if provided.
// Use encodeURIComponent for the query string.
export function googleFlightsURL(destination, date) {
	// TODO
}

// googleHotelsURL(destination)
// Returns a Google Hotels URL for the destination.
export function googleHotelsURL(destination) {
	// TODO
}

// bookingURL(destination)
// Returns a Booking.com search URL for the destination.
export function bookingURL(destination) {
	// TODO
}

export const CATEGORY_ICONS = {
	flight: '✈️',
	hotel: '🏨',
	car: '🚗',
	festival: '🎵',
	food: '🍽️',
	activity: '🎯',
	other: '📦',
};

export const TYPE_LABELS = {
	travel: '✈️ Travel',
	festival: '🎵 Festival',
	roadtrip: '🚗 Road Trip',
	other: '📍 Other',
};
