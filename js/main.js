/**
 * S. Video Creation — Main Interactive Script
 * Accessible mobile drawer, header scroll state, and safe placeholder actions
 * Follows PROJECT_RULES.md accessibility and performance specifications
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNavigation();
  initHeaderScrollState();
  initPlaceholderInteractions();
});

/**
 * Mobile Navigation Drawer Setup
 * Handles ARIA attributes, keyboard escape key, and backdrop click
 */
function initMobileNavigation() {
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNavDrawer');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  if (!menuToggle || !mobileNav) return;

  function openMenu() {
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close menu');
    mobileNav.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus first link in drawer for keyboard accessibility
    const firstFocusable = mobileNav.querySelector('a, button');
    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), 100);
    }
  }

  function closeMenu() {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
    mobileNav.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    menuToggle.focus();
  }

  menuToggle.addEventListener('click', () => {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    if (isExpanded) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close when clicking any navigation link
  mobileLinks.forEach((link) => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  // Close on Escape key press
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
      closeMenu();
    }
  });
}

/**
 * Header Scroll State
 * Adds elevated border/shadow styling when the page is scrolled down
 */
function initHeaderScrollState() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  function updateHeader() {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();
}

/**
 * Safe Placeholder Interactions
 * Provides accessible feedback if a user clicks an unverified contact placeholder
 */
function initPlaceholderInteractions() {
  const placeholderTriggers = document.querySelectorAll('[data-pending-notice]');

  placeholderTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      const noticeType = trigger.getAttribute('data-pending-notice') || 'information';
      showAccessibleNotice(`Notice: Official ${noticeType} for S. Video Creation is currently pending owner verification per PROJECT_RULES.md.`);
    });
  });
}

/**
 * Unobtrusive Accessible Toast Notification
 */
function showAccessibleNotice(message) {
  let noticeContainer = document.getElementById('accessibleNotice');

  if (!noticeContainer) {
    noticeContainer = document.createElement('div');
    noticeContainer.id = 'accessibleNotice';
    noticeContainer.setAttribute('role', 'status');
    noticeContainer.setAttribute('aria-live', 'polite');
    noticeContainer.style.position = 'fixed';
    noticeContainer.style.bottom = '24px';
    noticeContainer.style.right = '24px';
    noticeContainer.style.zIndex = '300';
    noticeContainer.style.maxWidth = '380px';
    noticeContainer.style.backgroundColor = '#1C1C1E';
    noticeContainer.style.border = '1px solid #E32636';
    noticeContainer.style.borderRadius = '8px';
    noticeContainer.style.padding = '14px 18px';
    noticeContainer.style.color = '#FFFFFF';
    noticeContainer.style.fontSize = '14px';
    noticeContainer.style.lineHeight = '1.4';
    noticeContainer.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.6)';
    noticeContainer.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    document.body.appendChild(noticeContainer);
  }

  noticeContainer.textContent = message;
  noticeContainer.style.opacity = '1';
  noticeContainer.style.transform = 'translateY(0)';

  clearTimeout(noticeContainer._timer);
  noticeContainer._timer = setTimeout(() => {
    noticeContainer.style.opacity = '0';
    noticeContainer.style.transform = 'translateY(10px)';
  }, 4500);
}
