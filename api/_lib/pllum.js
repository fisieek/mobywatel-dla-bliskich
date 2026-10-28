// Rozmowa z PLLuM przez API zgodne z OpenAI (dostawca: Featherless).
// Klucz API jest tylko tutaj, na serwerze — nigdy w przeglądarce.

const DEFAULT_BASE_URL = 'https://api.featherless.ai/v1';
const DEFAULT_MODEL = 'CYFRAGOVPL/PLLuM-12B-instruct-2512';
const MAX_LETTER_CHARS = 6000;
const MAX_FACTS_CHARS = 500;
const CACHE_LIMIT = 200;

const SYSTEM_PROMPT = `Jesteś Wirtualnym Asystentem w aplikacji mObywatel. Pomagasz zrozumieć pisma urzędowe.
Zasady:
- Piszesz prostym językiem, zrozumiałym dla osoby po 8–9 latach nauki. Krótkie zdania, strona czynna, bez urzędniczego żargonu.
- Zwracasz się do adresata pisma na „Ty”, w formie zgodnej z podaną płcią adresata.
- Opierasz się wyłącznie na treści pisma i faktach podanych przez użytkownika. Niczego nie wymyślasz.
- Nie podajesz numerów przepisów, których nie ma w piśmie ani w faktach podanych przez użytkownika.`;

const cache = new Map();

function remember(key, value) {
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value);
  cache.set(key, value);
}

function recipientLine(recipient) {
  const form = recipient?.form === 'male' ? 'mężczyzna' : 'kobieta';
  return `Adresat pisma: ${recipient?.name ?? 'Krystyna Nowak'} (${form}).`;
}

function explainMessages({ letterText, recipient }) {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `${recipientLine(recipient)}
Oto tekst pisma odczytany ze zdjęcia (może zawierać drobne błędy odczytu):
"""
${letterText}
"""
Odpowiedz wyłącznie obiektem JSON z polami:
- "from": kto przysłał pismo (nazwa urzędu, krótko),
- "what": o co chodzi w piśmie (1–2 zdania),
- "todo": co adresat musi zrobić (1–2 zdania; jeśli nic, napisz to wprost),
- "when": termin, np. "Do 8 grudnia 2026" albo "Brak terminu",
- "warning": co się stanie, jeśli adresat nic nie zrobi (1 zdanie).`,
    },
  ];
}

function draftMessages({ letterText, recipient, facts }) {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `${recipientLine(recipient)}
Pismo z urzędu:
"""
${letterText}
"""
Fakty, które adresat chce przekazać w odpowiedzi: ${facts}
Napisz krótką, uprzejmą odpowiedź na to pismo w imieniu adresata, gotową do wysłania. Zacznij od miejscowości i daty, podaj dane adresata, adresata pisma (urząd), znak sprawy, jeśli jest w piśmie, i podpis. Bez numerów przepisów, których nie ma w piśmie ani w faktach powyżej. Zwróć sam tekst odpowiedzi.`,
    },
  ];
}

function parseExplanation(text) {
  const json = text.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new Error('Model nie zwrócił JSON');
  const data = JSON.parse(json);
  for (const key of ['what', 'todo', 'when']) {
    if (typeof data[key] !== 'string' || !data[key].trim()) throw new Error(`Brak pola ${key}`);
  }
  return {
    from: String(data.from ?? '').trim(),
    what: data.what.trim(),
    todo: data.todo.trim(),
    when: data.when.trim(),
    warning: String(data.warning ?? '').trim(),
  };
}

async function chat(messages, env, { maxTokens, json }) {
  const response = await fetch(`${env.PLLUM_BASE_URL || DEFAULT_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.FEATHERLESS_API_KEY}` },
    body: JSON.stringify({
      model: env.PLLUM_MODEL || DEFAULT_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: maxTokens,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  if (!response.ok) throw new Error(`PLLuM odpowiedział błędem ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// Zwraca { status, body } — wspólne dla funkcji na serwerze i lokalnego serwera deweloperskiego
export async function handleAssistant(input, env) {
  if (!env.FEATHERLESS_API_KEY) return { status: 503, body: { error: 'Brak klucza API — działa tryb awaryjny' } };

  const task = input?.task;
  const letterText = String(input?.letterText ?? '').slice(0, MAX_LETTER_CHARS).trim();
  const facts = String(input?.facts ?? '').slice(0, MAX_FACTS_CHARS).trim();
  if (!['explainLetter', 'draftReply'].includes(task) || letterText.length < 40) {
    return { status: 400, body: { error: 'Nieprawidłowe zapytanie' } };
  }

  const key = JSON.stringify([task, letterText, facts, input?.recipient?.form]);
  if (cache.has(key)) return { status: 200, body: cache.get(key) };

  try {
    let body;
    if (task === 'explainLetter') {
      const text = await chat(explainMessages({ letterText, recipient: input.recipient }), env, { maxTokens: 500, json: true });
      body = { explanation: parseExplanation(text), model: env.PLLUM_MODEL || DEFAULT_MODEL };
    } else {
      const text = await chat(draftMessages({ letterText, recipient: input.recipient, facts: facts || 'brak' }), env, { maxTokens: 700 });
      if (text.trim().length < 80) throw new Error('Za krótka odpowiedź');
      body = { reply: text.trim(), model: env.PLLUM_MODEL || DEFAULT_MODEL };
    }
    remember(key, body);
    return { status: 200, body };
  } catch (error) {
    return { status: 502, body: { error: error.message } };
  }
}
