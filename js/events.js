/**
 * GRE Verbal Master - Events & Interaction Binding Module
 */

(function (global) {
  'use strict';

  // --- Clipboard Helper Functions ---
  function copyToClipboard(text, btnElement, successLabel = 'Copied!') {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showCopyFeedback(btnElement, successLabel);
      }).catch(() => {
        fallbackCopyText(text, btnElement, successLabel);
      });
    } else {
      fallbackCopyText(text, btnElement, successLabel);
    }
  }

  function fallbackCopyText(text, btnElement, successLabel) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showCopyFeedback(btnElement, successLabel);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
    document.body.removeChild(textArea);
  }

  function showCopyFeedback(btn, msg) {
    if (!btn) return;
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<span style="font-weight: 700;">✓ ${msg}</span>`;
    btn.classList.add('copied-active');
    setTimeout(() => {
      btn.innerHTML = origHtml;
      btn.classList.remove('copied-active');
    }, 1800);
  }

  function formatQuestionForClipboard(q) {
    let text = `[GRE Verbal - ${q.set.split(':')[0]} - Question ${q.questionNumber}]\n`;
    text += `Type: ${q.type.toUpperCase()} | Difficulty: ${q.difficulty}\n`;
    text += `Official PDF Source: Page ${q.pdfPageQuestion || 'N/A'} (Book Page ${q.bookPageQuestion || 'N/A'})\n\n`;

    if (q.type === 'rc' && q.passage && q.passage.text) {
      text += `=== READING PASSAGE: ${q.passage.title || 'Passage'} ===\n`;
      text += `${q.passage.text.trim()}\n\n`;
      text += `=== QUESTION ===\n`;
    }

    text += `${q.prompt.trim()}\n\n`;

    if (q.columns && q.columns.length > 0) {
      text += `Choices:\n`;
      q.columns.forEach(col => {
        text += `${col.blank}:\n`;
        col.choices.forEach(c => {
          text += `  [${c.label}] ${c.text}\n`;
        });
      });
    } else if (q.options && q.options.length > 0) {
      text += `Choices:\n`;
      q.options.forEach(opt => {
        text += `[${opt.label}] ${opt.text}\n`;
      });
    }

    return text.trim();
  }

  function formatAnswerForClipboard(q) {
    let text = `[GRE Verbal - ${q.set.split(':')[0]} - Question ${q.questionNumber} Solution]\n\n`;
    text += `Official Correct Answer: Choice ${q.correctAnswer.join(', ')}\n`;
    text += `Official PDF Source: Page ${q.pdfPageAnswer || 'N/A'} (Book Page ${q.bookPageAnswer || 'N/A'})\n\n`;

    if (q.passage && q.passage.description) {
      text += `Passage Overview & Structure:\n${q.passage.description.trim()}\n\n`;
    }

    text += `Official ETS Explanation:\n${(q.explanation || 'No explanation available.').trim()}\n`;

    return text.trim();
  }

  // --- Main Events Binder ---
  function bindEvents() {
    const { state, saveState, applyFilters } = global.GREState;
    const { renderCurrentQuestion, toggleExplanationAccordion, updateBookmarkBadge } = global.GRERenderer;
    const { startExamTimer, stopExamTimer, renderExamReview, finishExam } = global.GREExam;
    const { openModal, closeModal, openPdfModal, switchPdfTab, renderQuestionGrid, updateStatsModal, applySettings } = global.GREModals;

    // DOM Elements
    const sectionSelect = document.getElementById('section-select');
    const modeStudyBtn = document.getElementById('mode-study-btn');
    const modeExamBtn = document.getElementById('mode-exam-btn');
    const filterPills = document.querySelectorAll('.filter-pill');
    const examTimerBar = document.getElementById('exam-timer-bar');

    const btnOpenPdfModal = document.getElementById('btn-open-pdf-modal');
    const btnOpenPdfExp = document.getElementById('btn-open-pdf-exp');
    const btnCopyQuestion = document.getElementById('btn-copy-question');
    const btnCopyAnswer = document.getElementById('btn-copy-answer');
    const btnCheckAnswer = document.getElementById('btn-check-answer');
    const btnClearSelection = document.getElementById('btn-clear-selection');
    const bookmarkBtn = document.getElementById('bookmark-btn');
    const mobileBtnBookmark = document.getElementById('mobile-btn-bookmark');

    const mobilePassageAccordion = document.getElementById('mobile-passage-accordion');
    const mobilePassageHeaderBtn = document.getElementById('mobile-passage-header-btn');
    const mobilePassageChevron = document.getElementById('mobile-passage-chevron');

    const btnToggleDesktopDesc = document.getElementById('btn-toggle-desktop-desc');
    const desktopDescContent = document.getElementById('desktop-desc-content');
    const desktopDescChevron = document.getElementById('desktop-desc-chevron');

    const btnToggleMobileDesc = document.getElementById('btn-toggle-mobile-desc');
    const mobileDescContent = document.getElementById('mobile-desc-content');
    const mobileDescChevron = document.getElementById('mobile-desc-chevron');

    const btnToggleExpDesc = document.getElementById('btn-toggle-exp-desc');
    const expDescContent = document.getElementById('exp-desc-content');
    const expDescChevron = document.getElementById('exp-desc-chevron');

    const explanationToggleBtn = document.getElementById('explanation-toggle-btn');
    const explanationContainer = document.getElementById('explanation-container');

    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const mobileBtnPrev = document.getElementById('mobile-btn-prev');
    const mobileBtnNext = document.getElementById('mobile-btn-next');

    // Modals
    const pdfModal = document.getElementById('pdf-modal');
    const pdfTabQuestion = document.getElementById('pdf-tab-question');
    const pdfTabAnswer = document.getElementById('pdf-tab-answer');
    const btnClosePdf = document.getElementById('btn-close-pdf');

    const gridModal = document.getElementById('grid-modal');
    const statsModal = document.getElementById('stats-modal');
    const settingsModal = document.getElementById('settings-modal');
    const examReviewModal = document.getElementById('exam-review-modal');
    const examScoreModal = document.getElementById('exam-score-modal');

    const btnGridToggle = document.getElementById('btn-grid-toggle');
    const mobileBtnGrid = document.getElementById('mobile-btn-grid');
    const btnCloseGrid = document.getElementById('btn-close-grid');

    const btnStatsToggle = document.getElementById('btn-stats-toggle');
    const btnCloseStats = document.getElementById('btn-close-stats');
    const btnFilterIncorrect = document.getElementById('btn-filter-incorrect');
    const btnFilterBookmarks = document.getElementById('btn-filter-bookmarks');
    const btnResetProgress = document.getElementById('btn-reset-progress');

    const btnSettingsToggle = document.getElementById('btn-settings-toggle');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const fontSizeInc = document.getElementById('font-size-inc');
    const fontSizeDec = document.getElementById('font-size-dec');

    const examReviewBtn = document.getElementById('exam-review-btn');
    const examSubmitBtn = document.getElementById('exam-submit-btn');
    const btnCloseReview = document.getElementById('btn-close-review');
    const btnContinueExam = document.getElementById('btn-continue-exam');
    const btnFinishExamModal = document.getElementById('btn-finish-exam-modal');
    const btnCloseScore = document.getElementById('btn-close-score');
    const btnReviewExamMistakes = document.getElementById('btn-review-exam-mistakes');
    const btnRestartExam = document.getElementById('btn-restart-exam');

    // 1. PDF Locator Modal Handlers
    if (btnOpenPdfModal) {
      btnOpenPdfModal.addEventListener('click', () => {
        openPdfModal(null, 'question');
      });
    }

    if (btnOpenPdfExp) {
      btnOpenPdfExp.addEventListener('click', () => {
        openPdfModal(null, 'answer');
      });
    }

    if (pdfTabQuestion) {
      pdfTabQuestion.addEventListener('click', () => switchPdfTab('question'));
    }

    if (pdfTabAnswer) {
      pdfTabAnswer.addEventListener('click', () => switchPdfTab('answer'));
    }

    if (btnClosePdf) {
      btnClosePdf.addEventListener('click', () => closeModal(pdfModal));
    }

    // 2. Copy Buttons
    if (btnCopyQuestion) {
      btnCopyQuestion.addEventListener('click', () => {
        const q = state.filteredQuestions[state.currentIndex];
        if (q) {
          const text = formatQuestionForClipboard(q);
          copyToClipboard(text, btnCopyQuestion, 'Copied Q!');
        }
      });
    }

    if (btnCopyAnswer) {
      btnCopyAnswer.addEventListener('click', () => {
        const q = state.filteredQuestions[state.currentIndex];
        if (q) {
          const text = formatAnswerForClipboard(q);
          copyToClipboard(text, btnCopyAnswer, 'Copied Ans!');
        }
      });
    }

    // 3. Section Selection
    if (sectionSelect) {
      sectionSelect.addEventListener('change', (e) => {
        state.filters.section = e.target.value;
        state.currentIndex = 0;
        applyFilters();
        renderCurrentQuestion();
      });
    }

    // 4. Mode Toggle
    if (modeStudyBtn && modeExamBtn) {
      modeStudyBtn.addEventListener('click', () => {
        state.mode = 'study';
        modeStudyBtn.classList.add('active');
        modeExamBtn.classList.remove('active');
        if (examTimerBar) examTimerBar.classList.add('hidden');
        stopExamTimer();
        renderCurrentQuestion();
      });

      modeExamBtn.addEventListener('click', () => {
        if (confirm('Start Timed Exam Mode? This starts a 35-minute timer and scores your answers at the end.')) {
          state.mode = 'exam';
          modeExamBtn.classList.add('active');
          modeStudyBtn.classList.remove('active');
          if (examTimerBar) examTimerBar.classList.remove('hidden');
          startExamTimer();
          renderCurrentQuestion();
        }
      });
    }

    // 5. Filter Pills
    filterPills.forEach(pill => {
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

    // 6. Action Handlers
    function handleCheckAnswer() {
      const q = state.filteredQuestions[state.currentIndex];
      if (!q) return;

      state.checkedQuestions[q.id] = true;
      saveState();
      global.GRERenderer.renderOptions(q);
      global.GRERenderer.renderExplanation(q, true);

      setTimeout(() => {
        if (explanationContainer) {
          explanationContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
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

    if (btnCheckAnswer) btnCheckAnswer.addEventListener('click', handleCheckAnswer);
    if (btnClearSelection) btnClearSelection.addEventListener('click', handleClearSelection);
    if (bookmarkBtn) bookmarkBtn.addEventListener('click', toggleBookmark);
    if (mobileBtnBookmark) mobileBtnBookmark.addEventListener('click', toggleBookmark);

    // 7. Mobile Passage Drawer Toggle
    if (mobilePassageHeaderBtn) {
      mobilePassageHeaderBtn.addEventListener('click', () => {
        const isOpen = mobilePassageAccordion.classList.toggle('open');
        mobilePassageHeaderBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        if (mobilePassageChevron) {
          mobilePassageChevron.textContent = isOpen ? 'Hide Passage ▲' : 'Show Passage ▼';
        }
      });
    }

    // 8. Collapsible Overview & Structure Toggles
    if (btnToggleDesktopDesc) {
      btnToggleDesktopDesc.addEventListener('click', () => {
        const isHidden = desktopDescContent.classList.toggle('hidden');
        if (desktopDescChevron) desktopDescChevron.textContent = isHidden ? 'Click to show ▼' : 'Hide ▲';
      });
    }

    if (btnToggleMobileDesc) {
      btnToggleMobileDesc.addEventListener('click', () => {
        const isHidden = mobileDescContent.classList.toggle('hidden');
        if (mobileDescChevron) mobileDescChevron.textContent = isHidden ? 'Click to show ▼' : 'Hide ▲';
      });
    }

    if (btnToggleExpDesc) {
      btnToggleExpDesc.addEventListener('click', () => {
        const isHidden = expDescContent.classList.toggle('hidden');
        if (expDescChevron) expDescChevron.textContent = isHidden ? 'Click to view ▼' : 'Hide ▲';
      });
    }

    // 9. Explanation Accordion Toggle
    if (explanationToggleBtn) {
      explanationToggleBtn.addEventListener('click', toggleExplanationAccordion);
    }

    // 10. Navigation Buttons
    function goPrev() {
      if (state.currentIndex > 0) {
        state.currentIndex--;
        renderCurrentQuestion();
      }
    }

    function goNext() {
      if (state.currentIndex < state.filteredQuestions.length - 1) {
        state.currentIndex++;
        renderCurrentQuestion();
      }
    }

    if (btnPrev) btnPrev.addEventListener('click', goPrev);
    if (btnNext) btnNext.addEventListener('click', goNext);
    if (mobileBtnPrev) mobileBtnPrev.addEventListener('click', goPrev);
    if (mobileBtnNext) mobileBtnNext.addEventListener('click', goNext);

    // 11. Modals Triggering
    if (btnGridToggle) {
      btnGridToggle.addEventListener('click', () => {
        renderQuestionGrid();
        openModal(gridModal);
      });
    }
    if (mobileBtnGrid) {
      mobileBtnGrid.addEventListener('click', () => {
        renderQuestionGrid();
        openModal(gridModal);
      });
    }
    if (btnCloseGrid) btnCloseGrid.addEventListener('click', () => closeModal(gridModal));

    if (btnStatsToggle) {
      btnStatsToggle.addEventListener('click', () => {
        updateStatsModal();
        openModal(statsModal);
      });
    }
    if (btnCloseStats) btnCloseStats.addEventListener('click', () => closeModal(statsModal));

    if (btnSettingsToggle) btnSettingsToggle.addEventListener('click', () => openModal(settingsModal));
    if (btnCloseSettings) btnCloseSettings.addEventListener('click', () => closeModal(settingsModal));

    if (examReviewBtn) {
      examReviewBtn.addEventListener('click', () => {
        renderExamReview();
        openModal(examReviewModal);
      });
    }
    if (btnCloseReview) btnCloseReview.addEventListener('click', () => closeModal(examReviewModal));
    if (btnContinueExam) btnContinueExam.addEventListener('click', () => closeModal(examReviewModal));
    if (examSubmitBtn) {
      examSubmitBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to finish the exam and view your score report?')) {
          finishExam();
        }
      });
    }
    if (btnFinishExamModal) btnFinishExamModal.addEventListener('click', finishExam);
    if (btnCloseScore) btnCloseScore.addEventListener('click', () => closeModal(examScoreModal));
    if (btnReviewExamMistakes) {
      btnReviewExamMistakes.addEventListener('click', () => {
        closeModal(examScoreModal);
        state.mode = 'study';
        modeStudyBtn.classList.add('active');
        modeExamBtn.classList.remove('active');
        if (examTimerBar) examTimerBar.classList.add('hidden');
        renderCurrentQuestion();
      });
    }
    if (btnRestartExam) {
      btnRestartExam.addEventListener('click', () => {
        closeModal(examScoreModal);
        state.userAnswers = {};
        state.checkedQuestions = {};
        saveState();
        startExamTimer();
        renderCurrentQuestion();
      });
    }

    // 12. Stats Actions
    if (btnFilterIncorrect) {
      btnFilterIncorrect.addEventListener('click', () => {
        closeModal(statsModal);
        state.filters.status = 'incorrect';
        applyFilters();
        renderCurrentQuestion();
      });
    }
    if (btnFilterBookmarks) {
      btnFilterBookmarks.addEventListener('click', () => {
        closeModal(statsModal);
        state.filters.status = 'bookmarks';
        applyFilters();
        renderCurrentQuestion();
      });
    }
    if (btnResetProgress) {
      btnResetProgress.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all your progress, answers, and bookmarks?')) {
          state.userAnswers = {};
          state.checkedQuestions = {};
          state.bookmarks.clear();
          saveState();
          closeModal(statsModal);
          updateBookmarkBadge();
          renderCurrentQuestion();
        }
      });
    }

    // 13. Theme & Font Preferences
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

    if (fontSizeInc) {
      fontSizeInc.addEventListener('click', () => {
        if (state.settings.fontSize < 140) {
          state.settings.fontSize += 10;
          applySettings();
          saveState();
        }
      });
    }

    if (fontSizeDec) {
      fontSizeDec.addEventListener('click', () => {
        if (state.settings.fontSize > 80) {
          state.settings.fontSize -= 10;
          applySettings();
          saveState();
        }
      });
    }

    // 14. Keyboard Navigation
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    });
  }

  global.GREEvents = {
    bindEvents
  };

})(typeof window !== 'undefined' ? window : globalThis);
