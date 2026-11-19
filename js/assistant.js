// Wirtualny asystent w prototypie: przygotowane odpowiedzi do przykładowego pisma.
// Prototyp nie łączy się z żadnym modelem językowym (decyzja zespołu, 2.11.2026).
import { explanation, replyDraft } from './letter.js';

// Spinner ma się pokazać choć na chwilę, jak przy prawdziwej odpowiedzi
const THINKING_MS = 1200;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function explainLetter() {
  await wait(THINKING_MS);
  return explanation;
}

export async function draftReply() {
  await wait(THINKING_MS);
  return replyDraft;
}
