/**
 * GRE Verbal Master - Firebase Cloud Sync Module
 * Synchronizes bookmarks, progress, and settings in real-time across devices
 */

(function (global) {
  'use strict';

  // Firebase Web Configuration
  const firebaseConfig = {
    apiKey: "AIzaSyDRTNBM5Eom6ZdzyX6CPryjqxphYwAK_G8",
    authDomain: "gre-verbal-app-db78e.firebaseapp.com",
    projectId: "gre-verbal-app-db78e",
    storageBucket: "gre-verbal-app-db78e.firebasestorage.app",
    messagingSenderId: "603670510747",
    appId: "1:603670510747:web:fa2bccfe32a1b363eb1a3e",
    measurementId: "G-K5DZPPZKGV"
  };

  const SYNC_CODE_KEY = 'gre_verbal_sync_code';
  let db = null;
  let activeUnsubscribe = null;
  let isApplyingRemote = false;
  let debounceTimer = null;
  let syncStatus = 'offline'; // 'offline' | 'connecting' | 'synced' | 'syncing' | 'error'

  function generateSyncCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = 'GRE-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  function getSyncCode() {
    let code = localStorage.getItem(SYNC_CODE_KEY);
    if (!code || !code.trim()) {
      code = generateSyncCode();
      localStorage.setItem(SYNC_CODE_KEY, code);
    }
    return code.trim().toUpperCase();
  }

  function updateStatus(status, message) {
    syncStatus = status;
    const headerPill = document.getElementById('cloud-sync-pill');
    const statusText = document.getElementById('cloud-sync-status-text');
    const statusDot = document.getElementById('cloud-sync-dot');
    
    if (headerPill) {
      headerPill.classList.remove('status-synced', 'status-syncing', 'status-error', 'status-offline', 'status-connecting');
      headerPill.classList.add(`status-${status}`);
    }

    if (statusDot) {
      statusDot.className = `sync-dot status-${status}`;
    }

    if (statusText) {
      if (message) {
        statusText.textContent = message;
      } else if (status === 'synced') {
        statusText.textContent = 'Synced with Cloud';
      } else if (status === 'syncing') {
        statusText.textContent = 'Syncing...';
      } else if (status === 'error') {
        statusText.textContent = 'Sync Error';
      } else if (status === 'connecting') {
        statusText.textContent = 'Connecting...';
      } else {
        statusText.textContent = 'Offline';
      }
    }
  }

  function initFirebase() {
    if (typeof firebase === 'undefined') {
      console.warn('Firebase SDK not loaded. Working in offline mode.');
      updateStatus('offline', 'Firebase SDK Offline');
      return;
    }

    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.firestore();

      // Enable offline cache if available
      try {
        db.enablePersistence({ synchronizeTabs: true }).catch(() => {
          // Persistence might fail if multiple tabs are open on older browsers, safe to ignore
        });
      } catch (err) {
        // Safe to ignore
      }

      updateStatus('connecting', 'Connecting...');
      attachSyncListener();
    } catch (e) {
      console.error('Firebase initialization error:', e);
      updateStatus('error', 'Connection Failed');
    }
  }

  function attachSyncListener() {
    if (!db) return;
    if (activeUnsubscribe) {
      activeUnsubscribe();
      activeUnsubscribe = null;
    }

    const syncCode = getSyncCode();
    const docRef = db.collection('gre_users').doc(syncCode);

    activeUnsubscribe = docRef.onSnapshot((doc) => {
      if (isApplyingRemote) return;

      if (doc.exists) {
        const cloudData = doc.data();
        if (cloudData && global.GREState) {
          isApplyingRemote = true;
          try {
            const state = global.GREState.state;

            // Merge bookmarks (Union of local & cloud so nothing gets lost)
            if (Array.isArray(cloudData.bookmarks)) {
              cloudData.bookmarks.forEach(id => state.bookmarks.add(id));
            }

            // Update user answers & checked states if cloud has them
            if (cloudData.userAnswers) {
              state.userAnswers = Object.assign({}, state.userAnswers, cloudData.userAnswers);
            }
            if (cloudData.checkedQuestions) {
              state.checkedQuestions = Object.assign({}, state.checkedQuestions, cloudData.checkedQuestions);
            }

            // Sync settings if provided
            if (cloudData.settings) {
              state.settings = Object.assign(state.settings, cloudData.settings);
              if (global.GREModals && global.GREModals.applySettings) {
                global.GREModals.applySettings();
              }
            }

            // Save to localStorage
            global.GREState.saveState(false); // false = do not loop push to cloud

            // Re-render UI
            if (global.GRERenderer) {
              global.GRERenderer.updateBookmarkBadge();
              global.GRERenderer.renderCurrentQuestion();
            }
            if (global.GREModals && global.GREModals.renderQuestionGrid) {
              global.GREModals.renderQuestionGrid();
            }
          } finally {
            setTimeout(() => {
              isApplyingRemote = false;
            }, 100);
          }
        }
        updateStatus('synced', 'Live Cloud Sync Active');
      } else {
        // Doc does not exist yet on cloud, push local state to initialize it
        syncToCloud();
        updateStatus('synced', 'Live Cloud Sync Active');
      }
    }, (error) => {
      console.warn('Firestore snapshot error:', error);
      updateStatus('error', 'Cloud Disconnected');
    });
  }

  function syncToCloud() {
    if (!db || isApplyingRemote) return;

    clearTimeout(debounceTimer);
    updateStatus('syncing', 'Syncing to Cloud...');

    debounceTimer = setTimeout(async () => {
      try {
        const syncCode = getSyncCode();
        const state = global.GREState ? global.GREState.state : null;
        if (!state) return;

        const docRef = db.collection('gre_users').doc(syncCode);
        const payload = {
          bookmarks: Array.from(state.bookmarks),
          userAnswers: state.userAnswers,
          checkedQuestions: state.checkedQuestions,
          settings: state.settings,
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
          client: 'gre-verbal-web'
        };

        await docRef.set(payload, { merge: true });
        updateStatus('synced', 'All changes saved to cloud');
      } catch (err) {
        console.warn('Cloud sync push error:', err);
        updateStatus('error', 'Sync Failed (Will Retry)');
      }
    }, 400);
  }

  function setSyncCode(newCode) {
    if (!newCode || !newCode.trim()) return false;
    const formatted = newCode.trim().toUpperCase();
    localStorage.setItem(SYNC_CODE_KEY, formatted);
    
    // Re-attach Firestore listener to the new sync code document
    attachSyncListener();
    return true;
  }

  // Export module
  global.GRESync = {
    initFirebase,
    getSyncCode,
    setSyncCode,
    syncToCloud,
    updateStatus,
    getStatus: () => syncStatus
  };

})(typeof window !== 'undefined' ? window : globalThis);
