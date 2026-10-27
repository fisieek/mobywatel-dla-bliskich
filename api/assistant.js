// Funkcja na serwerze (Vercel): POST /api/assistant → PLLuM.
import { handleAssistant } from './_lib/pllum.js';

export async function POST(request) {
  let input;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: 'Nieprawidłowe zapytanie' }, { status: 400 });
  }
  const { status, body } = await handleAssistant(input, process.env);
  return Response.json(body, { status });
}
