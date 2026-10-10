// Natural-language expense parsing.
// Step 1 (extract): Gemini, or a rule-based fallback, returns RAW text values.
// Step 2 (resolve): raw names are matched against real group members and the
// amount is validated. LLM output is never trusted directly.

const AMOUNT_RE = /(?:₹|rs\.?\s*|inr\s*)?(\d[\d,]*(?:\.\d{1,2})?)/i;

const firstName = (m) => m.name.trim().split(/\s+/)[0].toLowerCase();
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function parseWithRules(text, members) {
  const amountMatch = text.match(AMOUNT_RE);
  const amountRupees = amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : null;

  const mentioned = members
    .filter((m) => new RegExp(`\\b${escapeRe(firstName(m))}\\b`, 'i').test(text))
    .map((m) => m.name);

  let payer = null;
  for (const m of members) {
    const f = escapeRe(firstName(m));
    if (new RegExp(`(paid by ${f}\\b|\\b${f} paid\\b)`, 'i').test(text)) payer = m.name;
  }

  const splitsWithOthers = /\b(split|with|between|among|shared)\b/i.test(text);
  const everyone = /\b(everyone|all of us|everybody|equally)\b/i.test(text);
  const participants = !everyone && splitsWithOthers && mentioned.length ? mentioned : null;

  const description = text
    .replace(AMOUNT_RE, '')
    .replace(/\b(split|shared)\b.*$/i, '')
    .replace(/\b(paid by \w+|\w+ paid|i paid|for|on)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { description: description || text.trim(), amountRupees, payer, participants };
}

async function parseWithGemini(text, members) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set');
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const prompt = [
    'Extract an expense from the sentence. Reply with JSON only:',
    '{"description": string, "amountRupees": number, "payer": string|null, "participants": string[]|null}',
    'payer is null when the speaker paid. participants is null when the split is among everyone.',
    `Group members: ${members.map((m) => m.name).join(', ')}.`,
    `Sentence: "${text}"`,
  ].join('\n');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

const findMember = (name, members) => {
  if (!name) return null;
  const n = String(name).trim().toLowerCase();
  return (
    members.find((m) => m.name.toLowerCase() === n) ||
    members.find((m) => firstName(m) === n.split(/\s+/)[0]) ||
    null
  );
};

function resolveDraft(raw, members, currentUserId) {
  const amount = Math.round(Number(raw.amountRupees) * 100);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: 'Could not find an amount. Try "dinner 1200 split with Rahul and Aman".' };
  }

  const me = members.find((m) => String(m._id) === String(currentUserId));
  const payer = raw.payer ? findMember(raw.payer, members) : me;

  const unmatched = [];
  let participantIds;
  if (Array.isArray(raw.participants) && raw.participants.length) {
    const ids = new Set();
    for (const name of raw.participants) {
      const m = /^(me|i|myself)$/i.test(name) ? me : findMember(name, members);
      if (m) ids.add(String(m._id));
      else unmatched.push(name);
    }
    if (payer) ids.add(String(payer._id)); // the payer always shares the cost
    participantIds = [...ids];
  } else {
    participantIds = members.map((m) => String(m._id));
  }

  return {
    draft: {
      description: String(raw.description || 'Expense').slice(0, 100),
      amount,
      paidBy: payer ? String(payer._id) : String(currentUserId),
      participants: participantIds,
    },
    unmatched,
  };
}

async function parseExpense(text, members, currentUserId) {
  let raw;
  let source = 'rules';
  try {
    raw = await parseWithGemini(text, members);
    source = 'gemini';
  } catch {
    raw = parseWithRules(text, members);
  }
  return { ...resolveDraft(raw, members, currentUserId), source };
}

module.exports = { parseExpense, parseWithRules, resolveDraft };
