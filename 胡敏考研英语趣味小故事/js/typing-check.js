/**
 * 逐词输入校验
 */
import { normalizeForCompare } from './sentence-splitter.js';

function normWord(w) {
  return w
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,!?;:"']/g, '');
}

export function getExpectedWords(sentence) {
  const matches = sentence.match(/[a-zA-Z\u00C0-\u024F']+/g) || [];
  return matches.map((raw) => ({ raw, norm: normWord(raw) }));
}

export function splitInputWords(input) {
  if (!input) return { completed: [], partial: '' };
  const endsWithSpace = /[\s]$/.test(input);
  const parts = input.trim().split(/\s+/).filter((p, i, arr) => p.length > 0 || arr.length === 1);
  if (!parts.length) return { completed: [], partial: '' };
  if (endsWithSpace) return { completed: parts, partial: '' };
  const partial = parts.pop() || '';
  return { completed: parts, partial };
}

export function analyzeWordProgress(expectedSentence, input) {
  const expected = getExpectedWords(expectedSentence);
  const { completed, partial } = splitInputWords(input);

  const states = expected.map((ew) => ({
    text: ew.raw,
    status: 'pending'
  }));

  let firstError = -1;

  for (let i = 0; i < expected.length; i++) {
    if (i < completed.length) {
      const ok = normWord(completed[i]) === expected[i].norm;
      states[i].status = ok ? 'correct' : 'wrong';
      if (!ok && firstError === -1) firstError = i;
    } else if (i === completed.length && partial) {
      const pn = normWord(partial);
      if (pn === expected[i].norm) states[i].status = 'typing-ok';
      else if (expected[i].norm.startsWith(pn)) states[i].status = 'typing';
      else {
        states[i].status = 'wrong';
        if (firstError === -1) firstError = i;
      }
    }
  }

  const allWordsDone =
    completed.length === expected.length &&
    !partial &&
    expected.every((ew, i) => normWord(completed[i]) === ew.norm);

  return {
    states,
    allWordsDone,
    sentenceComplete: allWordsDone && normalizeForCompare(expectedSentence) === normalizeForCompare(input),
    firstError,
    expectedCount: expected.length,
    doneCount: completed.filter((w, i) => normWord(w) === expected[i]?.norm).length
  };
}

export function renderWordProgressHtml(states) {
  if (!states.length) return '';
  return states
    .map((s) => `<span class="tw tw-${s.status}">${escapeHtml(s.text)}</span>`)
    .join(' ');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
