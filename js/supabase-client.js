/**
 * S. Video Creation — Supabase Client & YouTube Utilities
 * Lightweight, static-compatible client integration for public portfolio & admin dashboard.
 * 
 * SECURITY: Never put the Supabase service-role secret key in this file.
 * Only the public project URL and publishable anon key should be configured here.
 */

(function () {
  'use strict';

  // ============================================================================
  // Configuration
  // Replace the placeholder values below with your Supabase Project credentials.
  // ============================================================================
  const DEFAULT_CONFIG = {
    // e.g. 'https://xyzcompany.supabase.co'
    url: window.ENV_SUPABASE_URL || 'https://babfkmmaoijjyidepnfr.supabase.co',
    // e.g. 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    anonKey: window.ENV_SUPABASE_ANON_KEY || 'sb_publishable_QhH1EF8FlerGBH4SmQyqqQ_dHc44je4'
  };

  // Optional localStorage overrides for seamless developer / local testing
  const isLocalDev = (typeof window !== 'undefined' && window.location) ? (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]'
  ) : false;

  const storedUrl = (isLocalDev && typeof localStorage !== 'undefined') ? localStorage.getItem('svc_supabase_url') : null;
  const storedKey = (isLocalDev && typeof localStorage !== 'undefined') ? localStorage.getItem('svc_supabase_anon_key') : null;

  window.SUPABASE_CONFIG = {
    url: storedUrl || DEFAULT_CONFIG.url,
    anonKey: storedKey || DEFAULT_CONFIG.anonKey
  };

  /**
   * Checks whether real Supabase credentials have been configured.
   * Returns true if URL and AnonKey are populated and not default placeholders.
   */
  window.isSupabaseConfigured = function () {
    const cfg = window.SUPABASE_CONFIG;
    if (!cfg || !cfg.url || !cfg.anonKey) return false;
    const isPlaceholderUrl = cfg.url.includes('YOUR_SUPABASE') || cfg.url === '' || !cfg.url.startsWith('https://');
    const isPlaceholderKey = cfg.anonKey.includes('YOUR_SUPABASE') || cfg.anonKey === '';
    return !isPlaceholderUrl && !isPlaceholderKey;
  };

  let _clientInstance = null;

  /**
   * Returns the initialized Supabase client singleton, or null if unconfigured or CDN missing.
   */
  window.getSupabaseClient = function () {
    if (_clientInstance) return _clientInstance;

    if (!window.isSupabaseConfigured()) {
      return null;
    }

    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      console.warn('[S. Video Creation] Supabase JS SDK not loaded yet.');
      return null;
    }

    try {
      _clientInstance = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );
      return _clientInstance;
    } catch (err) {
      console.error('[S. Video Creation] Error initializing Supabase client:', err);
      return null;
    }
  };

  // ============================================================================
  // YouTube & URL Security Utilities
  // Strict URL parser, video ID extractor, and input sanitizers.
  // ============================================================================

  /**
   * Validates that a string is strictly an 11-character YouTube video ID.
   * Characters allowed: a-z, A-Z, 0-9, underscore, hyphen.
   * @param {string} id
   * @returns {boolean}
   */
  window.isValidYouTubeId = function (id) {
    if (!id || typeof id !== 'string') return false;
    return /^[a-zA-Z0-9_-]{11}$/.test(id);
  };

  /**
   * Validates that a URL is a secure, well-formed HTTPS image URL.
   * Rejects javascript:, data:, file:, relative paths, and dangerous characters.
   * @param {string} url
   * @returns {boolean}
   */
  window.isValidImageUrl = function (url) {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();

    // Must strictly start with https:// and be within standard URL length limits
    if (!trimmed.startsWith('https://') || trimmed.length > 2048) {
      return false;
    }

    // Reject control characters, spaces, and HTML injection characters
    if (/[\s"'<>\\^`{|}~]/.test(trimmed)) {
      return false;
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'https:') return false;
      if (!parsed.hostname || parsed.hostname.length < 3 || !parsed.hostname.includes('.')) {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  /**
   * Safely extracts and validates an 11-character YouTube video ID.
   * Supports:
   * - https://www.youtube.com/watch?v=VIDEO_ID
   * - https://youtube.com/watch?v=VIDEO_ID
   * - https://m.youtube.com/watch?v=VIDEO_ID
   * - https://youtu.be/VIDEO_ID
   * - https://www.youtube.com/shorts/VIDEO_ID
   * - https://youtube.com/shorts/VIDEO_ID
   * - https://www.youtube-nocookie.com/embed/VIDEO_ID
   * - Direct 11-char ID
   * 
   * @param {string} input - YouTube URL or ID string
   * @returns {string|null} - 11-character video ID, or null if invalid
   */
  window.extractYouTubeId = function (input) {
    if (!input || typeof input !== 'string') return null;
    const trimmed = input.trim();

    // Check if input is already a raw 11-character YouTube ID
    if (window.isValidYouTubeId(trimmed)) {
      return trimmed;
    }

    try {
      // Must be a valid URL
      const url = new URL(trimmed);
      const host = url.hostname.toLowerCase();

      // Only allow legitimate YouTube domains
      const validHosts = [
        'youtube.com',
        'www.youtube.com',
        'm.youtube.com',
        'music.youtube.com',
        'youtu.be',
        'www.youtube-nocookie.com',
        'youtube-nocookie.com'
      ];

      if (!validHosts.includes(host)) {
        return null;
      }

      // Format: youtu.be/VIDEO_ID
      if (host === 'youtu.be') {
        const id = url.pathname.slice(1).split('/')[0].split('?')[0];
        return window.isValidYouTubeId(id) ? id : null;
      }

      // Format: youtube.com/shorts/VIDEO_ID
      if (url.pathname.startsWith('/shorts/')) {
        const id = url.pathname.replace('/shorts/', '').split('/')[0].split('?')[0];
        return window.isValidYouTubeId(id) ? id : null;
      }

      // Format: youtube.com/embed/VIDEO_ID or youtube-nocookie.com/embed/VIDEO_ID
      if (url.pathname.startsWith('/embed/')) {
        const id = url.pathname.replace('/embed/', '').split('/')[0].split('?')[0];
        return window.isValidYouTubeId(id) ? id : null;
      }

      // Format: youtube.com/watch?v=VIDEO_ID
      const v = url.searchParams.get('v');
      if (v && window.isValidYouTubeId(v)) {
        return v;
      }

      return null;
    } catch (e) {
      // Invalid URL syntax
      return null;
    }
  };

  /**
   * Detects whether a YouTube URL points to a vertical Short.
   * @param {string} input 
   * @returns {boolean}
   */
  window.isYouTubeShort = function (input) {
    if (!input || typeof input !== 'string') return false;
    return input.includes('/shorts/');
  };

  /**
   * Normalizes any supported YouTube URL format (watch, shorts, youtu.be, embed, raw ID)
   * into a clean, canonical YouTube URL:
   * - Shorts -> https://www.youtube.com/shorts/VIDEO_ID
   * - Standard -> https://www.youtube.com/watch?v=VIDEO_ID
   *
   * Strips tracking parameters, query artifacts, and nocookie wrappers,
   * guaranteeing consistent database storage and seamless playback.
   *
   * @param {string} input - Any supported YouTube URL or 11-char ID
   * @param {string} [knownId] - Optional pre-extracted 11-char ID
   * @returns {string|null} - Canonical URL or null if invalid
   */
  window.normalizeYouTubeUrl = function (input, knownId) {
    const videoId = (knownId && window.isValidYouTubeId(knownId))
      ? knownId
      : window.extractYouTubeId(input);

    if (!videoId) return null;

    if (window.isYouTubeShort(input)) {
      return `https://www.youtube.com/shorts/${videoId}`;
    }
    return `https://www.youtube.com/watch?v=${videoId}`;
  };

  /**
   * Generates a high-quality YouTube thumbnail URL.
   * Strictly validates video ID before generating URL.
   * @param {string} videoId 
   * @param {'hqdefault'|'mqdefault'|'maxresdefault'|'sddefault'} quality 
   * @returns {string}
   */
  window.getYouTubeThumbnail = function (videoId, quality) {
    if (!window.isValidYouTubeId(videoId)) return '';
    const safeQuality = ['hqdefault', 'mqdefault', 'maxresdefault', 'sddefault'].includes(quality)
      ? quality
      : 'hqdefault';
    return `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/${safeQuality}.jpg`;
  };

  /**
   * Generates a privacy-enhanced YouTube embed URL (youtube-nocookie.com).
   * Strictly validates video ID before generating URL.
   * @param {string} videoId 
   * @param {Object} options
   * @returns {string}
   */
  window.getYouTubeEmbedUrl = function (videoId, options) {
    if (!window.isValidYouTubeId(videoId)) return '';
    const opts = options || {};
    const autoplay = opts.autoplay ? '1' : '0';
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=${autoplay}&rel=0&modestbranding=1`;
  };

  /**
   * Safely escapes untrusted strings for insertion into HTML text nodes.
   */
  window.escapeHTML = function (str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, function (tag) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag);
    });
  };

})();
