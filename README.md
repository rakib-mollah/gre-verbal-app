# ⚡ GRE Verbal Master - Interactive Web Application

A responsive, modular, mobile-first web application for practicing and testing authentic GRE Verbal Reasoning questions from the **Official GRE Verbal Reasoning Practice Questions (Volume 1)**.

---

## 📱 Features

- **Complete Official Dataset**: Includes **158 Questions** and **32 Reading Passages** (All Practice Sets from Chapters 2, 3, 4, 5, and 6).
- **Collapsible Answer & Explanation Dropdowns**: Solve questions interactively, then click to reveal official ETS explanations and option-by-option breakdowns.
- **Passage Overview & Structure**: Hidden by default to prevent spoilers; reveals on 1-tap.
- **Reading Comprehension Split & Drawer View**: Desktop side-by-side passage view and mobile 1-tap passage accordion.
- **Multi-Blank Text Completion & Sentence Equivalence**: Clean column tables and multi-select square checkboxes matching authentic GRE format.
- **Study Mode & Timed Exam Mode**: Practice casually with instant feedback or take 35-minute timed exam sets with review screen & diagnostic score report.
- **Offline & Persistence**: Automatically saves your answers, bookmarks, scores, and preferences in `localStorage`.
- **Themes & Reading Comfort**: Dark Mode 🌙, Clean Light Mode ☀️, and Sepia / Paper Reading Mode 📖 with adjustable font sizing.

---

## 📂 Modular Architecture & Directory Structure

```text
gre-verbal-app/
├── index.html                  # Main application entry point
├── README.md                   # Documentation & setup guide
├── css/
│   ├── styles.css              # Root stylesheet (imports CSS modules)
│   ├── base.css                # CSS variables, themes (Dark/Light/Sepia), reset
│   ├── layout.css              # Header, sub-strip, responsive grid, mobile bottom bar
│   ├── components.css          # Question cards, options, TC tables, buttons, accordions
│   └── modals.css              # Navigator grid, review modal, score report, stats, settings
├── data/
│   ├── index.js                # Aggregates and exports GRE_DATA
│   ├── questions.json          # Master JSON dataset (158 Qs)
│   ├── ch2_samples.js          # Chapter 2: Sample Questions (8 Qs, 1 passage)
│   ├── ch3_rc.js               # Chapter 3: Reading Comprehension (30 Qs, 14 passages)
│   ├── ch4_tc.js               # Chapter 4: Text Completion (25 Qs)
│   ├── ch5_se.js               # Chapter 5: Sentence Equivalence (20 Qs)
│   └── ch6_mixed.js            # Chapter 6: Mixed Sets 1-3 (75 Qs, 17 passages)
└── js/
    ├── app.js                  # Main application bootstrap & initialization
    ├── state.js                # Central state management & localStorage persistence
    ├── renderer.js             # Question rendering, options, passage drawer, explanations
    ├── exam.js                 # 35-min countdown timer, scoring engine & diagnostic reports
    ├── modals.js               # Grid navigator, exam review table, study stats & settings
    └── events.js               # Event listeners, filter pill bindings, keyboard navigation
```

---

## 🚀 How to Host on GitHub Pages (Mobile Ready)

You can host this entire web app on GitHub Pages for free in 1 minute:

### Step 1: Create a GitHub Repository
1. Go to [GitHub](https://github.com) and click **New Repository**.
2. Name it `gre-verbal-prep` (or any name you prefer).
3. Set visibility to **Public**.

### Step 2: Upload the Files
Upload the entire contents of the `gre-verbal-app` folder (including `css/`, `data/`, `js/`, and `index.html`):
```bash
git init
git add .
git commit -m "Modularized GRE Verbal App"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<REPO_NAME>.git
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. On your repository page, click **Settings** (gear icon).
2. On the left sidebar, click **Pages**.
3. Under **Branch**, select `main` and root folder `/ (root)`, then click **Save**.
4. Within ~30 seconds, your site will be live at:
   `https://<YOUR_USERNAME>.github.io/<REPO_NAME>/`

### Step 4: Open on Mobile
- Open that link on your iPhone Safari or Android Chrome.
- **Tip**: Tap "Add to Home Screen" in your mobile browser to use it like a full-screen native mobile app!
