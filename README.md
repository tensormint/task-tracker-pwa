# Productivity Task & Time Tracker (Offline PWA)

A mobile-first, 100% offline-capable Progressive Web App (PWA) designed to track daily study topics, sub-task progress, consecutive streaks, and focus sessions.

## Live Demo
**[Open Live App](https://rohit357854-hub.github.io/task-tracker-pwa/)**

## Key Features
- **100% Offline Support:** Powered by a custom Service Worker (`sw.js`) and `localStorage` so tasks, logs, and timers work without internet.
- **Drift-Free Session Timer:** Tracks exact focus duration using system timestamps (`Date.now()`), even if the screen locks or switches tabs.
- **Sub-Task & Topic Checklist:** Break down big goals into smaller topics with a live circular progress ring (`0%` to `100%`).
- **Consecutive Day Streak & Monthly Calendar:** Automatically tracks daily consistency and highlights active days on a monthly progress grid.
- **Schedule & Search Timeline:** Filter daily tasks by date or search keywords instantly.
- **Customizable Profile:** Set your own display name and dynamic avatar badge on first launch.

## Tech Stack
- **Frontend:** HTML5, CSS3 (Custom Mobile-First UI, SVG Progress Rings)
- **Logic:** Vanilla JavaScript (ES6+ Modular Architecture)
- **PWA & Storage:** Web App Manifest, Service Worker API, LocalStorage

## How to Install on Mobile
1. Open the [Live Demo Link](https://rohit357854-hub.github.io/task-tracker-pwa/) in **Google Chrome** on Android (or Safari on iOS).
2. Tap the **three-dot menu (`⋮`)** in the top-right corner.
3. Select **Install app** or **Add to Home screen** to use it like a native offline app.
