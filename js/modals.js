/**
 * GRE Verbal Master - Modals, Navigator Grid, PDF Viewer & Settings Module
 */

(function (global) {
  'use strict';

  function getDOM() {
    return {
      gridModal: document.getElementById('grid-modal'),
      questionGridContainer: document.getElementById('question-grid-container'),
      statsModal: document.getElementById('stats-modal'),
      statTotalCompleted: document.getElementById('stat-total-completed'),
      statAccuracyRate: document.getElementById('stat-accuracy-rate'),
      statTotalBookmarks: document.getElementById('stat-total-bookmarks'),
      settingsModal: document.getElementById('settings-modal'),
      fontSizeLabel: document.getElementById('font-size-label'),
      
      // PDF Modal
      pdfModal: document.getElementById('pdf-modal'),
      pdfModalTitle: document.getElementById('pdf-modal-title'),
      pdfViewerFrame: document.getElementById('pdf-viewer-frame'),
      pdfTabQuestion: document.getElementById('pdf-tab-question'),
      pdfTabAnswer: document.getElementById('pdf-tab-answer'),
      pdfTabQNum: document.getElementById('pdf-tab-q-num'),
      pdfTabAnsNum: document.getElementById('pdf-tab-ans-num'),
      pdfOpenNewTab: document.getElementById('pdf-open-new-tab')
    };
  }

  function openModal(modal) {
    if (modal) modal.classList.remove('hidden');
  }

  function closeModal(modal) {
    if (modal) modal.classList.add('hidden');
  }

  function openPdfModal(targetPage = null, activeTab = 'question') {
    const DOM = getDOM();
    const { state } = global.GREState;
    const q = state.filteredQuestions[state.currentIndex];
    if (!q) return;

    const qPage = q.pdfPageQuestion || 24;
    const ansPage = q.pdfPageAnswer || 24;
    const pageToLoad = targetPage || (activeTab === 'question' ? qPage : ansPage);

    if (DOM.pdfTabQNum) DOM.pdfTabQNum.textContent = qPage;
    if (DOM.pdfTabAnsNum) DOM.pdfTabAnsNum.textContent = ansPage;
    if (DOM.pdfModalTitle) DOM.pdfModalTitle.textContent = `PDF Source: Ch ${q.chapter} Q${q.questionNumber}`;

    if (DOM.pdfTabQuestion && DOM.pdfTabAnswer) {
      DOM.pdfTabQuestion.classList.toggle('active', activeTab === 'question');
      DOM.pdfTabAnswer.classList.toggle('active', activeTab === 'answer');
    }

    const pdfUrl = `Official%20GRE%20Verbal.pdf#page=${pageToLoad}`;
    if (DOM.pdfViewerFrame) {
      DOM.pdfViewerFrame.src = pdfUrl;
    }
    if (DOM.pdfOpenNewTab) {
      DOM.pdfOpenNewTab.href = pdfUrl;
    }

    openModal(DOM.pdfModal);
  }

  function switchPdfTab(tabName) {
    const DOM = getDOM();
    const { state } = global.GREState;
    const q = state.filteredQuestions[state.currentIndex];
    if (!q) return;

    const targetPage = (tabName === 'question') ? (q.pdfPageQuestion || 24) : (q.pdfPageAnswer || 24);
    openPdfModal(targetPage, tabName);
  }

  function renderQuestionGrid() {
    const DOM = getDOM();
    const { state, arraysEqual } = global.GREState;
    DOM.questionGridContainer.innerHTML = '';

    state.filteredQuestions.forEach((q, idx) => {
      const btn = document.createElement('button');
      btn.className = 'grid-q-btn';
      btn.textContent = idx + 1;

      if (idx === state.currentIndex) btn.classList.add('current');
      if (state.bookmarks.has(q.id)) btn.classList.add('has-bookmark');

      const ans = state.userAnswers[q.id];
      if (ans && ans.length > 0) {
        if (state.checkedQuestions[q.id] || state.mode === 'exam') {
          const isCorrect = arraysEqual(ans, q.correctAnswer);
          btn.classList.add(isCorrect ? 'answered-correct' : 'answered-incorrect');
        } else {
          btn.classList.add('answered-correct');
        }
      }

      btn.addEventListener('click', () => {
        state.currentIndex = idx;
        closeModal(DOM.gridModal);
        global.GRERenderer.renderCurrentQuestion();
      });

      DOM.questionGridContainer.appendChild(btn);
    });
  }

  function updateStatsModal() {
    const DOM = getDOM();
    const { state, arraysEqual } = global.GREState;
    const completed = Object.keys(state.userAnswers).length;
    let correct = 0;

    state.allData.forEach(q => {
      const ans = state.userAnswers[q.id];
      if (ans && arraysEqual(ans, q.correctAnswer)) {
        correct++;
      }
    });

    const acc = completed > 0 ? Math.round((correct / completed) * 100) : 0;

    DOM.statTotalCompleted.textContent = completed;
    DOM.statAccuracyRate.textContent = `${acc}%`;
    DOM.statTotalBookmarks.textContent = state.bookmarks.size;
  }

  function applySettings() {
    const DOM = getDOM();
    const { state } = global.GREState;
    document.body.className = `theme-${state.settings.theme}`;
    document.documentElement.style.setProperty('--passage-font-size', `${state.settings.fontSize / 100 * 1.0}rem`);
    document.documentElement.style.setProperty('--passage-font-family', state.settings.fontFamily === 'sans' ? 'var(--font-sans)' : 'var(--font-serif)');
    if (DOM.fontSizeLabel) {
      DOM.fontSizeLabel.textContent = `${state.settings.fontSize}%`;
    }

    document.querySelectorAll('.theme-choice-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.setTheme === state.settings.theme);
    });
    document.querySelectorAll('.font-family-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.setFont === state.settings.fontFamily);
    });
  }

  global.GREModals = {
    openModal,
    closeModal,
    openPdfModal,
    switchPdfTab,
    renderQuestionGrid,
    updateStatsModal,
    applySettings
  };

})(typeof window !== 'undefined' ? window : globalThis);
