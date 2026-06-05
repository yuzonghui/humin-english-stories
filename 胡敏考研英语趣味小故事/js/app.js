import { splitStory, extractWords } from './sentence-splitter.js';
import {
  loadAll, saveAll, getStoryProgress, updateStoryProgress,
  addWrongSentence, removeWrongSentence, toggleVocabulary, isWordSaved, applySettingsToDOM
} from './storage.js';
import { initSpeech, speakRepeat, stop } from './speech.js';
import { loadDictionary, lookupEntry, isContentWord } from './dictionary.js';
import { analyzeWordProgress, renderWordProgressHtml } from './typing-check.js';

let userData = null;
let stories = [];
let practice = null;
let playSessionId = 0;
let advanceTimer = null;

const READ_TIMES = 10;
const AUTO_ADVANCE_MS = 3000;

const pages = {
  articles: document.getElementById('page-articles'),
  practice: document.getElementById('page-practice'),
  wrong: document.getElementById('page-wrong'),
  vocab: document.getElementById('page-vocab'),
  settings: document.getElementById('page-settings')
};

async function init() {
  initSpeech();
  await loadDictionary();
  userData = await loadAll();
  stories = await window.api.loadStories();
  applySettingsToDOM(userData.settings);
  bindNav();
  bindSettings();
  bindPracticeControls();
  renderArticles();
  renderWrong();
  renderVocab();
}

function bindNav() {
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (practice && btn.dataset.page !== 'articles') {
        stop();
        practice = null;
      }
      showPage(btn.dataset.page);
      document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b === btn));
    });
  });
}

function showPage(name) {
  Object.entries(pages).forEach(([key, el]) => {
    el.classList.toggle('active', key === name);
  });
}

function bindSettings() {
  const s = userData.settings;
  const fontEl = document.getElementById('setting-font');
  const themeEl = document.getElementById('setting-theme');
  const accentEl = document.getElementById('setting-accent');
  const rateEl = document.getElementById('setting-rate');
  const modeEl = document.getElementById('setting-mode');

  fontEl.value = s.fontSize;
  themeEl.value = s.theme;
  accentEl.value = s.accent;
  rateEl.value = s.speechRate;
  modeEl.value = s.practiceMode;
  document.getElementById('font-size-val').textContent = s.fontSize;
  document.getElementById('speech-rate-val').textContent = s.speechRate;

  const save = async () => {
    userData.settings.fontSize = +fontEl.value;
    userData.settings.theme = themeEl.value;
    userData.settings.accent = accentEl.value;
    userData.settings.speechRate = +rateEl.value;
    userData.settings.practiceMode = modeEl.value;
    document.getElementById('font-size-val').textContent = fontEl.value;
    document.getElementById('speech-rate-val').textContent = rateEl.value;
    applySettingsToDOM(userData.settings);
    await saveAll(userData);
  };

  [fontEl, themeEl, accentEl, rateEl, modeEl].forEach((el) => el.addEventListener('change', save));
}

function renderArticles() {
  const grid = document.getElementById('article-grid');
  grid.innerHTML = stories.map((story) => {
    const prog = getStoryProgress(userData, story.id);
    return `
      <div class="article-card" data-id="${story.id}">
        <h3>第 ${story.id} 篇 · ${story.title}</h3>
        <div class="meta">${story.titleEn || ''}</div>
        <div class="meta">进度 ${prog.percent}% (${prog.completed}/${prog.total || '—'})</div>
        <div class="progress-mini"><div class="progress-mini-fill" style="width:${prog.percent}%"></div></div>
      </div>`;
  }).join('');

  grid.querySelectorAll('.article-card').forEach((card) => {
    card.addEventListener('click', () => startPractice(+card.dataset.id));
  });
}

function startPractice(storyId) {
  const story = stories.find((s) => s.id === storyId);
  if (!story) return;

  const { fullSentences, segments } = splitStory(story.content, story.contentCn || '');

  const saved = getStoryProgress(userData, storyId);
  let startIdx = saved.completed || 0;
  if (startIdx >= segments.length) startIdx = 0;

  practice = {
    story,
    segments,
    fullSentences,
    mode: userData.settings.practiceMode || 'segment',
    currentIdx: startIdx,
    hintShown: false,
    waiting: false
  };

  document.getElementById('practice-story-title').textContent = `第 ${story.id} 篇 · ${story.title}`;
  document.querySelectorAll('.mode-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.mode === practice.mode);
  });

  showPage('practice');
  showSentence();
}

function getCurrentText() {
  if (!practice) return '';
  const { segments, currentIdx } = practice;
  return segments[currentIdx]?.text || '';
}

function getCurrentSegment() {
  if (!practice) return null;
  return practice.segments[practice.currentIdx] || null;
}

function renderSentenceTranslation(seg, complete = false) {
  const translationEl = document.getElementById('sentence-translation');
  if (!translationEl) return;
  translationEl.textContent = seg?.translation || '（暂无中文翻译）';
  translationEl.hidden = false;
  translationEl.classList.toggle('is-complete', complete);
}

function clearAdvanceTimer() {
  if (advanceTimer) {
    clearTimeout(advanceTimer);
    advanceTimer = null;
  }
}

function resetSentenceState() {
  clearAdvanceTimer();
  playSessionId++;
  stop();
  if (practice) {
    practice.sentenceDone = false;
    practice.completing = false;
  }
}

function showSentence() {
  if (!practice) return;
  resetSentenceState();
  const { segments, currentIdx, mode } = practice;
  const seg = segments[currentIdx];
  if (!seg) { finishPractice(); return; }

  const display = document.getElementById('sentence-display');
  const input = document.getElementById('typing-input');
  const feedback = document.getElementById('feedback');

  input.value = '';
  input.className = '';
  input.disabled = false;
  feedback.textContent = '';
  feedback.className = 'feedback';
  document.getElementById('typing-words').innerHTML = '';
  practice.hintShown = false;

  const text = getCurrentText();
  if (mode === 'blind') {
    display.textContent = '盲打模式：请听音打字';
    display.classList.add('blind');
  } else {
    display.textContent = text;
    display.classList.remove('blind');
  }

  renderSentenceTranslation(seg, false);

  renderWordHints(text);
  updateTypingProgress('');
  updatePracticeProgress();

  document.getElementById('practice-progress-text').textContent =
    `第 ${currentIdx + 1} / ${segments.length} 句`;

  playCurrent();
  input.focus();
  updateSentenceNavButtons();
}

function goToSentence(delta) {
  if (!practice) return;
  const target = practice.currentIdx + delta;
  if (target < 0 || target >= practice.segments.length) return;

  resetSentenceState();
  practice.currentIdx = target;
  updateStoryProgress(userData, practice.story.id, target, practice.segments.length);
  saveAll(userData);
  showSentence();
}

function updateSentenceNavButtons() {
  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');
  if (!practice || !prevBtn || !nextBtn) return;
  prevBtn.disabled = practice.currentIdx <= 0;
  nextBtn.disabled = practice.currentIdx >= practice.segments.length - 1;
}

function renderWordHints(sentence) {
  const container = document.getElementById('word-hints');
  const words = extractWords(sentence).filter(isContentWord);
  container.innerHTML = words.map((w) => {
    const { cn, ipa } = lookupEntry(w);
    const saved = isWordSaved(userData, w);
    const ipaHtml = ipa ? `<span class="phonetic">${escapeHtml(ipa)}</span>` : '';
    return `<span class="word-chip ${saved ? 'saved' : ''}">
      <strong>${escapeHtml(w)}</strong>${ipaHtml}
      <span class="meaning">${escapeHtml(cn)}</span>
      <button data-word="${escapeHtml(w)}" data-meaning="${escapeHtml(cn)}" data-phonetic="${escapeHtml(ipa)}" title="收藏生词">${saved ? '★' : '☆'}</button>
    </span>`;
  }).join('');

  container.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const word = btn.dataset.word;
      const meaning = btn.dataset.meaning;
      const phonetic = btn.dataset.phonetic || '';
      toggleVocabulary(userData, word, meaning, practice.story.title, phonetic);
      await saveAll(userData);
      renderWordHints(sentence);
      renderVocab();
    });
  });
}

function updateTypingProgress(inputValue) {
  const input = document.getElementById('typing-input');
  const feedback = document.getElementById('feedback');
  const progressEl = document.getElementById('typing-words');
  if (!practice || !progressEl) return;

  const expected = getCurrentText();
  const value = inputValue ?? input.value;
  const result = analyzeWordProgress(expected, value);

  progressEl.innerHTML = renderWordProgressHtml(result.states);
  progressEl.classList.toggle('has-error', result.firstError >= 0);

  input.classList.remove('correct', 'wrong', 'typing');
  if (result.sentenceComplete) {
    input.classList.add('correct');
    if (!practice.sentenceDone) {
      scheduleSentenceComplete();
    }
  } else if (practice.sentenceDone) {
    practice.sentenceDone = false;
    clearAdvanceTimer();
    input.disabled = false;
  } else if (result.firstError >= 0) {
    input.classList.add('wrong');
    const bad = result.states[result.firstError];
    feedback.textContent = `✗ 第 ${result.firstError + 1} 个单词「${bad.text}」有误`;
    feedback.className = 'feedback err';
  } else if (value.trim()) {
    input.classList.add('typing');
    feedback.textContent = `已完成 ${result.doneCount} / ${result.expectedCount} 个单词`;
    feedback.className = 'feedback';
  } else {
    feedback.textContent = '';
    feedback.className = 'feedback';
  }

  return result;
}

async function playCurrent() {
  if (!practice) return;
  const text = getCurrentText();
  const { accent, speechRate } = userData.settings;
  const session = ++playSessionId;
  const feedback = document.getElementById('feedback');

  await speakRepeat(text, accent, speechRate, READ_TIMES, (round, total) => {
    if (!practice || session !== playSessionId) return;
    if (!practice.sentenceDone) {
      feedback.textContent = `🔊 朗读中 ${round}/${total}`;
      feedback.className = 'feedback';
    }
  });
}

function scheduleSentenceComplete() {
  if (!practice || practice.sentenceDone) return;
  practice.sentenceDone = true;
  playSessionId++;
  stop();

  const input = document.getElementById('typing-input');
  const feedback = document.getElementById('feedback');
  const display = document.getElementById('sentence-display');
  const seg = getCurrentSegment();

  input.disabled = true;
  input.classList.add('correct');

  if (seg) {
    display.textContent = seg.text;
    display.classList.remove('blind');
    renderSentenceTranslation(seg, true);
  }

  feedback.textContent = '✓ 全部正确！3 秒后进入下一句…';
  feedback.className = 'feedback ok';

  clearAdvanceTimer();
  advanceTimer = setTimeout(() => advanceToNextSentence(), AUTO_ADVANCE_MS);
}

async function advanceToNextSentence() {
  if (!practice || practice.completing) return;
  practice.completing = true;
  clearAdvanceTimer();
  playSessionId++;
  stop();

  const nextIdx = practice.currentIdx + 1;
  updateStoryProgress(userData, practice.story.id, nextIdx, practice.segments.length);
  await saveAll(userData);

  practice.completing = false;
  practice.sentenceDone = false;
  practice.currentIdx = nextIdx;

  if (practice.currentIdx >= practice.segments.length) {
    finishPractice();
  } else {
    showSentence();
  }
}

function updatePracticeProgress() {
  if (!practice) return;
  const pct = Math.round((practice.currentIdx / practice.segments.length) * 100);
  document.getElementById('progress-bar').style.width = pct + '%';
}

async function submitAnswer() {
  if (!practice || practice.sentenceDone) return;
  const input = document.getElementById('typing-input');
  const feedback = document.getElementById('feedback');
  const expected = getCurrentText();
  const result = updateTypingProgress(input.value);

  if (result.sentenceComplete) return;

  if (result.allWordsDone) {
    input.classList.add('wrong');
    feedback.textContent = '✗ 单词已全部正确，但标点或大小写与原文不一致';
    feedback.className = 'feedback err';
  } else if (result.firstError >= 0) {
    input.classList.add('wrong');
    addWrongSentence(userData, {
      id: Date.now(),
      storyId: practice.story.id,
      storyTitle: practice.story.title,
      sentenceIndex: practice.currentIdx,
      text: expected,
      userInput: input.value
    });
    await saveAll(userData);
    renderWrong();
  } else {
    feedback.textContent = `请继续输入（${result.doneCount}/${result.expectedCount} 个单词）`;
    feedback.className = 'feedback';
  }
}

function finishPractice() {
  const storyId = practice.story.id;
  updateStoryProgress(userData, storyId, practice.segments.length, practice.segments.length);
  saveAll(userData);
  practice = null;
  alert('本篇练习完成！');
  renderArticles();
  showPage('articles');
  document.querySelector('.nav-btn[data-page="articles"]').classList.add('active');
}

function bindPracticeControls() {
  document.getElementById('btn-back').addEventListener('click', () => {
    resetSentenceState();
    if (practice) {
      updateStoryProgress(userData, practice.story.id, practice.currentIdx, practice.segments.length);
      saveAll(userData);
      practice = null;
    }
    renderArticles();
    showPage('articles');
  });

  document.querySelectorAll('.mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!practice) return;
      practice.mode = btn.dataset.mode;
      document.querySelectorAll('.mode-btn').forEach((b) => b.classList.toggle('active', b === btn));
      showSentence();
    });
  });

  document.getElementById('typing-input').addEventListener('input', (e) => {
    updateTypingProgress(e.target.value);
  });

  document.getElementById('typing-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitAnswer();
  });

  document.getElementById('btn-replay').addEventListener('click', () => playCurrent());
  document.getElementById('btn-prev').addEventListener('click', () => goToSentence(-1));
  document.getElementById('btn-next').addEventListener('click', () => goToSentence(1));
  document.getElementById('btn-hint').addEventListener('click', () => {
    if (!practice || practice.mode !== 'blind') return;
    const display = document.getElementById('sentence-display');
    display.textContent = getCurrentText();
    display.classList.remove('blind');
    practice.hintShown = true;
  });
}

function renderWrong() {
  const list = document.getElementById('wrong-list');
  const items = userData.wrongSentences;
  document.getElementById('wrong-count').textContent = `共 ${items.length} 条错题`;
  if (!items.length) {
    list.innerHTML = '<div class="empty-state">暂无错题，继续加油！</div>';
    return;
  }
  list.innerHTML = items.map((w) => `
    <div class="card-item">
      <div class="text">
        <div class="en">${escapeHtml(w.text)}</div>
        <div class="cn">你的输入：${escapeHtml(w.userInput || '')} · ${escapeHtml(w.storyTitle)}</div>
      </div>
      <div class="actions">
        <button data-id="${w.id}" class="btn-practice-wrong">再练</button>
        <button data-id="${w.id}" class="btn-remove-wrong">删除</button>
      </div>
    </div>`).join('');

  list.querySelectorAll('.btn-remove-wrong').forEach((btn) => {
    btn.addEventListener('click', async () => {
      removeWrongSentence(userData, +btn.dataset.id);
      await saveAll(userData);
      renderWrong();
    });
  });
}

function renderVocab() {
  const list = document.getElementById('vocab-list');
  const items = userData.vocabulary;
  document.getElementById('vocab-count').textContent = `共 ${items.length} 个生词`;
  if (!items.length) {
    list.innerHTML = '<div class="empty-state">练习时点击 ☆ 收藏生词</div>';
    return;
  }
  list.innerHTML = items.map((v) => `
    <div class="card-item">
      <div class="text">
        <div class="en"><strong>${escapeHtml(v.word)}</strong>${v.phonetic ? ` <span class="phonetic">${escapeHtml(v.phonetic)}</span>` : ''}</div>
        <div class="cn">${escapeHtml(v.meaning)} · ${escapeHtml(v.storyTitle || '')}</div>
      </div>
      <div class="actions">
        <button data-word="${escapeHtml(v.word)}" class="btn-remove-vocab">取消收藏</button>
      </div>
    </div>`).join('');

  list.querySelectorAll('.btn-remove-vocab').forEach((btn) => {
    btn.addEventListener('click', async () => {
      userData.vocabulary = userData.vocabulary.filter((v) => v.word !== btn.dataset.word);
      await saveAll(userData);
      renderVocab();
    });
  });
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

init();
