// Zakładki i ekrany wspólne dla obu telefonów, odwzorowane z mObywatela.
// Nasze nowe usługi są wpięte w istniejące miejsca i oznaczone etykietą „Nowość”.
import { store } from '../store.js';
import { icon } from '../icons.js';
import { people } from '../personas.js';
import { documents, list, row, newBadge, sectionTitle, serviceHeader, infoBox, comingSoon } from '../ui.js';

const coreService = (title) => ({ title, go: 'coreService' });

// Kategorie i usługi jak na info.mobywatel.gov.pl/uslugi (wybór) + nasze nowe
const serviceCategories = [
  {
    name: 'Rodzina i bliscy',
    isNew: true,
    rows: [{ iconName: 'people', tint: 'green', title: 'Pomoc bliskich', desc: 'Pozwól bliskiej osobie pomagać Ci w sprawach urzędowych', go: 'helpers', isNew: true }],
  },
  {
    name: 'Ochrona danych',
    rows: [
      { iconName: 'globe', tint: 'violet', ...coreService('Bezpiecznie w sieci') },
      { iconName: 'phoneQuestion', tint: 'violet', title: 'Ktoś do mnie dzwoni?', desc: 'Sprawdź, czy dzwoni naprawdę policja, bank albo urząd', go: 'whoIsCalling', isNew: true },
      { iconName: 'eye', tint: 'violet', title: 'Kto widział moje dane', desc: 'Historia logowań, udostępnień i podpisów', go: 'myData', isNew: true },
      { iconName: 'shieldLock', tint: 'violet', ...coreService('Zastrzeż PESEL') },
      { iconName: 'shield', tint: 'violet', ...coreService('Sprawdź PESEL') },
    ],
  },
  {
    name: 'Sprawy urzędowe',
    rows: [
      { iconName: 'folder', tint: 'blue', ...coreService('Twoje sprawy') },
      { iconName: 'signature', tint: 'blue', ...coreService('Podpis kwalifikowany') },
      { iconName: 'call', tint: 'blue', ...coreService('E-wizyta w ZUS') },
    ],
  },
  { name: 'Zdrowie', rows: [{ iconName: 'pill', tint: 'red', ...coreService('Recepty') }] },
  {
    name: 'Kierowca i pojazdy',
    rows: [
      { iconName: 'car', tint: 'amber', ...coreService('Punkty karne') },
      { iconName: 'car', tint: 'amber', ...coreService('Sprawdź OC') },
    ],
  },
];

const servicesScreen = {
  kind: 'tab',
  title: 'Usługi',
  render: () =>
    serviceCategories
      .map(
        (cat) => `
        ${sectionTitle(cat.name, cat.isNew ? newBadge() : '')}
        ${list(cat.rows.map((r) => row({ ...r, badge: r.isNew ? newBadge() : '' })))}`,
      )
      .join(''),
};

const qrScreen = {
  kind: 'tab',
  title: 'Kod QR',
  render: () => `
    ${list([
      row({ iconName: 'qr', title: 'Zeskanuj kod QR', desc: 'Potwierdź swoje dane lub zaloguj się', go: 'qrScan' }),
      row({ iconName: 'idCheck', title: 'Pokaż kod QR', desc: 'Pozwól komuś sprawdzić Twój dokument', go: 'qrShow' }),
    ])}
    <p class="footnote">W scenie Kontrola sprawdzisz tu, że wypożyczalnia dostaje tylko te dane, które są potrzebne.</p>`,
};

const searchScreen = {
  kind: 'tab',
  title: 'Szukaj',
  render: () => `
    <div class="search-field">${icon('search', { size: 20 })}<span>Szukaj usług i dokumentów</span></div>
    ${sectionTitle('Popularne')}
    ${list([row(coreService('Zastrzeż PESEL')), row(coreService('Recepty')), row(coreService('Sprawdź OC'))])}`,
};

function toggle(on) {
  return `<span class="toggle ${on ? 'toggle-on' : ''}" aria-hidden="true"><span></span></span>`;
}

const moreScreen = {
  kind: 'tab',
  title: 'Więcej',
  render: (state, persona) => `
    <div class="profile-card">
      <div class="avatar" aria-hidden="true">${people[persona].firstName[0]}</div>
      <div><p class="profile-name">${people[persona].firstName} ${people[persona].lastName}</p><p class="muted">Dane fikcyjne</p></div>
    </div>
    ${sectionTitle('Ustawienia')}
    ${list([
      row({
        iconName: 'textSize',
        title: 'Tryb prosty',
        desc: 'Większy tekst, mniej przycisków, czytanie na głos',
        action: 'toggleSimple',
        badge: newBadge(),
        trailing: toggle(state.simpleMode[persona]),
      }),
      row({ iconName: 'people', tint: 'green', title: 'Pomoc bliskich', desc: 'Kto może Ci pomagać i w czym', go: 'helpers', badge: newBadge() }),
      row({ iconName: 'settings', ...coreService('Ustawienia aplikacji') }),
      row({ iconName: 'info', ...coreService('Pomoc i kontakt') }),
    ])}`,
  actions: {
    toggleSimple: (el, persona) =>
      store.update((s) => {
        s.simpleMode[persona] = !s.simpleMode[persona];
        return s;
      }),
  },
};

function docDetail(docId) {
  const doc = documents[docId];
  return {
    kind: 'inner',
    title: doc.name,
    render: (state, persona) => {
      const owner = state.actingAs === 'mama' && persona === 'anna' ? people.krystyna : people[persona];
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
          <button data-go="coreService"><i>${icon('ban', { size: 22 })}</i><span>Zastrzeż dokument</span></button>
          <button data-go="coreService"><i>${icon('dots', { size: 22 })}</i><span>Pozostałe skróty</span></button>
        </div>`;
    },
  };
}

const placeholder = (title, sceneName, extra = {}) => ({
  kind: 'inner',
  title,
  render: () => comingSoon(sceneName),
  ...extra,
});

const screens = {
  services: servicesScreen,
  qr: qrScreen,
  search: searchScreen,
  more: moreScreen,

  // Ikony w nagłówku (istniejące w mObywatelu)
  assistant: {
    kind: 'inner',
    title: 'Wirtualny Asystent',
    render: () => `
      ${serviceHeader({ iconName: 'assistant', tint: 'blue', title: 'Wirtualny Asystent', desc: 'Odpowiada na pytania o sprawy urzędowe i aplikację. Działa w mObywatelu na polskim modelu językowym PLLuM.' })}
      ${comingSoon('Pomoc (asystent wyjaśnia papierowe pismo)')}`,
  },
  inbox: placeholder('Skrzynka', 'Pomoc'),
  notifications: {
    kind: 'inner',
    title: 'Powiadomienia',
    render: () => infoBox('Brak nowych powiadomień.'),
  },

  // Istniejące usługi, których nie odtwarzamy
  coreService: {
    kind: 'inner',
    title: 'Usługa mObywatela',
    render: () =>
      infoBox('Ta usługa działa już w prawdziwym mObywatelu. W prototypie jej nie odtwarzamy — pokazujemy tylko nowe funkcje oznaczone etykietą „Nowość”.'),
  },
  customize: placeholder('Dostosuj', 'żadnej — to istniejąca funkcja mObywatela'),
  addDocument: placeholder('Dodaj dokument', 'żadnej — to istniejąca funkcja mObywatela'),
  qrScan: placeholder('Zeskanuj kod QR', 'Kontrola'),
  qrShow: placeholder('Pokaż kod QR', 'Kontrola'),

  // Nasze nowe usługi (sceny Ochrona i Kontrola w budowie; Pomoc jest w scenes/help.js)
  whoIsCalling: {
    kind: 'inner',
    title: 'Ktoś do mnie dzwoni?',
    speech: () => 'Ktoś do Ciebie dzwoni? Tu sprawdzisz, czy to naprawdę policja, bank albo urząd.',
    render: () => `
      ${serviceHeader({ iconName: 'phoneQuestion', tint: 'violet', title: 'Ktoś do mnie dzwoni?', desc: 'Sprawdź, czy policja, bank albo urząd naprawdę się z Tobą kontaktuje.', badge: newBadge() })}
      ${comingSoon('Ochrona')}`,
  },
  myData: {
    kind: 'inner',
    title: 'Kto widział moje dane',
    speech: () => 'Kto widział moje dane. Tu zobaczysz, kto i kiedy korzystał z Twoich danych.',
    render: () => `
      ${serviceHeader({ iconName: 'eye', tint: 'violet', title: 'Kto widział moje dane', desc: 'Logowania, udostępnienia, podpisy i działania osób, które Ci pomagają — w jednym miejscu, jak historia konta w banku.', badge: newBadge() })}
      ${comingSoon('Kontrola')}`,
  },
};

export function resolveCommonScreen(id) {
  if (id.startsWith('doc-')) return docDetail(id.slice(4));
  return screens[id];
}
