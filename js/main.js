/**
 * S. Video Creation — Main Interactive Script
 * Accessible mobile drawer, header scroll state, and safe placeholder actions
 * Follows PROJECT_RULES.md accessibility and performance specifications
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNavigation();
  initHeaderScrollState();
  initActiveNavigation();
  initPlaceholderInteractions();
  initPortfolioFilters();
  initCatalogueNav();
});

/**
 * Active Navigation Highlighting & ScrollSpy
 * Handles:
 * - Dedicated page URL detection (/portfolio/, /services/, /products/)
 * - Homepage IntersectionObserver scroll-spy for #top, #services, #portfolio, #products, #about, #contact
 * - Top of page & bottom of page edge cases
 * - Manual link clicking with smooth-scroll & temporary scroll-spy lock
 * - Direct page load and browser refresh with hash support
 * - Synchronized desktop (.nav-link) and mobile (.mobile-nav-link) state
 * - ARIA aria-current="page" (dedicated pages / home) and aria-current="true" (homepage sections)
 * - prefers-reduced-motion support
 */
function initActiveNavigation() {
  const isHomepage = !!document.querySelector('.hero-section') &&
                     !!document.getElementById('services') &&
                     !!document.getElementById('portfolio');

  if (!isHomepage) {
    highlightDedicatedPageNav();
    return;
  }

  initHomepageScrollTracking();
}

/**
 * Dedicated Page Navigation Active State
 * Sets active state and aria-current="page" based on URL path
 */
function highlightDedicatedPageNav() {
  const path = window.location.pathname.toLowerCase();
  const desktopLinks = document.querySelectorAll('.site-nav .nav-link');
  const mobileLinks = document.querySelectorAll('.mobile-nav-drawer .mobile-nav-link');

  let activeKey = null;
  if (path.includes('/portfolio')) {
    activeKey = 'portfolio';
  } else if (path.includes('/products')) {
    activeKey = 'products';
  } else if (path.includes('/services')) {
    activeKey = 'services';
  } else if (path.includes('/about')) {
    activeKey = 'about';
  } else if (path.includes('/contact')) {
    activeKey = 'contact';
  }

  if (!activeKey) return;

  [desktopLinks, mobileLinks].forEach((links) => {
    links.forEach((link) => {
      const href = (link.getAttribute('href') || '').toLowerCase();
      const text = (link.textContent || '').trim().toLowerCase();

      const isMatch = href.includes(activeKey) || text.startsWith(activeKey);
      if (isMatch) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  });
}

/**
 * Homepage Scroll-Spy & In-Page Section Tracking
 * Uses IntersectionObserver API with header offset and edge-case protection
 */
function initHomepageScrollTracking() {
  const sectionConfigs = [
    { id: 'top', targetEl: document.querySelector('.hero-section') || document.getElementById('top'), hash: '#top' },
    { id: 'services', targetEl: document.getElementById('services'), hash: '#services' },
    { id: 'portfolio', targetEl: document.getElementById('portfolio'), hash: '#portfolio' },
    { id: 'products', targetEl: document.getElementById('products'), hash: '#products' },
    { id: 'about', targetEl: document.getElementById('about'), hash: '#about' },
    { id: 'contact', targetEl: document.getElementById('contact'), hash: '#contact' }
  ].filter(item => !!item.targetEl);

  if (!sectionConfigs.length) return;

  let isManualScrolling = false;
  let manualScrollTimeout = null;

  const desktopLinks = document.querySelectorAll('.site-nav .nav-link');
  const mobileLinks = document.querySelectorAll('.mobile-nav-drawer .mobile-nav-link');

  function setActiveNav(targetHash) {
    [desktopLinks, mobileLinks].forEach((links) => {
      links.forEach((link) => {
        const href = link.getAttribute('href');
        const isMatch = href === targetHash;
        if (isMatch) {
          link.classList.add('active');
          link.setAttribute('aria-current', targetHash === '#top' ? 'page' : 'true');
        } else {
          link.classList.remove('active');
          link.removeAttribute('aria-current');
        }
      });
    });
  }

  function getHeaderHeight() {
    const header = document.querySelector('.site-header');
    return header ? header.offsetHeight : 72;
  }

  function updateActiveSection() {
    if (isManualScrolling) return;

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const headerHeight = getHeaderHeight();

    // 1. Top of page edge case: activate Home (#top)
    if (scrollY < 80) {
      setActiveNav('#top');
      return;
    }

    // 2. Bottom of page edge case: activate the last section (#contact) even if short
    if (windowHeight + scrollY >= docHeight - 50) {
      const lastItem = sectionConfigs[sectionConfigs.length - 1];
      if (lastItem) {
        setActiveNav(lastItem.hash);
        return;
      }
    }

    // 3. Focal zone calculation below the sticky header
    // Calculates which section currently occupies the upper reading area below the sticky header
    const focalOffset = Math.max(headerHeight + 130, Math.min(windowHeight * 0.4, 280));
    let activeItem = sectionConfigs[0];

    for (let i = 0; i < sectionConfigs.length; i++) {
      const item = sectionConfigs[i];
      const rect = item.targetEl.getBoundingClientRect();
      if (rect.top <= focalOffset) {
        activeItem = item;
      } else {
        break;
      }
    }

    if (activeItem) {
      setActiveNav(activeItem.hash);
    }
  }

  // Primary IntersectionObserver tracking
  if ('IntersectionObserver' in window) {
    const headerHeight = getHeaderHeight();
    const observer = new IntersectionObserver(() => {
      if (!isManualScrolling) {
        updateActiveSection();
      }
    }, {
      rootMargin: `-${headerHeight}px 0px -45% 0px`,
      threshold: [0, 0.2, 0.5, 0.8]
    });

    sectionConfigs.forEach(item => observer.observe(item.targetEl));
  }

  // Passive requestAnimationFrame scroll listener for real-time smoothness
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(() => {
        updateActiveSection();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  // Handle window resizing / orientation change
  window.addEventListener('resize', () => {
    updateActiveSection();
  }, { passive: true });

  // Unlock manual scroll lock if user wheels or touches
  window.addEventListener('wheel', () => { isManualScrolling = false; }, { passive: true });
  window.addEventListener('touchstart', () => { isManualScrolling = false; }, { passive: true });

  // Handle manual in-page navigation clicks with smooth scrolling
  const inPageLinks = document.querySelectorAll('.site-nav a[href^="#"], .mobile-nav-drawer a[href^="#"], .brand-logo-link[href="#top"], .footer-links a[href="#top"], .header-actions a[href="#contact"]');
  inPageLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;

      const targetId = href.substring(1);
      const targetEl = targetId === 'top'
        ? (document.querySelector('.hero-section') || document.getElementById('top'))
        : document.getElementById(targetId);

      if (targetEl) {
        event.preventDefault();

        // Immediately update active styling
        setActiveNav(href);

        // Lock scroll-spy while smooth scrolling takes place
        isManualScrolling = true;
        clearTimeout(manualScrollTimeout);

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const behavior = prefersReducedMotion ? 'auto' : 'smooth';

        if (targetId === 'top') {
          window.scrollTo({ top: 0, behavior });
        } else {
          targetEl.scrollIntoView({ behavior, block: 'start' });
        }

        if (history.pushState) {
          history.pushState(null, '', href);
        } else {
          window.location.hash = href;
        }

        const duration = prefersReducedMotion ? 50 : 800;
        manualScrollTimeout = setTimeout(() => {
          isManualScrolling = false;
          updateActiveSection();
        }, duration);
      }
    });
  });

  // Handle browser back/forward buttons
  window.addEventListener('popstate', () => {
    if (window.location.hash) {
      const matching = sectionConfigs.find(item => item.hash === window.location.hash);
      if (matching) {
        setActiveNav(matching.hash);
      } else {
        updateActiveSection();
      }
    } else {
      setActiveNav('#top');
    }
  });

  // Handle initial page load or browser refresh with hash
  if (window.location.hash) {
    const matching = sectionConfigs.find(item => item.hash === window.location.hash);
    if (matching) {
      setActiveNav(matching.hash);
    } else {
      updateActiveSection();
    }
  } else {
    updateActiveSection();
  }
}

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

/**
 * Products Catalogue Category Navigation Setup
 * Provides accessible category jumping, active pill state management, and scroll spy
 */
function initCatalogueNav() {
  const navBtns = document.querySelectorAll('.catalogue-nav-btn');
  const sections = document.querySelectorAll('.catalogue-section, #related-data-recovery');

  if (!navBtns.length || !sections.length) return;

  let isClickScrolling = false;
  let clickScrollTimeout = null;

  function setActiveBtn(targetId) {
    navBtns.forEach((btn) => {
      const href = btn.getAttribute('href');
      const isMatch = href === `#${targetId}`;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-current', isMatch ? 'true' : 'false');
    });
  }

  // Smooth scroll and active state on click
  navBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('href')?.replace('#', '');
      if (targetId) {
        setActiveBtn(targetId);
        isClickScrolling = true;
        clearTimeout(clickScrollTimeout);
        const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 50 : 800;
        clickScrollTimeout = setTimeout(() => {
          isClickScrolling = false;
        }, duration);
      }
    });
  });

  // User wheel or touch unlocks click scroll lock immediately
  window.addEventListener('wheel', () => { isClickScrolling = false; }, { passive: true });
  window.addEventListener('touchstart', () => { isClickScrolling = false; }, { passive: true });

  // ScrollSpy via IntersectionObserver
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (isClickScrolling) return;

      const intersecting = entries.filter(e => e.isIntersecting);
      if (intersecting.length > 0) {
        // Pick the intersecting section closest to top reading zone
        intersecting.sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));
        setActiveBtn(intersecting[0].target.id);
      }
    }, {
      rootMargin: '-15% 0px -55% 0px',
      threshold: [0, 0.2, 0.5]
    });

    sections.forEach((sec) => observer.observe(sec));
  }
}

