// Scena 3 · KONTROLA — „Tylko tyle, ile trzeba. I wiem komu.”
// 3a: Anna skanuje kod QR wypożyczalni i wybiera, ile danych pokazać (domyślnie najmniej, ile wystarczy).
// 3b: historia jak w banku — u Anny wpis o wypożyczalni, u Krystyny wszystko w jednym miejscu: pomoc Anny, zablokowany atak, udostępnienia.
import { store, replace, notify, patch, addHistory, withBiometric } from '../store.js';
import { icon } from '../icons.js';
import { list, row, newBadge, sectionTitle, serviceHeader, infoBox } from '../ui.js';
import { revokeGuardian, GUARDIAN_UNTIL } from './help.js';

const RENTAL = 'AutoMorze';

const allFields = ['Imię i nazwisko', 'Prawo jazdy kat. B — ważne', 'Numer PESEL', 'Adres', 'Data urodzenia', 'Zdjęcie', 'Numer dokumentu'];

const levels = {
  confirm: {
    title: 'Samo potwierdzenie',
    desc: '„Ma prawo jazdy kat. B — ważne”',
    fields: ['Prawo jazdy kat. B — ważne'],
    note: `${RENTAL} może nie wydać auta bez imienia i nazwiska na umowie.`,
    short: 'potwierdzenie prawa jazdy kat. B. Bez imienia, nazwiska, PESEL i adresu',
  },
  basic: {
    title: 'Dane podstawowe',
    desc: 'Imię, nazwisko, prawo jazdy kat. B',
    fields: ['Imię i nazwisko', 'Prawo jazdy kat. B — ważne'],
    note: '',
    short: 'imię, nazwisko, prawo jazdy kat. B. Bez PESEL i adresu',
  },
  full: {
    title: 'Pełny dokument',
    desc: 'Wszystkie dane z mDowodu i mPrawa jazdy',
    fields: allFields,
    note: 'Przekażesz też numer PESEL i adres. Do wynajmu auta nie są potrzebne.',
    short: 'cały mDowód i mPrawo jazdy, w tym PESEL i adres',
  },
};

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
};

// ---------- Kod QR (rysowany, nie do zeskanowania) ----------

function qrSvg(size = 140) {
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
  anna: { iconName: 'people', tint: 'green', title: () => 'Anna (Twoja opiekunka)' },
  self: { iconName: 'checkCircle', tint: 'blue', title: () => 'Ty' },
  blocked: { iconName: 'shieldLock', tint: 'red', title: () => 'Zablokowano' },
  institution: { iconName: 'building', tint: 'violet', title: (e) => e.who },
  shared: { iconName: 'idCheck', tint: 'amber', title: (e) => e.who },
};

function historyItem(entry) {
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
        <p class="history-title">${look.title(entry)} <span class="history-date">${entryDate(entry)}</span></p>
        <p class="history-desc">${entry.text}${entry.revoked ? ' · <strong>zgoda cofnięta</strong>' : ''}</p>
        ${links}
      </div>
    </div>`;
}

const historyList = (entries) => `<div class="list-card history">${entries.map(historyItem).join('')}</div>`;

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
        ${list([row({ iconName: 'people', tint: 'green', title: 'Anna Nowak (córka)', desc: `Pomaga Ci do ${GUARDIAN_UNTIL}`, go: 'helpersScopeView' })])}
        <button class="btn btn-secondary btn-danger-text" data-action="revokeGuardian">Odwołaj pomoc Anny</button>
        <p class="footnote center">Możesz to zrobić w każdej chwili.</p>`
      : '';
  return `
    ${fromAnna.length ? `${sectionTitle('Co zrobiła Anna')}${historyList(fromAnna)}` : ''}
    ${blocked.length ? `${sectionTitle('Zablokowane próby')}${historyList(blocked)}` : ''}
    ${sectionTitle('Udostępnienia i Twoje działania')}
    ${historyList(rest)}
    ${guardianCard}`;
}

function myDataSpeech(state, persona) {
  const entries = persona === 'krystyna' ? entriesFor(state, 'krystyna') : entriesFor(state, 'anna');
  const first = entries.slice(0, 4).map((e) => `${(actorLook[e.actor] ?? actorLook.self).title(e)}: ${e.text}.`);
  return `Kto widział Twoje dane. ${first.join(' ')}`;
}

// ---------- Ekrany ----------

function fieldList(level) {
  const shared = levels[level].fields;
  const hidden = allFields.filter((f) => !shared.includes(f));
  return `
    <div class="field-split">
      <div><p class="ai-label">Przekażesz</p>${shared.map((f) => `<p class="field field-on">${icon('check', { size: 16 })} ${f}</p>`).join('')}</div>
      ${hidden.length ? `<div><p class="ai-label ai-label-muted">Nie przekażesz</p>${hidden.map((f) => `<p class="field field-off">${icon('close', { size: 16 })} ${f}</p>`).join('')}</div>` : ''}
    </div>`;
}

export const controlScreens = {
  qrScan: {
    kind: 'inner',
    hideReadAloud: true,
    title: 'Zeskanuj kod QR',
    render: (state, persona) => {
      if (persona !== 'anna') {
        return `
          <div class="viewfinder viewfinder-empty"><span class="viewfinder-frame" aria-hidden="true"></span><p>Skieruj aparat na kod QR</p></div>
          ${infoBox('W scenie Kontrola kod QR wypożyczalni skanuje Anna, na swoim telefonie.')}`;
      }
      if (state.actingAs !== 'ja') {
        return `
          ${infoBox('Auto wynajmujesz dla siebie. Wróć do siebie, żeby pokazać swoje dane.')}
          <button class="btn btn-primary" data-action-global="actAsMe">Działaj jako Ja</button>`;
      }
      return `
        <div class="viewfinder viewfinder-qr">
          <div class="counter-card">
            <p class="counter-brand">${icon('car', { size: 18 })} ${RENTAL}</p>
            <p class="counter-sub">Wynajem aut · Gdynia</p>
            <button class="qr-target" data-action="scan" aria-label="Zeskanuj kod QR wypożyczalni ${RENTAL}">${qrSvg(132)}</button>
            <p class="counter-sub">Zeskanuj w mObywatelu, żeby potwierdzić dane</p>
          </div>
          <span class="viewfinder-frame" aria-hidden="true"></span>
        </div>
        <p class="footnote center">Dotknij kodu, żeby go zeskanować.</p>`;
    },
    actions: {
      scan: (el, persona) => {
        patch({ consent: 'scanned', consentLevel: 'basic' });
        replace(persona, 'consent');
      },
    },
  },

  consent: {
    kind: 'inner',
    title: 'Potwierdź swoje dane',
    render: (state) => {
      if (state.consent === 'none') return infoBox('Najpierw zeskanuj kod QR wypożyczalni.');
      if (state.consent === 'shared') return infoBox(`Dane dla ${RENTAL} zostały już udostępnione. Zobaczysz je w historii.`);
      const level = state.consentLevel;
      const options = Object.entries(levels)
        .map(
          ([id, l]) => `
          <button class="choice ${id === level ? 'choice-on' : ''}" role="radio" aria-checked="${id === level}" data-action="level" data-id="${id}">
            <span class="radio" aria-hidden="true"></span>
            <span class="row-text">
              <span class="row-title">${l.title}${id === 'basic' ? ' <span class="enough">Wystarczy</span>' : ''}</span>
              <span class="row-desc">${l.desc}</span>
            </span>
          </button>`,
        )
        .join('');
      return `
        <div class="requester">
          <span class="service-icon tint-amber">${icon('car', { size: 26 })}</span>
          <div>
            <h2 class="requester-name">${RENTAL} prosi o Twoje dane</h2>
            <p class="verified">${icon('checkCircle', { size: 16 })} Zweryfikowany odbiorca</p>
          </div>
        </div>
        ${list([
          row({ title: 'O co prosi', desc: 'Cały mDowód i mPrawo jazdy', trailing: '' }),
          row({ title: 'W jakim celu', desc: 'Wynajem auta', trailing: '' }),
          row({ title: 'Jak długo przechowa dane', desc: '30 dni', trailing: '' }),
        ])}
        ${sectionTitle('Co chcesz pokazać?', newBadge())}
        <div class="choices" role="radiogroup" aria-label="Ile danych pokazać">${options}</div>
        ${infoBox('Do wynajmu auta wystarczą <strong>dane podstawowe</strong>. Nie musisz podawać numeru PESEL ani adresu.')}
        ${levels[level].note ? `<p class="ai-warning">${levels[level].note}</p>` : ''}
        ${fieldList(level)}
        <button class="btn btn-primary" data-action="share">Udostępnij: ${levels[level].title.toLowerCase()}</button>
        <button class="btn btn-secondary" data-home>Anuluj</button>`;
    },
    actions: {
      level: (el) => patch({ consentLevel: el.dataset.id }),
      share: (el, persona) =>
        withBiometric(persona, () => {
          const level = store.get().consentLevel;
          patch({ consent: 'shared' });
          addHistory({ persona: 'anna', actor: 'shared', who: RENTAL, text: `${capitalize(levels[level].short)}. Na 30 dni, cel: wynajem auta`, consent: true, level });
          replace(persona, 'consentDone');
        }),
    },
  },

  consentDone: {
    kind: 'inner',
    title: 'Udostępniono',
    render: (state) => {
      const level = state.consentLevel;
      return `
        <div class="success">
          <span class="success-icon">${icon('check', { size: 40 })}</span>
          <h2 class="service-title">${RENTAL} dostało tylko to, czego potrzebuje</h2>
        </div>
        ${fieldList(level)}
        ${infoBox('Wpis jest już w Twojej historii. Możesz z niej cofnąć zgodę albo zgłosić nadużycie.')}
        <button class="btn btn-primary" data-go="myData">Zobacz w historii</button>
        <button class="btn btn-secondary" data-home>Gotowe</button>`;
    },
  },

  myData: {
    kind: 'inner',
    title: 'Kto widział moje dane',
    speech: (state, persona) => myDataSpeech(state, persona),
    onEnter: (state, persona) => {
      if (persona === 'krystyna' && state.consent === 'shared' && !state.historySeen) patch({ historySeen: true });
    },
    render: (state, persona) => {
      const head = serviceHeader({
        iconName: 'eye',
        tint: 'violet',
        title: 'Kto widział moje dane',
        desc: 'Logowania, udostępnienia, podpisy i działania osób, które Ci pomagają — w jednym miejscu, jak historia konta w banku.',
        badge: newBadge(),
      });
      if (persona === 'anna' && state.actingAs !== 'ja') {
        return `${head}${infoBox('Historię mamy widzi tylko mama. Twoje działania w jej imieniu są tam zapisane.')}`;
      }
      return `${head}${persona === 'krystyna' ? krystynaHistory(state) : `${sectionTitle('Twoja historia')}${historyList(entriesFor(state, 'anna'))}`}`;
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
      report: (el, persona) =>
        notify(persona, { title: 'Dziękujemy za zgłoszenie', body: 'Sprawdzimy je i odpowiemy w Skrzynce. W prototypie nic nie wysyłamy.' }),
      revokeGuardian: () => revokeGuardian(),
    },
  },
};

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
