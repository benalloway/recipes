// @ts-check

/**
 * Plain-TS island for the recipes shell:
 * 1. Light / Dark theme toggle (persisted in localStorage)
 * 2. Mobile navigation <dialog> sheet (open, close, backdrop click)
 */

const navOpenBtn = document.querySelector<HTMLButtonElement>('[data-mobile-menu-open]');
const navCloseBtn = document.querySelector<HTMLButtonElement>('[data-mobile-menu-close]');
const navDialog = document.querySelector<HTMLDialogElement>('#mobile-nav-dialog');
const navPanel = document.querySelector<HTMLElement>('[data-mobile-menu-panel]');

if (navOpenBtn && navDialog) {
  navOpenBtn.addEventListener('click', () => {
    navDialog.showModal();
    navOpenBtn.setAttribute('aria-expanded', 'true');
  });

  navDialog.addEventListener('close', () => {
    navOpenBtn.setAttribute('aria-expanded', 'false');
  });

  navDialog.addEventListener('click', (event) => {
    if (navPanel && !navPanel.contains(event.target as Node)) {
      navDialog.close();
    }
  });
}

if (navCloseBtn && navDialog) {
  navCloseBtn.addEventListener('click', () => {
    navDialog.close();
  });
}

const themeBtn = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    const next = isDark ? 'light' : 'dark';
    root.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Storage unavailable in private mode; ignore
    }
  });
}
