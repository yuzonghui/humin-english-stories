/**
 * 按 . ! ? ; （及中文 。！？；）分句，每句保持完整
 */
function splitSentences(text) {
  const raw = text.replace(/\r\n/g, '\n').replace(/\n+/g, ' ').trim();
  return raw
    .split(/(?<=[.!?;。！？；])\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function splitStory(text, textCn = '') {
  const fullSentences = splitSentences(text);
  const fullSentencesCn = textCn ? splitSentences(textCn) : [];

  const segments = fullSentences.map((segText, fullIndex) => ({
    text: segText,
    fullIndex,
    translation: fullSentencesCn[fullIndex] || ''
  }));
  return { fullSentences, fullSentencesCn, segments };
}

export function splitIntoSentences(text) {
  return splitStory(text).segments.map((s) => s.text);
}

export function normalizeForCompare(text) {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019']/g, "'")
    .replace(/[\u201c\u201d"]/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:"']/g, '')
    .trim();
}

export function compareInput(expected, input) {
  return normalizeForCompare(expected) === normalizeForCompare(input);
}

export function extractWords(sentence) {
  const matches = sentence.match(/[a-zA-Z\u00C0-\u024F']+/g) || [];
  const seen = new Set();
  const words = [];
  for (const w of matches) {
    const lower = w.toLowerCase();
    if (lower.length > 1 && !seen.has(lower)) {
      seen.add(lower);
      words.push(lower);
    }
  }
  return words;
}
