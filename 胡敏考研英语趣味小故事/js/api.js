(function () {
  const STORAGE_KEY = 'humin-english-user-data';

  const defaultUserData = {
    progress: {},
    wrongSentences: [],
    vocabulary: [],
    settings: {
      fontSize: 16,
      theme: 'light',
      accent: 'en-US',
      practiceMode: 'segment',
      speechRate: 0.9
    }
  };

  window.api = {
    loadUserData() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return Promise.resolve(raw ? JSON.parse(raw) : { ...defaultUserData });
      } catch {
        return Promise.resolve({ ...defaultUserData });
      }
    },

    saveUserData(data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return Promise.resolve(true);
    },

    loadStories() {
      return fetch('data/stories.json').then((r) => {
        if (!r.ok) throw new Error('无法加载故事数据');
        return r.json();
      });
    }
  };
})();
