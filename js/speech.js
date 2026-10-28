// „Przeczytaj mi na głos” — syntezator mowy wbudowany w przeglądarkę, po polsku.
// Gdy przeglądarka go nie ma, przycisk po prostu nic nie robi.

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

function polishVoice() {
  if (!synth) return null;
  const voices = synth.getVoices();
  return voices.find((v) => v.lang === 'pl-PL') ?? voices.find((v) => v.lang?.startsWith('pl')) ?? null;
}

export const canSpeak = Boolean(synth);

// Czy właśnie czytamy — pasek na dole zmienia się wtedy w „Zatrzymaj czytanie”
let speaking = false;
const listeners = new Set();

function setSpeaking(value) {
  if (speaking === value) return;
  speaking = value;
  listeners.forEach((fn) => fn(speaking));
}

export const isSpeaking = () => speaking;

export function onSpeakingChange(fn) {
  listeners.add(fn);
}

export function speak(text) {
  if (!synth || !text) return;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pl-PL';
  // Spokojne tempo dla osób starszych
  utterance.rate = 0.85;
  const voice = polishVoice();
  if (voice) utterance.voice = voice;
  utterance.onstart = () => setSpeaking(true);
  utterance.onend = () => setSpeaking(false);
  utterance.onerror = () => setSpeaking(false);
  synth.speak(utterance);
  setSpeaking(true);
}

export function stopSpeaking() {
  synth?.cancel();
  setSpeaking(false);
}
