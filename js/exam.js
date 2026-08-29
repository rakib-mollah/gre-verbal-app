/**
 * GRE Verbal Master - Exam Engine Module (Timer, Review, Scoring)
 */

(function (global) {
  'use strict';

  function getDOM() {
    return {
      examTimerBar: document.getElementById('exam-timer-bar'),
      examTimerText: document.getElementById('exam-timer-text'),
      examReviewModal: document.getElementById('exam-review-modal'),
      examReviewTable: document.getElementById('exam-review-table'),
      revAnsweredCount: document.getElementById('rev-answered-count'),
      revUnansweredCount: document.getElementById('rev-unanswered-count'),
      revMarkedCount: document.getElementById('rev-marked-count'),
      examScoreModal: document.getElementById('exam-score-modal'),
      scorePercentage: document.getElementById('score-percentage'),
      scoreGreEstimate: document.getElementById('score-gre-estimate'),
      scoreSummaryText: document.getElementById('score-summary-text'),
      scoreTypeBars: document.getElementById('score-type-bars'),
      scoreDiffBars: document.getElementById('score-diff-bars')
    };
  }

  function startExamTimer() {
    const { state } = global.GREState;
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
    const { state } = global.GREState;
    if (state.examTimer.intervalId) {
      clearInterval(state.examTimer.intervalId);
      state.examTimer.intervalId = null;
    }
    state.examTimer.isActive = false;
  }

  function updateTimerDisplay() {
    const DOM = getDOM();
    const { state } = global.GREState;
    const mins = Math.floor(state.examTimer.remaining / 60);
    const secs = state.examTimer.remaining % 60;
    DOM.examTimerText.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function renderExamReview() {
    const DOM = getDOM();
    const { state } = global.GREState;
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
        global.GREModals.closeModal(DOM.examReviewModal);
        global.GRERenderer.renderCurrentQuestion();
      });
      DOM.examReviewTable.appendChild(row);
    });

    DOM.revAnsweredCount.textContent = answered;
    DOM.revUnansweredCount.textContent = unanswered;
    DOM.revMarkedCount.textContent = marked;
  }

  function finishExam() {
    const DOM = getDOM();
    const { state, saveState, arraysEqual } = global.GREState;
    stopExamTimer();
    global.GREModals.closeModal(DOM.examReviewModal);

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

    global.GREModals.openModal(DOM.examScoreModal);
  }

  global.GREExam = {
    startExamTimer,
    stopExamTimer,
    updateTimerDisplay,
    renderExamReview,
    finishExam
  };

})(typeof window !== 'undefined' ? window : globalThis);
