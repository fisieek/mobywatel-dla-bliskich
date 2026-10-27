// Urządzenie, na którym pokazujemy aplikację na komputerze: iPhone 18 Pro albo składany iPhone Duo.
// Ekrany mają prawdziwe wymiary w punktach iOS (piksele z danych technicznych Apple podzielone przez 3).
// Cały telefon skalujemy jedną skalą, żeby urządzenia zachowały prawdziwe proporcje względem siebie.

const STORAGE_KEY = 'mobywatel-dla-bliskich:urzadzenie';
const MOBILE_MAX = 860;

// Wymiary całej obudowy: ekran + ramka ekranu + metalowa krawędź (style w app.css)
export const devices = {
  iphone18pro: { label: 'iPhone 18 Pro', width: 434, height: 906, biometric: 'Face ID' },
  'duo-closed': { label: 'iPhone Duo · złożony', width: 496, height: 708, biometric: 'Touch ID' },
  'duo-open': { label: 'iPhone Duo · rozłożony', width: 922, height: 658, biometric: 'Touch ID' },
};

// Skalę dobieramy do najwyższego urządzenia, żeby przełączanie nie zmieniało rozmiaru „w ręku”
const TALLEST = Math.max(...Object.values(devices).map((d) => d.height));

function load() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved in devices) return saved;
  } catch {
    // brak dostępu do pamięci przeglądarki — zostaje domyślny telefon
  }
  return 'iphone18pro';
}

let current = load();

export const biometric = () => devices[current].biometric;

function fit() {
  const stage = document.querySelector('.stage');
  if (window.innerWidth <= MOBILE_MAX) {
    stage.style.removeProperty('--device-zoom');
    stage.classList.remove('stage-guide-below');
    return;
  }
  const device = devices[current];
  const styles = getComputedStyle(stage);
  const padding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
  const gap = parseFloat(styles.columnGap) || 32;
  const width = stage.clientWidth - padding;
  const guide = 300;
  const caption = 30;
  const top = stage.getBoundingClientRect().top + window.scrollY;

  const byHeight = Math.min(1, (window.innerHeight - top - 2 * parseFloat(styles.paddingTop) - caption) / TALLEST);
  const guideBeside = (width - guide - 2 * gap) / (2 * device.width);
  const guideBelow = (width - gap) / (2 * device.width);
  // Przewodnik zostaje obok telefonów, jeśli nie trzeba ich przez to zmniejszać
  const beside = guideBeside >= byHeight;
  const zoom = Math.max(0.45, Math.min(byHeight, beside ? guideBeside : guideBelow));

  stage.style.setProperty('--device-zoom', zoom.toFixed(3));
  stage.classList.toggle('stage-guide-below', !beside);
}

function apply() {
  document.body.dataset.device = current;
  document.querySelectorAll('[data-device-pick]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.devicePick === current));
  });
  fit();
}

export function initDevices(onChange) {
  apply();
  window.addEventListener('resize', fit);
  document.querySelectorAll('[data-device-pick]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.devicePick === current) return;
      current = btn.dataset.devicePick;
      try {
        localStorage.setItem(STORAGE_KEY, current);
      } catch {
        // wybór działa do odświeżenia strony
      }
      document.querySelectorAll('.phone-frame').forEach((frame) => {
        frame.classList.remove('device-in');
        void frame.offsetWidth;
        frame.classList.add('device-in');
      });
      apply();
      onChange();
    });
  });
}
