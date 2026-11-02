// Scena · MOJE LEKI (Cała rodzina, filar Pomoc).
// Krystynie kończy się lek na ciśnienie. Aplikacja ostrzega 5 dni wcześniej, Krystyna prosi Annę o pomoc,
// Anna prosi przychodnię o receptę, recepta przychodzi na telefon Krystyny, a w aptece wystarczy jeden ekran.
import { store, notify, patch, addHistory, replace } from '../store.js';
import { icon } from '../icons.js';
import { list, row, newBadge, serviceHeader, infoBox } from '../ui.js';
import { contactName } from '../personas.js';
import { qrSvg } from './control.js';

// Po prośbie Anny przychodnia wystawia receptę po chwili
const REFILL_DELAY_MS = 3000;

const annaFor = (state) => contactName(state, 'krystyna', 'anna');
const mamaFor = (state) => contactName(state, 'anna', 'krystyna');

// Leki z e-recept, opisane po ludzku. Nazwy substancji są prawdziwe, dawki przykładowe.
export const meds = [
  {
    id: 'bp',
    when: 'Rano',
    plain: 'Lek na ciśnienie',
    dose: '1 tabletka',
    substance: 'Bisoprolol 5 mg',
    leaflet: 'Obniża ciśnienie i spokojniej prowadzi pracę serca. Bierz rano, codziennie o tej samej porze. Nie przestawaj brać sama — najpierw zapytaj lekarza.',
  },
  {
    id: 'chol',
    when: 'Wieczorem',
    plain: 'Lek na cholesterol',
    dose: '1 tabletka',
    substance: 'Atorwastatyna 20 mg',
    leaflet: 'Obniża cholesterol we krwi i chroni serce i naczynia. Bierz wieczorem. Nie pij do niego soku grejpfrutowego.',
  },
];

const clinic = { name: 'Przychodnia „Pod Lipami” w Wejherowie', phone: '58 000 00 00' };
const prescriptionCode = '4827';

const lowMed = meds[0];

// Start sceny z przewodnika: mija kilka tygodni i Krystynie kończy się lek
export function startMedsLow() {
  patch({ meds: 'low', medsShown: false });
  notify('krystyna', {
    title: 'Moje leki',
    body: `${lowMed.plain} skończy się za około 5 dni.`,
    tone: 'attention',
    action: { label: 'Zobacz', go: 'meds' },
  });
}

// Karta na ekranie głównym Krystyny w trybie prostym
export function medsStatus(state) {
  if (state.meds === 'low') return { text: `${lowMed.plain} skończy się za około 5 dni.`, tone: 'attention', go: 'meds', cta: 'Zobacz moje leki' };
  if (state.meds === 'refilled' && !state.medsShown) {
    return { text: `Nowa recepta jest gotowa: ${lowMed.plain.toLowerCase()}.`, tone: 'ok', go: 'medsPharmacy', cta: 'Pokaż w aptece' };
  }
  return null;
}

function medsBanner(state) {
  switch (state.meds) {
    case 'low':
      return `
        <div class="m-warning" role="status">${icon('warning', { size: 22 })}<p><strong>${lowMed.plain} skończy się za około 5 dni.</strong> Policzyliśmy to z daty wykupienia i dawki z recepty.</p></div>
        <button class="btn btn-primary" data-action="refill">Poproś o nową receptę</button>`;
    case 'requested':
      return infoBox(`<strong>Poprosiłaś o pomoc: ${annaFor(state)}.</strong> Dostaniesz powiadomienie, gdy recepta będzie gotowa.`);
    case 'ordered':
      return infoBox('<strong>Przychodnia dostała prośbę o receptę.</strong> Recepta przyjdzie tutaj, na Twój telefon.');
    case 'refilled':
      return `
        <div class="m-ok" role="status">${icon('checkCircle', { size: 22 })}<p><strong>Nowa recepta jest gotowa.</strong> ${lowMed.plain}, ważna 365 dni.</p></div>
        <button class="btn btn-primary" data-go="medsPharmacy">Pokaż w aptece</button>`;
    default:
      return '';
  }
}

function medCard(med) {
  return `
    <button class="med-card" data-go="med-${med.id}">
      <span class="ai-label">${med.when}</span>
      <span class="med-plain">${med.plain}</span>
      <span class="med-dose">${med.dose} · ${med.substance}</span>
      <span class="med-more">Na co jest ten lek? ${icon('chevronRight', { size: 16 })}</span>
    </button>`;
}

function medDetail(medId) {
  const med = meds.find((m) => m.id === medId);
  return {
    kind: 'inner',
    title: med.plain,
    speech: () => `${med.plain}. ${med.dose}, ${med.when.toLowerCase()}. ${med.leaflet} W razie wątpliwości zapytaj lekarza lub farmaceutę.`,
    render: () => `
      <h2 class="service-title">${med.plain}</h2>
      <p class="service-desc">${med.when} · ${med.dose} · ${med.substance}</p>
      <div class="ai-blocks">
        <div class="ai-block"><p class="ai-label">Na co jest ten lek</p><p>${med.leaflet}</p></div>
      </div>
      <p class="ai-source">${icon('assistant', { size: 16 })} Streszczenie ulotki leku. W razie wątpliwości zapytaj lekarza lub farmaceutę.</p>
      <button class="btn btn-secondary" data-speak>${icon('speaker', { size: 20 })} Przeczytaj mi to</button>`,
  };
}

export function resolveMedsScreen(id) {
  if (id.startsWith('med-')) return medDetail(id.slice(4));
  return medsScreens[id];
}

export const medsScreens = {
  meds: {
    kind: 'inner',
    title: 'Moje leki',
    speech: (state) => {
      const warn = state.meds === 'low' ? `Uwaga: ${lowMed.plain.toLowerCase()} skończy się za około 5 dni. ` : '';
      return `Moje leki. ${warn}${meds.map((m) => `${m.when}: ${m.plain.toLowerCase()}, ${m.dose}.`).join(' ')}`;
    },
    render: (state) => `
      ${serviceHeader({ iconName: 'pill', tint: 'red', title: 'Moje leki', desc: 'Twoje leki z e-recept, opisane po ludzku: co, kiedy i na co.', badge: newBadge() })}
      ${medsBanner(state)}
      <div class="med-list">${meds.map(medCard).join('')}</div>
      ${state.meds === 'refilled' ? '' : '<button class="btn btn-secondary" data-go="medsPharmacy">Pokaż w aptece</button>'}`,
    actions: {
      refill: (el, persona) => replace(persona, 'medsRefill'),
    },
  },

  medsRefill: {
    kind: 'inner',
    title: 'Nowa recepta',
    speech: (state) =>
      state.guardian === 'active'
        ? `${lowMed.plain} kończy się. Możesz poprosić o pomoc: ${annaFor(state)}, albo zadzwonić do przychodni.`
        : `${lowMed.plain} kończy się. Zadzwoń do przychodni.`,
    render: (state) => {
      const ask =
        state.guardian === 'active'
          ? row({ iconName: 'people', tint: 'green', title: `Poproś o pomoc: ${annaFor(state)}`, desc: 'Zobaczy tylko, że kończy się ten jeden lek', action: 'askAnnaMeds' })
          : row({ iconName: 'people', tint: 'green', title: 'Pozwól bliskiej osobie Ci pomagać', go: 'helpers' });
      return `
        <h2 class="service-title">${lowMed.plain} kończy się</h2>
        <p class="service-desc">${lowMed.substance}. Kto ma poprosić lekarza o nową receptę?</p>
        ${list([
          ask,
          row({ iconName: 'call', tint: 'blue', title: 'Zadzwoń do przychodni', desc: `${clinic.name} · ${clinic.phone}`, trailing: '' }),
        ])}`;
    },
    actions: {
      askAnnaMeds: (el, persona) => {
        const state = store.get();
        patch({ meds: 'requested' });
        addHistory({ persona: 'krystyna', text: `Poprosiłaś o pomoc z receptą (${lowMed.plain.toLowerCase()}): ${annaFor(state)}` });
        notify('anna', {
          title: mamaFor(state),
          body: `Kończy się jej ${lowMed.plain.toLowerCase()} (${lowMed.substance}), za ok. 5 dni. Prosi o pomoc z nową receptą.`,
          action: { label: 'Zobacz', go: 'mamaMeds' },
        });
        replace(persona, 'meds');
      },
    },
  },

  medsPharmacy: {
    kind: 'inner',
    title: 'W aptece',
    onEnter: (state) => {
      if (state.meds === 'refilled' && !state.medsShown) patch({ medsShown: true });
    },
    speech: () => `Pokaż ten ekran w aptece. Kod recepty: ${prescriptionCode.split('').join(' ')}. Farmaceuta zeskanuje kod albo przepisze cyfry.`,
    render: () => `
      <div class="pharmacy">
        <p class="ai-label">Pokaż w aptece</p>
        ${qrSvg(170)}
        <p class="pharmacy-code">${prescriptionCode.split('').map((d) => `<span>${d}</span>`).join('')}</p>
        <p class="service-desc">Kod recepty. Farmaceuta zeskanuje kod albo przepisze cyfry. Nie musisz niczego szukać ani tłumaczyć.</p>
      </div>
      ${list(meds.map((m) => row({ iconName: 'pill', tint: 'red', title: m.plain, desc: m.substance, trailing: '' })))}
      <button class="btn btn-primary" data-home>Gotowe</button>`,
  },

  // Telefon Anny: prośba mamy o pomoc z receptą
  mamaMeds: {
    kind: 'inner',
    title: 'Leki',
    helping: 'krystyna',
    render: (state) => {
      if (state.meds === 'ok') return infoBox(`${mamaFor(state)}: brak próśb o pomoc z lekami.`);
      if (state.meds === 'requested') {
        return `
          <h2 class="service-title">${mamaFor(state)}</h2>
          <p class="service-desc">Prosi o pomoc z nową receptą.</p>
          <div class="m-warning" role="status">${icon('warning', { size: 22 })}<p><strong>${lowMed.plain} skończy się za około 5 dni.</strong> ${lowMed.substance}.</p></div>
          ${infoBox(`Widzisz tylko ten jeden lek — tyle, ile pokazała Ci ${mamaFor(state)}. Reszta jej danych zdrowotnych jest dla Ciebie zamknięta.`)}
          ${list([row({ iconName: 'building', tint: 'blue', title: clinic.name, desc: 'Przychodnia lekarza rodzinnego', trailing: '' })])}
          <button class="btn btn-primary" data-action="orderRx">Poproś przychodnię o receptę ${newBadge()}</button>`;
      }
      if (state.meds === 'ordered') return infoBox(`<strong>Przychodnia dostała prośbę.</strong> Recepta przyjdzie prosto do telefonu: ${mamaFor(state)}.`);
      return `
        <div class="success">
          <span class="success-icon">${icon('check', { size: 40 })}</span>
          <h2 class="service-title">Recepta gotowa</h2>
          <p class="service-desc">Przychodnia wystawiła receptę. Jest już w telefonie: ${mamaFor(state)}.</p>
        </div>
        <button class="btn btn-primary" data-home>Gotowe</button>`;
    },
    actions: {
      orderRx: () => {
        const state = store.get();
        patch({ meds: 'ordered' });
        addHistory({ persona: 'krystyna', actor: 'anna', text: `Poprosiła przychodnię o receptę: ${lowMed.plain.toLowerCase()}` });
        notify('krystyna', { title: annaFor(state), body: 'Poprosiła przychodnię o Twoją receptę. Recepta przyjdzie tutaj.' });
        setTimeout(() => {
          if (store.get().meds !== 'ordered') return;
          patch({ meds: 'refilled' });
          notify('krystyna', {
            title: 'Nowa recepta',
            body: `${lowMed.plain}. Wystawiła: ${clinic.name}.`,
            tone: 'ok',
            action: { label: 'Pokaż w aptece', go: 'medsPharmacy' },
          });
          notify('anna', { title: mamaFor(store.get()), body: 'Recepta jest gotowa ✓ Przyszła na jej telefon.' });
        }, REFILL_DELAY_MS);
      },
    },
  },
};
