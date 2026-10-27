// Klocki interfejsu odwzorowane z mObywatela: karty dokumentów, listy w białych kartach,
// nagłówek usługi, ramka informacyjna. Etykieta „Nowość” oznacza to, co dokładamy do aplikacji.
import { icon } from './icons.js';

export const newBadge = (text = 'Nowość') => `<span class="new-badge">${text}</span>`;

export const documents = {
  mdowod: { name: 'mDowód', bg: 'var(--card-mdowod)', mark: 'idCheck' },
  emeryt: { name: 'Legitymacja emeryta-rencisty', bg: 'var(--card-emeryt)', mark: 'idCheck' },
  prawoJazdy: { name: 'mPrawo jazdy', bg: 'var(--card-prawo-jazdy)', mark: 'car' },
  pojazdy: { name: 'Moje pojazdy', bg: 'var(--card-pojazdy)', mark: 'car' },
};

export function docStack(ids, owner) {
  return `
    <div class="doc-stack" style="--count:${ids.length}">
      ${ids
        .map(
          (id, i) => `
        <button class="doc-card" style="background:${documents[id].bg}; --i:${i}" data-go="doc-${id}"
          aria-label="${documents[id].name}${owner ? `, ${owner}` : ''}">
          <span class="doc-name">${documents[id].name}</span>
          <span class="doc-mark">${icon(documents[id].mark, { size: 16 })}</span>
        </button>`,
        )
        .join('')}
    </div>`;
}

// Wiersz listy: { iconName, tint, title, desc, go, action, badge, trailing }
export function row({ iconName, tint = 'blue', title, desc = '', go, action, id, badge = '', trailing }) {
  const target = go ? `data-go="${go}"` : action ? `data-action="${action}"${id ? ` data-id="${id}"` : ''}` : '';
  return `
    <button class="row" ${target}>
      ${iconName ? `<span class="row-icon tint-${tint}">${icon(iconName, { size: 20 })}</span>` : ''}
      <span class="row-text">
        <span class="row-title">${title}${badge}</span>
        ${desc ? `<span class="row-desc">${desc}</span>` : ''}
      </span>
      ${trailing ?? icon('chevronRight', { size: 18 })}
    </button>`;
}

export const list = (rows) => `<div class="list-card">${rows.join('')}</div>`;

export const sectionTitle = (text, badge = '') => `<h2 class="section-title">${text}${badge}</h2>`;

export function serviceHeader({ iconName, tint = 'violet', title, desc, badge = '' }) {
  return `
    <div class="service-head">
      <span class="service-icon tint-${tint}">${icon(iconName, { size: 28 })}</span>
      <h2 class="service-title">${title}</h2>
      ${badge}
      ${desc ? `<p class="service-desc">${desc}</p>` : ''}
    </div>`;
}

export function infoBox(text, link = '') {
  return `
    <div class="info-box">
      ${icon('info', { size: 20 })}
      <div><p>${text}</p>${link}</div>
    </div>`;
}

export function comingSoon(sceneName) {
  return infoBox(`Ten ekran pokażemy w scenie <strong>${sceneName}</strong>. Prototyp jest w budowie.`);
}
