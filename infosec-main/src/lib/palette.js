// Muted, professional header tones for meal and category cards.
// Deep shades keep the white text readable while staying away from neon.
export const CARD_TONES = [
  "from-emerald-800 to-teal-900",
  "from-slate-700 to-slate-900",
  "from-amber-700 to-amber-900",
  "from-rose-800 to-rose-950",
  "from-indigo-800 to-indigo-950",
  "from-stone-700 to-stone-900",
];

// Stable assignment so a meal keeps the same tone between renders.
export function toneFor(value = "") {
  const text = String(value);
  let total = 0;
  for (let index = 0; index < text.length; index += 1) total += text.charCodeAt(index);
  return CARD_TONES[total % CARD_TONES.length];
}
