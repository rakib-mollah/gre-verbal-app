/**
 * GRE Verbal Master - Interactive Application Engine
 * Pure Vanilla JavaScript (Zero External Dependencies)
 * Fully compatible with GitHub Pages & Mobile Browsers
 */

(function () {
  'use strict';

  // --- App State ---
  const state = {
    allData: (typeof GRE_DATA !== 'undefined') ? GRE_DATA : [],
    filteredQuestions: [],
    currentIndex: 0,
    mode: 'study', // 'study' | 'exam'
    filters: {
      section: 'all',
      type: 'all',
      difficulty: 'all',
      status: 'all' // 'all' | 'bookmarks' | 'incorrect'
    },
    userAnswers: {},     // qId -> Array of selected option labels e.g. ["A", "C"]
    checkedQuestions: {}, // qId -> boolean (true if answer was checked in study mode)
    bookmarks: new Set(),
    examTimer: {
      duration: 35 * 60, // 35 minutes for GRE verbal set
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

  // --- Storage Helpers ---
  const STORAGE_KEY = 'gre_verbal_app_state_v2';

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

  // --- DOM Elements Cache ---
  const DOM = {
    sectionSelect: document.getElementById('section-select'),
    modeStudyBtn: document.getElementById('mode-study-btn'),
    modeExamBtn: document.getElementById('mode-exam-btn'),
    filterPills: document.querySelectorAll('.filter-pill'),
    bookmarkCount: document.getElementById('bookmark-count'),
    examTimerBar: document.getElementById('exam-timer-bar'),
    examTimerText: document.getElementById('exam-timer-text'),
    examReviewBtn: document.getElementById('exam-review-btn'),
    examSubmitBtn: document.getElementById('exam-submit-btn'),
    progressBar: document.getElementById('progress-bar'),
    quizLayout: document.getElementById('quiz-layout'),
    
    // Mobile Passage Accordion
    mobilePassageAccordion: document.getElementById('mobile-passage-accordion'),
    mobilePassageHeaderBtn: document.getElementById('mobile-passage-header-btn'),
    mobilePassageTitle: document.getElementById('mobile-passage-title'),
    mobilePassageText: document.getElementById('mobile-passage-text'),
    mobilePassageDescContainer: document.getElementById('mobile-passage-desc-container'),
    btnToggleMobileDesc: document.getElementById('btn-toggle-mobile-desc'),
    mobileDescContent: document.getElementById('mobile-desc-content'),
    mobilePassageDescText: document.getElementById('mobile-passage-desc-text'),
    mobileDescChevron: document.getElementById('mobile-desc-chevron'),
    mobilePassageChevron: document.getElementById('mobile-passage-chevron'),

    // Desktop Passage Panel
    passagePanel: document.getElementById('passage-panel'),
    passageTitle: document.getElementById('passage-title'),
    passageText: document.getElementById('passage-text'),
    desktopPassageDescContainer: document.getElementById('desktop-passage-desc-container'),
    btnToggleDesktopDesc: document.getElementById('btn-toggle-desktop-desc'),
    desktopDescContent: document.getElementById('desktop-desc-content'),
    passageDescText: document.getElementById('passage-desc-text'),
    desktopDescChevron: document.getElementById('desktop-desc-chevron'),

    // Question
    qCounter: document.getElementById('q-counter'),
    qBadgeChapter: document.getElementById('q-badge-chapter'),
    qBadgeType: document.getElementById('q-badge-type'),
    qBadgeDiff: document.getElementById('q-badge-diff'),
    bookmarkBtn: document.getElementById('bookmark-btn'),
    qInstruction: document.getElementById('q-instruction'),
    qPrompt: document.getElementById('q-prompt'),
    optionsForm: document.getElementById('options-form'),

    // Actions & Explanation
    btnCheckAnswer: document.getElementById('btn-check-answer'),
    btnClearSelection: document.getElementById('btn-clear-selection'),
    explanationContainer: document.getElementById('explanation-container'),
    explanationToggleBtn: document.getElementById('explanation-toggle-btn'),
    expStatusIcon: document.getElementById('exp-status-icon'),
    expHeaderText: document.getElementById('exp-header-text'),
    expHeaderSub: document.getElementById('exp-header-sub'),
    expCorrectKey: document.getElementById('exp-correct-key'),
    expPassageSummary: document.getElementById('exp-passage-summary'),
    btnToggleExpDesc: document.getElementById('btn-toggle-exp-desc'),
    expDescContent: document.getElementById('exp-desc-content'),
    expPassageSummaryText: document.getElementById('exp-passage-summary-text'),
    expDescChevron: document.getElementById('exp-desc-chevron'),
    expDetailsText: document.getElementById('exp-details-text'),

    // Navigation
    btnPrev: document.getElementById('btn-prev'),
    btnNext: document.getElementById('btn-next'),
    navQIndicator: document.getElementById('nav-q-indicator'),
    mobileBtnPrev: document.getElementById('mobile-btn-prev'),
    mobileBtnNext: document.getElementById('mobile-btn-next'),
    mobileBtnGrid: document.getElementById('mobile-btn-grid'),
    mobileBtnBookmark: document.getElementById('mobile-btn-bookmark'),
    mobileGridIndicator: document.getElementById('mobile-grid-indicator'),
    mobileBmStar: document.getElementById('mobile-bm-star'),

    // Modals
    gridModal: document.getElementById('grid-modal'),
    statsModal: document.getElementById('stats-modal'),
    settingsModal: document.getElementById('settings-modal'),
    examReviewModal: document.getElementById('exam-review-modal'),
    examScoreModal: document.getElementById('exam-score-modal'),
    
    // Quick toggles
    btnGridToggle: document.getElementById('btn-grid-toggle'),
    btnStatsToggle: document.getElementById('btn-stats-toggle'),
    btnSettingsToggle: document.getElementById('btn-settings-toggle'),
    btnCloseGrid: document.getElementById('btn-close-grid'),
    btnCloseStats: document.getElementById('btn-close-stats'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    btnCloseReview: document.getElementById('btn-close-review'),
    btnCloseScore: document.getElementById('btn-close-score'),

    // Stats & Settings
    statTotalCompleted: document.getElementById('stat-total-completed'),
    statAccuracyRate: document.getElementById('stat-accuracy-rate'),
    statTotalBookmarks: document.getElementById('stat-total-bookmarks'),
    btnFilterIncorrect: document.getElementById('btn-filter-incorrect'),
    btnFilterBookmarks: document.getElementById('btn-filter-bookmarks'),
    btnResetProgress: document.getElementById('btn-reset-progress'),
    fontSizeDec: document.getElementById('font-size-dec'),
    fontSizeInc: document.getElementById('font-size-inc'),
    fontSizeLabel: document.getElementById('font-size-label'),
    questionGridContainer: document.getElementById('question-grid-container'),
    examReviewTable: document.getElementById('exam-review-table'),
    revAnsweredCount: document.getElementById('rev-answered-count'),
    revUnansweredCount: document.getElementById('rev-unanswered-count'),
    revMarkedCount: document.getElementById('rev-marked-count'),
    btnContinueExam: document.getElementById('btn-continue-exam'),
    btnFinishExamModal: document.getElementById('btn-finish-exam-modal'),
    btnReviewExamMistakes: document.getElementById('btn-review-exam-mistakes'),
    btnRestartExam: document.getElementById('btn-restart-exam'),
    scorePercentage: document.getElementById('score-percentage'),
    scoreGreEstimate: document.getElementById('score-gre-estimate'),
    scoreSummaryText: document.getElementById('score-summary-text'),
    scoreTypeBars: document.getElementById('score-type-bars'),
    scoreDiffBars: document.getElementById('score-diff-bars')
  };

  // --- Initialization ---
  function init() {
    loadSavedState();
    applySettings();
    applyFilters();
    bindEvents();
    renderCurrentQuestion();
    updateBookmarkBadge();
  }

  // --- Filtering Logic ---
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
    updateProgressUI();
  }

  function arraysEqual(a, b) {
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, idx) => val === sortedB[idx]);
  }

  // --- Rendering ---
  function renderCurrentQuestion() {
    const q = state.filteredQuestions[state.currentIndex];
    
    if (!q) {
      renderEmptyState();
      return;
    }

    // Update Meta Indicators
    DOM.qCounter.textContent = `Q ${state.currentIndex + 1} of ${state.filteredQuestions.length}`;
    DOM.navQIndicator.textContent = `${state.currentIndex + 1} / ${state.filteredQuestions.length}`;
    DOM.mobileGridIndicator.textContent = `Q ${state.currentIndex + 1}/${state.filteredQuestions.length}`;
    
    DOM.qBadgeChapter.textContent = `Ch ${q.chapter}: ${q.set.split(':')[0]}`;
    DOM.qBadgeType.textContent = formatQuestionType(q);
    
    DOM.qBadgeDiff.textContent = q.difficulty;
    DOM.qBadgeDiff.className = `badge badge-diff diff-${q.difficulty.toLowerCase()}`;

    // Bookmark status
    const isBookmarked = state.bookmarks.has(q.id);
    DOM.bookmarkBtn.classList.toggle('active', isBookmarked);
    DOM.bookmarkBtn.querySelector('.bookmark-icon').textContent = isBookmarked ? '★' : '☆';
    DOM.mobileBtnBookmark.classList.toggle('active', isBookmarked);
    DOM.mobileBmStar.textContent = isBookmarked ? '★' : '☆';

    // Instruction & Prompt
    DOM.qInstruction.textContent = getQuestionInstruction(q);
    DOM.qPrompt.innerHTML = formatPromptText(q.prompt);

    // Reset collapsible description panels to closed state by default
    collapseOverviewPanels();

    // Passage handling
    if (q.type === 'rc' && q.passage && q.passage.text) {
      // Desktop
      DOM.passagePanel.classList.remove('hidden');
      DOM.quizLayout.classList.add('has-passage');
      DOM.passageTitle.textContent = q.passage.title || 'Reading Comprehension Passage';
      DOM.passageText.innerHTML = formatPassageText(q.passage.text);

      if (q.passage.description) {
        DOM.desktopPassageDescContainer.classList.remove('hidden');
        DOM.passageDescText.textContent = q.passage.description;
      } else {
        DOM.desktopPassageDescContainer.classList.add('hidden');
      }

      // Mobile Accordion
      DOM.mobilePassageAccordion.classList.remove('hidden');
      DOM.mobilePassageTitle.textContent = q.passage.title || 'Reading Comprehension Passage';
      DOM.mobilePassageText.innerHTML = formatPassageText(q.passage.text);

      if (q.passage.description) {
        DOM.mobilePassageDescContainer.classList.remove('hidden');
        DOM.mobilePassageDescText.textContent = q.passage.description;
      } else {
        DOM.mobilePassageDescContainer.classList.add('hidden');
      }
    } else {
      DOM.passagePanel.classList.add('hidden');
      DOM.quizLayout.classList.remove('has-passage');
      DOM.mobilePassageAccordion.classList.add('hidden');
    }

    // Render Options
    renderOptions(q);

    // Explanation Accordion
    const isChecked = Boolean(state.checkedQuestions[q.id]);
    if (state.mode === 'study' && isChecked) {
      renderExplanation(q, true);
    } else {
      DOM.explanationContainer.classList.add('hidden');
      DOM.explanationContainer.classList.remove('open');
      DOM.explanationToggleBtn.setAttribute('aria-expanded', 'false');
    }

    // Nav Button States
    DOM.btnPrev.disabled = (state.currentIndex === 0);
    DOM.btnNext.disabled = (state.currentIndex === state.filteredQuestions.length - 1);
    DOM.mobileBtnPrev.disabled = (state.currentIndex === 0);
    DOM.mobileBtnNext.disabled = (state.currentIndex === state.filteredQuestions.length - 1);

    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateProgressUI();
  }

  function collapseOverviewPanels() {
    DOM.desktopDescContent.classList.add('hidden');
    DOM.desktopDescChevron.textContent = 'Click to show ▼';
    DOM.mobileDescContent.classList.add('hidden');
    DOM.mobileDescChevron.textContent = 'Click to show ▼';
    DOM.expDescContent.classList.add('hidden');
    DOM.expDescChevron.textContent = 'Click to view ▼';
  }

  function formatQuestionType(q) {
    if (q.type === 'rc') {
      if (q.subType === 'multi_choice') return 'Reading Comp (Multi-Select)';
      if (q.subType === 'select_sentence') return 'Reading Comp (Select Sentence)';
      return 'Reading Comprehension';
    }
    if (q.type === 'tc') {
      if (q.subType === 'tc_triple') return 'Text Completion (3 Blanks)';
      if (q.subType === 'tc_double') return 'Text Completion (2 Blanks)';
      return 'Text Completion (1 Blank)';
    }
    if (q.type === 'se') {
      return 'Sentence Equivalence (Select 2)';
    }
    return 'GRE Verbal Question';
  }

  function getQuestionInstruction(q) {
    if (q.type === 'se') {
      return 'Select the TWO answer choices that produce completed sentences that are alike in meaning.';
    }
    if (q.type === 'rc') {
      if (q.subType === 'multi_choice') {
        return 'Consider each choice separately and select ALL that apply (one, two, or all three).';
      }
      if (q.subType === 'select_sentence') {
        return 'Select the sentence from the passage that matches the description.';
      }
      return 'Select only one answer choice.';
    }
    if (q.type === 'tc') {
      if (q.subType === 'tc_triple' || q.subType === 'tc_double') {
        return 'For each blank, select ONE entry from the corresponding column of choices.';
      }
      return 'Select one entry to complete the blank in the sentence.';
    }
    return 'For each question, indicate the best answer choice(s).';
  }

  function formatPromptText(prompt) {
    return prompt.replace(/_{3,}/g, '<span style="text-decoration: underline; font-weight: 700;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>');
  }

  function formatPassageText(text) {
    const paras = text.split(/\n\s*\n|\n(?=[A-Z])/);
    return paras.map(p => `<p>${p.trim()}</p>`).join('');
  }

  function renderOptions(q) {
    DOM.optionsForm.innerHTML = '';
    const userSelected = state.userAnswers[q.id] || [];
    const isChecked = Boolean(state.checkedQuestions[q.id]);

    if (q.columns && q.columns.length > 0) {
      // Multi-blank Text Completion (Table layout)
      const tableContainer = document.createElement('div');
      tableContainer.className = 'tc-table-container';

      q.columns.forEach((col, colIdx) => {
        const colCard = document.createElement('div');
        colCard.className = 'tc-column';

        const colHeader = document.createElement('div');
        colHeader.className = 'tc-column-header';
        colHeader.textContent = col.blank;
        colCard.appendChild(colHeader);

        const list = document.createElement('div');
        list.className = 'tc-options-list';

        col.choices.forEach(c => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'tc-option-btn';
          btn.dataset.col = colIdx;
          btn.dataset.label = c.label;

          const isSel = userSelected.includes(c.label);
          if (isSel) btn.classList.add('selected');

          if (isChecked && state.mode === 'study') {
            const isCorrect = q.correctAnswer.includes(c.label);
            if (isCorrect) btn.classList.add('state-correct');
            else if (isSel) btn.classList.add('state-incorrect');
          }

          btn.innerHTML = `
            <span class="tc-pill">${c.label}</span>
            <span class="tc-text">${c.text}</span>
          `;

          btn.addEventListener('click', () => handleOptionClick(q, c.label, colIdx));
          list.appendChild(btn);
        });

        colCard.appendChild(list);
        tableContainer.appendChild(colCard);
      });

      DOM.optionsForm.appendChild(tableContainer);
    } else if (q.options && q.options.length > 0) {
      const isMulti = (q.type === 'se' || q.subType === 'multi_choice');

      q.options.forEach(opt => {
        const item = document.createElement('div');
        item.className = 'option-item';
        if (isMulti) item.classList.add('multi-select');

        const isSel = userSelected.includes(opt.label);
        if (isSel) item.classList.add('selected');

        if (isChecked && state.mode === 'study') {
          const isCorrect = q.correctAnswer.includes(opt.label);
          if (isCorrect) item.classList.add('state-correct');
          else if (isSel) item.classList.add('state-incorrect');
        }

        item.innerHTML = `
          <div class="option-indicator">${opt.label}</div>
          <div class="option-text">${opt.text}</div>
        `;

        item.addEventListener('click', () => handleOptionClick(q, opt.label));
        DOM.optionsForm.appendChild(item);
      });
    }
  }

  function handleOptionClick(q, label, colIndex = null) {
    if (!state.userAnswers[q.id]) {
      state.userAnswers[q.id] = [];
    }

    let current = [...state.userAnswers[q.id]];

    if (q.columns && q.columns.length > 0) {
      const colChoices = q.columns[colIndex].choices.map(c => c.label);
      current = current.filter(l => !colChoices.includes(l));
      current.push(label);
    } else if (q.type === 'se' || q.subType === 'multi_choice') {
      if (current.includes(label)) {
        current = current.filter(l => l !== label);
      } else {
        if (q.type === 'se' && current.length >= 2) {
          current.shift();
        }
        current.push(label);
      }
    } else {
      current = [label];
    }

    state.userAnswers[q.id] = current;
    saveState();
    renderOptions(q);
  }

  // --- Explanation Dropdown ---
  function renderExplanation(q, isAutoOpen = false) {
    DOM.explanationContainer.classList.remove('hidden');
    
    const userSelected = state.userAnswers[q.id] || [];
    const isCorrect = arraysEqual(userSelected, q.correctAnswer);

    if (userSelected.length > 0) {
      DOM.expStatusIcon.textContent = isCorrect ? '✅' : '❌';
      DOM.expHeaderText.textContent = isCorrect ? 'Correct Answer!' : 'Incorrect';
      DOM.expHeaderSub.textContent = isCorrect 
        ? 'Great job! Click to review the detailed official explanation.' 
        : `Your answer: [${userSelected.join(', ')}] • Official Answer: [${q.correctAnswer.join(', ')}]`;
    } else {
      DOM.expStatusIcon.textContent = '💡';
      DOM.expHeaderText.textContent = 'Official Answer & Explanation';
      DOM.expHeaderSub.textContent = `Correct Answer: Choice ${q.correctAnswer.join(', ')}`;
    }

    DOM.expCorrectKey.textContent = `Choice ${q.correctAnswer.join(', ')}`;

    if (q.passage && q.passage.description) {
      DOM.expPassageSummary.classList.remove('hidden');
      DOM.expPassageSummaryText.textContent = q.passage.description;
    } else {
      DOM.expPassageSummary.classList.add('hidden');
    }

    DOM.expDetailsText.textContent = q.explanation || 'No further explanation details available.';

    if (isAutoOpen) {
      DOM.explanationContainer.classList.add('open');
      DOM.explanationToggleBtn.setAttribute('aria-expanded', 'true');
    }
  }

  function toggleExplanationAccordion() {
    const isOpen = DOM.explanationContainer.classList.toggle('open');
    DOM.explanationToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  function handleCheckAnswer() {
    const q = state.filteredQuestions[state.currentIndex];
    if (!q) return;

    state.checkedQuestions[q.id] = true;
    saveState();
    renderOptions(q);
    renderExplanation(q, true);

    setTimeout(() => {
      DOM.explanationContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);
  }

  function handleClearSelection() {
    const q = state.filteredQuestions[state.currentIndex];
    if (!q) return;

    delete state.userAnswers[q.id];
    delete state.checkedQuestions[q.id];
    saveState();
    renderCurrentQuestion();
  }

  function toggleBookmark() {
    const q = state.filteredQuestions[state.currentIndex];
    if (!q) return;

    if (state.bookmarks.has(q.id)) {
      state.bookmarks.delete(q.id);
    } else {
      state.bookmarks.add(q.id);
    }
    saveState();
    updateBookmarkBadge();
    renderCurrentQuestion();
  }

  function updateBookmarkBadge() {
    DOM.bookmarkCount.textContent = state.bookmarks.size;
  }

  function updateProgressUI() {
    const total = state.filteredQuestions.length;
    if (total === 0) {
      DOM.progressBar.style.width = '0%';
      return;
    }

    const completed = state.filteredQuestions.filter(q => state.userAnswers[q.id] && state.userAnswers[q.id].length > 0).length;
    const pct = Math.round((completed / total) * 100);
    DOM.progressBar.style.width = `${pct}%`;
  }

  function renderEmptyState() {
    DOM.passagePanel.classList.add('hidden');
    DOM.quizLayout.classList.remove('has-passage');
    DOM.mobilePassageAccordion.classList.add('hidden');

    DOM.qCounter.textContent = 'No Questions Found';
    DOM.qBadgeChapter.textContent = '-';
    DOM.qBadgeType.textContent = '-';
    DOM.qBadgeDiff.textContent = '-';
    DOM.qInstruction.textContent = 'Please adjust your filter selection above.';
    DOM.qPrompt.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">No questions match the selected filter criteria. Try selecting "All Types" or "All Difficulties".</div>';
    DOM.optionsForm.innerHTML = '';
    DOM.explanationContainer.classList.add('hidden');
    DOM.btnPrev.disabled = true;
    DOM.btnNext.disabled = true;
  }

  // --- Question Grid Modal ---
  function renderQuestionGrid() {
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
        renderCurrentQuestion();
      });

      DOM.questionGridContainer.appendChild(btn);
    });
  }

  // --- Exam Review Modal & Logic ---
  function renderExamReview() {
    let answered = 0;
    let unanswered = 0;
    let marked = 0;

    DOM.examReviewTable.innerHTML = '';

    state.filteredQuestions.forEach((q, idx) => {
      const ans = state.userAnswers[q.id];
      const hasAns = ans && ans.length > 0;
      const isMarked = state.bookmarks.has(q.id);

      if (hasAns) answered++;
      else unanswered++;
      if (isMarked) marked++;

      const row = document.createElement('div');
      row.className = 'rev-row';
      row.innerHTML = `
        <span><strong>Q${idx + 1}</strong> (${q.type.toUpperCase()})</span>
        <span>${hasAns ? '✅ Answered' : '⏳ Incomplete'}</span>
        <span>${isMarked ? '⭐ Marked' : '-'}</span>
      `;
      row.addEventListener('click', () => {
        state.currentIndex = idx;
        closeModal(DOM.examReviewModal);
        renderCurrentQuestion();
      });
      DOM.examReviewTable.appendChild(row);
    });

    DOM.revAnsweredCount.textContent = answered;
    DOM.revUnansweredCount.textContent = unanswered;
    DOM.revMarkedCount.textContent = marked;
  }

  function finishExam() {
    stopExamTimer();
    closeModal(DOM.examReviewModal);

    let total = state.filteredQuestions.length;
    let correct = 0;

    const byType = { rc: { total: 0, correct: 0 }, tc: { total: 0, correct: 0 }, se: { total: 0, correct: 0 } };
    const byDiff = { Easy: { total: 0, correct: 0 }, Medium: { total: 0, correct: 0 }, Hard: { total: 0, correct: 0 } };

    state.filteredQuestions.forEach(q => {
      state.checkedQuestions[q.id] = true;
      const ans = state.userAnswers[q.id];
      const isCorr = arraysEqual(ans, q.correctAnswer);

      if (isCorr) correct++;

      if (byType[q.type]) {
        byType[q.type].total++;
        if (isCorr) byType[q.type].correct++;
      }

      if (byDiff[q.difficulty]) {
        byDiff[q.difficulty].total++;
        if (isCorr) byDiff[q.difficulty].correct++;
      }
    });

    saveState();

    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const scaledScore = Math.round(130 + (pct / 100) * 40);

    DOM.scorePercentage.textContent = `${pct}%`;
    DOM.scoreGreEstimate.textContent = `${scaledScore} / 170`;
    DOM.scoreSummaryText.textContent = `You answered ${correct} out of ${total} questions correctly.`;

    DOM.scoreTypeBars.innerHTML = '';
    for (const [tKey, tData] of Object.entries(byType)) {
      if (tData.total > 0) {
        const tPct = Math.round((tData.correct / tData.total) * 100);
        const tName = tKey === 'rc' ? 'Reading Comp' : (tKey === 'tc' ? 'Text Completion' : 'Sentence Equiv');
        DOM.scoreTypeBars.innerHTML += `
          <div class="bar-row">
            <span class="bar-label">${tName}</span>
            <div class="bar-track"><div class="bar-fill" style="width: ${tPct}%;"></div></div>
            <span class="bar-val">${tData.correct}/${tData.total}</span>
          </div>
        `;
      }
    }

    DOM.scoreDiffBars.innerHTML = '';
    for (const [dKey, dData] of Object.entries(byDiff)) {
      if (dData.total > 0) {
        const dPct = Math.round((dData.correct / dData.total) * 100);
        DOM.scoreDiffBars.innerHTML += `
          <div class="bar-row">
            <span class="bar-label">${dKey}</span>
            <div class="bar-track"><div class="bar-fill" style="width: ${dPct}%;"></div></div>
            <span class="bar-val">${dData.correct}/${dData.total}</span>
          </div>
        `;
      }
    }

    openModal(DOM.examScoreModal);
  }

  // --- Timer ---
  function startExamTimer() {
    state.examTimer.remaining = state.examTimer.duration;
    state.examTimer.isActive = true;
    updateTimerDisplay();

    if (state.examTimer.intervalId) clearInterval(state.examTimer.intervalId);

    state.examTimer.intervalId = setInterval(() => {
      if (state.examTimer.remaining > 0) {
        state.examTimer.remaining--;
        updateTimerDisplay();
      } else {
        clearInterval(state.examTimer.intervalId);
        alert('Time is up! Submitting your exam now.');
        finishExam();
      }
    }, 1000);
  }

  function stopExamTimer() {
    if (state.examTimer.intervalId) {
      clearInterval(state.examTimer.intervalId);
      state.examTimer.intervalId = null;
    }
    state.examTimer.isActive = false;
  }

  function updateTimerDisplay() {
    const mins = Math.floor(state.examTimer.remaining / 60);
    const secs = state.examTimer.remaining % 60;
    DOM.examTimerText.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // --- Modal Helpers ---
  function openModal(modal) {
    modal.classList.remove('hidden');
  }

  function closeModal(modal) {
    modal.classList.add('hidden');
  }

  // --- Settings ---
  function applySettings() {
    document.body.className = `theme-${state.settings.theme}`;
    document.documentElement.style.setProperty('--passage-font-size', `${state.settings.fontSize / 100 * 1.0}rem`);
    document.documentElement.style.setProperty('--passage-font-family', state.settings.fontFamily === 'sans' ? 'var(--font-sans)' : 'var(--font-serif)');
    DOM.fontSizeLabel.textContent = `${state.settings.fontSize}%`;

    document.querySelectorAll('.theme-choice-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.setTheme === state.settings.theme);
    });
    document.querySelectorAll('.font-family-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.setFont === state.settings.fontFamily);
    });
  }

  function updateStatsModal() {
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

  // --- Event Listeners ---
  function bindEvents() {
    // Section Select
    DOM.sectionSelect.addEventListener('change', (e) => {
      state.filters.section = e.target.value;
      state.currentIndex = 0;
      applyFilters();
      renderCurrentQuestion();
    });

    // Mode Toggle
    DOM.modeStudyBtn.addEventListener('click', () => {
      state.mode = 'study';
      DOM.modeStudyBtn.classList.add('active');
      DOM.modeExamBtn.classList.remove('active');
      DOM.examTimerBar.classList.add('hidden');
      stopExamTimer();
      renderCurrentQuestion();
    });

    DOM.modeExamBtn.addEventListener('click', () => {
      if (confirm('Start Timed Exam Mode? This starts a 35-minute timer and scores your answers at the end.')) {
        state.mode = 'exam';
        DOM.modeExamBtn.classList.add('active');
        DOM.modeStudyBtn.classList.remove('active');
        DOM.examTimerBar.classList.remove('hidden');
        startExamTimer();
        renderCurrentQuestion();
      }
    });

    // Filter pills
    DOM.filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        if (pill.dataset.filterType) {
          document.querySelectorAll('[data-filter-type]').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          state.filters.type = pill.dataset.filterType;
        } else if (pill.dataset.filterDiff) {
          document.querySelectorAll('[data-filter-diff]').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          state.filters.difficulty = pill.dataset.filterDiff;
        } else if (pill.dataset.filterStatus) {
          const isAct = pill.classList.toggle('active');
          state.filters.status = isAct ? pill.dataset.filterStatus : 'all';
        }
        state.currentIndex = 0;
        applyFilters();
        renderCurrentQuestion();
      });
    });

    // Action buttons
    DOM.btnCheckAnswer.addEventListener('click', handleCheckAnswer);
    DOM.btnClearSelection.addEventListener('click', handleClearSelection);
    DOM.bookmarkBtn.addEventListener('click', toggleBookmark);
    DOM.mobileBtnBookmark.addEventListener('click', toggleBookmark);

    // Mobile passage accordion toggle
    DOM.mobilePassageHeaderBtn.addEventListener('click', () => {
      const isOpen = DOM.mobilePassageAccordion.classList.toggle('open');
      DOM.mobilePassageHeaderBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      DOM.mobilePassageChevron.textContent = isOpen ? 'Hide Passage ▲' : 'Show Passage ▼';
    });

    // Overview & Structure Toggle Listeners (Desktop, Mobile, Explanation)
    DOM.btnToggleDesktopDesc.addEventListener('click', () => {
      const isHidden = DOM.desktopDescContent.classList.toggle('hidden');
      DOM.desktopDescChevron.textContent = isHidden ? 'Click to show ▼' : 'Hide ▲';
    });

    DOM.btnToggleMobileDesc.addEventListener('click', () => {
      const isHidden = DOM.mobileDescContent.classList.toggle('hidden');
      DOM.mobileDescChevron.textContent = isHidden ? 'Click to show ▼' : 'Hide ▲';
    });

    DOM.btnToggleExpDesc.addEventListener('click', () => {
      const isHidden = DOM.expDescContent.classList.toggle('hidden');
      DOM.expDescChevron.textContent = isHidden ? 'Click to view ▼' : 'Hide ▲';
    });

    // Explanation Accordion Toggle
    DOM.explanationToggleBtn.addEventListener('click', toggleExplanationAccordion);

    // Navigation
    DOM.btnPrev.addEventListener('click', () => {
      if (state.currentIndex > 0) {
        state.currentIndex--;
        renderCurrentQuestion();
      }
    });

    DOM.btnNext.addEventListener('click', () => {
      if (state.currentIndex < state.filteredQuestions.length - 1) {
        state.currentIndex++;
        renderCurrentQuestion();
      }
    });

    DOM.mobileBtnPrev.addEventListener('click', () => {
      if (state.currentIndex > 0) {
        state.currentIndex--;
        renderCurrentQuestion();
      }
    });

    DOM.mobileBtnNext.addEventListener('click', () => {
      if (state.currentIndex < state.filteredQuestions.length - 1) {
        state.currentIndex++;
        renderCurrentQuestion();
      }
    });

    // Modal Triggers
    DOM.btnGridToggle.addEventListener('click', () => {
      renderQuestionGrid();
      openModal(DOM.gridModal);
    });
    DOM.mobileBtnGrid.addEventListener('click', () => {
      renderQuestionGrid();
      openModal(DOM.gridModal);
    });
    DOM.btnCloseGrid.addEventListener('click', () => closeModal(DOM.gridModal));

    DOM.btnStatsToggle.addEventListener('click', () => {
      updateStatsModal();
      openModal(DOM.statsModal);
    });
    DOM.btnCloseStats.addEventListener('click', () => closeModal(DOM.statsModal));

    DOM.btnSettingsToggle.addEventListener('click', () => openModal(DOM.settingsModal));
    DOM.btnCloseSettings.addEventListener('click', () => closeModal(DOM.settingsModal));

    DOM.examReviewBtn.addEventListener('click', () => {
      renderExamReview();
      openModal(DOM.examReviewModal);
    });
    DOM.btnCloseReview.addEventListener('click', () => closeModal(DOM.examReviewModal));
    DOM.btnContinueExam.addEventListener('click', () => closeModal(DOM.examReviewModal));
    DOM.examSubmitBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to finish the exam and view your score report?')) {
        finishExam();
      }
    });
    DOM.btnFinishExamModal.addEventListener('click', finishExam);
    DOM.btnCloseScore.addEventListener('click', () => closeModal(DOM.examScoreModal));
    DOM.btnReviewExamMistakes.addEventListener('click', () => {
      closeModal(DOM.examScoreModal);
      state.mode = 'study';
      DOM.modeStudyBtn.classList.add('active');
      DOM.modeExamBtn.classList.remove('active');
      DOM.examTimerBar.classList.add('hidden');
      renderCurrentQuestion();
    });
    DOM.btnRestartExam.addEventListener('click', () => {
      closeModal(DOM.examScoreModal);
      state.userAnswers = {};
      state.checkedQuestions = {};
      saveState();
      startExamTimer();
      renderCurrentQuestion();
    });

    // Stats Filters
    DOM.btnFilterIncorrect.addEventListener('click', () => {
      closeModal(DOM.statsModal);
      state.filters.status = 'incorrect';
      applyFilters();
      renderCurrentQuestion();
    });
    DOM.btnFilterBookmarks.addEventListener('click', () => {
      closeModal(DOM.statsModal);
      state.filters.status = 'bookmarks';
      applyFilters();
      renderCurrentQuestion();
    });
    DOM.btnResetProgress.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all your progress, answers, and bookmarks?')) {
        state.userAnswers = {};
        state.checkedQuestions = {};
        state.bookmarks.clear();
        saveState();
        closeModal(DOM.statsModal);
        updateBookmarkBadge();
        renderCurrentQuestion();
      }
    });

    // Theme & Font Settings
    document.querySelectorAll('.theme-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.settings.theme = btn.dataset.setTheme;
        applySettings();
        saveState();
      });
    });

    document.querySelectorAll('.font-family-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.settings.fontFamily = btn.dataset.setFont;
        applySettings();
        saveState();
      });
    });

    DOM.fontSizeInc.addEventListener('click', () => {
      if (state.settings.fontSize < 140) {
        state.settings.fontSize += 10;
        applySettings();
        saveState();
      }
    });

    DOM.fontSizeDec.addEventListener('click', () => {
      if (state.settings.fontSize > 80) {
        state.settings.fontSize -= 10;
        applySettings();
        saveState();
      }
    });

    // Keyboard navigation (Arrow keys)
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === 'ArrowRight') {
        if (state.currentIndex < state.filteredQuestions.length - 1) {
          state.currentIndex++;
          renderCurrentQuestion();
        }
      } else if (e.key === 'ArrowLeft') {
        if (state.currentIndex > 0) {
          state.currentIndex--;
          renderCurrentQuestion();
        }
      }
    });
  }

  window.addEventListener('DOMContentLoaded', init);
})();
