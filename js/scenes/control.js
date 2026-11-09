// Scena 3 · KONTROLA — „Tylko tyle, ile trzeba. I wiem komu.”
// 3a: Anna skanuje kod QR wypożyczalni i wybiera, ile danych pokazać (domyślnie najmniej, ile wystarczy).
//     To samo może zrobić Krystyna przy zameldowaniu w hotelu.
// 3b: historia jak w banku — u Anny wpis o wypożyczalni, u Krystyny wszystko w jednym miejscu: pomoc Anny, zablokowany atak, udostępnienia.
import { store, replace, notify, patch, addHistory, withBiometric } from '../store.js';
import { icon } from '../icons.js';
import { list, row, newBadge, sectionTitle, serviceHeader, infoBox } from '../ui.js';
import { revokeGuardian, GUARDIAN_UNTIL } from './help.js';
import { contactName, contactCase } from '../personas.js';

// Imiona bez odmiany: „Anna Nowak, Córka” na telefonie Krystyny, „Mama” na telefonie Anny
const annaFor = (state) => contactName(state, 'krystyna', 'anna');
const mamaFor = (state) => contactName(state, 'anna', 'krystyna');

// Kto prosi o dane: Anna wynajmuje auto, Krystyna melduje się w hotelu.
// Poziomy danych: samo potwierdzenie → dane podstawowe (wystarczą) → pełny dokument.
const requesters = {
  anna: {
    name: 'AutoMorze',
    iconName: 'car',
    place: 'Wynajem aut · Gdynia',
    asks: 'Cały mDowód i mPrawo jazdy',
    purpose: 'wynajem auta',
    keep: '30 dni',
    hint: 'Do wynajmu auta wystarczą <strong>dane podstawowe</strong>. Nie musisz podawać numeru PESEL ani adresu.',
    allFields: ['Imię i nazwisko', 'Prawo jazdy kat. B — ważne', 'Numer PESEL', 'Adres', 'Data urodzenia', 'Zdjęcie', 'Numer dokumentu'],
    levels: {
      confirm: {
        desc: '„Ma prawo jazdy kat. B — ważne”',
        fields: ['Prawo jazdy kat. B — ważne'],
        note: 'Wypożyczalnia może nie wydać auta bez imienia i nazwiska na umowie.',
        short: 'potwierdzenie prawa jazdy kat. B. Bez imienia, nazwiska, PESEL i adresu',
      },
      basic: {
        desc: 'Imię, nazwisko, prawo jazdy kat. B',
        fields: ['Imię i nazwisko', 'Prawo jazdy kat. B — ważne'],
        note: '',
        short: 'imię, nazwisko, prawo jazdy kat. B. Bez PESEL i adresu',
      },
      full: {
        desc: 'Wszystkie dane z mDowodu i mPrawa jazdy',
        note: 'Przekażesz też numer PESEL i adres. Do wynajmu auta nie są potrzebne.',
        short: 'cały mDowód i mPrawo jazdy, w tym PESEL i adres',
      },
    },
  },
  krystyna: {
    name: 'Hotel Przystań',
    iconName: 'building',
    place: 'Recepcja · Jastarnia',
    asks: 'Cały mDowód',
    purpose: 'zameldowanie w hotelu',
    keep: 'do końca pobytu',
    hint: 'Do zameldowania w hotelu wystarczą <strong>dane podstawowe</strong>. Nie musisz podawać numeru PESEL ani adresu.',
    allFields: ['Imię i nazwisko', 'Dowód osobisty — ważny', 'Numer PESEL', 'Adres', 'Data urodzenia', 'Zdjęcie', 'Numer dokumentu'],
    levels: {
      confirm: {
        desc: '„Ma ważny dowód osobisty”',
        fields: ['Dowód osobisty — ważny'],
        note: 'Hotel może potrzebować imienia i nazwiska, żeby znaleźć Twoją rezerwację.',
        short: 'potwierdzenie ważnego dowodu. Bez imienia, nazwiska, PESEL i adresu',
      },
      basic: {
        desc: 'Imię, nazwisko, ważny dowód',
        fields: ['Imię i nazwisko', 'Dowód osobisty — ważny'],
        note: '',
        short: 'imię, nazwisko, ważny dowód. Bez PESEL i adresu',
      },
      full: {
        desc: 'Wszystkie dane z mDowodu',
        note: 'Przekażesz też numer PESEL i adres. Do zameldowania w hotelu nie są potrzebne.',
        short: 'cały mDowód, w tym PESEL i adres',
      },
    },
  },
};

const levelTitles = { confirm: 'Samo potwierdzenie', basic: 'Dane podstawowe', full: 'Pełny dokument' };

const levelFields = (req, level) => req.levels[level].fields ?? req.allFields;

// Starsze wpisy w historii — tło, żeby historia wyglądała jak prawdziwa
const pastEntries = {
  krystyna: [
    { daysAgo: 13, actor: 'institution', who: 'Zakład Ubezpieczeń Społecznych', text: 'Sprawdził Twoje dane, bo złożyłaś wniosek' },
    { daysAgo: 37, actor: 'shared', who: 'Bank Bursztynowy', text: 'Imię, nazwisko, numer PESEL — za Twoją zgodą, przy otwarciu lokaty', consent: true },
  ],
  anna: [
    { daysAgo: 41, actor: 'shared', who: 'Operator komórkowy Fala', text: 'Cały dowód osobisty, w tym PESEL i adres — przy podpisaniu umowy', consent: true },
    { daysAgo: 64, actor: 'institution', who: 'Urząd Miasta Gdyni', text: 'Sprawdził Twoje dane przy zgłoszeniu wymiany dowodu' },
  ],
  zosia: [],
};

// ---------- Kod QR (rysowany, nie do zeskanowania) ----------

export function qrSvg(size = 140) {
  const n = 21;
  let seed = 7;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const finder = (x, y) => x < 7 && y < 7;
  const inFinder = (x, y) => finder(x, y) || finder(n - 1 - x, y) || finder(x, n - 1 - y);
  let cells = '';
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (inFinder(x, y)) continue;
      if (rand() > 0.52) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
  }
  const finderMark = (x, y) =>
    `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
  return `<svg class="qr-code" width="${size}" height="${size}" viewBox="-1 -1 ${n + 2} ${n + 2}" aria-hidden="true">
    <rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="#fff"/>
    <g fill="#111">${finderMark(0, 0)}${finderMark(n - 7, 0)}${finderMark(0, n - 7)}${cells}</g></svg>`;
}

// ---------- Historia ----------

function entryDate(entry) {
  if (entry.daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - entry.daysAgo);
    return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
  }
  return `dziś, ${new Date(entry.at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`;
}

const actorLook = {
  anna: { iconName: 'people', tint: 'green', title: (e, state) => annaFor(state) },
  self: { iconName: 'checkCircle', tint: 'blue', title: () => 'Ty' },
  blocked: { iconName: 'shieldLock', tint: 'red', title: () => 'Zablokowano' },
  institution: { iconName: 'building', tint: 'violet', title: (e) => e.who },
  shared: { iconName: 'idCheck', tint: 'amber', title: (e) => e.who },
};

function historyItem(entry, state) {
  const look = actorLook[entry.actor] ?? actorLook.self;
  const canRevoke = entry.consent && !entry.revoked;
  const links = entry.actor === 'self' ? '' : `
    <div class="history-links">
      ${canRevoke ? `<button class="link" data-action="revokeConsent" data-id="${entry.id}">${icon('undo', { size: 15 })} Cofnij zgodę</button>` : ''}
      ${entry.actor === 'blocked' ? '' : `<button class="link link-muted" data-action="report" data-id="${entry.id}">${icon('flag', { size: 15 })} Nie rozpoznajesz? Zgłoś</button>`}
    </div>`;
  return `
    <div class="history-item ${entry.revoked ? 'history-revoked' : ''}">
      <span class="row-icon tint-${look.tint}">${icon(look.iconName, { size: 18 })}</span>
      <div class="history-text">
        <p class="history-title">${look.title(entry, state)} <span class="history-date">${entryDate(entry)}</span></p>
        <p class="history-desc">${entry.text}${entry.revoked ? ' · <strong>zgoda cofnięta</strong>' : ''}</p>
        ${links}
      </div>
    </div>`;
}

const historyList = (entries, state) => `<div class="list-card history">${entries.map((e) => historyItem(e, state)).join('')}</div>`;

// Wpisy z bieżącej sesji + starsze wpisy (z id, żeby dało się cofnąć zgodę)
function entriesFor(state, persona) {
  const past = pastEntries[persona].map((e, i) => ({ id: `past-${persona}-${i}`, ...e, revoked: state.history.some((h) => h.revokes === `past-${persona}-${i}`) }));
  const current = state.history.filter((h) => h.persona === persona && !h.revokes);
  return [...current, ...past];
}

function krystynaHistory(state) {
  const entries = entriesFor(state, 'krystyna');
  const fromAnna = entries.filter((e) => e.actor === 'anna');
  const blocked = entries.filter((e) => e.actor === 'blocked');
  const rest = entries.filter((e) => e.actor !== 'anna' && e.actor !== 'blocked');
  const guardianCard =
    state.guardian === 'active'
      ? `
        ${sectionTitle('Kto Ci pomaga')}
        ${list([row({ iconName: 'people', tint: 'green', title: annaFor(state), desc: `Pomaga Ci do ${GUARDIAN_UNTIL}`, go: 'helpersScopeView' })])}
        <button class="btn btn-secondary btn-danger-text" data-action="revokeGuardian">Odwołaj pomoc: ${annaFor(state)}</button>
        <p class="footnote center">Możesz to zrobić w każdej chwili.</p>`
      : '';
  return `
    ${blocked.length ? `${sectionTitle('Zablokowane próby')}${historyList(blocked, state)}` : ''}
    ${fromAnna.length ? `${sectionTitle('Działania osób, które Ci pomagają')}${historyList(fromAnna, state)}` : ''}
    ${sectionTitle('Udostępnienia i Twoje działania')}
    ${historyList(rest, state)}
    ${guardianCard}`;
}

function myDataSpeech(state, persona) {
  const entries = persona === 'krystyna' ? entriesFor(state, 'krystyna') : entriesFor(state, 'anna');
  const first = entries.slice(0, 4).map((e) => `${(actorLook[e.actor] ?? actorLook.self).title(e, state)}: ${e.text}.`);
  return `Kto widział Twoje dane. ${first.join(' ')}`;
}

// ---------- Ekrany ----------

function fieldList(req, level, { done = false } = {}) {
  const shared = levelFields(req, level);
  const hidden = req.allFields.filter((f) => !shared.includes(f));
  return `
    <div class="field-split">
      <div><p class="ai-label">${done ? 'Przekazano' : 'Przekażesz'}</p>${shared.map((f) => `<p class="field field-on">${icon('check', { size: 16 })} ${f}</p>`).join('')}</div>
      ${hidden.length ? `<div><p class="ai-label ai-label-muted">${done ? 'Nie przekazano' : 'Nie przekażesz'}</p>${hidden.map((f) => `<p class="field field-off">${icon('close', { size: 16 })} ${f}</p>`).join('')}</div>` : ''}
    </div>`;
}

// Tryb prosty: jedna decyzja. Pokazujemy tylko to, co wystarczy; trzy poziomy są pod „Inne możliwości”.
function simpleConsent(req) {
  return `
    <div class="requester">
      <span class="service-icon tint-amber">${icon(req.iconName, { size: 26 })}</span>
      <div>
        <h2 class="requester-name">${req.name} chce sprawdzić, że to Ty</h2>
        <p class="verified">${icon('checkCircle', { size: 16 })} Zweryfikowany odbiorca</p>
      </div>
    </div>
    <p class="service-desc">Cel: ${req.purpose}. Pokażemy tylko to, co wystarczy.</p>
    ${fieldList(req, 'basic')}
    <button class="btn btn-primary" data-action="share">Pokaż tylko to</button>
    <button class="btn btn-secondary" data-home>Nie pokazuj</button>
    <button class="link center" data-action="advanced">Inne możliwości</button>`;
}

export const controlScreens = {
  qrScan: {
    kind: 'inner',
    hideReadAloud: true,
    title: 'Zeskanuj kod QR',
    speech: (state, persona) => `Skieruj aparat na kod QR. Tutaj to kod: ${requesters[persona].name}. Dotknij przycisku Zeskanuj kod.`,
    render: (state, persona) => {
      const req = requesters[persona];
      return `
        <div class="viewfinder viewfinder-qr">
          <button class="counter-card" data-action="scan" aria-label="Zeskanuj kod QR: ${req.name}">
            <span class="counter-brand">${icon(req.iconName, { size: 18 })} ${req.name}</span>
            <span class="counter-sub">${req.place}</span>
            ${qrSvg(132)}
            <span class="counter-sub">Zeskanuj w mObywatelu, żeby potwierdzić dane</span>
          </button>
          <span class="viewfinder-frame" aria-hidden="true"></span>
          <span class="scan-line" aria-hidden="true"></span>
        </div>
        <p class="footnote center">W prototypie aparat „widzi” kod ${persona === 'anna' ? 'wypożyczalni' : 'z recepcji hotelu'}. Dotknij kodu albo przycisku.</p>
        <button class="btn btn-primary" data-action="scan">${icon('qr', { size: 20 })} Zeskanuj kod</button>`;
    },
    actions: {
      scan: (el, persona) => {
        store.update((s) => {
          s.consent[persona] = 'scanned';
          s.consentLevel[persona] = 'basic';
          s.consentAdvanced[persona] = false;
          return s;
        });
        replace(persona, 'consent');
      },
    },
  },

  consent: {
    kind: 'inner',
    title: 'Potwierdź swoje dane',
    speech: (state, persona) => {
      const req = requesters[persona];
      if (state.simpleMode[persona] && !state.consentAdvanced[persona]) {
        return `${req.name} chce sprawdzić, że to Ty. Cel: ${req.purpose}. Pokażemy tylko: ${req.levels.basic.fields.join(', ')}. Nie pokażemy numeru PESEL ani adresu. Dotknij Pokaż tylko to albo Nie pokazuj.`;
      }
      return `${req.name} prosi o Twoje dane. Cel: ${req.purpose}. Wybierz, ile pokazać. ${req.hint.replace(/<[^>]+>/g, '')}`;
    },
    render: (state, persona) => {
      const req = requesters[persona];
      if (state.consent[persona] === 'none') return infoBox('Najpierw zeskanuj kod QR.');
      if (state.consent[persona] === 'shared') return infoBox(`Dane dla: ${req.name} zostały już udostępnione. Zobaczysz je w historii.`);
      if (state.simpleMode[persona] && !state.consentAdvanced[persona]) return simpleConsent(req);
      const level = state.consentLevel[persona];
      const options = Object.entries(req.levels)
        .map(
          ([id, l]) => `
          <button class="choice ${id === level ? 'choice-on' : ''}" role="radio" aria-checked="${id === level}" data-action="level" data-id="${id}">
            <span class="radio" aria-hidden="true"></span>
            <span class="row-text">
              <span class="row-title">${levelTitles[id]}${id === 'basic' ? ' <span class="enough">Wystarczy</span>' : ''}</span>
              <span class="row-desc">${l.desc}</span>
            </span>
          </button>`,
        )
        .join('');
      return `
        <div class="requester">
          <span class="service-icon tint-amber">${icon(req.iconName, { size: 26 })}</span>
          <div>
            <h2 class="requester-name">${req.name} prosi o Twoje dane</h2>
            <p class="verified">${icon('checkCircle', { size: 16 })} Zweryfikowany odbiorca</p>
          </div>
        </div>
        ${list([
          row({ title: 'O co prosi', desc: req.asks, trailing: '' }),
          row({ title: 'W jakim celu', desc: capitalize(req.purpose), trailing: '' }),
          row({ title: 'Jak długo przechowa dane', desc: capitalize(req.keep), trailing: '' }),
        ])}
        ${sectionTitle('Co chcesz pokazać?', newBadge())}
        <div class="choices" role="radiogroup" aria-label="Ile danych pokazać">${options}</div>
        ${infoBox(req.hint)}
        ${req.levels[level].note ? `<p class="ai-warning">${req.levels[level].note}</p>` : ''}
        ${fieldList(req, level)}
        <button class="btn btn-primary" data-action="share">Udostępnij: ${levelTitles[level].toLowerCase()}</button>
        <button class="btn btn-secondary" data-home>Anuluj</button>`;
    },
    actions: {
      level: (el, persona) =>
        store.update((s) => {
          s.consentLevel[persona] = el.dataset.id;
          return s;
        }),
      advanced: (el, persona) =>
        store.update((s) => {
          s.consentAdvanced[persona] = true;
          return s;
        }),
      share: (el, persona) =>
        withBiometric(persona, () => {
          const req = requesters[persona];
          const level = store.get().consentLevel[persona];
          store.update((s) => {
            s.consent[persona] = 'shared';
            return s;
          });
          addHistory({ persona, actor: 'shared', who: req.name, text: `${capitalize(req.levels[level].short)}. Cel: ${req.purpose}, przechowa ${req.keep}`, consent: true, level });
          replace(persona, 'consentDone');
        }),
    },
  },

  consentDone: {
    kind: 'inner',
    title: 'Udostępniono',
    speech: (state, persona) => {
      const req = requesters[persona];
      return `Gotowe. Do: ${req.name} trafiło tylko to, czego potrzeba: ${req.levels[state.consentLevel[persona]].short}.`;
    },
    render: (state, persona) => {
      const req = requesters[persona];
      return `
        <div class="success">
          <span class="success-icon">${icon('check', { size: 40 })}</span>
          <h2 class="service-title">Tylko to, czego potrzeba</h2>
          <p class="service-desc">Odbiorca: ${req.name}. Cel: ${req.purpose}.</p>
        </div>
        ${fieldList(req, state.consentLevel[persona], { done: true })}
        ${infoBox('Wpis jest już w Twojej historii. Możesz z niej cofnąć zgodę albo zgłosić nadużycie.')}
        <button class="btn btn-primary" data-go="myData">Zobacz w historii</button>
        <button class="btn btn-secondary" data-home>Gotowe</button>`;
    },
  },

  // Rozszerzenie istniejącej Historii aktywności (Więcej → Pozostałe), stąd taki tytuł ekranu
  myData: {
    kind: 'inner',
    title: 'Historia aktywności',
    speech: (state, persona) => myDataSpeech(state, persona),
    onEnter: (state, persona) => {
      if (persona === 'krystyna' && state.consent.anna === 'shared' && !state.historySeen) patch({ historySeen: true });
    },
    render: (state, persona) => {
      const head = serviceHeader({
        iconName: 'eye',
        tint: 'violet',
        title: 'Kto widział moje dane',
        desc: 'Logowania, udostępnienia, podpisy i działania osób, które Ci pomagają — w jednym miejscu, jak historia konta w banku.',
        badge: newBadge(),
      });
      return `${head}${persona === 'krystyna' ? krystynaHistory(state) : `${sectionTitle('Twoja historia')}${historyList(entriesFor(state, 'anna'), state)}`}`;
    },
    actions: {
      revokeConsent: (el, persona) => {
        const id = el.dataset.id;
        const state = store.get();
        const entry = entriesFor(state, persona).find((e) => e.id === id);
        if (!entry) return;
        if (id.startsWith('past-')) {
          addHistory({ persona, revokes: id });
        } else {
          store.update((s) => {
            s.history.find((h) => h.id === id).revoked = true;
            return s;
          });
        }
        notify(persona, { title: 'Zgoda cofnięta', body: `Wysłaliśmy informację do: ${entry.who}. Nie może dalej korzystać z Twoich danych na podstawie tej zgody.` });
      },
      report: (el, persona) => {
        const state = store.get();
        const entry = entriesFor(state, persona).find((e) => e.id === el.dataset.id);
        notify(persona, { title: 'Dziękujemy za zgłoszenie', body: `${reportRecipient(entry, state)} Odpowiedź dostaniesz w powiadomieniach. W prototypie nic nie wysyłamy.` });
      },
      revokeGuardian: () => revokeGuardian(),
    },
  },
};

// Kto dostaje zgłoszenie „Nie rozpoznajesz? Zgłoś” — zależnie od tego, kto widział dane
function reportRecipient(entry, state) {
  if (!entry) return 'Zgłoszenie trafi do zespołu mObywatela.';
  if (entry.actor === 'anna') {
    return `Zapytamy o to ${contactCase(state, 'krystyna', 'anna', 'acc')}. Jeśli to nie ona, odwołasz pomoc jednym przyciskiem.`;
  }
  if (entry.actor === 'institution') return `Zgłoszenie trafi do inspektora ochrony danych w: ${entry.who}.`;
  return `Zgłoszenie trafi do inspektora ochrony danych w: ${entry.who}, a jeśli to wygląda na oszustwo — także do CERT Polska.`;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
