// Scena · UPOWAŻNIJ BABCIĘ (Cała rodzina, filar Kontrola).
// Anna utknęła w pracy. W minutę upoważnia mamę do odebrania Zosi ze szkoły. Krystyna pokazuje w szkole kod QR,
// nauczycielka widzi tylko to, co potrzebne, a Anna dostaje informację o odbiorze.
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
const zosiaForAnna = (state) => contactName(state, 'anna', 'zosia');
const antekForAnna = (state) => contactName(state, 'anna', 'antek');
const zosiaForKrystyna = (state) => contactName(state, 'krystyna', 'zosia');
const antekForKrystyna = (state) => contactName(state, 'krystyna', 'antek');

const untilOptions = {
  today: { title: 'Tylko dziś', desc: 'Do 18:00', short: 'dziś do 18:00' },
  year: { title: 'Do końca roku szkolnego', desc: 'Do 26 czerwca', short: 'do końca roku szkolnego' },
  always: { title: 'Do odwołania', desc: 'Możesz odwołać w każdej chwili', short: 'do odwołania' },
};

const scopeText = (state, pickup) =>
  [pickup.school ? `odbiór ze szkoły · ${zosiaForKrystyna(state)}` : '', pickup.doctor ? `wizyta u lekarza · ${antekForKrystyna(state)}` : '']
    .filter(Boolean)
    .join(', ');

function toggle(on) {
  return `<span class="toggle ${on ? 'toggle-on' : ''}" aria-hidden="true"><span></span></span>`;
}

// Karta na ekranie głównym Krystyny w trybie prostym
export function pickupStatus(state) {
  if (state.pickup?.status !== 'active' || !state.pickup.school) return null;
  return { text: `Możesz dziś odebrać ze szkoły: ${zosiaForKrystyna(state)}.`, tone: 'attention', go: 'pickupPass', cta: 'Pokaż kod w szkole' };
}

// Wiersz mamy na ekranie Anny
export function pickupSummary(state) {
  if (state.pickup?.status === 'active') return { desc: `Upoważniona: ${untilOptions[state.pickup.until].short}`, tint: 'blue' };
  if (state.pickup?.status === 'used') return { desc: `Dziś ${clock(state.pickup.usedAt)} · odebrała ze szkoły: ${zosiaForAnna(state)}`, tint: 'green' };
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
          ${list([
            state.pickup.school ? row({ iconName: 'check', tint: 'green', title: `Odbiór ze szkoły · ${zosiaForAnna(state)}`, desc: school.name, trailing: '' }) : '',
            state.pickup.doctor ? row({ iconName: 'check', tint: 'green', title: `Wizyta u lekarza · ${antekForAnna(state)}`, trailing: '' }) : '',
          ].filter(Boolean))}
          ${infoBox('Dostaniesz powiadomienie, gdy szkoła zeskanuje kod.')}
          <button class="btn btn-secondary btn-danger-text" data-action="revokePickup">Odwołaj upoważnienie</button>`;
      }
      const draft = state.pickupDraft;
      return `
        ${serviceHeader({ iconName: 'people', tint: 'green', title: 'Upoważnij bliską osobę', desc: 'Nie możesz odebrać dziecka ze szkoły albo pójść z nim do lekarza? Upoważnij kogoś z rodziny. Szkoła sprawdzi to kodem QR.', badge: newBadge() })}
        ${sectionTitle('Kogo upoważniasz?')}
        <div class="choices" role="radiogroup" aria-label="Kogo upoważniasz">
          <button class="choice choice-on" role="radio" aria-checked="true">
            <span class="radio" aria-hidden="true"></span>
            <span class="row-text"><span class="row-title">${mamaFor(state)}</span><span class="row-desc">${fullName('krystyna')} · Matka</span></span>
          </button>
        </div>
        ${sectionTitle('Do czego?')}
        ${list([
          row({ title: `Odbiór ze szkoły · ${zosiaForAnna(state)}`, desc: `${school.name}, klasa ${school.klass}`, action: 'pickupScope', id: 'school', trailing: toggle(draft.school) }),
          row({ title: `Wizyta u lekarza · ${antekForAnna(state)}`, desc: 'Pediatra i szczepienia', action: 'pickupScope', id: 'doctor', trailing: toggle(draft.doctor) }),
        ])}
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
        ${infoBox('Szkoła zobaczy tylko: kto może odebrać, kogo, do kiedy i kto upoważnił. Bez adresu i numeru PESEL.')}
        <button class="btn btn-primary" data-action="authorizeConfirm" ${draft.school || draft.doctor ? '' : 'disabled'}>Upoważnij</button>`;
    },
    actions: {
      pickupScope: (el) =>
        store.update((s) => {
          s.pickupDraft[el.dataset.id] = !s.pickupDraft[el.dataset.id];
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
          const pickup = { ...state.pickupDraft, status: 'active', usedAt: null };
          patch({ pickup });
          addHistory({ persona: 'anna', text: `Upoważniłaś: ${mamaFor(state)} · ${untilOptions[pickup.until].short}` });
          addHistory({ persona: 'krystyna', actor: 'anna', text: `Upoważniła Cię: ${scopeText(state, pickup)} · ${untilOptions[pickup.until].short}` });
          notify('krystyna', {
            title: annaFor(state),
            body: `Upoważniła Cię: ${scopeText(state, pickup)}. Ważne ${untilOptions[pickup.until].short}.`,
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

  // Telefon Krystyny: kod do pokazania w szkole
  pickupPass: {
    kind: 'inner',
    title: 'Upoważnienie',
    speech: (state) =>
      state.pickup?.status === 'active'
        ? `Możesz dziś odebrać ze szkoły: ${zosiaForKrystyna(state)}. Upoważniła Cię: ${annaFor(state)}. Pokaż ten kod w szkole.`
        : null,
    render: (state) => {
      const pickup = state.pickup;
      if (!pickup || pickup.status === 'revoked') return infoBox('Nie masz teraz żadnego upoważnienia.');
      if (pickup.status === 'used') {
        return `
          <div class="success">
            <span class="success-icon">${icon('check', { size: 40 })}</span>
            <h2 class="service-title">Szkoła potwierdziła odbiór</h2>
            <p class="service-desc">${zosiaForKrystyna(state)} · ${clock(pickup.usedAt)}. Informację dostała: ${annaFor(state)}.</p>
          </div>
          ${teacherView(state)}
          <button class="btn btn-primary" data-home>Gotowe</button>`;
      }
      return `
        <div class="pass">
          <p class="ai-label">Możesz odebrać ze szkoły</p>
          <h2 class="service-title">${zosiaForKrystyna(state)}</h2>
          ${qrSvg(170)}
          <p class="service-desc">Pokaż ten kod nauczycielce. Ważne ${untilOptions[pickup.until].short}.</p>
        </div>
        ${list([row({ iconName: 'people', tint: 'green', title: annaFor(state), desc: 'Upoważniła Cię', trailing: '' })])}
        <div class="m-ok" role="status">${icon('checkCircle', { size: 22 })}<p>Nauczycielka zobaczy tylko imię i nazwisko i to upoważnienie. Bez adresu i numeru PESEL.</p></div>
        <button class="btn btn-secondary" data-action="teacherScan">${icon('qr', { size: 20 })} Nauczycielka skanuje kod</button>
        <p class="footnote center">W prototypie ten przycisk udaje skaner w szkole.</p>`;
    },
    actions: {
      teacherScan: () => {
        const state = store.get();
        const usedAt = new Date().toISOString();
        patch({ pickup: { ...state.pickup, status: 'used', usedAt } });
        addHistory({ persona: 'krystyna', actor: 'institution', who: school.name, text: 'Sprawdziła Twoje upoważnienie do odbioru dziecka: imię, nazwisko, zakres i termin' });
        notify('anna', { title: mamaFor(state), body: `Odebrała ze szkoły: ${zosiaForAnna(state)} · ${clock(usedAt)}. Szkoła sprawdziła upoważnienie.`, tone: 'ok' });
      },
    },
  },
};

// Co zobaczyła szkoła po zeskanowaniu kodu
function teacherView(state) {
  return `
    <div class="teacher-view">
      <p class="ai-label">Nauczycielka zobaczyła</p>
      <dl>
        <dt>Odbiera</dt><dd>${fullName('krystyna')}</dd>
        <dt>Dziecko</dt><dd>${fullName('zosia')}, klasa ${school.klass}</dd>
        <dt>Upoważniła</dt><dd>${fullName('anna')} (matka)</dd>
        <dt>Ważne</dt><dd>${untilOptions[state.pickup.until].short}</dd>
      </dl>
      <p class="footnote">Bez adresu, numeru PESEL i zdjęć dokumentów.</p>
    </div>`;
}
