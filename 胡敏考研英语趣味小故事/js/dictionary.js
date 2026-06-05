/**
 * 离线英汉词典：优先查 dict.json，支持常见词形还原
 */
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'nor', 'so', 'yet', 'for', 'if', 'as',
  'in', 'on', 'at', 'to', 'of', 'by', 'with', 'from', 'into', 'upon', 'under',
  'over', 'out', 'up', 'down', 'about', 'than', 'then', 'there', 'here',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
  'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
  'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must',
  'not', 'no', 'yes', 'all', 'each', 'every', 'both', 'either', 'neither',
  'this', 'that', 'these', 'those', 'it', 'its',
  'i', 'me', 'my', 'we', 'us', 'our', 'you', 'your',
  'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their',
  'who', 'whom', 'whose', 'which', 'what', 'when', 'where', 'why', 'how'
]);

export function isContentWord(word) {
  const key = word.toLowerCase();
  return key.length > 1 && !STOPWORDS.has(key);
}

let dict = null;
let loading = null;

const IRREGULAR = {
  was: 'be', were: 'be', been: 'be', being: 'be', am: 'be', is: 'be', are: 'be',
  had: 'have', has: 'have', having: 'have',
  did: 'do', does: 'do', doing: 'do',
  went: 'go', goes: 'go', going: 'go', gone: 'go',
  said: 'say', says: 'say', saying: 'say',
  made: 'make', makes: 'make', making: 'make',
  took: 'take', takes: 'take', taking: 'take', taken: 'take',
  came: 'come', comes: 'come', coming: 'come',
  got: 'get', gets: 'get', getting: 'get', gotten: 'get',
  knew: 'know', knows: 'know', knowing: 'know', known: 'know',
  thought: 'think', thinks: 'think', thinking: 'think',
  felt: 'feel', feels: 'feel', feeling: 'feel',
  kept: 'keep', keeps: 'keep', keeping: 'keep',
  gave: 'give', gives: 'give', giving: 'give', given: 'give',
  wrote: 'write', writes: 'write', writing: 'write', written: 'write',
  read: 'read', reads: 'reading',
  led: 'lead', leads: 'lead', leading: 'lead',
  shone: 'shine', shines: 'shine', shining: 'shine',
  grew: 'grow', grows: 'grow', growing: 'grow', grown: 'grow'
};

export async function loadDictionary() {
  if (dict) return dict;
  if (loading) return loading;
  loading = fetch('data/dict.json')
    .then((r) => r.json())
    .then((data) => {
      dict = data;
      return dict;
    });
  return loading;
}

function stripSuffix(word) {
  if (IRREGULAR[word]) return IRREGULAR[word];
  if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
  if (word.endsWith('ing') && word.length > 5) {
    const base = word.slice(0, -3);
    if (base.endsWith(base.at(-1) + base.at(-1))) return base.slice(0, -1);
    return base;
  }
  if (word.endsWith('ed') && word.length > 4) {
    const base = word.slice(0, -2);
    if (base.endsWith(base.at(-1) + base.at(-1))) return base.slice(0, -1);
    if (base.endsWith('i')) return base.slice(0, -1) + 'y';
    return base;
  }
  if (word.endsWith('es') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('s') && word.length > 3 && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

function normalizeKey(word) {
  return word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function parseEntry(raw) {
  if (!raw) return null;
  if (typeof raw === 'string') return { cn: raw, ipa: '' };
  return { cn: raw.cn || '', ipa: raw.ipa || '' };
}

function resolveEntry(word) {
  if (!dict) return null;
  const key = normalizeKey(word);
  if (dict[key]) return parseEntry(dict[key]);
  if (dict[word.toLowerCase()]) return parseEntry(dict[word.toLowerCase()]);
  const stem = stripSuffix(key);
  if (stem !== key && dict[stem]) return parseEntry(dict[stem]);
  return null;
}

export function lookupWord(word) {
  if (!dict) return '加载中…';
  return resolveEntry(word)?.cn || '（暂无释义）';
}

export function lookupPhonetic(word) {
  if (!dict) return '';
  return resolveEntry(word)?.ipa || '';
}

export function lookupEntry(word) {
  if (!dict) return { cn: '加载中…', ipa: '' };
  return resolveEntry(word) || { cn: '（暂无释义）', ipa: '' };
}
