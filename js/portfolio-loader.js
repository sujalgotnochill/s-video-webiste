/**
 * S. Video Creation — Public Portfolio Dynamic Loader
 * Dynamically renders published YouTube portfolio entries from Supabase
 * with thumbnail-first lazy loading and accessible click-to-play embeds.
 * 
 * Hardened per project requirements:
 * - Strict HTTPS image URL validation for custom thumbnails (falls back to YouTube HQ)
 * - Strict 11-char YouTube ID verification before constructing embeds
 * - Pure DOM textContent rendering (zero untrusted innerHTML interpolation)
 * - Safe fallback to static preview cards when Supabase is unconfigured or offline
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', initPortfolioLoader);

  function isHindi() {
    return document.documentElement.lang === 'hi' || window.location.pathname.includes('/hi/');
  }

  const VALID_CATEGORIES = ['editing', 'reels', 'wedding', 'mixing', 'other'];

  const CATEGORY_NAMES = {
    en: {
      editing: 'Video Editing',
      reels: 'Reels & Promos',
      wedding: 'Wedding & Events',
      mixing: 'Video Mixing',
      other: 'Other'
    },
    hi: {
      editing: 'वीडियो एडिटिंग',
      reels: 'रील्स और प्रोमोज',
      wedding: 'वेडिंग एवं इवेंट्स',
      mixing: 'वीडियो मिक्सिंग',
      other: 'अन्य'
    }
  };

  async function initPortfolioLoader() {
    const isHomepage = !!document.querySelector('.portfolio-grid');
    const isPortfolioPage = !!document.getElementById('portfolioGrid');

    if (!isHomepage && !isPortfolioPage) return;

    // If Supabase credentials are not set, maintain static preview cards
    if (typeof window.isSupabaseConfigured !== 'function' || !window.isSupabaseConfigured()) {
      console.info('[S. Video Creation] Supabase is unconfigured. Showing static studio workflow preview.');
      return;
    }

    const client = window.getSupabaseClient();
    if (!client) return;

    try {
      if (isPortfolioPage) {
        await loadPortfolioPageEntries(client);
      } else if (isHomepage) {
        await loadHomepageEntries(client);
      }
    } catch (err) {
      console.warn('[S. Video Creation] Failed to load dynamic portfolio entries; preserving preview cards.', err);
    }
  }

  /**
   * Homepage: load published entries marked as is_featured=true
   */
  async function loadHomepageEntries(client) {
    const grid = document.querySelector('.portfolio-grid');
    if (!grid) return;

    const { data, error } = await client
      .from('portfolio_items')
      .select('*')
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      console.warn('[S. Video Creation] Error fetching featured portfolio items:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      // Keep static preview placeholders if no published featured items exist yet
      return;
    }

    // Replace static cards with real published featured cards
    grid.innerHTML = '';
    const lang = isHindi() ? 'hi' : 'en';

    data.forEach((item) => {
      const card = createPortfolioCard(item, lang, false);
      grid.appendChild(card);
    });
  }

  /**
   * Portfolio Page: load all published entries and distribute by orientation
   */
  async function loadPortfolioPageEntries(client) {
    const horizontalGrid = document.querySelector('.portfolio-horizontal-grid');
    const verticalGrid = document.querySelector('.portfolio-vertical-grid');
    const horizontalSide = document.getElementById('portfolioHorizontalSide');
    const verticalSide = document.getElementById('portfolioVerticalSide');

    if (!horizontalGrid || !verticalGrid) return;

    const { data, error } = await client
      .from('portfolio_items')
      .select('*')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[S. Video Creation] Error fetching portfolio items:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      // Keep static preview cards if database has no published entries yet
      return;
    }

    const lang = isHindi() ? 'hi' : 'en';
    const horizontalItems = data.filter(item => item.orientation !== 'portrait');
    const verticalItems = data.filter(item => item.orientation === 'portrait');

    // Populate Horizontal Grid (16:9)
    if (horizontalItems.length > 0) {
      horizontalGrid.innerHTML = '';
      horizontalItems.forEach((item) => {
        horizontalGrid.appendChild(createPortfolioCard(item, lang, true));
      });
      const countEl = horizontalSide ? horizontalSide.querySelector('.portfolio-side-count') : null;
      if (countEl) {
        countEl.textContent = `${horizontalItems.length} ${lang === 'hi' ? 'प्रोजेक्ट्स' : 'Projects'}`;
      }
    }

    // Populate Vertical Grid (9:16)
    if (verticalItems.length > 0) {
      verticalGrid.innerHTML = '';
      verticalItems.forEach((item) => {
        verticalGrid.appendChild(createPortfolioCard(item, lang, true));
      });
      const countEl = verticalSide ? verticalSide.querySelector('.portfolio-side-count') : null;
      if (countEl) {
        countEl.textContent = `${verticalItems.length} ${lang === 'hi' ? 'रील्स' : 'Reels'}`;
      }
    }

    // Adjust split layout visibility if one column is empty
    if (horizontalSide && verticalSide) {
      if (horizontalItems.length > 0 && verticalItems.length === 0) {
        verticalSide.style.display = 'none';
        horizontalSide.classList.add('is-full-width');
      } else if (verticalItems.length > 0 && horizontalItems.length === 0) {
        horizontalSide.style.display = 'none';
        verticalSide.classList.add('is-centered');
      } else {
        horizontalSide.style.display = '';
        verticalSide.style.display = '';
        horizontalSide.classList.remove('is-full-width');
        verticalSide.classList.remove('is-centered');
      }
    }

    // Re-attach or trigger filter click on current active filter button
    refreshFilterListeners();
  }

  /**
   * Constructs an accessible, responsive portfolio card with thumbnail-first click-to-play.
   * Completely avoids innerHTML interpolation of database-supplied content.
   */
  function createPortfolioCard(item, lang, isPortfolioPage) {
    const card = document.createElement('article');
    card.className = isPortfolioPage
      ? 'portfolio-card-item portfolio-dynamic-card'
      : 'card portfolio-placeholder-card portfolio-dynamic-card';

    // Safely validate category
    const safeCategory = VALID_CATEGORIES.includes(item.category) ? item.category : 'other';
    card.setAttribute('data-category', safeCategory);

    const isPortrait = item.orientation === 'portrait';
    const rawTitle = (lang === 'hi' && item.title_hi) ? item.title_hi : item.title_en;
    const title = String(rawTitle || '');
    const rawDesc = (lang === 'hi' && item.description_hi) ? item.description_hi : (item.description_en || '');
    const desc = String(rawDesc || '');
    const catLabel = (CATEGORY_NAMES[lang] && CATEGORY_NAMES[lang][safeCategory]) || safeCategory;

    // Secure thumbnail resolution:
    // Only accept custom thumbnail if it is a strictly valid HTTPS image URL; otherwise fallback to YouTube HQ
    const defaultThumb = window.isValidYouTubeId(item.youtube_video_id)
      ? window.getYouTubeThumbnail(item.youtube_video_id, 'hqdefault')
      : '';
    const safeThumbUrl = (item.thumbnail_url && window.isValidImageUrl(item.thumbnail_url))
      ? item.thumbnail_url
      : defaultThumb;

    const playAriaLabel = lang === 'hi' ? `वीडियो चलाएं: ${title}` : `Play video: ${title}`;
    const orientationLabel = isPortrait
      ? (lang === 'hi' ? '9:16 वर्टिकल रील' : '9:16 Vertical Reel')
      : (lang === 'hi' ? '16:9 वाइडस्क्रीन' : '16:9 Widescreen');

    const mediaBox = document.createElement('div');
    mediaBox.className = `portfolio-media-box ${isPortrait ? 'portfolio-media-box--vertical' : ''} has-media`;
    if (window.isValidYouTubeId(item.youtube_video_id)) {
      mediaBox.setAttribute('data-youtube-id', item.youtube_video_id);
    }

    // Thumbnail Image (Safe DOM attributes)
    const img = document.createElement('img');
    img.className = 'portfolio-thumb-img';
    img.src = safeThumbUrl;
    img.alt = title;
    img.loading = 'lazy';
    img.decoding = 'async';
    // Fallback if custom thumbnail fails
    img.onerror = function () {
      if (img.src !== defaultThumb && defaultThumb) {
        img.src = defaultThumb;
      }
    };

    // Play Button Overlay
    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'portfolio-play-btn';
    playBtn.setAttribute('aria-label', playAriaLabel);
    // Static SVG icon (no variable interpolation)
    playBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';

    // Click-to-Play Activation
    function activatePlayer() {
      if (!window.isValidYouTubeId(item.youtube_video_id)) return;
      const embedUrl = window.getYouTubeEmbedUrl(item.youtube_video_id, { autoplay: 1 });
      if (!embedUrl) return;

      const iframe = document.createElement('iframe');
      iframe.src = embedUrl;
      iframe.title = title;
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.setAttribute('loading', 'lazy');
      iframe.className = 'portfolio-video-iframe';

      mediaBox.innerHTML = '';
      mediaBox.appendChild(iframe);
      iframe.focus();
    }

    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      activatePlayer();
    });

    mediaBox.addEventListener('click', () => {
      if (!mediaBox.querySelector('iframe')) {
        activatePlayer();
      }
    });

    mediaBox.appendChild(img);
    mediaBox.appendChild(playBtn);
    card.appendChild(mediaBox);

    // Card Content (Pure textContent)
    const content = document.createElement('div');
    content.className = 'portfolio-card-content';

    const catEl = document.createElement('div');
    catEl.className = 'portfolio-card-category';
    catEl.textContent = catLabel;
    content.appendChild(catEl);

    const titleEl = document.createElement('h3');
    titleEl.className = 'portfolio-card-title';
    titleEl.textContent = title;
    content.appendChild(titleEl);

    if (desc) {
      const descEl = document.createElement('p');
      descEl.className = 'portfolio-card-desc';
      descEl.textContent = desc;
      content.appendChild(descEl);
    }

    const statusEl = document.createElement('span');
    statusEl.className = 'portfolio-card-status';
    statusEl.textContent = `${catLabel} • ${orientationLabel}`;
    content.appendChild(statusEl);

    card.appendChild(content);
    return card;
  }

  /**
   * Re-evaluates filter visibility after dynamically injecting new cards
   */
  function refreshFilterListeners() {
    const activeBtn = document.querySelector('.portfolio-filter-btn.active');
    if (activeBtn) {
      activeBtn.click();
    }
  }

})();
