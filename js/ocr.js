// Odczyt tekstu ze zdjęcia pisma: Tesseract.js w przeglądarce, z polskim słownikiem.
// Zdjęcie nie opuszcza telefonu. Bibliotekę ładujemy dopiero, gdy ktoś zrobi zdjęcie.

const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';

let loading = null;

function loadTesseract() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TESSERACT_URL;
    script.onload = () => resolve(window.Tesseract);
    script.onerror = () => reject(new Error('Nie udało się wczytać odczytu tekstu'));
    document.head.appendChild(script);
  });
  return loading;
}

export async function readTextFromPhoto(file) {
  const Tesseract = await loadTesseract();
  const { data } = await Tesseract.recognize(file, 'pol');
  return data.text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}
