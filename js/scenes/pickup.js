// Scenariusz · ODBIÓR DZIECKA ZE SZKOŁY (i inne codzienne sprawy).
// Upoważnienie to cyfrowa wersja kartki: Anna wybiera podpowiedź albo opisuje sprawę własnymi słowami.
// Krystyna pokazuje kod QR, sprawdzający widzi, kto i do czego upoważnił, a Anna dostaje informację o użyciu.
import { store, notify, patch, addHistory, withBiometric } from '../store.js';
import { icon } from '../icons.js';
import { list, row, newBadge, serviceHeader, infoBox, sectionTitle } from '../ui.js';
import { contactName, fullName } from '../personas.js';
import { clock } from '../dates.js';
import { qrSvg } from './control.js';

const school = { name: 'Szkoła Podstawowa nr 7 w Gdyni', klass: '5b' };

// Imiona bez odmiany — każdy telefon pokazuje bliskich po swojemu
const mamaFor = (state) => contactName(state, 'anna', 'krystyna'); // na telefonie Anny
const annaFor = (state) => contactName(state, 'krystyna', 'anna'); // na telefonie Krystyny

const untilOptions = {
  today: { title: 'Tylko dziś', desc: 'Do 18:00', short: 'dziś do 18:00' },
  year: { title: 'Do końca roku szkolnego', desc: 'Do 26 czerwca', short: 'do końca roku szkolnego' },
  always: { title: 'Do odwołania', desc: 'Możesz odwołać w każdej chwili', short: 'do odwołania' },
};

// W czyjej sprawie i jakie podpowiedzi. Listy nie da się przewidzieć, dlatego zawsze jest też „Inna sprawa”.
// Antka tu nie pokazujemy: żaden scenariusz o nim nie opowiada (decyzja Filipa, 9.11.2026).
const subjects = [
  { id: 'zosia', purposes: ['school', 'doctor'] },
  { id: 'me', purposes: ['parcel'] },
];

const purposes = {
  school: { title: 'Odbiór ze szkoły', desc: `${school.name}, klasa ${school.klass}` },
  doctor: { title: 'Wizyta u lekarza', desc: 'Pediatra i szczepienia' },
  parcel: { title: 'Odbiór przesyłki', desc: 'Na poczcie lub w punkcie odbioru' },
  other: { title: 'Inna sprawa', desc: 'Opisz ją własnymi słowami' },
};

const purposeText = (pickup) => (pickup.purpose === 'other' ? pickup.text : purposes[pickup.purpose].title);

// Jak dana osoba widzi zakres, np. „Odbiór ze szkoły · Zosia”
function scopeText(state, pickup, viewer) {
  return pickup.subject === 'me' ? purposeText(pickup) : `${purposeText(pickup)} · ${contactName(state, viewer, pickup.subject)}`;
}

const isSchool = (pickup) => pickup.purpose === 'school';

// Karta na ekranie głównym Krystyny w trybie prostym
export function pickupStatus(state) {
  if (state.pickup?.status !== 'active') return null;
  return { text: `Masz upoważnienie: ${scopeText(state, state.pickup, 'krystyna')}.`, tone: 'attention', go: 'pickupPass', cta: isSchool(state.pickup) ? 'Pokaż kod w szkole' : 'Pokaż kod' };
}

// Wiersz mamy na ekranie Anny
export function pickupSummary(state) {
  if (state.pickup?.status === 'active') return { desc: `Upoważniona: ${untilOptions[state.pickup.until].short}`, tint: 'blue' };
  if (state.pickup?.status === 'used') return { desc: `Dziś ${clock(state.pickup.usedAt)} · upoważnienie użyte: ${scopeText(state, state.pickup, 'anna')}`, tint: 'green' };
  return null;
}

export const pickupScreens = {
  // Telefon Anny: upoważnienie dla mamy
  authorize: {
    kind: 'inner',
    title: 'Upoważnienie',
    render: (state) => {
      if (state.pickup?.status === 'active') {
        return `
          ${serviceHeader({ iconName: 'people', tint: 'green', title: 'Upoważnienie aktywne', desc: `${mamaFor(state)} · ${untilOptions[state.pickup.until].short}`, badge: newBadge() })}
          ${list([row({ iconName: 'check', tint: 'green', title: scopeText(state, state.pickup, 'anna'), trailing: '' })])}
          ${infoBox('Dostaniesz powiadomienie, gdy ktoś zeskanuje kod.')}
          <button class="btn btn-secondary btn-danger-text" data-action="revokePickup">Odwołaj upoważnienie</button>`;
      }
      if (state.pickup?.status === 'used') {
        return `
          ${serviceHeader({ iconName: 'people', tint: 'green', title: 'Upoważnienie użyte', desc: `${mamaFor(state)} · dziś o ${clock(state.pickup.usedAt)}`, badge: newBadge() })}
          ${list([row({ iconName: 'check', tint: 'green', title: scopeText(state, state.pickup, 'anna'), desc: `Ważne ${untilOptions[state.pickup.until].short}`, trailing: '' })])}
          ${infoBox(isSchool(state.pickup) ? 'Szkoła potwierdziła odbiór. Wpis znajdziesz też w historii.' : 'Osoba sprawdzająca potwierdziła upoważnienie. Wpis znajdziesz też w historii.')}
          <button class="btn btn-primary" data-home>Gotowe</button>
          <button class="btn btn-secondary btn-danger-text" data-action="revokePickup">Odwołaj upoważnienie</button>`;
      }
      const draft = state.pickupDraft;
      const options = [...subjects.find((x) => x.id === draft.subject).purposes, 'other'];
      const ready = draft.purpose !== 'other' || draft.text.trim();
      return `
        ${serviceHeader({ iconName: 'people', tint: 'green', title: 'Upoważnij bliską osobę', desc: 'Nie możesz czegoś załatwić osobiście? Upoważnij kogoś z rodziny. Osoba sprawdzająca potwierdzi to kodem QR.', badge: newBadge() })}
        ${sectionTitle('Kogo upoważniasz?')}
        <div class="choices" role="radiogroup" aria-label="Kogo upoważniasz">
          <button class="choice choice-on" role="radio" aria-checked="true">
            <span class="radio" aria-hidden="true"></span>
            <span class="row-text"><span class="row-title">${mamaFor(state)}</span><span class="row-desc">${fullName('krystyna')} · Matka</span></span>
          </button>
        </div>
        ${sectionTitle('W czyjej sprawie?')}
        <div class="chips" role="radiogroup" aria-label="W czyjej sprawie">
          ${subjects
            .map(({ id }) => {
              const on = draft.subject === id;
              return `<button class="chip ${on ? 'chip-on' : ''}" role="radio" aria-checked="${on}" data-action="pickupSubject" data-id="${id}">${id === 'me' ? 'Moja' : contactName(state, 'anna', id)}</button>`;
            })
            .join('')}
        </div>
        ${sectionTitle('Do czego?')}
        <div class="choices" role="radiogroup" aria-label="Do czego">
          ${options
            .map((id) => {
              const on = draft.purpose === id;
              return `
            <button class="choice ${on ? 'choice-on' : ''}" role="radio" aria-checked="${on}" data-action="pickupPurpose" data-id="${id}">
              <span class="radio" aria-hidden="true"></span>
              <span class="row-text"><span class="row-title">${purposes[id].title}</span><span class="row-desc">${purposes[id].desc}</span></span>
            </button>`;
            })
            .join('')}
        </div>
        ${draft.purpose === 'other' ? `
        <label class="field-label" for="pickup-text">Opis sprawy</label>
        <input class="text-input" id="pickup-text" data-pickup-text data-keep-focus maxlength="80" placeholder="${draft.subject === 'me' ? 'np. Odbiór garnituru z pralni' : 'np. Odbiór z treningu w środę'}" value="${draft.text}">` : ''}
        ${['other', 'doctor'].includes(draft.purpose) ? infoBox('To nie zastępuje pełnomocnictwa w sprawach pieniędzy, nieruchomości ani dostępu do danych medycznych. Instytucja może mieć własne zasady.') : ''}
        ${sectionTitle('Do kiedy?')}
        <div class="choices" role="radiogroup" aria-label="Do kiedy">
          ${Object.entries(untilOptions)
            .map(
              ([id, o]) => `
            <button class="choice ${draft.until === id ? 'choice-on' : ''}" role="radio" aria-checked="${draft.until === id}" data-action="pickupUntil" data-id="${id}">
              <span class="radio" aria-hidden="true"></span>
              <span class="row-text"><span class="row-title">${o.title}</span><span class="row-desc">${o.desc}</span></span>
            </button>`,
            )
            .join('')}
        </div>
        ${infoBox('Osoba sprawdzająca zobaczy tylko: kto jest upoważniony, do czego, do kiedy i kto upoważnił. Bez adresu i numeru PESEL.')}
        <button class="btn btn-primary" data-action="authorizeConfirm" ${ready ? '' : 'disabled'}>Upoważnij</button>`;
    },
    actions: {
      pickupSubject: (el) =>
        store.update((s) => {
          s.pickupDraft.subject = el.dataset.id;
          s.pickupDraft.purpose = subjects.find((x) => x.id === el.dataset.id).purposes[0];
          return s;
        }),
      pickupPurpose: (el) =>
        store.update((s) => {
          s.pickupDraft.purpose = el.dataset.id;
          return s;
        }),
      pickupUntil: (el) =>
        store.update((s) => {
          s.pickupDraft.until = el.dataset.id;
          return s;
        }),
      authorizeConfirm: (el, persona) =>
        withBiometric(persona, () => {
          const state = store.get();
          const pickup = { ...state.pickupDraft, text: state.pickupDraft.text.trim(), status: 'active', usedAt: null };
          patch({ pickup });
          addHistory({ persona: 'anna', text: `Upoważniłaś: ${mamaFor(state)} · ${scopeText(state, pickup, 'anna')} · ${untilOptions[pickup.until].short}` });
          addHistory({ persona: 'krystyna', actor: 'anna', text: `Upoważniła Cię: ${scopeText(state, pickup, 'krystyna')} · ${untilOptions[pickup.until].short}` });
          notify('krystyna', {
            title: annaFor(state),
            body: `Upoważniła Cię: ${scopeText(state, pickup, 'krystyna')}. Ważne ${untilOptions[pickup.until].short}.`,
            action: { label: 'Pokaż kod', go: 'pickupPass' },
          });
        }),
      revokePickup: () => {
        const state = store.get();
        patch({ pickup: { ...state.pickup, status: 'revoked' } });
        addHistory({ persona: 'anna', text: `Odwołałaś upoważnienie: ${mamaFor(state)}` });
        notify('krystyna', { title: annaFor(state), body: 'Odwołała upoważnienie. Kod już nie działa.' });
      },
    },
  },

  // Telefon Krystyny: kod do pokazania osobie, która sprawdza upoważnienie
  pickupPass: {
    kind: 'inner',
    title: 'Upoważnienie',
    speech: (state) =>
      state.pickup?.status === 'active'
        ? `Twoje upoważnienie: ${scopeText(state, state.pickup, 'krystyna')}. Upoważniła Cię: ${annaFor(state)}. Pokaż ten kod.`
        : null,
    render: (state) => {
      const pickup = state.pickup;
      if (!pickup || pickup.status === 'revoked') return infoBox('Nie masz teraz żadnego upoważnienia.');
      const checker = isSchool(pickup) ? 'Nauczycielka' : 'Osoba sprawdzająca';
      if (pickup.status === 'used') {
        return `
          <div class="success">
            <span class="success-icon">${icon('check', { size: 40 })}</span>
            <h2 class="service-title">${isSchool(pickup) ? 'Szkoła potwierdziła odbiór' : 'Upoważnienie sprawdzone'}</h2>
            <p class="service-desc">${scopeText(state, pickup, 'krystyna')} · ${clock(pickup.usedAt)}. Informację dostała: ${annaFor(state)}.</p>
          </div>
          ${checkerView(state)}
          <button class="btn btn-primary" data-home>Gotowe</button>`;
      }
      return `
        <div class="pass">
          <p class="ai-label">Twoje upoważnienie</p>
          <h2 class="service-title">${scopeText(state, pickup, 'krystyna')}</h2>
          ${qrSvg(170)}
          <p class="service-desc">Pokaż ten kod${isSchool(pickup) ? ' nauczycielce' : ''}. Ważne ${untilOptions[pickup.until].short}.</p>
        </div>
        ${list([row({ iconName: 'people', tint: 'green', title: annaFor(state), desc: 'Upoważniła Cię', trailing: '' })])}
        <div class="m-ok" role="status">${icon('checkCircle', { size: 22 })}<p>${checker} zobaczy tylko imię i nazwisko i to upoważnienie. Bez adresu i numeru PESEL.</p></div>
        <button class="btn btn-secondary" data-action="teacherScan">${icon('qr', { size: 20 })} ${checker} skanuje kod</button>
        <p class="footnote center">W prototypie ten przycisk udaje skaner.</p>`;
    },
    actions: {
      teacherScan: () => {
        const state = store.get();
        const usedAt = new Date().toISOString();
        const pickup = state.pickup;
        patch({ pickup: { ...pickup, status: 'used', usedAt } });
        addHistory({ persona: 'krystyna', actor: 'institution', who: isSchool(pickup) ? school.name : 'Osoba sprawdzająca', text: 'Sprawdziła Twoje upoważnienie: imię, nazwisko, zakres i termin' });
        notify('anna', { title: mamaFor(state), body: `Upoważnienie użyte: ${scopeText(state, pickup, 'anna')} · ${clock(usedAt)}.`, tone: 'ok' });
      },
    },
  },
};

// Co zobaczył sprawdzający po zeskanowaniu kodu. Dane osób i termin są z rejestru, a opis wpisany ręcznie jest oznaczony.
function checkerView(state) {
  const pickup = state.pickup;
  const child = pickup.subject !== 'me';
  return `
    <div class="teacher-view">
      <p class="ai-label">${isSchool(pickup) ? 'Nauczycielka' : 'Osoba sprawdzająca'} zobaczyła</p>
      <dl>
        <dt>Upoważniona</dt><dd>${fullName('krystyna')}</dd>
        <dt>${pickup.purpose === 'other' ? 'Do czego (opis od upoważniającej)' : 'Do czego'}</dt><dd>${purposeText(pickup)}</dd>
        ${child ? `<dt>Dziecko</dt><dd>${fullName(pickup.subject)}${isSchool(pickup) ? `, klasa ${school.klass}` : ''}</dd>` : ''}
        <dt>Upoważniła</dt><dd>${fullName('anna')}${child ? ' (matka)' : ''}</dd>
        <dt>Ważne</dt><dd>${untilOptions[pickup.until].short}</dd>
      </dl>
      <p class="footnote">Bez adresu, numeru PESEL i zdjęć dokumentów.</p>
    </div>`;
}
