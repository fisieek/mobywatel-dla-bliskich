// Wirtualny Asystent na PLLuM: wyjaśnienie pisma i szkic odpowiedzi.
// Zapytania idą do /api/assistant (klucz API jest tylko na serwerze). Gdy PLLuM nie odpowie
// w 8 sekund albo serwera nie ma (np. zwykły podgląd plików), prototyp po cichu używa
// przygotowanych odpowiedzi, żeby demo nigdy się nie zatrzymało.
import { explanation as scriptedExplanation, replyDraft as scriptedReply } from './letter.js';

const LIVE_TIMEOUT_MS = 8000;
// Spinner ma się pokazać choć na chwilę, nawet gdy odpowiedź jest od razu
const MIN_DURATION_MS = 1200;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callLive(payload) {
  const response = await fetch('/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(LIVE_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Asystent niedostępny (${response.status})`);
  return response.json();
}

async function atLeast(started) {
  const left = MIN_DURATION_MS - (Date.now() - started);
  if (left > 0) await wait(left);
}

// Zwraca { explanation, source: 'live' | 'scripted' }
export async function explainLetter({ letterText, recipient }) {
  const started = Date.now();
  try {
    const { explanation } = await callLive({ task: 'explainLetter', letterText, recipient });
    await atLeast(started);
    return { explanation, source: 'live' };
  } catch {
    await atLeast(started);
    return { explanation: scriptedExplanation, source: 'scripted' };
  }
}

// Zwraca { reply, source }. Bez połączenia: przygotowany szkic dla przykładowego pisma,
// a dla innego pisma prosty szablon z faktami wpisanymi przez Annę.
export async function draftReply({ letterText, recipient, facts, isSample }) {
  const started = Date.now();
  try {
    const { reply } = await callLive({ task: 'draftReply', letterText, recipient, facts });
    await atLeast(started);
    return { reply, source: 'live' };
  } catch {
    await atLeast(started);
    const reply = isSample
      ? scriptedReply
      : `${recipient.name}\n\nW odpowiedzi na Państwa pismo wyjaśniam: ${facts}\n\nZ poważaniem\n${recipient.name}`;
    return { reply, source: 'scripted' };
  }
}
