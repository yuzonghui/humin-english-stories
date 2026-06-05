let synth = window.speechSynthesis;
let voices = [];
let currentUtterance = null;

export function initSpeech() {
  loadVoices();
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = loadVoices;
  }
}

function loadVoices() {
  voices = synth.getVoices();
}

export function getAvailableAccents() {
  return [
    { code: 'en-US', label: '美音 (US)' },
    { code: 'en-GB', label: '英音 (UK)' }
  ];
}

function pickVoice(accent) {
  if (!voices.length) voices = synth.getVoices();
  const lang = accent.startsWith('en-GB') ? 'en-GB' : 'en-US';
  const exact = voices.find((v) => v.lang === lang);
  const prefix = voices.find((v) => v.lang.startsWith(lang.split('-')[0]));
  return exact || prefix || voices.find((v) => v.lang.startsWith('en')) || null;
}

export function speak(text, accent = 'en-US', rate = 0.9) {
  return new Promise((resolve) => {
    stop();
    if (!text.trim()) {
      resolve();
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    const voice = pickVoice(accent);
    if (voice) utter.voice = voice;
    utter.lang = accent;
    utter.rate = rate;
    utter.onend = () => resolve();
    utter.onerror = () => resolve();
    currentUtterance = utter;
    synth.speak(utter);
  });
}

export async function speakRepeat(text, accent = 'en-US', rate = 0.9, times = 10, onRound) {
  for (let i = 0; i < times; i++) {
    if (onRound) onRound(i + 1, times);
    await speak(text, accent, rate);
  }
}

export function stop() {
  synth.cancel();
  currentUtterance = null;
}

export function isSpeaking() {
  return synth.speaking;
}

export function replay() {
  /* handled by caller re-invoking speak */
}
