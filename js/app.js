/**
 * GRE Verbal Master - Application Bootstrap & Orchestrator
 * Pure Vanilla JavaScript (Zero Build Step, GitHub Pages Ready)
 */

(function () {
  'use strict';

  function initApp() {
    // 1. Verify Dataset
    const dataset = (typeof window.GRE_DATA !== 'undefined') ? window.GRE_DATA : [];
    if (!dataset || dataset.length === 0) {
      console.warn('GRE_DATA not detected or empty. Please ensure data modules are loaded.');
    }

    // 2. Initialize State
    window.GREState.loadSavedState();
    window.GREState.initData(dataset);

    // 3. Apply Settings & Appearance
    window.GREModals.applySettings();

    // 4. Bind Interaction Listeners
    window.GREEvents.bindEvents();

    // 5. Initial Render
    window.GRERenderer.renderCurrentQuestion();
    window.GRERenderer.updateBookmarkBadge();

    console.log(`⚡ GRE Verbal Master initialized successfully with ${dataset.length} questions.`);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
