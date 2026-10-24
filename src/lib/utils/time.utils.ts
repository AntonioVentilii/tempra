export const formatClock = (seconds: number): string => {
	const s = Math.max(0, Math.floor(seconds));

	return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export const formatDuration = (seconds: number): string =>
	seconds >= 120 && seconds % 60 === 0 ? `${seconds / 60} min` : `${seconds} s`;

export const formatWhen = (iso: string, locale: string): string => {
	const d = new Date(iso);

	return `${d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
};
