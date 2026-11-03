/**
 * S. Video Creation — Main Interactive Script
 * Accessible mobile drawer, header scroll state, and safe placeholder actions
 * Follows PROJECT_RULES.md accessibility and performance specifications
 */

document.addEventListener('DOMContentLoaded', () => {
  initAmbientField();
  initMobileNavigation();
  initHeaderScrollState();
  initActiveNavigation();
  initPlaceholderInteractions();
  initPortfolioFilters();
  initCatalogueNav();
  initScrollReveals();
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

  const keywordsMap = {
    portfolio: ['portfolio', 'पोर्टफोलियो'],
    products: ['product', 'प्रोडक्ट्स', 'उत्पाद'],
    services: ['service', 'सेवाएं', 'सेवाओं', 'सेवा'],
    about: ['about', 'परिचय', 'स्टूडियो'],
    contact: ['contact', 'संपर्क']
  };

  const activeTerms = keywordsMap[activeKey] || [activeKey];

  [desktopLinks, mobileLinks].forEach((links) => {
    links.forEach((link) => {
      const href = (link.getAttribute('href') || '').toLowerCase();
      const text = (link.textContent || '').trim().toLowerCase();

      // Match by href keyword, text matching any active term, or exact self link (./ on hub or ../ on subservice)
      const matchesHref = href.includes(activeKey);
      const matchesText = activeTerms.some(term => text.includes(term) || text.startsWith(term));
      const isHubSelfLink = (href === './' || href === '') && !path.includes('/video-editing') && !path.includes('/reels') && !path.includes('/video-mixing') && !path.includes('/data-recovery') && !path.includes('/software-sales') && !path.includes('/wedding');
      const isSubpageParentLink = activeKey === 'services' && (href === '../' || href === '../../services/' || href === '../../../services/');

      const isMatch = matchesHref || matchesText || (isHubSelfLink && matchesText) || (isSubpageParentLink && matchesText);
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
  // Portfolio items queried dynamically on filter click to support Supabase-loaded cards
  const emptyState = document.getElementById('portfolioEmptyState');
  const horizontalSide = document.getElementById('portfolioHorizontalSide');
  const verticalSide = document.getElementById('portfolioVerticalSide');

  if (!filterButtons.length) return;

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

      const currentItems = document.querySelectorAll('.portfolio-card-item');

      currentItems.forEach((item) => {
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

/**
 * Scroll-Triggered Reveal Animations
 * Premium, minimal entrance reveals powered by a single shared IntersectionObserver.
 *
 * Safeguards:
 * - Content is 100% visible if JavaScript is disabled or fails (html.js-reveal-active is only applied after support verification)
 * - Respects prefers-reduced-motion: reduce
 * - Above-the-fold content is revealed immediately to prevent any flash or delay
 * - Modest staggered delays (50-60ms) capped per row
 * - Elements are revealed once and immediately unobserved
 * - Reveal classes are cleaned up upon transition completion so hover/focus run 100% native
 */
function initScrollReveals() {
  if (typeof window === 'undefined') return;

  // Reduced motion check
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  // IntersectionObserver feature check
  if (!('IntersectionObserver' in window)) return;

  const targetSelector = [
    '.section-header',
    '.service-card',
    '.portfolio-placeholder-card',
    '.portfolio-card-item',
    '.product-card',
    '.catalogue-card',
    '.contact-card',
    '.use-case-card',
    '.process-card',
    '.about-box',
    '.about-feature-item',
    '.advisory-box',
    '.notice-box',
    '.reveal-on-scroll'
  ].join(', ');

  const targets = document.querySelectorAll(targetSelector);
  if (!targets.length) return;

  // Activate CSS reveal system
  document.documentElement.classList.add('js-reveal-active');

  const windowHeight = window.innerHeight || document.documentElement.clientHeight;

  // Single shared observer
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.classList.add('is-revealed');
        observer.unobserve(el);

        // After reveal transition completes, clean up reveal classes and delay
        // so hover, focus, and base transitions run 100% native with zero cascade conflicts
        const delay = parseFloat(el.style.getPropertyValue('--reveal-delay')) || 0;
        setTimeout(() => {
          el.classList.remove('reveal-item', 'is-revealed');
          el.style.removeProperty('--reveal-delay');
        }, delay + 450);
      }
    });
  }, {
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1
  });

  // Calculate subtle stagger delay for child items inside grids
  const gridSelectors = [
    '.services-grid',
    '.portfolio-grid',
    '.portfolio-horizontal-grid',
    '.portfolio-vertical-grid',
    '.products-grid',
    '.catalogue-grid',
    '.catalogue-grid--4',
    '.contact-grid',
    '.use-cases-grid',
    '.process-grid',
    '.about-features-list',
    '.related-services-grid'
  ];

  gridSelectors.forEach((selector) => {
    const grids = document.querySelectorAll(selector);
    grids.forEach((grid) => {
      const items = Array.from(grid.children).filter(el => !el.classList.contains('is-hidden'));
      const isFourCol = grid.classList.contains('catalogue-grid--4') || grid.classList.contains('process-grid');
      const modulo = isFourCol ? 4 : 3;
      const step = isFourCol ? 50 : 60;
      items.forEach((item, index) => {
        const delay = (index % modulo) * step;
        item.style.setProperty('--reveal-delay', `${delay}ms`);
      });
    });
  });

  targets.forEach((target) => {
    target.classList.add('reveal-item');
    const rect = target.getBoundingClientRect();
    // If element is already well within the initial visible viewport, reveal immediately
    // Elements lower down near or past the fold wait to reveal smoothly as the user scrolls
    if (rect.top < windowHeight * 0.65) {
      target.classList.add('is-revealed');
      setTimeout(() => {
        target.classList.remove('reveal-item', 'is-revealed');
        target.style.removeProperty('--reveal-delay');
      }, 450);
    } else {
      revealObserver.observe(target);
    }
  });

  // Expose registration hook for dynamically loaded elements (e.g. Supabase portfolio cards)
  window.registerScrollReveal = function (el) {
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!document.documentElement.classList.contains('js-reveal-active')) return;

    el.classList.add('reveal-item');
    const rect = el.getBoundingClientRect();
    if (rect.top < windowHeight * 0.65) {
      el.classList.add('is-revealed');
      setTimeout(() => {
        el.classList.remove('reveal-item', 'is-revealed');
        el.style.removeProperty('--reveal-delay');
      }, 450);
    } else {
      revealObserver.observe(el);
    }
  };
}

/**
 * Crimson Northern Lights / Aurora Borealis (Motion Batch 2 — Fluid Light Field)
 *
 * Visual Characteristics:
 * - Pure charcoal/black background (#151515) remains dominant.
 * - Fluid, silky curtains of deep crimson and red light continuously flowing across the dark space.
 * - Light stretches, bends, folds and morphs organically like real northern lights in the night sky.
 * - Physical mouse interaction: cursor movement physically deflects and creates fluid ripples along the
 *   auroral curtains over a wide area, smoothly recovering with spring damping.
 * - Absolutely zero cursor circles, spotlights, pointer halos, particles, or dots.
 * - High performance: internal 0.5x render scaling with GPU hardware bilinear upscaling, RAF pause on tab hide.
 * - Accessibility: full prefers-reduced-motion support (single static frame rendered, zero animation loop).
 */
function initAmbientField() {
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Clean up deprecated DOM elements if present
  const oldField = document.getElementById('ambientLightField');
  if (oldField) oldField.remove();
  const oldCanvas = document.getElementById('ambientCanvas');
  if (oldCanvas) oldCanvas.remove();

  // Ensure aurora canvas exists at the root of body
  let canvas = document.getElementById('ambientAurora');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'ambientAurora';
    canvas.className = 'ambient-aurora-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
  }

  // Touch capability detection
  const coarseQuery = window.matchMedia('(pointer: coarse)');
  let isCoarse = coarseQuery.matches;
  coarseQuery.addEventListener('change', (e) => {
    isCoarse = e.matches;
    if (isCoarse) {
      targetActive = 0;
      mouseActive = 0;
    }
  });

  // Try initializing WebGL
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true }) ||
             canvas.getContext('experimental-webgl', { alpha: true, antialias: false, premultipliedAlpha: true });

  if (gl) {
    initWebGLAurora(gl, canvas, motionQuery, isCoarse);
  } else {
    // Graceful 2D Canvas fallback
    init2DAuroraFallback(canvas, motionQuery, isCoarse);
  }
}

/**
 * WebGL Volumetric Silky Aurora Engine — Subtle & Refined
 */
function initWebGLAurora(gl, canvas, motionQuery, isCoarse) {
  const vsSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = (a_position + 1.0) * 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fsSource = `
    precision highp float;
    varying vec2 v_uv;

    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform vec2 u_wake;
    uniform float u_mouse_active;

    float hash(vec2 p) {
      p = fract(p * vec2(234.34, 435.345));
      p += dot(p, p + 34.23);
      return fract(p.x * p.y);
    }

    float smoothNoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    // 4-octave Fractional Brownian Motion for silky drapery folds
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * smoothNoise(p);
        p = p * 2.03 + vec2(0.4, 0.2);
        a *= 0.5;
      }
      return v;
    }

    // Tall, freely wandering organic auroral curtain
    // Unanchored: travels across the entire background unpredictably
    // Tall: span increased to 0.65-0.70 (2.5x vertical height)
    vec4 tallOrganicCurtain(
      vec2 uv,
      vec2 dynamicCenter,
      float dynamicAngle,
      float waveSpeed,
      float freq,
      float amp,
      float pleatDensity,
      float baseRibbonSpan,
      vec3 deepColor,
      vec3 crestColor,
      float time,
      vec2 mNorm,
      vec2 wakeNorm,
      float mActive
    ) {
      float aspect = u_resolution.x / u_resolution.y;

      // Aspect-corrected rotation around freely traveling dynamicCenter
      vec2 p = uv - dynamicCenter;
      p.x *= aspect;
      float cosA = cos(dynamicAngle);
      float sinA = sin(dynamicAngle);
      vec2 rotP = vec2(
        cosA * p.x + sinA * p.y,
        -sinA * p.x + cosA * p.y
      );

      float u = rotP.x;
      float v = rotP.y;

      // Responsive fluid cursor disturbance & trailing wake
      vec2 deltaScreen = vec2((uv.x - mNorm.x) * aspect, uv.y - mNorm.y);
      float mDist = length(deltaScreen);

      // Broad, organic Gaussian influence radius
      float influenceRadius = 0.42;
      float gauss = exp(- (mDist * mDist) / (2.0 * influenceRadius * influenceRadius)) * mActive;

      // Project displacement delta into curtain's local rotated frame (u, v)
      vec2 rotDelta = vec2(
        cosA * deltaScreen.x + sinA * deltaScreen.y,
        -sinA * deltaScreen.x + cosA * deltaScreen.y
      );

      // 1. Perpendicular push & deflection (visibly pushes and parts the curtain spine)
      float pushStrength = 0.145;
      float fluidDeflect = (rotDelta.y / (mDist + 0.12)) * gauss * pushStrength;

      // 2. Tangential warp & ray parting (bends vertical ray pleats around the cursor)
      float warpStrength = 0.095;
      float fluidRayWarp = (rotDelta.x / (mDist + 0.14)) * gauss * warpStrength;

      // 3. Trailing fluid wake ripple behind the moving cursor
      vec2 wakeDelta = vec2((uv.x - wakeNorm.x) * aspect, uv.y - wakeNorm.y);
      float wakeDist = length(wakeDelta);
      float wakeGauss = exp(- (wakeDist * wakeDist) / (2.0 * 0.38 * 0.38)) * mActive;
      float wakeRipple = sin(wakeDist * 14.0 - time * 4.5) * wakeGauss * 0.048;

      // Fluid silk drapery warp across the tall curtain height + cursor ray parting
      float warp = sin(v * 3.2 - time * (waveSpeed * 0.6)) * 0.045;
      warp += cos(v * 6.5 + time * (waveSpeed * 0.35)) * 0.020;
      float uWarped = u + warp + fluidRayWarp;

      // Multi-harmonic traveling wave spine (waves travel through the curtain)
      float spine = sin(uWarped * freq - time * waveSpeed) * amp;
      spine += cos(uWarped * (freq * 1.65) + time * (waveSpeed * 0.72)) * (amp * 0.40);
      spine += sin(uWarped * (freq * 2.8) - time * (waveSpeed * 1.2)) * (amp * 0.16);

      // Organic shape morphing via FBM (morphs the actual curve of the light)
      float shapeMorph = (fbm(vec2(uWarped * 1.2 + time * 0.08, time * 0.07)) - 0.5) * (amp * 0.95);
      spine += shapeMorph;

      // Apply physical fluid deflection and trailing wake directly to spine
      spine += (fluidDeflect + wakeRipple);

      // Distance from the undulating curtain spine
      float dist = v - spine;

      // Dynamic ribbon height: tall 2.5x vertical span that stretches & breathes
      float localSpan = baseRibbonSpan * (0.85 + 0.28 * sin(uWarped * (freq * 0.45) - time * (waveSpeed * 0.4)));
      localSpan *= (0.92 + 0.16 * fbm(vec2(u * 0.8, time * 0.05)));

      // Ribbon boundary limits
      if (dist < -0.04 || dist > localSpan) {
        return vec4(0.0);
      }

      // Tall vertical ray pleats streaming along the curtain
      float rayFlow = uWarped * pleatDensity + sin(v * 2.8 - time * 0.3) * 0.30 + time * (waveSpeed * 1.3);
      float rays = fbm(vec2(rayFlow, v * 1.1 - time * 0.18));
      rays = pow(rays, 1.2) * 1.3;

      // Optical fold thickness where curtain bunches up
      float folds = 1.0 + abs(cos(uWarped * freq - time * waveSpeed)) * 0.42;

      // Feathered envelope: whisper-thin bottom fade, tall feathered top fade
      float bottomFade = smoothstep(-0.04, 0.03, dist);
      float topFade = 1.0 - smoothstep(localSpan * 0.30, localSpan, dist);

      // Intensity envelope
      float intensity = bottomFade * topFade * (0.24 + 0.76 * rays) * folds;

      // Subdued crimson color progression (no neon)
      float crestFactor = smoothstep(0.01, localSpan * 0.55, dist) * rays;
      vec3 col = mix(deepColor, crestColor, clamp(crestFactor, 0.0, 1.0));

      return vec4(col, intensity);
    }

    void main() {
      vec2 uv = v_uv;

      // Normalized mouse & wake coordinates
      vec2 mNorm = u_mouse / u_resolution;
      mNorm.y = 1.0 - mNorm.y;
      vec2 wakeNorm = u_wake / u_resolution;
      wakeNorm.y = 1.0 - wakeNorm.y;

      // Unanchored, non-repeating Lissajous-Brownian trajectories across the entire screen
      // Incommensurate frequency ratios guarantee free, unpredictable travel (no fixed corners)

      // Curtain 1: Sweeps freely across all quadrants and center
      vec2 c1_center = vec2(
        0.50 + 0.55 * (0.52 * sin(u_time * 0.063 + 0.5) + 0.33 * sin(u_time * 0.127 - 1.8) + 0.15 * cos(u_time * 0.203 + 2.1)),
        0.50 + 0.45 * (0.52 * cos(u_time * 0.051 - 1.2) + 0.33 * cos(u_time * 0.109 + 0.9) + 0.15 * sin(u_time * 0.181 - 0.4))
      );
      float c1_angle = -0.38 + 0.32 * sin(u_time * 0.041) + 0.18 * cos(u_time * 0.083 + 1.4);

      // Curtain 2: Wanders diagonally across the entire viewport
      vec2 c2_center = vec2(
        0.50 + 0.55 * (0.52 * cos(u_time * 0.057 + 2.3) + 0.33 * sin(u_time * 0.139 + 0.4) - 0.15 * cos(u_time * 0.221 - 1.5)),
        0.50 + 0.45 * (0.52 * sin(u_time * 0.067 - 0.8) + 0.33 * cos(u_time * 0.117 - 2.1) + 0.15 * sin(u_time * 0.173 + 1.6))
      );
      float c2_angle = 0.48 + 0.32 * cos(u_time * 0.047 + 0.7) + 0.18 * sin(u_time * 0.091 - 1.1);

      // Curtain 3: Tall vertical drapery traveling across left, center and right
      vec2 c3_center = vec2(
        0.50 + 0.55 * (0.50 * sin(u_time * 0.049 - 1.7) - 0.35 * cos(u_time * 0.111 + 2.6) + 0.15 * sin(u_time * 0.233 + 0.3)),
        0.50 + 0.45 * (0.50 * cos(u_time * 0.073 + 1.1) + 0.35 * sin(u_time * 0.131 - 0.6) - 0.15 * cos(u_time * 0.197 + 2.0))
      );
      float c3_angle = 1.22 + 0.30 * sin(u_time * 0.039 - 0.5) + 0.16 * cos(u_time * 0.077 + 2.2);

      // Curtain 4: Atmospheric swell drifting across top, bottom and mid-sky
      vec2 c4_center = vec2(
        0.50 + 0.55 * (0.50 * cos(u_time * 0.061 + 1.4) + 0.35 * sin(u_time * 0.123 - 0.9) + 0.15 * cos(u_time * 0.211 + 0.6)),
        0.50 + 0.45 * (0.50 * sin(u_time * 0.053 + 2.0) - 0.35 * cos(u_time * 0.119 + 1.3) + 0.15 * sin(u_time * 0.187 - 1.7))
      );
      float c4_angle = -0.22 + 0.28 * cos(u_time * 0.043 + 1.8) + 0.15 * sin(u_time * 0.087 - 0.6);

      // Color palettes: deep wine to subdued crimson (brand-harmonized #E32636)
      vec3 c1_base = vec3(0.24, 0.025, 0.045);
      vec3 c1_crest = vec3(0.52, 0.065, 0.105);

      vec3 c2_base = vec3(0.20, 0.020, 0.038);
      vec3 c2_crest = vec3(0.44, 0.052, 0.088);

      vec3 c3_base = vec3(0.16, 0.018, 0.032);
      vec3 c3_crest = vec3(0.38, 0.042, 0.072);

      vec3 c4_base = vec3(0.14, 0.015, 0.028);
      vec3 c4_crest = vec3(0.34, 0.036, 0.065);

      // 2.5x taller vertical height (baseRibbonSpan: 0.65, 0.60, 0.68, 0.55)
      vec4 r1 = tallOrganicCurtain(
        uv, c1_center, c1_angle, 0.42, 3.4, 0.082, 9.5, 0.65,
        c1_base, c1_crest, u_time,
        mNorm, wakeNorm, u_mouse_active
      );

      vec4 r2 = tallOrganicCurtain(
        uv, c2_center, c2_angle, 0.36, 2.9, 0.088, 8.0, 0.60,
        c2_base, c2_crest, u_time + 14.0,
        mNorm, wakeNorm, u_mouse_active
      );

      vec4 r3 = tallOrganicCurtain(
        uv, c3_center, c3_angle, 0.30, 2.4, 0.072, 6.5, 0.68,
        c3_base, c3_crest, u_time + 28.0,
        mNorm, wakeNorm, u_mouse_active
      );

      vec4 r4 = tallOrganicCurtain(
        uv, c4_center, c4_angle, 0.34, 3.1, 0.065, 7.5, 0.55,
        c4_base, c4_crest, u_time + 42.0,
        mNorm, wakeNorm, u_mouse_active
      );

      // Additive translucent composite onto base space color (#151515)
      // Balanced weights maintain exact subtle intensity with 2.5x taller curtains
      vec3 bg = vec3(0.082, 0.082, 0.082); // #151515
      vec3 auroralLights = r1.rgb * (r1.a * 0.26) +
                           r2.rgb * (r2.a * 0.22) +
                           r3.rgb * (r3.a * 0.18) +
                           r4.rgb * (r4.a * 0.15);

      vec3 finalColor = bg + auroralLights;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  function createShader(glCtx, type, source) {
    const shader = glCtx.createShader(type);
    glCtx.shaderSource(shader, source);
    glCtx.compileShader(shader);
    if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
      console.warn('Aurora shader error:', glCtx.getShaderInfoLog(shader));
      glCtx.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return;

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('Aurora program link error:', gl.getProgramInfoLog(program));
    return;
  }
  gl.useProgram(program);

  // Fullscreen quad buffer
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1
  ]), gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, 'u_resolution');
  const uTime = gl.getUniformLocation(program, 'u_time');
  const uMouse = gl.getUniformLocation(program, 'u_mouse');
  const uWake = gl.getUniformLocation(program, 'u_wake');
  const uMouseActive = gl.getUniformLocation(program, 'u_mouse_active');

  // Internal render scale: 0.5x internal resolution with GPU hardware bilinear upscaling
  const scale = 0.5;

  function resize() {
    canvas.width = Math.max(Math.round(window.innerWidth * scale), 320);
    canvas.height = Math.max(Math.round(window.innerHeight * scale), 240);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }
  resize();

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 120);
  }, { passive: true });

  // Mouse fluid interaction state
  let targetMouseX = canvas.width * 0.5;
  let targetMouseY = canvas.height * 0.5;
  let mouseX = targetMouseX;
  let mouseY = targetMouseY;
  let wakeX = targetMouseX;
  let wakeY = targetMouseY;
  let targetActive = 0;
  let mouseActive = 0;
  let idleTimer = null;

  function onPointerMove(e) {
    if (isCoarse) return;
    targetMouseX = e.clientX * scale;
    targetMouseY = e.clientY * scale;
    targetActive = 1.0;

    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      targetActive = 0.0;
    }, 1800);
  }

  function onPointerLeave() {
    targetActive = 0.0;
    clearTimeout(idleTimer);
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('mouseleave', onPointerLeave, { passive: true });

  let rafId = null;
  let lastTime = performance.now();

  function render(currentTime) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    // Responsive activation (fast pickup on move, graceful relaxation on idle)
    if (targetActive > mouseActive) {
      mouseActive += (targetActive - mouseActive) * Math.min(dt * 8.0, 1.0);
    } else {
      mouseActive += (targetActive - mouseActive) * (1 - Math.exp(-dt * 2.2));
    }

    // Responsive position tracking (follows cursor crisply without sluggishness)
    mouseX += (targetMouseX - mouseX) * (1 - Math.exp(-dt * 12.0));
    mouseY += (targetMouseY - mouseY) * (1 - Math.exp(-dt * 12.0));

    // Trailing wake position (slower follow, creates soft fluid trailing wake ripple)
    wakeX += (mouseX - wakeX) * (1 - Math.exp(-dt * 3.5));
    wakeY += (mouseY - wakeY) * (1 - Math.exp(-dt * 3.5));

    gl.uniform1f(uTime, currentTime * 0.001);
    gl.uniform2f(uMouse, mouseX, mouseY);
    gl.uniform2f(uWake, wakeX, wakeY);
    gl.uniform1f(uMouseActive, mouseActive);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    rafId = requestAnimationFrame(render);
  }

  function start() {
    if (rafId || motionQuery.matches) return;
    lastTime = performance.now();
    rafId = requestAnimationFrame(render);
  }

  function stop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  // Accessibility: static render for reduced motion
  function renderStaticFrame() {
    stop();
    gl.uniform1f(uTime, 5.0);
    gl.uniform2f(uMouse, canvas.width * 0.5, canvas.height * 0.5);
    gl.uniform2f(uWake, canvas.width * 0.5, canvas.height * 0.5);
    gl.uniform1f(uMouseActive, 0.0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  motionQuery.addEventListener('change', (e) => {
    if (e.matches) {
      renderStaticFrame();
    } else {
      start();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
    } else if (!motionQuery.matches) {
      start();
    }
  });

  if (motionQuery.matches) {
    renderStaticFrame();
  } else {
    start();
  }
}

/**
 * Graceful 2D Canvas Fallback (for environments without WebGL)
 */
function init2DAuroraFallback(canvas, motionQuery, isCoarse) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = window.innerWidth;
  let height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  function drawStaticFallback() {
    ctx.fillStyle = '#151515';
    ctx.fillRect(0, 0, width, height);

    // Diagonal sweep from upper-left toward center
    const grad1 = ctx.createLinearGradient(0, 0, width * 0.8, height * 0.7);
    grad1.addColorStop(0, 'rgba(21, 21, 21, 0)');
    grad1.addColorStop(0.35, 'rgba(165, 24, 34, 0.14)');
    grad1.addColorStop(0.7, 'rgba(110, 15, 24, 0.06)');
    grad1.addColorStop(1, 'rgba(21, 21, 21, 0)');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, width, height);

    // Ascending sweep from lower-left toward upper-right
    const grad2 = ctx.createLinearGradient(0, height, width, height * 0.3);
    grad2.addColorStop(0, 'rgba(21, 21, 21, 0)');
    grad2.addColorStop(0.4, 'rgba(140, 20, 30, 0.10)');
    grad2.addColorStop(1, 'rgba(21, 21, 21, 0)');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, width, height);

    // Tall drapery on the right
    const grad3 = ctx.createLinearGradient(width * 0.7, 0, width, height);
    grad3.addColorStop(0, 'rgba(21, 21, 21, 0)');
    grad3.addColorStop(0.5, 'rgba(125, 18, 28, 0.09)');
    grad3.addColorStop(1, 'rgba(21, 21, 21, 0)');
    ctx.fillStyle = grad3;
    ctx.fillRect(0, 0, width, height);
  }

  drawStaticFallback();
}

