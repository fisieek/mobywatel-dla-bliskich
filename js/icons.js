// Ikony: oficjalne z systemu projektowego mObywatela (official-icons.js), a tam, gdzie takiej nie ma
// (głównie nasze nowe funkcje), własne obrysowe w tym samym stylu. Godła i logo dokumentów nie używamy.
import { officialIcons } from './official-icons.js';

// Własne: tylko to, czego nie ma w oficjalnym zestawie
const ownPaths = {
  call: '<path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 005 5l1.5-2 4 1.5v3a2 2 0 01-2 2A16 16 0 014.5 5.5a2 2 0 012-2z"/>',
  phoneQuestion: '<path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 005 5l1.5-2 4 1.5v3a2 2 0 01-2 2A16 16 0 014.5 5.5a2 2 0 012-2z"/><path d="M15 4.5a2.5 2.5 0 114 2c-.8.5-1.5 1-1.5 2"/><circle cx="17.5" cy="11.2" r=".4" fill="currentColor"/>',
  speaker: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 010 6"/><path d="M18 6.5a7.5 7.5 0 010 11"/>',
  pill: '<rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="M9.5 9.5l5 5"/>',
  textSize: '<path d="M4 18L8.5 6 13 18M5.6 14h5.8"/><path d="M14.5 18l3-8 3 8M15.4 15.6h4.2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6L18 18M6 18l1.4-1.4M16.6 7.4L18 6"/>',
  mic: '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M6 11.5a6 6 0 0012 0M12 17.5v3"/>',
  keypad: '<circle cx="7" cy="6" r="1.3"/><circle cx="12" cy="6" r="1.3"/><circle cx="17" cy="6" r="1.3"/><circle cx="7" cy="11" r="1.3"/><circle cx="12" cy="11" r="1.3"/><circle cx="17" cy="11" r="1.3"/><circle cx="7" cy="16" r="1.3"/><circle cx="12" cy="16" r="1.3"/><circle cx="17" cy="16" r="1.3"/><circle cx="12" cy="20.5" r="1.3"/>',
  flag: '<path d="M5.5 21V4.5M5.5 5h11l-2 4 2 4h-11"/>',
  stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="2.5"/>',
};

// Kolorowe ikony usług to osobne pliki, bo mają gradienty (assets/ikony)
export const brandIcon = (name, size = 28) => `<img class="brand-icon" src="assets/ikony/${name}.svg" width="${size}" height="${size}" alt="">`;

// filled — wersja wypełniona, jak aktywna zakładka w dolnym pasku
export function icon(name, { size = 24, label = '', filled = false } = {}) {
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  const official = officialIcons[filled ? `${name}-fill` : name] ?? officialIcons[name];
  if (official) return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" ${a11y}>${official}</svg>`;
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" ${a11y}>${ownPaths[name] ?? ''}</svg>`;
}
