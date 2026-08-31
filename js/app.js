/**
 * GRE Verbal Master - Application Bootstrapper
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // 1. Check dataset availability
  const dataset = window.GRE_DATA || [];
  if (!dataset || dataset.length === 0) {
    console.error('GRE_DATA not found. Please ensure data scripts are loaded.');
    return;
  }

  // 2. Initialize State
  const { initData, loadSavedState } = window.GREState;
  initData(dataset);
  loadSavedState();

  // 3. Apply Preferences
  window.GREModals.applySettings();

  // 4. Preload PDF in background for instant page opening
  if (window.GREModals && window.GREModals.preloadPdfDocument) {
    window.GREModals.preloadPdfDocument();
  }

  // 5. Initial Render
  window.GRERenderer.renderCurrentQuestion();
  window.GRERenderer.updateBookmarkBadge();

  // 6. Bind Event Handlers
  window.GREEvents.bindEvents();

  // 7. Initialize Firebase Real-Time Cloud Sync
  if (window.GRESync && window.GRESync.initFirebase) {
    window.GRESync.initFirebase();
  }

  console.log('⚡ GRE Verbal Master initialized successfully with', dataset.length, 'questions.');
});
