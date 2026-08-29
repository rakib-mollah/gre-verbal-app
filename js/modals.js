/**
 * GRE Verbal Master - Modals, Navigator Grid, High-Speed PDF.js Viewer & Settings Module
 */

(function (global) {
  'use strict';

  // Configure PDF.js Worker
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js';
  }

  let pdfDoc = null;
  let pdfDocLoadingPromise = null;
  let currentPdfPage = 1;
  let pdfZoom = 1.0;
  let isPdfRendering = false;
  let pendingPdfPage = null;

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
      pdfPageIndicator: document.getElementById('pdf-page-indicator'),
      pdfCanvas: document.getElementById('pdf-canvas'),
      pdfCanvasContainer: document.getElementById('pdf-canvas-container'),
      pdfLoadingSpinner: document.getElementById('pdf-loading-spinner'),
      pdfTabQuestion: document.getElementById('pdf-tab-question'),
      pdfTabAnswer: document.getElementById('pdf-tab-answer'),
      pdfTabQNum: document.getElementById('pdf-tab-q-num'),
      pdfTabAnsNum: document.getElementById('pdf-tab-ans-num'),
      pdfZoomLabel: document.getElementById('pdf-zoom-label')
    };
  }

  function openModal(modal) {
    if (modal) modal.classList.remove('hidden');
  }

  function closeModal(modal) {
    if (modal) modal.classList.add('hidden');
  }

  // --- Background Preloader for Instant Rendering ---
  function preloadPdfDocument() {
    if (pdfDocLoadingPromise || pdfDoc) return;
    if (typeof pdfjsLib === 'undefined') return;

    try {
      const loadingTask = pdfjsLib.getDocument({
        url: 'Official%20GRE%20Verbal.pdf',
        cMapPacked: true
      });

      loadingTask.onProgress = function (progress) {
        if (progress.total > 0) {
          const pct = Math.round((progress.loaded / progress.total) * 100);
          const DOM = getDOM();
          if (DOM.pdfLoadingSpinner && !DOM.pdfLoadingSpinner.classList.contains('hidden')) {
            const span = DOM.pdfLoadingSpinner.querySelector('span');
            if (span) span.textContent = `Loading PDF (${pct}%)...`;
          }
        }
      };

      pdfDocLoadingPromise = loadingTask.promise.then(doc => {
        pdfDoc = doc;
        console.log('⚡ PDF Document preloaded successfully in background.');
        return doc;
      }).catch(err => {
        console.warn('PDF background preload retry:', err);
        pdfDocLoadingPromise = null;
      });
    } catch (e) {
      console.error('PDF preloading error:', e);
    }
  }

  async function loadPdfDocument() {
    if (pdfDoc) return pdfDoc;
    if (pdfDocLoadingPromise) return await pdfDocLoadingPromise;
    preloadPdfDocument();
    return await pdfDocLoadingPromise;
  }

  async function renderPdfPage(pageNum) {
    const DOM = getDOM();
    if (!DOM.pdfCanvas) return;

    if (isPdfRendering) {
      pendingPdfPage = pageNum;
      return;
    }

    isPdfRendering = true;
    currentPdfPage = pageNum;

    if (DOM.pdfLoadingSpinner) {
      DOM.pdfLoadingSpinner.classList.remove('hidden');
      const span = DOM.pdfLoadingSpinner.querySelector('span');
      if (span) span.textContent = 'Rendering Page...';
    }

    try {
      const doc = await loadPdfDocument();
      if (!doc) {
        if (DOM.pdfLoadingSpinner) DOM.pdfLoadingSpinner.classList.add('hidden');
        isPdfRendering = false;
        return;
      }

      const totalPages = doc.numPages;
      const validPage = Math.max(1, Math.min(pageNum, totalPages));
      currentPdfPage = validPage;

      if (DOM.pdfPageIndicator) {
        DOM.pdfPageIndicator.textContent = `Page ${validPage} of ${totalPages}`;
      }
      if (DOM.pdfZoomLabel) {
        DOM.pdfZoomLabel.textContent = `${Math.round(pdfZoom * 100)}%`;
      }

      const page = await doc.getPage(validPage);
      
      // Calculate responsive scale based on viewport width
      const containerWidth = DOM.pdfCanvasContainer ? (DOM.pdfCanvasContainer.clientWidth - 24) : (window.innerWidth - 40);
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      const baseScale = Math.min(2.2, Math.max(0.65, (containerWidth > 100 ? containerWidth : 600) / unscaledViewport.width));
      const finalScale = baseScale * pdfZoom;

      const viewport = page.getViewport({ scale: finalScale });
      const canvas = DOM.pdfCanvas;
      const ctx = canvas.getContext('2d', { alpha: false });

      // Crisp Retina Rendering
      const outputScale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = Math.floor(viewport.width) + "px";
      canvas.style.height = Math.floor(viewport.height) + "px";

      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

      const renderContext = {
        canvasContext: ctx,
        transform: transform,
        viewport: viewport
      };

      await page.render(renderContext).promise;

      if (DOM.pdfLoadingSpinner) DOM.pdfLoadingSpinner.classList.add('hidden');
      if (DOM.pdfCanvasContainer) DOM.pdfCanvasContainer.scrollTop = 0;

    } catch (error) {
      console.error('Error rendering PDF page:', error);
      if (DOM.pdfLoadingSpinner) DOM.pdfLoadingSpinner.classList.add('hidden');
    } finally {
      isPdfRendering = false;
      if (pendingPdfPage !== null) {
        const next = pendingPdfPage;
        pendingPdfPage = null;
        renderPdfPage(next);
      }
    }
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

    openModal(DOM.pdfModal);
    renderPdfPage(pageToLoad);
  }

  function switchPdfTab(tabName) {
    const DOM = getDOM();
    const { state } = global.GREState;
    const q = state.filteredQuestions[state.currentIndex];
    if (!q) return;

    const targetPage = (tabName === 'question') ? (q.pdfPageQuestion || 24) : (q.pdfPageAnswer || 24);
    
    if (DOM.pdfTabQuestion && DOM.pdfTabAnswer) {
      DOM.pdfTabQuestion.classList.toggle('active', tabName === 'question');
      DOM.pdfTabAnswer.classList.toggle('active', tabName === 'answer');
    }

    renderPdfPage(targetPage);
  }

  function stepPdfPage(delta) {
    renderPdfPage(currentPdfPage + delta);
  }

  function zoomPdf(factor) {
    const newZoom = Math.min(2.5, Math.max(0.5, pdfZoom * factor));
    if (newZoom !== pdfZoom) {
      pdfZoom = newZoom;
      renderPdfPage(currentPdfPage);
    }
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
    preloadPdfDocument,
    openPdfModal,
    switchPdfTab,
    renderPdfPage,
    stepPdfPage,
    zoomPdf,
    renderQuestionGrid,
    updateStatsModal,
    applySettings
  };

})(typeof window !== 'undefined' ? window : globalThis);
