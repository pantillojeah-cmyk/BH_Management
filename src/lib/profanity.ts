/**
 * Profanity filter for student/customer reviews.
 * Censors offensive/inappropriate words in English, Tagalog/Filipino, and Bisaya/Cebuano,
 * replacing them with asterisks (e.g. *****).
 */

const BAD_WORDS: string[] = [
  // ── English ──
  "fuck", "fucking", "fucked", "fucker", "fuckers", "fucks", "fck", "fuk",
  "shit", "shits", "shitty", "bullshit",
  "bitch", "bitches", "bitching",
  "asshole", "assholes", "bastard", "bastards",
  "cunt", "cunts", "dick", "dicks", "cock", "cocks",
  "pussy", "pussies", "whore", "whores", "slut", "sluts",
  "motherfucker", "motherfucking",

  // ── Tagalog / Filipino ──
  "putangina", "tangina", "putang ina", "tang ina", "potangina", "tanginamo", "tangina mo",
  "puta", "pota", "putragis",
  "gago", "gaga", "gaguhan",
  "tarantado", "tarantada",
  "ulol", "olol",
  "kupal", "inutil",
  "tite", "titi", "puke", "puki", "kiki",
  "kantot", "kantotan", "kantotero", "hindot", "hindutan",
  "pokpok", "pakyu",
  "leche", "letse", "bwisit", "buwisit",
  "bobo", "tanga", "ungas",

  // ── Bisaya / Cebuano ──
  "yawa", "yawaa", "ywa", "kayawa",
  "piste", "pisti", "peste", "pesting", "pestihan",
  "giatay", "atay", "ataye",
  "bilat", "bilatibay", "bilatana", "bilata",
  "kayat", "kayata", "kigwa", "kigwahon",
  "oten", "utin", "otin",
  "lubot", "kagwang", "kolera", "linti", "panulay",
  "buang", "boang", "bogo"
];

// Sort by length descending so multi-word or longer variations match before shorter substrings
const SORTED_BAD_WORDS = [...BAD_WORDS].sort((a, b) => b.length - a.length);

/**
 * Replaces any detected profanity in the text with asterisks.
 */
export function filterProfanity(text: string | null | undefined): string {
  if (!text) return "";
  let filtered = text;

  for (const word of SORTED_BAD_WORDS) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    filtered = filtered.replace(regex, (match) => "*".repeat(match.length));
  }

  return filtered;
}
