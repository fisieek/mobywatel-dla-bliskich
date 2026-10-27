// „Przeczytaj mi na głos” — syntezator mowy wbudowany w przeglądarkę, po polsku.
// Gdy przeglądarka go nie ma, przycisk po prostu nic nie robi.

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

function polishVoice() {
  if (!synth) return null;
  const voices = synth.getVoices();
  return voices.find((v) => v.lang === 'pl-PL') ?? voices.find((v) => v.lang?.startsWith('pl')) ?? null;
}

export const canSpeak = Boolean(synth);

export function speak(text) {
  if (!synth || !text) return;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pl-PL';
  utterance.rate = 0.92;
  const voice = polishVoice();
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
}

export function stopSpeaking() {
  synth?.cancel();
}
