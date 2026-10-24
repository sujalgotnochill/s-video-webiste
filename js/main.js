/**
 * S. Video Creation — Main Interactive Script
 * Accessible mobile drawer, header scroll state, and safe placeholder actions
 * Follows PROJECT_RULES.md accessibility and performance specifications
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNavigation();
  initHeaderScrollState();
  initPlaceholderInteractions();
  initPortfolioFilters();
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
      const channelName = trigger.getAttribute('data-pending-notice') || 'Contact Channel';
      showAccessibleNotice(channelName);
    });
  });
}

/**
 * Unobtrusive Accessible Toast Notification
 * Features dismiss button, accessible role, and clear project rules explanation
 */
function showAccessibleNotice(channelName) {
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
    noticeContainer.style.maxWidth = '400px';
    noticeContainer.style.backgroundColor = '#1C1C1E';
    noticeContainer.style.border = '1px solid #E32636';
    noticeContainer.style.borderRadius = '8px';
    noticeContainer.style.padding = '16px 20px';
    noticeContainer.style.color = '#FFFFFF';
    noticeContainer.style.fontSize = '14px';
    noticeContainer.style.lineHeight = '1.5';
    noticeContainer.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.7)';
    noticeContainer.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    document.body.appendChild(noticeContainer);

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && noticeContainer.style.opacity === '1') {
        dismissNotice();
      }
    });
  }

  function dismissNotice() {
    noticeContainer.style.opacity = '0';
    noticeContainer.style.transform = 'translateY(10px)';
    clearTimeout(noticeContainer._timer);
  }

  // Construct accessible content with close button
  noticeContainer.innerHTML = `
    <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 8px;">
      <span style="font-weight: 700; color: #E32636; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">
        Pending Verification
      </span>
      <button type="button" id="noticeDismissBtn" aria-label="Dismiss notice" style="background: none; border: none; color: #929292; font-size: 18px; line-height: 1; cursor: pointer; padding: 0 4px;">
        &times;
      </button>
    </div>
    <p style="margin: 0; color: #FFFFFF; font-size: 13px; line-height: 1.5;">
      Direct <strong>${escapeHTML(channelName)}</strong> links for S. Video Creation are currently pending business owner verification per <code>PROJECT_RULES.md</code>. Direct messaging will be activated upon launch.
    </p>
  `;

  const dismissBtn = document.getElementById('noticeDismissBtn');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', dismissNotice);
  }

  noticeContainer.style.opacity = '1';
  noticeContainer.style.transform = 'translateY(0)';

  clearTimeout(noticeContainer._timer);
  noticeContainer._timer = setTimeout(dismissNotice, 6000);
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g,
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

/**
 * Portfolio Category Filter Setup
 * Accessible category switching with zero reload, split layout support, and empty state handling
 */
function initPortfolioFilters() {
  const filterButtons = document.querySelectorAll('.portfolio-filter-btn');
  const portfolioItems = document.querySelectorAll('.portfolio-card-item');
  const emptyState = document.getElementById('portfolioEmptyState');
  const horizontalSide = document.getElementById('portfolioHorizontalSide');
  const verticalSide = document.getElementById('portfolioVerticalSide');

  if (!filterButtons.length || !portfolioItems.length) return;

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const selectedCategory = btn.getAttribute('data-filter') || 'all';

      // Update active state and aria-pressed across filter buttons
      filterButtons.forEach((otherBtn) => {
        const isCurrent = otherBtn === btn;
        otherBtn.classList.toggle('active', isCurrent);
        otherBtn.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
      });

      // Filter portfolio items
      let visibleTotal = 0;
      let visibleHorizontal = 0;
      let visibleVertical = 0;

      portfolioItems.forEach((item) => {
        const itemCategory = item.getAttribute('data-category');
        const matches = selectedCategory === 'all' || itemCategory === selectedCategory;

        if (matches) {
          item.classList.remove('is-hidden');
          visibleTotal++;
          if (horizontalSide && horizontalSide.contains(item)) {
            visibleHorizontal++;
          }
          if (verticalSide && verticalSide.contains(item)) {
            visibleVertical++;
          }
        } else {
          item.classList.add('is-hidden');
        }
      });

      // Handle split layout column wrappers
      if (horizontalSide) {
        if (visibleHorizontal > 0) {
          horizontalSide.style.display = '';
          if (visibleVertical === 0) {
            horizontalSide.classList.add('is-full-width');
          } else {
            horizontalSide.classList.remove('is-full-width');
          }
        } else {
          horizontalSide.style.display = 'none';
          horizontalSide.classList.remove('is-full-width');
        }
      }

      if (verticalSide) {
        if (visibleVertical > 0) {
          verticalSide.style.display = '';
          if (visibleHorizontal === 0) {
            verticalSide.classList.add('is-centered');
          } else {
            verticalSide.classList.remove('is-centered');
          }
        } else {
          verticalSide.style.display = 'none';
          verticalSide.classList.remove('is-centered');
        }
      }

      // Toggle empty state if no matching items
      if (emptyState) {
        if (visibleTotal === 0) {
          emptyState.removeAttribute('hidden');
          emptyState.style.display = 'block';
        } else {
          emptyState.setAttribute('hidden', '');
          emptyState.style.display = 'none';
        }
      }
    });
  });
}
