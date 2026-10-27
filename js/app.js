// Scena z dwoma telefonami obok siebie (komputer) albo jednym telefonem z przełącznikiem (telefon).
// Każdy telefon to ta sama aplikacja mObywatel: nagłówek, treść, dolny pasek z pięcioma zakładkami.
import { store, go, back, home, openTab, currentScreen, dismissNotification } from './store.js';
import { icon } from './icons.js';
import { speak, canSpeak, stopSpeaking } from './speech.js';
import { actingAsOptions } from './personas.js';
import { documentsScreen, callContactScreen } from './screens/documents.js';
import { resolveCommonScreen } from './screens/common.js';
import { helpScreens, onPhotoSelected } from './scenes/help.js';
import { renderGuide } from './guide.js';

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
  return helpScreens[id] ?? resolveCommonScreen(id) ?? documentsScreen;
}

// Na wąskim ekranie widać jeden telefon naraz
let mobilePersona = 'krystyna';
const lastScreen = { krystyna: null, anna: null };

function tabHeader(screen, state, persona) {
  const unread = state.notifications[persona].length > 0;
  return `
    <header class="app-top">
      <button class="app-mark" data-home aria-label="Strona główna"><span>m</span></button>
      <span class="spacer"></span>
      <button class="icon-btn" data-go="assistant" aria-label="Wirtualny Asystent">${icon('assistant')}</button>
      <button class="icon-btn" data-go="inbox" aria-label="Skrzynka">${icon('envelope')}</button>
      <button class="icon-btn" data-go="notifications" aria-label="Powiadomienia">${icon('bell')}${unread ? '<i class="dot"></i>' : ''}</button>
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
  const who = actingAsOptions[state.actingAs];
  return `
    <div class="acting-banner" role="status">
      <span>Działasz jako: <strong>${who.full}</strong></span>
      <button class="link link-light" data-action-global="actAsMe">Wróć do siebie</button>
    </div>`;
}

function tabbar(state, persona) {
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

function banners(state, persona) {
  return state.notifications[persona]
    .map(
      (n) => `
      <div class="banner banner-${n.tone}" role="alert">
        <div class="banner-head">
          <span class="banner-app" aria-hidden="true">m</span><span>mObywatel</span><span class="banner-time">teraz</span>
          <button class="banner-close" data-dismiss="${n.id}" aria-label="Zamknij powiadomienie">${icon('close', { size: 16 })}</button>
        </div>
        <p class="banner-title">${n.title}</p>
        <p class="banner-body">${n.body}</p>
        ${n.action ? `<button class="btn btn-primary btn-small" data-notification-go="${n.action.go}" data-id="${n.id}">${n.action.label}</button>` : ''}
      </div>`,
    )
    .join('');
}

function readAloudButton(state, persona, screen) {
  if (!canSpeak || !state.simpleMode[persona] || screen.hideReadAloud) return '';
  return `<button class="read-aloud" data-speak>${icon('speaker', { size: 22 })}<span>Przeczytaj na głos</span></button>`;
}

function overlay(state, persona) {
  const mode = state.overlay[persona];
  if (!mode) return '';
  return `
    <div class="faceid ${mode === 'faceid-ok' ? 'faceid-ok' : ''}" role="status">
      <div class="faceid-box">${icon(mode === 'faceid-ok' ? 'checkCircle' : 'eye', { size: 56 })}<span>Face ID</span></div>
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
    <div class="statusbar" aria-hidden="true"><span>9:41</span><span class="statusbar-icons">●●● ▮</span></div>
    ${screen.kind === 'tab' ? tabHeader(screen, state, persona) : innerHeader(screen, state, persona)}
    <main class="app-content">${screen.render(state, persona)}</main>
    ${readAloudButton(state, persona, screen)}
    ${tabbar(state, persona)}
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

function handleClick(event) {
  const target = event.target.closest('button');
  if (!target || target.disabled) return;

  const phone = target.closest('[data-persona]');
  if (phone) {
    const persona = phone.dataset.persona;
    const screen = resolveScreen(currentScreen(persona));
    const { go: goTo, tab, action, actionGlobal, dismiss, notificationGo } = target.dataset;

    if (goTo) return go(persona, goTo);
    if (tab) return openTab(persona, tab);
    if ('back' in target.dataset) return back(persona);
    if ('home' in target.dataset) return home(persona);
    if ('speak' in target.dataset) return speak(screenSpeech(persona));
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
render(store.get());
