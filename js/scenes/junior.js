// Sceny Zosi (11 lat, mObywatel Junior), Cała rodzina:
// · KTOŚ DO MNIE PISZE? (filar Ochrona) — obcy, który poznał Zosię w grze, pisze do niej, chce zdjęć i straszy. Zosia dostaje radę po dziecięcemu
//   i sama wybiera, komu powiedzieć: 116 111, mamie albo Dyżurnet.pl. Mama nie dostaje nic bez jej zgody.
// · ZGODA OD MAMY W MINUTĘ (filar Pomoc) — Zosia skanuje kod z kartki od wychowawczyni, Anna podpisuje zgodę w pracy.
import { store, notify, patch, addHistory, replace, withBiometric, home } from '../store.js';
import { icon } from '../icons.js';
import { list, row, newBadge, serviceHeader, infoBox, sectionTitle } from '../ui.js';
import { contactName } from '../personas.js';
import { daysFromToday, longDate } from '../dates.js';
import { qrSvg } from './control.js';
import { stopSpeaking } from '../speech.js';

const mamaForZosia = (state) => contactName(state, 'zosia', 'anna');
const zosiaForAnna = (state) => contactName(state, 'anna', 'zosia');

// ---------- Wiadomości od obcego (ekran innej aplikacji, jak ekran rozmowy u Krystyny) ----------

const chat = {
  from: '+48 500 000 000',
  lines: [
    'hej, widziałem cię w grze, super grasz',
    'masz jakieś swoje zdjęcia? wyślij mi, tylko nikomu nie mów',
    'jak nie wyślesz, to pokażę wszystkim, co mi pisałaś',
  ],
};

const LINE_DELAY_MS = 1400;

export function startStrangerChat() {
  stopSpeaking();
  patch({ chat: { open: true, since: Date.now() }, writing: { situation: null, told: false, called: false, reported: false } });
}

export function chatAction(kind) {
  if (kind === 'minimize') {
    store.update((s) => {
      if (s.chat) s.chat.open = false;
      return s;
    });
    home('zosia');
  }
  if (kind === 'expand') {
    store.update((s) => {
      if (s.chat) s.chat.open = true;
      return s;
    });
  }
}

export function chatOverlay(state, persona) {
  if (persona !== 'zosia' || !state.chat?.open) return '';
  const elapsed = Date.now() - state.chat.since;
  const isNew = elapsed < 400 ? 'call-screen-new' : '';
  const bubbles = chat.lines
    .map((line, i) => `<p class="chat-bubble" style="animation-delay:${i * LINE_DELAY_MS - elapsed}ms">${line}</p>`)
    .join('');
  return `
    <div class="chat-screen ${isNew}" role="dialog" aria-label="Wiadomości od nieznanego numeru">
      <div class="chat-head">
        <span class="chat-back" aria-hidden="true">${icon('chevronLeft', { size: 24 })}</span>
        <div class="chat-contact">
          <span class="chat-avatar" aria-hidden="true">${icon('people', { size: 24 })}</span>
          <p class="chat-from">${chat.from}</p>
        </div>
      </div>
      <div class="chat-thread" aria-live="polite">
        <p class="chat-meta"><strong>iMessage</strong><br>Dzisiaj 9:38</p>
        ${bubbles}
        <p class="chat-meta chat-unknown" style="animation-delay:${chat.lines.length * LINE_DELAY_MS - elapsed}ms">Nadawcy nie ma na Twojej liście kontaktów.</p>
      </div>
      <div class="chat-compose" aria-hidden="true">
        <span class="chat-plus">+</span>
        <span class="chat-field">iMessage</span>
      </div>
      <button class="call-swipe chat-swipe" data-chat="minimize">
        <span class="call-swipe-bar" aria-hidden="true"></span>
        Przesuń w górę, żeby wyjść z Wiadomości
      </button>
    </div>`;
}

// ---------- Ktoś do mnie pisze? ----------

const situations = {
  insult: {
    title: 'Ktoś mnie obraża',
    advice: ['Nie odpisuj i nie obrażaj w odpowiedzi.', 'Zrób zrzut ekranu i nie kasuj rozmowy. To dowód.', 'Możesz zablokować tę osobę w telefonie.'],
    report: false,
  },
  stranger: {
    title: 'Obcy chce zdjęć albo spotkania',
    advice: ['Nie wysyłaj zdjęć i nie umawiaj się.', 'Nie odpisuj. Zrób zrzut ekranu i nie kasuj rozmowy.', 'Dorosły, który prosi dziecko o zdjęcia, łamie prawo.'],
    report: true,
  },
  threat: {
    title: 'Ktoś straszy, że coś pokaże',
    advice: ['Nie wysyłaj nic więcej i nie płać.', 'Zrób zrzut ekranu i nie kasuj rozmowy.', 'Takie zdjęcia da się usunąć z internetu. Pomogą w tym dorośli.'],
    report: true,
  },
};

function writingSpeech(state) {
  const s = situations[state.writing.situation];
  if (!s) return null;
  return `To nie Twoja wina. ${s.advice.join(' ')} Kogo poprosić o pomoc? Ty wybierasz: telefon 116 111, mama${s.report ? ' albo zgłoszenie do Dyżurnet' : ''}.`;
}

// ---------- Zgoda dla szkoły ----------

const trip = {
  title: 'Wycieczka do Gdańska',
  what: 'Westerplatte i Stare Miasto, przewodnik, obiad',
  hours: '8:00–17:00',
  cost: '80 zł',
  teacher: 'Ewa Kowalska, wychowawczyni klasy 5b',
  school: 'Szkoła Podstawowa nr 7 w Gdyni',
};
const tripDate = () => longDate(daysFromToday(14));
const payBy = () => longDate(daysFromToday(7));

function tripCards() {
  return list([
    row({ iconName: 'history', title: tripDate(), desc: trip.hours, trailing: '' }),
    row({ iconName: 'letter', title: trip.what, desc: `Koszt: ${trip.cost}, wpłata do ${payBy()}`, trailing: '' }),
    row({ iconName: 'people', title: trip.teacher, desc: trip.school, trailing: '' }),
  ]);
}

// Ekran główny Zosi (mObywatel Junior)
// Zakładka Usługi w mObywatelu Junior
export function zosiaServices(state) {
  return list([
    row({ iconName: 'phoneQuestion', tint: 'violet', title: 'Ktoś do mnie pisze?', desc: 'Obraża Cię, straszy albo chce zdjęć?', go: 'whoIsWriting', badge: newBadge() }),
    row({ iconName: 'qr', tint: 'blue', title: 'Zgoda dla szkoły', desc: 'Zeskanuj kod z kartki od wychowawczyni', go: 'schoolConsentScan', badge: newBadge() }),
    row({ iconName: 'call', tint: 'green', title: `Zadzwoń do ${mamaForZosia(state)}`, go: 'callContact' }),
    row({ iconName: 'people', tint: 'blue', title: 'Moi bliscy', desc: 'Nazwy, pod którymi widzisz bliskie osoby', go: 'contacts', badge: newBadge() }),
  ]);
}

export const juniorScreens = {
  whoIsWriting: {
    kind: 'inner',
    title: 'Ktoś do mnie pisze?',
    speech: () => 'Ktoś pisze do Ciebie coś, co Cię martwi? Wybierz, co się dzieje: ktoś mnie obraża, obcy chce zdjęć albo spotkania, albo ktoś straszy, że coś pokaże.',
    render: () => `
      ${serviceHeader({ iconName: 'phoneQuestion', tint: 'violet', title: 'Ktoś do mnie pisze?', desc: 'Ktoś pisze do Ciebie coś, co Cię martwi? Wybierz, co się dzieje. Nikt się nie dowie bez Twojej zgody.', badge: newBadge() })}
      <div class="big-choices">
        ${Object.entries(situations)
          .map(([id, s]) => `<button class="big-choice" data-action="situation" data-id="${id}">${s.title}</button>`)
          .join('')}
      </div>`,
    actions: {
      situation: (el, persona) => {
        store.update((s) => {
          s.writing.situation = el.dataset.id;
          return s;
        });
        replace(persona, 'writingHelp');
      },
    },
  },

  writingHelp: {
    kind: 'inner',
    title: 'Ktoś do mnie pisze?',
    speech: (state) => writingSpeech(state),
    render: (state) => {
      const s = situations[state.writing.situation];
      if (!s) return infoBox('Najpierw wybierz, co się dzieje.');
      const mama = mamaForZosia(state);
      return `
        <div class="alert-full alert-calm" role="status">
          <h2>To nie Twoja wina</h2>
          ${s.advice.map((a) => `<p>${a}</p>`).join('')}
        </div>
        ${sectionTitle('Kogo poprosić o pomoc? Ty wybierasz.')}
        ${list([
          row({ iconName: 'call', tint: 'green', title: 'Zadzwoń: 116 111', desc: 'Telefon zaufania dla dzieci. Bezpłatnie, o każdej porze.', go: 'call116' }),
          state.writing.told
            ? row({ iconName: 'check', tint: 'green', title: `Wysłane: ${mama}`, desc: 'Wie tylko tyle, że chcesz coś powiedzieć', trailing: '' })
            : row({ iconName: 'people', tint: 'blue', title: `Powiedz: ${mama}`, desc: 'Wyślemy tylko: „Chcę Ci coś powiedzieć”', action: 'tellMom' }),
          s.report ? row({ iconName: 'flag', tint: 'red', title: 'Zgłoś do Dyżurnet.pl', desc: 'Usuwają z internetu zdjęcia dzieci', go: 'reportDyzurnet' }) : '',
        ].filter(Boolean))}
        <p class="footnote">${mama}: nic nie dostanie bez Twojej zgody.</p>`;
    },
    actions: {
      tellMom: () => {
        const state = store.get();
        store.update((s) => {
          s.writing.told = true;
          return s;
        });
        notify('anna', {
          title: zosiaForAnna(state),
          body: 'Chce Ci coś powiedzieć. Zadzwoń spokojnie. Nie wiesz jeszcze o czym — sama zdecyduje, co powie.',
          action: { label: `Zadzwoń do ${zosiaForAnna(state)}`, go: 'call-zosia' },
        });
        notify('zosia', { title: 'Wysłane', body: `${mamaForZosia(state)}: wie tylko tyle, że chcesz coś powiedzieć.` });
      },
    },
  },

  call116: {
    kind: 'inner',
    title: 'Telefon zaufania',
    onEnter: () =>
      store.update((s) => {
        s.writing.called = true;
        return s;
      }),
    render: () => `
      <div class="calling">
        <div class="avatar avatar-large" aria-hidden="true">116</div>
        <p class="calling-name">116 111</p>
        <p class="muted">Telefon zaufania dla dzieci i młodzieży · łączę…</p>
      </div>
      ${infoBox('Bezpłatnie, o każdej porze. Nie musisz podawać imienia. W prototypie nigdzie nie dzwonimy.')}
      <button class="btn btn-danger" data-home>Rozłącz</button>`,
  },

  reportDyzurnet: {
    kind: 'inner',
    title: 'Zgłoszenie',
    render: (state) => {
      if (state.writing.reported) {
        return `
          <div class="success">
            <span class="success-icon">${icon('check', { size: 40 })}</span>
            <h2 class="service-title">Zgłoszenie wysłane</h2>
            <p class="service-desc">Dyżurnet.pl się tym zajmie. Nie kasuj rozmowy. W prototypie nic nie wysyłamy.</p>
          </div>
          <button class="btn btn-primary" data-back>Wróć</button>`;
      }
      return `
        ${serviceHeader({ iconName: 'flag', tint: 'red', title: 'Zgłoś do Dyżurnet.pl', desc: 'Dyżurnet.pl to zespół NASK, który usuwa z internetu nielegalne treści, także zdjęcia dzieci.' })}
        ${list([row({ iconName: 'check', tint: 'green', title: 'Zrzut ekranu rozmowy', desc: `Wiadomości od: ${chat.from}`, trailing: '' })])}
        <button class="btn btn-primary" data-action="sendReport">Wyślij zgłoszenie</button>`;
    },
    actions: {
      sendReport: () =>
        store.update((s) => {
          s.writing.reported = true;
          return s;
        }),
    },
  },

  schoolConsentScan: {
    kind: 'inner',
    hideReadAloud: true,
    title: 'Zgoda dla szkoły',
    render: () => `
      <p class="service-desc">Wychowawczyni rozdała kartki ze zgodą na wycieczkę. Zeskanuj kod z kartki.</p>
      <div class="viewfinder viewfinder-qr">
        <button class="counter-card" data-action="scanSchool" aria-label="Zeskanuj kod z kartki">
          <span class="counter-brand">${icon('building', { size: 18 })} SP nr 7 w Gdyni</span>
          <span class="counter-sub">Zgoda rodzica · ${trip.title}</span>
          ${qrSvg(120)}
        </button>
        <span class="viewfinder-frame" aria-hidden="true"></span>
        <span class="scan-line" aria-hidden="true"></span>
      </div>
      <button class="btn btn-primary" data-action="scanSchool">${icon('qr', { size: 20 })} Zeskanuj kod</button>`,
    actions: {
      scanSchool: (el, persona) => {
        if (store.get().school === 'none') patch({ school: 'scanned' });
        replace(persona, 'schoolConsent');
      },
    },
  },

  // Telefon Zosi: o co prosi szkoła i prośba do mamy
  schoolConsent: {
    kind: 'inner',
    title: 'Zgoda dla szkoły',
    render: (state) => {
      const mama = mamaForZosia(state);
      if (state.school === 'none') return infoBox('Najpierw zeskanuj kod z kartki.');
      if (state.school === 'signed') {
        return `
          <div class="success">
            <span class="success-icon">${icon('check', { size: 40 })}</span>
            <h2 class="service-title">Zgoda podpisana ✓</h2>
            <p class="service-desc">Podpisała: ${mama}. Wychowawczyni już to widzi.</p>
          </div>
          ${tripCards()}
          <button class="btn btn-primary" data-home>Gotowe</button>`;
      }
      if (state.school === 'declined') return infoBox(`${mama}: nie zgodziła się. Porozmawiajcie w domu.`);
      return `
        <h2 class="service-title">${trip.title}</h2>
        ${tripCards()}
        ${state.school === 'requested'
          ? infoBox(`<strong>Wysłane.</strong> Czeka na podpis: ${mama}.`)
          : `${infoBox('Zgodę podpisuje rodzic. Wyślemy mu prośbę, a szkoła od razu zobaczy podpis.')}
             <button class="btn btn-primary" data-action="askConsent">Poproś o zgodę: ${mama}</button>`}`;
    },
    actions: {
      askConsent: () => {
        const state = store.get();
        patch({ school: 'requested' });
        notify('anna', {
          title: zosiaForAnna(state),
          body: `Prosi o zgodę: ${trip.title}, ${tripDate()}, ${trip.cost}.`,
          action: { label: 'Zobacz', go: 'schoolConsentReview' },
        });
      },
    },
  },

  // Telefon Anny: podpis zgody w pracy
  schoolConsentReview: {
    kind: 'inner',
    title: 'Zgoda dla szkoły',
    render: (state) => {
      const zosia = zosiaForAnna(state);
      if (state.school === 'signed') {
        return `
          <div class="success">
            <span class="success-icon">${icon('check', { size: 40 })}</span>
            <h2 class="service-title">Podpisane ✓</h2>
            <p class="service-desc">Szkoła ma Twoją zgodę. Wiadomość dostała: ${zosia}.</p>
          </div>
          <button class="btn btn-primary" data-home>Gotowe</button>`;
      }
      if (state.school !== 'requested') return infoBox('Brak zgód do podpisania.');
      return `
        <h2 class="service-title">${trip.title}</h2>
        <p class="service-desc">Prosi: ${zosia}. Kartkę rozdała wychowawczyni.</p>
        ${tripCards()}
        ${infoBox('Podpisujesz tylko tę jedną zgodę. Szkoła dostanie: Twoje imię i nazwisko, zgodę i datę.')}
        <button class="btn btn-primary" data-action="signConsent">Zgadzam się</button>
        <button class="btn btn-secondary" data-action="declineConsent">Nie zgadzam się</button>`;
    },
    actions: {
      signConsent: (el, persona) =>
        withBiometric(persona, () => {
          const state = store.get();
          patch({ school: 'signed' });
          addHistory({ persona: 'anna', text: `Podpisałaś zgodę dla szkoły: ${trip.title} · ${zosiaForAnna(state)}` });
          notify('zosia', { title: mamaForZosia(state), body: `Zgodziła się: ${trip.title} ✓ Wychowawczyni już to widzi.`, tone: 'ok' });
        }),
      declineConsent: () => {
        patch({ school: 'declined' });
        notify('zosia', { title: mamaForZosia(store.get()), body: 'Nie zgodziła się na wycieczkę. Porozmawiajcie w domu.' });
      },
    },
  },
};
