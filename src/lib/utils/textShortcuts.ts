const MONTHS = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
];

function ordinalSuffix(day: number): string {
	const j = day % 10;
	const k = day % 100;
	if (j === 1 && k !== 11) return 'st';
	if (j === 2 && k !== 12) return 'nd';
	if (j === 3 && k !== 13) return 'rd';
	return 'th';
}

function formatDate(d: Date): string {
	const day = d.getDate();
	return `${MONTHS[d.getMonth()]} ${day}${ordinalSuffix(day)}, ${d.getFullYear()}`;
}

export function applyTextShortcuts(text: string): string {
	if (!text) return text;
	return text.replace(/\[date\]/gi, formatDate(new Date()));
}
