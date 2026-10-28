// Scena z dwoma telefonami obok siebie (komputer) albo jednym telefonem z przełącznikiem (telefon).
// Każdy telefon to ta sama aplikacja mObywatel: nagłówek, treść, dolny pasek z pięcioma zakładkami.
import { store, go, back, home, openTab, currentScreen, dismissNotification } from './store.js';
import { icon } from './icons.js';
import { speak, canSpeak, stopSpeaking, isSpeaking, onSpeakingChange } from './speech.js';
import { fullName, actingAsPeople } from './personas.js';
import { documentsScreen, callContactScreen } from './screens/documents.js';
import { resolveCommonScreen } from './screens/common.js';
import { helpScreens, onPhotoSelected } from './scenes/help.js';
import { protectScreens, callOverlay, callPill, callAction, startScamCall, startRealCall, startLogin } from './scenes/protect.js';
import { controlScreens } from './scenes/control.js';
import { renderGuide } from './guide.js';
import { initDevices, biometric } from './device.js';

const tabs = [
  { id: 'documents', iconName: 'cards', label: 'Dokumenty' },
  { id: 'services', iconName: 'folder', label: 'Usługi' },
  { id: 'qr', iconName: 'qr', label: 'Kod QR' },
  { id: 'search', iconName: 'search', label: 'Szukaj' },
  { id: 'more', iconName: 'grid', label: 'Więcej' },
];

const resolve = (value, state, persona) => (typeof value === 'function' ? value(state, persona) : value);

function resolveScreen(id) {
  if (id === 'documents') return documentsScreen;
  if (id === 'callContact') return callContactScreen;
  return helpScreens[id] ?? protectScreens[id] ?? controlScreens[id] ?? resolveCommonScreen(id) ?? documentsScreen;
}

// Na wąskim ekranie widać jeden telefon naraz
let mobilePersona = 'krystyna';
const lastScreen = { krystyna: null, anna: null };

function tabHeader(screen, state, persona) {
  const unread = state.notificationLog[persona].some((n) => n.unread);
  // W trybie prostym nie ma ikon bez podpisów — Powiadomienia i Asystent są wierszami na ekranie głównym
  const icons = state.simpleMode[persona]
    ? ''
    : `
      <button class="icon-btn" data-go="assistant" aria-label="Wirtualny Asystent">${icon('assistant')}</button>
      <button class="icon-btn" data-go="inbox" aria-label="Skrzynka">${icon('envelope')}</button>
      <button class="icon-btn" data-go="notifications" aria-label="Powiadomienia">${icon('bell')}${unread ? '<i class="dot"></i>' : ''}</button>`;
  return `
    <header class="app-top">
      <button class="app-mark" data-home aria-label="Strona główna"><span>m</span></button>
      <span class="spacer"></span>
      ${icons}
    </header>
    ${actingBanner(state, persona)}
    <div class="large-title-row">
      <h1 class="large-title">${resolve(screen.title, state, persona)}</h1>
      ${resolve(screen.titleBadge, state, persona) ?? ''}
    </div>`;
}

function innerHeader(screen, state, persona) {
  return `
    <header class="nav-bar">
      <button class="nav-back" data-back>${icon('chevronLeft', { size: 22 })}<span>Wróć</span></button>
      <h1 class="nav-title">${resolve(screen.title, state, persona)}</h1>
      <button class="icon-btn nav-help" data-go="coreService" aria-label="Pomoc">${icon('help', { size: 22 })}</button>
    </header>
    ${actingBanner(state, persona)}`;
}

function actingBanner(state, persona) {
  if (persona !== 'anna' || state.actingAs === 'ja') return '';
  return `
    <div class="acting-banner" role="status">
      <span>Działasz jako: <strong>${fullName(actingAsPeople[state.actingAs])}</strong></span>
      <button class="link link-light" data-action-global="actAsMe">Wróć do siebie</button>
    </div>`;
}

// Tryb prosty: zamiast pięciu małych zakładek dwa duże przyciski — powrót na start i stałe wyjście „Nie wiem, co zrobić”
function simpleDock() {
  return `
    <nav class="simple-dock" aria-label="Menu">
      <button class="dock-start" data-simple-start>${icon('cards', { size: 22 })}<span>Start</span></button>
      <button class="dock-help" data-help-me>${icon('help', { size: 22 })}<span>Nie wiem, co zrobić</span></button>
    </nav>`;
}

function tabbar(state, persona) {
  if (state.simpleMode[persona]) return simpleDock();
  const active = state.nav[persona][0];
  return `
    <nav class="tabbar" aria-label="Menu główne">
      ${tabs
        .map((t) => {
          const on = t.id === active;
          return `
          <button class="tab ${on ? 'tab-active' : ''}" data-tab="${t.id}" ${on ? 'aria-current="page"' : ''}>
            ${icon(t.iconName, { filled: on && ['cards', 'folder'].includes(t.iconName) })}<span>${t.label}</span>
          </button>`;
        })
        .join('')}
    </nav>`;
}

// Powiadomienie wjeżdża i wibruje tylko raz — nie przy każdym przerysowaniu telefonu
const shownBanners = new Set();

// Na ekranie najwyżej jedno, najnowsze powiadomienie. Starsze są w Powiadomieniach (dzwonek).
function banners(state, persona) {
  return state.notifications[persona]
    .slice(-1)
    .map((n) => {
      const isNew = !shownBanners.has(n.id);
      shownBanners.add(n.id);
      return `
      <div class="banner banner-${n.tone} ${isNew ? 'banner-new' : ''}" role="alert">
        <div class="banner-head">
          <span class="banner-app" aria-hidden="true">m</span><span>mObywatel</span><span class="banner-time">teraz</span>
          <button class="banner-close" data-dismiss="${n.id}" aria-label="Zamknij powiadomienie">${icon('close', { size: 16 })}</button>
        </div>
        <p class="banner-title">${n.title}</p>
        <p class="banner-body">${n.body}</p>
        ${n.action ? `<button class="btn btn-primary btn-small" data-notification-go="${n.action.go}" data-id="${n.id}">${n.action.label}</button>` : ''}
      </div>`;
    })
    .join('');
}

// Stały pasek nad dolnym menu (nie pływa nad treścią, więc niczego nie zasłania)
function readAloudButton(state, persona, screen) {
  if (!canSpeak || !state.simpleMode[persona] || screen.hideReadAloud) return '';
  if (isSpeaking()) {
    return `<div class="read-aloud-bar"><button class="read-aloud read-aloud-stop" data-stop-speaking>${icon('stop', { size: 22 })}<span>Zatrzymaj czytanie</span></button></div>`;
  }
  return `<div class="read-aloud-bar"><button class="read-aloud" data-speak>${icon('speaker', { size: 22 })}<span>Przeczytaj na głos</span></button></div>`;
}

// Pasek stanu jak w iOS: godzina (albo zielona pigułka trwającej rozmowy), zasięg, Wi-Fi, bateria
const statusbar = (state, persona) => `
  <div class="statusbar">
    ${callPill(state, persona) || '<span class="statusbar-time" aria-hidden="true">9:41</span>'}
    <span class="statusbar-icons" aria-hidden="true">
      <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
      <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.6c2.3 0 4.4.9 6 2.4l1.2-1.2A10.3 10.3 0 008 .9 10.3 10.3 0 00.8 3.8L2 5a8.6 8.6 0 016-2.4z"/><path d="M8 6c1.4 0 2.6.5 3.6 1.4l1.2-1.2A6.9 6.9 0 008 4.3c-1.9 0-3.6.7-4.8 1.9l1.2 1.2C5.4 6.5 6.6 6 8 6z"/><path d="M8 9.3c.6 0 1.2.2 1.6.6L8 11.6 6.4 9.9c.4-.4 1-.6 1.6-.6z"/></svg>
      <svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x=".5" y=".5" width="23" height="12" rx="3.8" stroke="currentColor" opacity=".38"/><rect x="2" y="2" width="20" height="9" rx="2.5" fill="currentColor"/><path d="M25 4.5v4a2.2 2.2 0 000-4z" fill="currentColor" opacity=".4"/></svg>
    </span>
  </div>`;

function overlay(state, persona) {
  const mode = state.overlay[persona];
  if (!mode) return '';
  const name = biometric();
  const waiting = name === 'Touch ID' ? 'fingerprint' : 'eye';
  return `
    <div class="faceid ${mode === 'faceid-ok' ? 'faceid-ok' : ''}" role="status">
      <div class="faceid-box">${icon(mode === 'faceid-ok' ? 'checkCircle' : waiting, { size: 56 })}<span>${name}</span></div>
    </div>`;
}

// Zapamiętuje pole, w którym ktoś pisze, żeby przerysowanie ekranu nie zgubiło kursora
function captureFocus(root) {
  const el = document.activeElement;
  if (!el || !root.contains(el) || !el.matches('[data-keep-focus]')) return null;
  return { start: el.selectionStart, end: el.selectionEnd, scroll: el.scrollTop };
}

function restoreFocus(root, saved) {
  const el = saved && root.querySelector('[data-keep-focus]');
  if (!el) return;
  el.focus();
  el.setSelectionRange(saved.start, saved.end);
  el.scrollTop = saved.scroll;
}

function renderPhone(persona, state) {
  const screenId = currentScreen(persona);
  const screen = resolveScreen(screenId);
  const phone = document.querySelector(`[data-persona="${persona}"]`);
  const root = phone.querySelector('.phone-screen');
  const content = root.querySelector('.app-content');
  const keepScroll = lastScreen[persona] === screenId && content ? content.scrollTop : 0;
  const focus = captureFocus(root);

  phone.classList.toggle('simple', state.simpleMode[persona]);
  root.innerHTML = `
    ${statusbar(state, persona)}
    ${screen.kind === 'tab' ? tabHeader(screen, state, persona) : innerHeader(screen, state, persona)}
    <main class="app-content">${screen.render(state, persona)}</main>
    ${readAloudButton(state, persona, screen)}
    ${tabbar(state, persona)}
    ${callOverlay(state, persona)}
    <div class="banners" aria-live="assertive">${banners(state, persona)}</div>
    ${overlay(state, persona)}`;

  root.querySelector('.app-content').scrollTop = keepScroll;
  restoreFocus(root, focus);

  if (lastScreen[persona] !== screenId) {
    lastScreen[persona] = screenId;
    // Akcje przy wejściu na ekran (np. powiadomienie na drugim telefonie) po zakończeniu renderowania
    if (screen.onEnter) setTimeout(() => screen.onEnter(store.get(), persona), 0);
  }
}

function renderMobileSwitch(state) {
  document.querySelectorAll('[data-show-persona]').forEach((btn) => {
    const persona = btn.dataset.showPersona;
    const selected = persona === mobilePersona;
    btn.setAttribute('aria-pressed', String(selected));
    btn.classList.toggle('switch-selected', selected);
    const count = state.notifications[persona].length;
    btn.querySelector('.badge').textContent = !selected && count ? String(count) : '';
  });
  document.querySelectorAll('.phone').forEach((phone) => {
    phone.classList.toggle('phone-hidden-mobile', phone.dataset.persona !== mobilePersona);
  });
}

function render(state) {
  renderPhone('krystyna', state);
  renderPhone('anna', state);
  renderMobileSwitch(state);
  document.querySelector('[data-guide]').innerHTML = renderGuide(state);
}

function screenSpeech(persona) {
  const state = store.get();
  const screen = resolveScreen(currentScreen(persona));
  const custom = screen.speech ? screen.speech(state, persona) : null;
  if (custom) return custom;
  const root = document.querySelector(`[data-persona="${persona}"]`);
  const title = root.querySelector('.large-title, .nav-title')?.textContent ?? '';
  return `${title}. ${root.querySelector('.app-content').innerText}`;
}

// „Nie wiem, co zrobić”: zapamiętujemy, na którym ekranie ktoś utknął, żeby móc to przekazać bliskiej osobie
function openHelpMe(persona) {
  if (currentScreen(persona) === 'helpMe') return;
  const screen = resolveScreen(currentScreen(persona));
  const root = document.querySelector(`[data-persona="${persona}"]`);
  const from = screen.kind === 'tab' && currentScreen(persona) === 'documents'
    ? 'Ekran główny'
    : (root.querySelector('.nav-title, .large-title')?.textContent.trim() ?? '');
  store.update((s) => {
    s.helpFrom[persona] = from;
    return s;
  });
  stopSpeaking();
  go(persona, 'helpMe');
}

function handleClick(event) {
  const target = event.target.closest('button');
  if (!target || target.disabled) return;

  const phone = target.closest('[data-persona]');
  if (phone) {
    const persona = phone.dataset.persona;
    const screen = resolveScreen(currentScreen(persona));
    const { go: goTo, tab, action, actionGlobal, dismiss, notificationGo } = target.dataset;

    if (target.dataset.call) return callAction(persona, target.dataset.call);
    if (goTo) return go(persona, goTo);
    if (tab) return openTab(persona, tab);
    if ('back' in target.dataset) return back(persona);
    if ('home' in target.dataset) return home(persona);
    if ('simpleStart' in target.dataset) return openTab(persona, 'documents');
    if ('helpMe' in target.dataset) return openHelpMe(persona);
    if ('speak' in target.dataset) return speak(screenSpeech(persona));
    if ('stopSpeaking' in target.dataset) return stopSpeaking();
    if (dismiss) return dismissNotification(persona, dismiss);
    if (notificationGo) {
      dismissNotification(persona, target.dataset.id);
      return go(persona, notificationGo);
    }
    if (actionGlobal === 'actAsMe') {
      return store.update((s) => {
        s.actingAs = 'ja';
        return s;
      });
    }
    if (action) return screen.actions?.[action]?.(target, persona);
    return;
  }

  // Przyciski w przewodniku: telefon od „policjanta”, od prawdziwego urzędu albo logowanie, które zaczyna Krystyna
  if (target.dataset.guideAction) {
    mobilePersona = 'krystyna';
    const start = { realCall: startRealCall, login: startLogin }[target.dataset.guideAction] ?? startScamCall;
    return start();
  }

  if (target.dataset.showPersona) {
    mobilePersona = target.dataset.showPersona;
    renderMobileSwitch(store.get());
    return;
  }

  if ('reset' in target.dataset) {
    stopSpeaking();
    mobilePersona = 'krystyna';
    store.reset();
  }
}

document.addEventListener('click', handleClick);
document.addEventListener('input', (event) => {
  if (event.target.matches('[data-draft]')) {
    store.quietly((s) => {
      s.reply = event.target.value;
    });
  }
  if (event.target.matches('[data-nickname]')) {
    const persona = event.target.closest('[data-persona]').dataset.persona;
    const contactId = event.target.id.replace('nickname-', '');
    store.quietly((s) => {
      s.nicknameDrafts[`${persona}:${contactId}`] = event.target.value;
    });
  }
  if (event.target.matches('[data-facts]')) {
    store.quietly((s) => {
      s.replyFacts = event.target.value;
    });
  }
});
document.addEventListener('change', (event) => {
  if (event.target.matches('[data-photo]')) {
    onPhotoSelected(event.target.closest('[data-persona]').dataset.persona, event.target.files[0]);
  }
});
store.subscribe(render);
onSpeakingChange(() => render(store.get()));
render(store.get());
initDevices(() => render(store.get()));
