// Daty w prototypie liczymy od dnia pokazu, żeby jury nigdy nie zobaczyło terminu, który już minął.

const DAY_MS = 24 * 60 * 60 * 1000;

export const daysFromToday = (days) => new Date(Date.now() + days * DAY_MS);

export function monthsFromToday(months) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date;
}

// 20.11.2026
export const shortDate = (date) => date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });

// 8 grudnia 2026
export const longDate = (date) => date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });

// 10:12
export const clock = (date) => new Date(date).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
