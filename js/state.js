/**
 * GRE Verbal Master - State Management & Storage Module
 */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'gre_verbal_app_state_v3';

  const state = {
    allData: [],
    filteredQuestions: [],
    currentIndex: 0,
    mode: 'study', // 'study' | 'exam'
    filters: {
      section: 'all',
      type: 'all',
      difficulty: 'all',
      status: 'all' // 'all' | 'bookmarks' | 'incorrect'
    },
    userAnswers: {},     // qId -> Array of selected labels e.g. ["A", "C"]
    checkedQuestions: {}, // qId -> boolean
    bookmarks: new Set(),
    examTimer: {
      duration: 35 * 60,
      remaining: 35 * 60,
      intervalId: null,
      isActive: false
    },
    settings: {
      theme: 'dark',
      fontSize: 100,
      fontFamily: 'serif'
    }
  };

  function initData(dataset) {
    state.allData = Array.isArray(dataset) ? dataset : [];
    applyFilters();
  }

  function saveState() {
    try {
      const dataToSave = {
        userAnswers: state.userAnswers,
        checkedQuestions: state.checkedQuestions,
        bookmarks: Array.from(state.bookmarks),
        settings: state.settings,
        filters: state.filters,
        mode: state.mode
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  function loadSavedState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.userAnswers) state.userAnswers = parsed.userAnswers;
        if (parsed.checkedQuestions) state.checkedQuestions = parsed.checkedQuestions;
        if (parsed.bookmarks) state.bookmarks = new Set(parsed.bookmarks);
        if (parsed.settings) state.settings = Object.assign(state.settings, parsed.settings);
        if (parsed.filters) state.filters = Object.assign(state.filters, parsed.filters);
        if (parsed.mode) state.mode = parsed.mode;
      }
    } catch (e) {
      console.warn('LocalStorage load failed:', e);
    }
  }

  function arraysEqual(a, b) {
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, idx) => val === sortedB[idx]);
  }

  function applyFilters() {
    let list = state.allData;

    // Section Filter
    if (state.filters.section !== 'all') {
      if (state.filters.section.startsWith('ch')) {
        const [chCode, sCode] = state.filters.section.split('-');
        const chNum = parseInt(chCode.replace('ch', ''), 10);
        if (chNum === 2) {
          list = list.filter(q => q.chapter === 2);
        } else if (sCode) {
          const sNum = parseInt(sCode.replace('s', ''), 10);
          if (chNum === 6) {
            list = list.filter(q => q.chapter === 6 && q.set.includes(`Set ${sNum}`));
          } else {
            list = list.filter(q => q.chapter === chNum && q.set.toLowerCase().includes(`set ${sNum}`));
          }
        }
      }
    }

    // Type Filter
    if (state.filters.type !== 'all') {
      list = list.filter(q => q.type === state.filters.type);
    }

    // Difficulty Filter
    if (state.filters.difficulty !== 'all') {
      list = list.filter(q => q.difficulty === state.filters.difficulty);
    }

    // Status Filter
    if (state.filters.status === 'bookmarks') {
      list = list.filter(q => state.bookmarks.has(q.id));
    } else if (state.filters.status === 'incorrect') {
      list = list.filter(q => {
        const ans = state.userAnswers[q.id];
        return ans && !arraysEqual(ans, q.correctAnswer);
      });
    }

    state.filteredQuestions = list;
    if (state.currentIndex >= list.length) {
      state.currentIndex = Math.max(0, list.length - 1);
    }
  }

  // Export module
  global.GREState = {
    state,
    initData,
    saveState,
    loadSavedState,
    applyFilters,
    arraysEqual
  };

})(typeof window !== 'undefined' ? window : globalThis);
