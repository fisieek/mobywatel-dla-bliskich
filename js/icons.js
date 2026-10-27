// Własne ikony obrysowe w stylu ikon mObywatela (cienki obrys, zaokrąglone końce).
// Plików ikon, godła ani logo z aplikacji nie kopiujemy.

const paths = {
  // dolny pasek
  cards: '<rect x="4" y="5" width="16" height="14" rx="3"/><path d="M4 9.5h16"/>',
  folder: '<path d="M3.5 7.5a2 2 0 012-2h4l2 2h7a2 2 0 012 2v7.5a2 2 0 01-2 2h-13a2 2 0 01-2-2z"/>',
  qr: '<path d="M4 8V5.5A1.5 1.5 0 015.5 4H8M16 4h2.5A1.5 1.5 0 0120 5.5V8M20 16v2.5a1.5 1.5 0 01-1.5 1.5H16M8 20H5.5A1.5 1.5 0 014 18.5V16"/><rect x="8.5" y="8.5" width="7" height="7" rx="1"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
  grid: '<circle cx="7.5" cy="7.5" r="3"/><circle cx="16.5" cy="7.5" r="3"/><circle cx="7.5" cy="16.5" r="3"/><circle cx="16.5" cy="16.5" r="3"/>',
  // nagłówek
  assistant: '<rect x="4.5" y="7" width="15" height="11" rx="4"/><path d="M12 7V4.5"/><circle cx="12" cy="4" r=".8" fill="currentColor"/><circle cx="9.5" cy="12.5" r="1" fill="currentColor"/><circle cx="14.5" cy="12.5" r="1" fill="currentColor"/><path d="M2.5 11.5v3M21.5 11.5v3"/>',
  envelope: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 6.5l8 6 8-6"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0112 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 004 0"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.5a2.5 2.5 0 114 2c-.9.6-1.6 1.1-1.6 2.2"/><circle cx="12" cy="16.8" r=".6" fill="currentColor"/>',
  chevronLeft: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
  chevronRight: '<path d="M9.5 5.5L16 12l-6.5 6.5"/>',
  // treść
  letter: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3.5 6l8.5 7 8.5-7"/>',
  phoneQuestion:
    '<path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 005 5l1.5-2 4 1.5v3a2 2 0 01-2 2A16 16 0 014.5 5.5a2 2 0 012-2z"/><path d="M15 4.5a2.5 2.5 0 114 2c-.8.5-1.5 1-1.5 2"/><circle cx="17.5" cy="11.2" r=".4" fill="currentColor"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  call: '<path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 005 5l1.5-2 4 1.5v3a2 2 0 01-2 2A16 16 0 014.5 5.5a2 2 0 012-2z"/>',
  speaker: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 010 6"/><path d="M18 6.5a7.5 7.5 0 010 11"/>',
  people: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0112 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2a5 5 0 015 5"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6z"/>',
  shieldLock: '<path d="M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6z"/><rect x="9" y="11" width="6" height="4.5" rx="1"/><path d="M10.2 11V9.8a1.8 1.8 0 013.6 0V11"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.5 3.5 5.5 3.5 8.5s-1 6-3.5 8.5c-2.5-2.5-3.5-5.5-3.5-8.5s1-6 3.5-8.5z"/>',
  history: '<path d="M4 12a8 8 0 102.3-5.6"/><path d="M4 4.5v3.5h3.5"/><path d="M12 8v4.5l3 2"/>',
  pill: '<rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="M9.5 9.5l5 5"/>',
  car: '<path d="M5 16.5V12l1.8-4.2A1.5 1.5 0 018.2 7h7.6a1.5 1.5 0 011.4.8L19 12v4.5"/><path d="M4 12.5h16v4H4z"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/>',
  signature: '<path d="M4 17c2-4 4-9 6-9s-1 7 1 7 2-3 3.5-3 1 2 2.5 2h3"/><path d="M4 20.5h16"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4L18 18M6 18l1.6-1.6M16.4 7.6L18 6"/>',
  textSize: '<path d="M4 18L8.5 6 13 18M5.6 14h5.8"/><path d="M14.5 18l3-8 3 8M15.4 15.6h4.2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.8 2.8L16.2 9.5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r=".5" fill="currentColor"/>',
  idCheck: '<rect x="3.5" y="6" width="17" height="12" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 15.5a3 3 0 016 0M14 10h4M14 13h3"/>',
  ban: '<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>',
  fingerprint:
    '<path d="M6.2 6.6A7.5 7.5 0 0119.5 11v1.5M4.5 15v-4a7.4 7.4 0 01.6-2.9"/><path d="M8.5 19.5A11 11 0 009.5 14v-3a2.5 2.5 0 015 0v1.5"/><path d="M12 11v3a14 14 0 01-1.6 6.5M14.5 15.5a17 17 0 01-.9 4.5M17 11a5 5 0 00-9.4-2.4M7 11v3a7 7 0 01-.8 3.3M19.3 16a20 20 0 01-.5 2.5"/>',
  dots: '<circle cx="6" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="18" cy="12" r="1.2" fill="currentColor"/>',
};

export function icon(name, { size = 24, label = '', filled = false } = {}) {
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  const fill = filled ? 'currentColor' : 'none';
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor"
    stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" ${a11y}>${paths[name] ?? ''}</svg>`;
}
