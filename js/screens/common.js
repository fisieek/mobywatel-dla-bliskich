// Zakładki i ekrany wspólne dla obu telefonów, odwzorowane z mObywatela.
// Nasze nowe usługi są wpięte w istniejące miejsca i oznaczone etykietą „Nowość”.
import { store, notify, markNotificationsRead, openTab, addHistory } from '../store.js';
import { icon } from '../icons.js';
import { people, family, fullName, contactName } from '../personas.js';
import { documents, list, row, newBadge, sectionTitle, serviceHeader, infoBox, coreNotice, docMini, shortcut } from '../ui.js';
import { servicesFor, documentCatalog, findService, searchCatalog } from '../catalog.js';
import { zosiaServices } from '../scenes/junior.js';

// Usługi: kategorie jak na info.mobywatel.gov.pl/uslugi, nasze nowe wpięte między istniejące
function servicesList(state, persona) {
  return servicesFor(persona)
    .map(
      (category) => `
      ${sectionTitle(category.name, category.isNew ? newBadge() : '')}
      ${list(
        category.rows.map((r) =>
          row({
            ...r,
            tint: category.tint,
            desc: r.go === 'authorize' && state.pickup?.status === 'active' ? 'Aktywne · dotknij, żeby zobaczyć albo odwołać' : r.desc,
            badge: r.isNew ? newBadge() : '',
          }),
        ),
      )}`,
    )
    .join('');
}

const servicesScreen = {
  kind: 'tab',
  title: 'Usługi',
  titleBadge: (state, persona) => (persona === 'zosia' ? newBadge('mObywatel Junior') : ''),
  render: (state, persona) => (persona === 'zosia' ? zosiaServices(state) : servicesList(state, persona)),
};

const qrScreen = {
  kind: 'tab',
  title: 'Kod QR',
  render: (state, persona) =>
    persona === 'zosia'
      ? list([
          row({ iconName: 'qr', title: 'Zgoda dla szkoły', desc: 'Zeskanuj kod z kartki od wychowawczyni', go: 'schoolConsentScan' }),
          row({ iconName: 'idCheck', title: 'Pokaż legitymację', desc: 'W autobusie, w muzeum, w kinie', go: 'doc-legitymacja' }),
        ])
      : list([
          row({ iconName: 'qr', title: 'Zeskanuj kod QR', desc: 'Potwierdź swoje dane lub zaloguj się', go: 'qrScan' }),
          row({ iconName: 'idCheck', title: 'Pokaż kod QR', desc: 'Pozwól komuś sprawdzić Twój dokument', go: 'qrShow' }),
        ]),
};

// Zakładka Szukaj jak w aplikacji: pole, Nowości (tu trafiają też nasze funkcje) i Popularne, a w trakcie pisania wyniki
const searchNews = [
  { title: 'Tryb prosty', iconName: 'textSize', tint: 'blue', go: 'simpleOffer', isNew: true },
  { title: 'Pomoc bliskich', iconName: 'people', tint: 'green', go: 'helpers', isNew: true },
  { title: 'Ktoś do mnie dzwoni?', iconName: 'phoneQuestion', tint: 'violet', go: 'whoIsCalling', isNew: true },
  { title: 'Kto widział moje dane', iconName: 'eye', tint: 'violet', go: 'myData', isNew: true },
  { title: 'Dane w KRS', brand: 'IC026_pozostale', go: 'core:Dane w KRS' },
  { title: 'Prawo wykonywania zawodu farmaceuty', iconName: 'idCheck', tint: 'blue', go: 'core:Prawo wykonywania zawodu farmaceuty' },
];
const searchPopular = ['Zastrzeż PESEL', 'Recepty', 'Załatw sprawę', 'Punkty karne'];

function searchResults(query, persona) {
  const results = searchCatalog(query, persona, people[persona].documents);
  if (!results.length) return infoBox(`Nic nie znaleźliśmy dla: ${escapeAttr(query)}.`);
  return list(
    results.map((r) =>
      row({
        ...(r.card ? { leading: docMini(r.card) } : { brand: r.brand, iconName: r.iconName, tint: r.tint }),
        title: r.title,
        desc: r.kind,
        go: r.go,
        badge: r.isNew ? newBadge() : '',
      }),
    ),
  );
}

const escapeAttr = (text) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const searchScreen = {
  kind: 'tab',
  title: 'Szukaj',
  render: (state, persona) => {
    const query = state.search[persona];
    return `
      <div class="search-row">
        <label class="search-field">${icon('search', { size: 20 })}<input class="search-input" data-search data-keep-focus aria-label="Szukaj w aplikacji" placeholder="Szukaj w aplikacji" value="${escapeAttr(query)}"></label>
        ${query ? '<button class="link" data-action="clearSearch">Anuluj</button>' : ''}
      </div>
      ${
        query.trim()
          ? searchResults(query, persona)
          : `
      ${sectionTitle('Nowości')}
      <div class="shortcuts">${searchNews.map(shortcut).join('')}</div>
      ${sectionTitle('Popularne')}
      ${list(searchPopular.map((title) => row({ title, go: `core:${title}` })))}`
      }`;
  },
  actions: {
    clearSearch: (el, persona) =>
      store.update((s) => {
        s.search[persona] = '';
        return s;
      }),
  },
};

function toggle(on) {
  return `<span class="toggle ${on ? 'toggle-on' : ''}" aria-hidden="true"><span></span></span>`;
}

// Więcej dokładnie jak w aplikacji (lista od Filipa z telefonu, 2.11.2026). Nowy jest tylko Tryb prosty, reszta to ślepe uliczki.
const moreRow = (title, iconName, go = `core:${title}`) => row({ iconName, tint: 'plain', title, go });

const moreScreen = {
  kind: 'tab',
  title: 'Więcej',
  render: (state, persona) => `
    ${sectionTitle('Twoje dane')}
    ${list([
      moreRow('Dane kontaktowe', 'addressBook'),
      moreRow('Dane zameldowania', 'homePin'),
      moreRow('Dane paszportu', 'passport'),
    ])}
    ${sectionTitle('Ustawienia')}
    ${list([
      moreRow('Zmień hasło', 'lock'),
      moreRow('Logowanie biometryczne', 'fingerprint'),
      moreRow('Powiadomienia', 'bell'),
      moreRow('Wygląd', 'sun'),
      row({ iconName: 'textSize', tint: 'plain', title: 'Tryb prosty', desc: 'Większy tekst, mniej przycisków, czytanie na głos', go: 'simpleOffer', badge: newBadge(), trailing: toggle(state.simpleMode[persona]) }),
      moreRow('Język aplikacji', 'globe'),
      moreRow('Wydane certyfikaty', 'certificate'),
    ])}
    ${sectionTitle('Pozostałe')}
    ${list([
      row({ iconName: 'history', tint: 'plain', title: 'Historia aktywności', desc: 'Także: kto widział moje dane', go: 'myData', badge: newBadge() }),
      moreRow('O aplikacji', 'info'),
      moreRow('Pomoc techniczna', 'help'),
      moreRow('Oceń aplikację', 'star'),
      moreRow('Wirtualny asystent', 'assistant', 'assistant'),
      moreRow('Zagłosuj na pomysł', 'bulb'),
      moreRow('Dezaktywuj aplikację', 'power'),
    ])}`,
};

// Skróty pod dokumentem jak na zrzutach z App Store. Pierwszy, „Potwierdź swoje dane”, jest przy każdym.
const docShortcuts = {
  mdowod: [['Zastrzeż dokument', 'ban'], ['Pozostałe skróty', 'dots']],
  prawoJazdy: [['Punkty karne', 'car'], ['Mandaty', 'receipt'], ['Usuń dokument', 'trash']],
};

// ownerId — gdy rodzic ogląda dokument dziecka; bez niego dokument właściciela telefonu
function docDetail(docId, ownerId) {
  const doc = documents[docId];
  return {
    kind: 'inner',
    title: doc.name,
    render: (state, persona) => {
      const owner = people[ownerId ?? persona];
      const shortcuts = docShortcuts[docId] ?? [['Usuń dokument', 'trash']];
      return `
        <p class="doc-time">Czas: 9:41:21 ${new Date().toLocaleDateString('pl-PL')}</p>
        <div class="doc-big" style="background:${doc.bg}">
          <span class="doc-photo" aria-hidden="true">${icon('people', { size: 40 })}</span>
          <dl class="doc-data">
            <dt>Imię (imiona)</dt><dd>${owner.firstName.toUpperCase()}</dd>
            <dt>Nazwisko</dt><dd>${owner.lastName.toUpperCase()}</dd>
            <dt>Data urodzenia</dt><dd>${owner.born}</dd>
            <dt>Numer PESEL</dt><dd>${owner.pesel}</dd>
          </dl>
        </div>
        <div class="doc-valid">${icon('checkCircle', { size: 28 })}<span>Dokument ważny</span></div>
        <div class="round-actions">
          <button data-go="qrShow"><i>${icon('qr', { size: 22 })}</i><span>Potwierdź swoje dane</span></button>
          ${shortcuts.map(([title, iconName]) => `<button data-go="core:${title}"><i>${icon(iconName, { size: 22 })}</i><span>${title}</span></button>`).join('')}
        </div>`;
    },
  };
}

// Ślepa uliczka dla istniejącej funkcji: nazwa, jedno zdanie o usłudze i informacja, że jej nie odtwarzamy
function coreScreen(title) {
  const service = findService(title);
  const isDocument = documentCatalog.some((d) => d.title === title);
  return {
    kind: 'inner',
    title: isDocument ? 'Dokument' : title,
    render: () => `
      ${service?.about ? serviceHeader({ brand: service.brand, iconName: service.iconName, tint: service.tint, title, desc: service.about }) : ''}
      ${isDocument ? serviceHeader({ iconName: 'idCheck', tint: 'blue', title }) : ''}
      ${coreNotice()}`,
  };
}

const screens = {
  services: servicesScreen,
  qr: qrScreen,
  search: searchScreen,
  more: moreScreen,

  // Ikony w nagłówku (istniejące w mObywatelu)
  assistant: {
    kind: 'inner',
    title: 'Wirtualny asystent',
    render: () => `
      ${serviceHeader({ iconName: 'assistant', tint: 'blue', title: 'Wirtualny asystent', desc: 'Odpowiada na pytania o sprawy urzędowe i aplikację. Działa w mObywatelu na polskim modelu językowym PLLuM.' })}
      ${infoBox('W prototypie asystent działa przy pismach z urzędu: wyjaśnia je po ludzku i pomaga przygotować odpowiedź.')}`,
  },
  inbox: { kind: 'inner', title: 'Skrzynka', render: () => coreNotice() },
  // Powiadomienia, które zniknęły z ekranu, zostają tutaj — razem z przyciskami
  notifications: {
    kind: 'inner',
    title: 'Powiadomienia',
    onEnter: (state, persona) => markNotificationsRead(persona),
    render: (state, persona) => {
      const log = state.notificationLog[persona];
      if (!log.length) return infoBox('Brak powiadomień.');
      return `<div class="list-card notification-log">${log
        .map(
          (n) => `
          <div class="notification-item notification-${n.tone}">
            <p class="notification-title">${n.title} <span class="history-date">${new Date(n.at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span></p>
            <p class="notification-body">${n.body}</p>
            ${n.action ? `<button class="btn btn-secondary btn-small" data-notification-go="${n.action.go}" data-id="${n.id}">${n.action.label}</button>` : ''}
          </div>`,
        )
        .join('')}</div>`;
    },
  },

  // „Nie wiem, co zrobić” — stałe wyjście w trybie prostym: zadzwoń, daj znać bliskiej osobie albo wróć na start
  helpMe: {
    kind: 'inner',
    title: 'Pomoc',
    speech: (state, persona) => {
      const contact = contactName(state, persona, people[persona].contact);
      return `Spokojnie. Nic się nie stanie, jeśli teraz przerwiesz. Możesz zadzwonić do ${contact}, dać znać, że potrzebujesz pomocy, albo wrócić na start.`;
    },
    render: (state, persona) => {
      const contactId = people[persona].contact;
      const contact = contactName(state, persona, contactId);
      const from = state.helpFrom[persona];
      const canAsk = persona === 'krystyna' && state.guardian === 'active';
      return `
        <div class="pin-head">
          <h2 class="service-title">Spokojnie. Pomożemy.</h2>
          <p class="service-desc">Nic się nie stanie, jeśli teraz przerwiesz.</p>
        </div>
        ${list([
          row({ iconName: 'call', tint: 'green', title: `Zadzwoń do ${contact}`, go: 'callContact' }),
          canAsk
            ? row({ iconName: 'people', tint: 'blue', title: `Daj znać: ${contact}`, desc: from ? `Zobaczy, że potrzebujesz pomocy przy: „${from}”` : 'Zobaczy, że potrzebujesz pomocy', action: 'askForHelp' })
            : row({ iconName: 'people', tint: 'blue', title: 'Pozwól bliskiej osobie Ci pomagać', go: 'helpers' }),
          row({ iconName: 'cards', tint: 'blue', title: 'Wróć na start', action: 'goStart' }),
        ])}`;
    },
    actions: {
      askForHelp: (el, persona) => {
        const state = store.get();
        const contactId = people[persona].contact;
        const from = state.helpFrom[persona];
        const me = contactName(state, contactId, persona);
        addHistory({ persona, text: `Poprosiłaś o pomoc${from ? ` przy ekranie „${from}”` : ''}: ${contactName(state, persona, contactId)}` });
        notify(contactId, {
          title: me,
          body: `Potrzebuje pomocy${from ? ` na ekranie „${from}”` : ''}. Zadzwoń do niej.`,
          action: { label: `Zadzwoń do ${me}`, go: 'callContact' },
        });
        notify(persona, { title: 'Wysłane', body: `Wysłaliśmy do: ${contactName(state, persona, contactId)}. Zaraz może do Ciebie zadzwonić.` });
      },
      goStart: (el, persona) => openTab(persona, 'documents'),
    },
  },

  // Propozycja trybu prostego od bliskiej osoby — decyduje właściciel telefonu
  simpleOffer: {
    kind: 'inner',
    title: 'Tryb prosty',
    render: (state, persona) => {
      if (state.simpleMode[persona]) {
        return `
          ${infoBox('Tryb prosty jest włączony.')}
          <button class="btn btn-primary" data-back>Gotowe</button>
          <button class="btn btn-secondary" data-action="disable">Wyłącz tryb prosty</button>`;
      }
      return `
        ${serviceHeader({ iconName: 'textSize', tint: 'blue', title: 'Wolisz większe litery i mniej przycisków?', desc: state.simpleOffered ? `Proponuje to: ${contactName(state, persona, people[persona].contact)}. Decydujesz Ty.` : 'Ten sam mObywatel, tylko prościej. Wyłączysz go w każdej chwili w Więcej.', badge: newBadge() })}
        ${list([
          row({ iconName: 'textSize', title: 'Większy tekst i duże przyciski', trailing: '' }),
          row({ iconName: 'speaker', title: 'Czytanie na głos każdego ekranu', trailing: '' }),
          row({ iconName: 'help', title: 'Przycisk „Nie wiem, co zrobić” zawsze na dole', trailing: '' }),
        ])}
        <button class="btn btn-primary" data-action="enable">Włącz tryb prosty</button>
        <button class="btn btn-secondary" data-home>Nie, dziękuję</button>`;
    },
    actions: {
      enable: (el, persona) => {
        store.update((s) => {
          s.simpleMode[persona] = true;
          return s;
        });
        const contactId = people[persona].contact;
        // Bliska osoba, która to zaproponowała, dowiaduje się o decyzji
        if (store.get().simpleOffered) notify(contactId, { title: contactName(store.get(), contactId, persona), body: 'Włączyła tryb prosty.' });
        openTab(persona, 'documents');
      },
      disable: (el, persona) => {
        store.update((s) => {
          s.simpleMode[persona] = false;
          return s;
        });
        openTab(persona, 'documents');
      },
    },
  },

  // Moi bliscy: lista osób z rejestru i nazwy, które nadał im właściciel telefonu
  contacts: {
    kind: 'inner',
    title: 'Moi bliscy',
    render: (state, persona) => `
      ${serviceHeader({
        iconName: 'people',
        tint: 'blue',
        title: 'Moi bliscy',
        desc: 'Osoby z Twojej rodziny według rejestru stanu cywilnego. Możesz nadać im własną nazwę, np. „Mama”.',
        badge: newBadge(),
      })}
      ${list(
        family[persona].map(({ id, relation }) =>
          row({ iconName: 'people', tint: 'green', title: contactName(state, persona, id), desc: `${fullName(id)} · ${relation}`, go: `contact-${id}` }),
        ),
      )}
      <p class="footnote">Imiona i nazwy pokazujemy zawsze w tej samej formie, np. „Zadzwoń do Mama”.</p>`,
  },

  // Istniejące usługi, których nie odtwarzamy
  coreService: {
    kind: 'inner',
    title: 'Usługa mObywatela',
    render: () =>
      coreNotice(),
  },
  customize: { kind: 'inner', title: 'Dostosuj', render: () => coreNotice() },
  // Dodaj: pełna lista dokumentów z info.mobywatel.gov.pl
  addDocument: {
    kind: 'inner',
    title: 'Dodaj dokument',
    render: () => list(documentCatalog.map((d) => row({ leading: docMini(d.card), title: d.title, go: `core:${d.title}` }))),
  },
  qrShow: {
    kind: 'inner',
    title: 'Pokaż kod QR',
    render: () => coreNotice(),
  },
};

function contactDetail(contactId) {
  return {
    kind: 'inner',
    title: (state, persona) => contactName(state, persona, contactId),
    render: (state, persona) => {
      const relation = family[persona].find((f) => f.id === contactId)?.relation ?? '';
      const nickname = state.nicknames[persona]?.[contactId] ?? '';
      const draft = state.nicknameDrafts[`${persona}:${contactId}`] ?? nickname;
      return `
        ${list([
          row({ iconName: 'people', tint: 'green', title: fullName(contactId), desc: 'Imię i nazwisko z rejestru', trailing: '' }),
          row({ iconName: 'people', tint: 'blue', title: relation, desc: 'Kim jest dla Ciebie', trailing: '' }),
        ])}
        <label class="field-label" for="nickname-${contactId}">Twoja nazwa dla tej osoby</label>
        <input class="text-input" id="nickname-${contactId}" data-nickname data-keep-focus maxlength="30" placeholder="np. Mama" value="${draft.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')}">
        <p class="footnote">Nazwa pokazuje się zawsze w tej samej formie, np. „Zadzwoń do ${nickname || 'Mama'}”. Bez nazwy zobaczysz: ${fullName(contactId)}, ${relation}.</p>
        <button class="btn btn-primary" data-action="saveNickname">Zapisz</button>
        ${nickname ? '<button class="btn btn-secondary" data-action="clearNickname">Usuń nazwę</button>' : ''}`;
    },
    actions: {
      saveNickname: (el, persona) => {
        // Nazwa trafia do treści ekranów, więc bez znaków, które przeglądarka czyta jako kod
        const value = (document.querySelector(`[data-persona="${persona}"] [data-nickname]`)?.value ?? '').replace(/[<>&"]/g, '').trim();
        store.update((s) => {
          s.nicknames[persona][contactId] = value;
          delete s.nicknameDrafts[`${persona}:${contactId}`];
          return s;
        });
        notify(persona, { title: 'Zapisano', body: `Ta osoba będzie widoczna jako: ${contactName(store.get(), persona, contactId)}.` });
      },
      clearNickname: (el, persona) => {
        store.update((s) => {
          s.nicknames[persona][contactId] = '';
          delete s.nicknameDrafts[`${persona}:${contactId}`];
          return s;
        });
        notify(persona, { title: 'Nazwa usunięta', body: `Ta osoba będzie widoczna jako: ${contactName(store.get(), persona, contactId)}.` });
      },
    },
  };
}

export function resolveCommonScreen(id) {
  if (id.startsWith('doc-')) return docDetail(...id.slice(4).split(':'));
  if (id.startsWith('core:')) return coreScreen(id.slice(5));
  if (id.startsWith('contact-')) return contactDetail(id.slice(8));
  return screens[id];
}
