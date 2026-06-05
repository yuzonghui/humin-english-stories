const DEFAULT_SETTINGS = {
  fontSize: 16,
  theme: 'light',
  accent: 'en-US',
  practiceMode: 'segment',
  speechRate: 0.9
};

let cache = null;

export async function loadAll() {
  if (cache) return cache;
  cache = await window.api.loadUserData();
  cache.settings = { ...DEFAULT_SETTINGS, ...cache.settings };
  cache.progress = cache.progress || {};
  cache.wrongSentences = cache.wrongSentences || [];
  cache.vocabulary = cache.vocabulary || [];
  return cache;
}

export async function saveAll(data) {
  cache = data;
  await window.api.saveUserData(data);
}

export function getStoryProgress(data, storyId) {
  const p = data.progress[storyId];
  if (!p) return { completed: 0, total: 0, percent: 0 };
  const percent = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
  return { ...p, percent };
}

export function updateStoryProgress(data, storyId, completed, total) {
  data.progress[storyId] = { completed, total, updatedAt: Date.now() };
}

export function addWrongSentence(data, item) {
  const exists = data.wrongSentences.some(
    (w) => w.storyId === item.storyId && w.sentenceIndex === item.sentenceIndex && w.text === item.text
  );
  if (!exists) {
    data.wrongSentences.unshift({ ...item, addedAt: Date.now() });
    if (data.wrongSentences.length > 500) data.wrongSentences.length = 500;
  }
}

export function removeWrongSentence(data, id) {
  data.wrongSentences = data.wrongSentences.filter((w) => w.id !== id);
}

export function toggleVocabulary(data, word, meaning, storyTitle, phonetic = '') {
  const idx = data.vocabulary.findIndex((v) => v.word === word);
  if (idx >= 0) {
    data.vocabulary.splice(idx, 1);
    return false;
  }
  data.vocabulary.unshift({
    id: Date.now() + Math.random(),
    word,
    meaning,
    phonetic,
    storyTitle,
    addedAt: Date.now()
  });
  return true;
}

export function isWordSaved(data, word) {
  return data.vocabulary.some((v) => v.word === word);
}

export function applySettingsToDOM(settings) {
  document.documentElement.style.fontSize = settings.fontSize + 'px';
  document.documentElement.dataset.theme = settings.theme;
}
