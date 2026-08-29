/**
 * GRE Verbal Master - UI Renderer Module
 */

(function (global) {
  'use strict';

  function getDOM() {
    return {
      sectionSelect: document.getElementById('section-select'),
      progressBar: document.getElementById('progress-bar'),
      quizLayout: document.getElementById('quiz-layout'),
      bookmarkCount: document.getElementById('bookmark-count'),

      // Mobile Passage Accordion
      mobilePassageAccordion: document.getElementById('mobile-passage-accordion'),
      mobilePassageHeaderBtn: document.getElementById('mobile-passage-header-btn'),
      mobilePassageTitle: document.getElementById('mobile-passage-title'),
      mobilePassageText: document.getElementById('mobile-passage-text'),
      mobilePassageDescContainer: document.getElementById('mobile-passage-desc-container'),
      mobileDescContent: document.getElementById('mobile-desc-content'),
      mobilePassageDescText: document.getElementById('mobile-passage-desc-text'),
      mobileDescChevron: document.getElementById('mobile-desc-chevron'),
      mobilePassageChevron: document.getElementById('mobile-passage-chevron'),

      // Desktop Passage Panel
      passagePanel: document.getElementById('passage-panel'),
      passageTitle: document.getElementById('passage-title'),
      passageText: document.getElementById('passage-text'),
      desktopPassageDescContainer: document.getElementById('desktop-passage-desc-container'),
      desktopDescContent: document.getElementById('desktop-desc-content'),
      passageDescText: document.getElementById('passage-desc-text'),
      desktopDescChevron: document.getElementById('desktop-desc-chevron'),

      // Question elements
      qCounter: document.getElementById('q-counter'),
      qBadgeChapter: document.getElementById('q-badge-chapter'),
      qBadgeType: document.getElementById('q-badge-type'),
      qBadgeDiff: document.getElementById('q-badge-diff'),
      btnPdfPageLabel: document.getElementById('btn-pdf-page-label'),
      bookmarkBtn: document.getElementById('bookmark-btn'),
      qInstruction: document.getElementById('q-instruction'),
      qPrompt: document.getElementById('q-prompt'),
      optionsForm: document.getElementById('options-form'),

      // Explanation
      explanationContainer: document.getElementById('explanation-container'),
      explanationToggleBtn: document.getElementById('explanation-toggle-btn'),
      expStatusIcon: document.getElementById('exp-status-icon'),
      expHeaderText: document.getElementById('exp-header-text'),
      expHeaderSub: document.getElementById('exp-header-sub'),
      expCorrectKey: document.getElementById('exp-correct-key'),
      expPdfPageNum: document.getElementById('exp-pdf-page-num'),
      expPassageSummary: document.getElementById('exp-passage-summary'),
      expDescContent: document.getElementById('exp-desc-content'),
      expPassageSummaryText: document.getElementById('exp-passage-summary-text'),
      expDescChevron: document.getElementById('exp-desc-chevron'),
      expDetailsText: document.getElementById('exp-details-text'),

      // Nav indicators
      btnPrev: document.getElementById('btn-prev'),
      btnNext: document.getElementById('btn-next'),
      navQIndicator: document.getElementById('nav-q-indicator'),
      mobileBtnPrev: document.getElementById('mobile-btn-prev'),
      mobileBtnNext: document.getElementById('mobile-btn-next'),
      mobileBtnBookmark: document.getElementById('mobile-btn-bookmark'),
      mobileGridIndicator: document.getElementById('mobile-grid-indicator'),
      mobileBmStar: document.getElementById('mobile-bm-star')
    };
  }

  function renderCurrentQuestion() {
    const DOM = getDOM();
    const { state } = global.GREState;
    const q = state.filteredQuestions[state.currentIndex];
    
    if (!q) {
      renderEmptyState();
      return;
    }

    // Indicators
    DOM.qCounter.textContent = `Q ${state.currentIndex + 1} of ${state.filteredQuestions.length}`;
    DOM.navQIndicator.textContent = `${state.currentIndex + 1} / ${state.filteredQuestions.length}`;
    DOM.mobileGridIndicator.textContent = `Q ${state.currentIndex + 1}/${state.filteredQuestions.length}`;
    
    DOM.qBadgeChapter.textContent = `Ch ${q.chapter}: ${q.set.split(':')[0]}`;
    DOM.qBadgeType.textContent = formatQuestionType(q);
    
    DOM.qBadgeDiff.textContent = q.difficulty;
    DOM.qBadgeDiff.className = `badge badge-diff diff-${q.difficulty.toLowerCase()}`;

    if (DOM.btnPdfPageLabel) {
      DOM.btnPdfPageLabel.textContent = `PDF p. ${q.pdfPageQuestion || 1}`;
    }

    // Bookmark
    const isBookmarked = state.bookmarks.has(q.id);
    DOM.bookmarkBtn.classList.toggle('active', isBookmarked);
    DOM.bookmarkBtn.querySelector('.bookmark-icon').textContent = isBookmarked ? '★' : '☆';
    DOM.mobileBtnBookmark.classList.toggle('active', isBookmarked);
    DOM.mobileBmStar.textContent = isBookmarked ? '★' : '☆';

    // Instruction & Prompt
    DOM.qInstruction.textContent = getQuestionInstruction(q);
    DOM.qPrompt.innerHTML = formatPromptText(q.prompt);

    // Collapsible overview resets to closed
    collapseOverviewPanels();

    // Passage handling
    if (q.type === 'rc' && q.passage && q.passage.text) {
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
    const DOM = getDOM();
    if (DOM.desktopDescContent) {
      DOM.desktopDescContent.classList.add('hidden');
      DOM.desktopDescChevron.textContent = 'Click to show ▼';
    }
    if (DOM.mobileDescContent) {
      DOM.mobileDescContent.classList.add('hidden');
      DOM.mobileDescChevron.textContent = 'Click to show ▼';
    }
    if (DOM.expDescContent) {
      DOM.expDescContent.classList.add('hidden');
      DOM.expDescChevron.textContent = 'Click to view ▼';
    }
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
    const DOM = getDOM();
    const { state } = global.GREState;
    DOM.optionsForm.innerHTML = '';
    const userSelected = state.userAnswers[q.id] || [];
    const isChecked = Boolean(state.checkedQuestions[q.id]);

    if (q.columns && q.columns.length > 0) {
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
    const { state, saveState } = global.GREState;
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

  function renderExplanation(q, isAutoOpen = false) {
    const DOM = getDOM();
    const { state, arraysEqual } = global.GREState;
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

    if (DOM.expPdfPageNum) {
      DOM.expPdfPageNum.textContent = q.pdfPageAnswer || 1;
    }

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
    const DOM = getDOM();
    const isOpen = DOM.explanationContainer.classList.toggle('open');
    DOM.explanationToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  function updateProgressUI() {
    const DOM = getDOM();
    const { state } = global.GREState;
    const total = state.filteredQuestions.length;
    if (total === 0) {
      DOM.progressBar.style.width = '0%';
      return;
    }

    const completed = state.filteredQuestions.filter(q => state.userAnswers[q.id] && state.userAnswers[q.id].length > 0).length;
    const pct = Math.round((completed / total) * 100);
    DOM.progressBar.style.width = `${pct}%`;
  }

  function updateBookmarkBadge() {
    const DOM = getDOM();
    const { state } = global.GREState;
    DOM.bookmarkCount.textContent = state.bookmarks.size;
  }

  function renderEmptyState() {
    const DOM = getDOM();
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

  // Export module
  global.GRERenderer = {
    getDOM,
    renderCurrentQuestion,
    renderOptions,
    handleOptionClick,
    renderExplanation,
    toggleExplanationAccordion,
    collapseOverviewPanels,
    updateProgressUI,
    updateBookmarkBadge
  };

})(typeof window !== 'undefined' ? window : globalThis);
